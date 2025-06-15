import dotenv from 'dotenv'
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { Kafka, logLevel } from 'kafkajs';
import prisma from '../prismaClient';
import nodemailer from 'nodemailer';
import { info, error as logError } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import { sendToTopic } from '../services/producer';
import { mailConfig } from '../config/mailConfig';
import { kafkaBrokerList } from '../config/kafkaConfig';
import { Counter, Gauge, Histogram } from 'prom-client';

// Prometheus metrics
const voteCounter = new Counter({
  name: 'validator_votes_total',
  help: 'Total number of votes received',
  labelNames: ['status']
});

const consensusGauge = new Gauge({
  name: 'site_consensus_status',
  help: 'Current consensus status for sites (1=UP, 0=DOWN)',
  labelNames: ['url']
});

const voteLatencyHistogram = new Histogram({
  name: 'vote_processing_latency_seconds',
  help: 'Time taken to process votes and reach consensus',
  labelNames: ['url']
});

const processedConsensus = new Set<string>();

// GLOBAL CRASH HANDLERS
process.on('unhandledRejection', (err) => {
  logError(`UNHANDLED REJECTION: ${(err as Error).stack || err}`);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logError(`UNCAUGHT EXCEPTION: ${(err as Error).stack || err}`);
  process.exit(1);
});

// CONFIG
const SERVER_PORT = Number(process.env.PORT) || 3000;

// VALIDATOR_IDS
if (!process.env.VALIDATOR_IDS) {
  throw new AppError('VALIDATOR_IDS must be set (comma-separated)', 500);
}
const VALIDATOR_IDS = process.env.VALIDATOR_IDS.split(',')
  .map((s) => {
    const n = Number(s.trim());
    if (isNaN(n)) throw new AppError(`Invalid validator ID: ${s}`, 400);
    return n;
  });
if (VALIDATOR_IDS.length === 0) {
  throw new AppError(`VALIDATOR_IDS list cannot be empty`, 400);
}

const QUORUM = Math.ceil(VALIDATOR_IDS.length / 2);

// AGGREGATION INTERVAL
const AGG_INTERVAL = Number(process.env.PING_INTERVAL_MS) || 10_000;

// KAFKA TOPIC
const KAFKA_TOPIC = process.env.KAFKA_TOPIC;
if (!KAFKA_TOPIC) {
  throw new AppError(`KAFKA_TOPIC must be defined`, 500);
}

// ALERT EMAILS
let ALERT_EMAILS: Record<string, string> = {};
if (process.env.LOCATION_EMAILS) {
  try {
    ALERT_EMAILS = JSON.parse(process.env.LOCATION_EMAILS);
  } catch {
    throw new AppError('LOCATION_EMAILS must be valid JSON', 400);
  }
}

// MAILER
const mailTransporter = nodemailer.createTransport({
  host: mailConfig.SMTP_HOST,
  port: Number(mailConfig.SMTP_PORT),
  secure: mailConfig.SMTP_SECURE,
  auth: {
    user: mailConfig.SMTP_USER,
    pass: mailConfig.SMTP_PASS,
  },
});

// APP + WS SETUP
const app = express();
app.use(express.json());

const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

// IN MEMORY BUFFER
interface VoteEntry {
  validatorId: number;
  status: 'UP' | 'DOWN';
  weight: number;
  latencyMs: number;  
  location: string;
  timestamp: number;
}

const voteBuffer: Record<string, VoteEntry[]> = {};
const VOTE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

// Cleanup old votes
function cleanupOldVotes() {
  const now = Date.now();
  for (const key of Object.keys(voteBuffer)) {
    const entries = voteBuffer[key];
    if (entries.length === 0) continue;

    // Remove entries older than TTL
    voteBuffer[key] = entries.filter(entry => now - entry.timestamp < VOTE_TTL_MS);
    
    // Remove empty buffers
    if (voteBuffer[key].length === 0) {
      delete voteBuffer[key];
    }
  }
}

// Start Kafka Consumer
async function startKafkaConsumer() {
  const kafkaClient = new Kafka({
    clientId: 'aggregator',
    brokers: kafkaBrokerList,
    logLevel: logLevel.INFO,
  });

  const consumer = kafkaClient.consumer({ groupId: 'aggregator-group' });

  await consumer.connect();
  info('Aggregator connected to Kafka');

  await consumer.subscribe({ topic: 'validator-logs', fromBeginning: false });
  info('Subscribed to validator-logs topic');

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload = JSON.parse(message.value!.toString()) as {
          validatorId: number;
          url: string;
          status: 'UP' | 'DOWN';
          latencyMs: number;
          timestamp: string;
          location: string; // Added location
        };

        const key = `${payload.url}__${payload.timestamp}`;
        
        // Skip if already processed
        if (processedConsensus.has(key)) {
          return;
        }

        voteBuffer[key] = voteBuffer[key] || [];

        voteBuffer[key].push({
          validatorId: payload.validatorId,
          status: payload.status,
          weight: 1,
          latencyMs: payload.latencyMs,
          location: payload.location,
          timestamp: Date.now()
        });        
        
        // Update metrics
        voteCounter.inc({ status: payload.status });
        voteLatencyHistogram.observe(payload.latencyMs / 1000); // Convert to seconds

        // Process quorum if we have enough votes
        if (voteBuffer[key].length >= QUORUM) {
          await processQuorum();
        }
      } catch (err) {
        logError(`Error processing Kafka message: ${(err as Error).message}`);
      }
    },
  });
}

// Start the Kafka consumer
startKafkaConsumer().catch((err) => {
  logError(`Failed to start Kafka consumer: ${err}`);
  process.exit(1);
});

// GOSSIP ROUTE
app.post('/api/simulate/gossip', async (req: Request, res: Response) => {
  const {
    site,
    vote,
    fromId,
    latencyMs,
    timestamp,
    location,
  } = req.body as {
    site: string;
    vote: { status: "UP" | "DOWN"; weight: number };
    fromId: number;
    latencyMs: number;
    timestamp: string;
    location: string;
  };

  if (
    typeof site !== 'string' ||
    typeof fromId !== 'number' ||
    typeof latencyMs !== 'number' ||
    typeof timestamp !== 'string' ||
    typeof location !== 'string' ||
    !vote ||
    (vote.status !== 'UP' && vote.status !== 'DOWN')
  ) {
    throw new AppError('Malformed gossip payload', 400);
  }

  const key = `${site}__${timestamp}`;
  voteBuffer[key] = voteBuffer[key] || [];

  voteBuffer[key].push({
    validatorId: fromId,
    status: vote.status,
    weight: vote.weight,
    latencyMs,
    location,
    timestamp: Date.now()
  });

  info(`Received gossip from ${fromId}@${location} → ${site}: ${vote.status}`);
  res.sendStatus(204);
});


// ── PROCESS QUORUM ──────────────────────────────────────────────────────────
async function processQuorum() {
  const startTime = Date.now();
  
  for (const key of Object.keys(voteBuffer)) {
    const entries = voteBuffer[key];
    if (entries.length < QUORUM) continue;

    const [site, timestamp] = key.split('__');
    const upCount = entries.filter((e) => e.status === 'UP').length;
    const consensus: 'UP' | 'DOWN' =
      upCount >= entries.length - upCount ? 'UP' : 'DOWN';

    // Skip if already processed
    if (processedConsensus.has(key)) {
      continue;
    }

    info(`✔️ Consensus for ${site}@${timestamp}: ${consensus} (${upCount}/${entries.length} UP)`);

    // Update consensus metric
    consensusGauge.set({ url: site }, consensus === 'UP' ? 1 : 0);

    // a) Persist raw votes + consensus
    await prisma.validatorLog.createMany({
      data: entries.map((e) => ({
        validatorId: e.validatorId,
        site,
        status: e.status,
        latency: e.latencyMs ?? 0,  
        timestamp: new Date(timestamp),
      })),
    });
    
    await prisma.validatorLog.create({
      data: {
        validatorId: 0,
        site,
        status: consensus,
        latency: 0,
        timestamp: new Date(timestamp),
      },
    });

    // b) Broadcast WS
    const payload = { url: site, consensus, votes: entries, timestamp };
    const msg = JSON.stringify(payload);
    wsServer.clients.forEach((c) => {
      if (c.readyState === c.OPEN) c.send(msg);
    });

    // c) Publish to Kafka
    try {
      await sendToTopic(KAFKA_TOPIC!, payload);
    } catch (e) {
      logError(`Kafka publish failed: ${(e as Error).message}`);
    }

    // d) Send DOWN alerts per region
    if (consensus === 'DOWN') {
      for (const e of entries.filter((e) => e.status === 'DOWN')) {
        const to = ALERT_EMAILS[e.location];
        if (!to) continue;
        try {
          await mailTransporter.sendMail({
            from: process.env.ALERT_FROM!,
            to,
            subject: `ALERT: ${site} DOWN in ${e.location}`,
            text: `Validator ${e.validatorId}@${e.location} reported DOWN at ${timestamp}.`,
          });
          info(`✉️ Alert sent to ${to}`);
        } catch (mailErr) {
          logError(`Mail error: ${(mailErr as Error).message}`);
        }
      }
    }

    // Mark as processed and cleanup
    processedConsensus.add(key);
    delete voteBuffer[key];

    // Record processing latency
    const processingTime = (Date.now() - startTime) / 1000; // Convert to seconds
    voteLatencyHistogram.observe({ url: site }, processingTime);
  }
}

// ── SERVER START ────────────────────────────────────────────────────────────
server.listen(SERVER_PORT, () => {
  info(`🔌 Aggregator listening on port ${SERVER_PORT}`);
});

// Regular cleanup of old votes
setInterval(cleanupOldVotes, 60 * 1000); // Run cleanup every minute

// Regular quorum processing
setInterval(() => {
  processQuorum().catch((e) =>
    logError(`processQuorum crashed: ${(e as Error).message}`)
  );
}, AGG_INTERVAL);
