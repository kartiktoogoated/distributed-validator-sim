import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { Kafka, logLevel } from 'kafkajs';
import prisma from '../prismaClient';
import nodemailer from 'nodemailer';
import { info, warn, error as logError } from '../../utils/logger';
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
const SERVER_PORT = process.env.PORT ? Number(process.env.PORT) : (() => { throw new AppError('PORT must be set in environment', 500); })();

// Graceful shutdown handler
function gracefulShutdown(signal: string) {
  info(`Received ${signal}. Starting graceful shutdown...`);
  
  wsServer.close(() => {
    info('WebSocket server closed');
  });

  server.close(() => {
    info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logError('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server (fail fast on port in use)
function startServer(port: number): void {
  server.listen(port, () => {
    info(`Aggregator listening on port ${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logError(`Port ${port} is already in use. Check you only have one aggregator per PORT.`);
    } else {
      logError(`Server error: ${err.stack || err.message}`);
    }
    process.exit(1);
  });
}

// VALIDATOR_IDS
if (!process.env.VALIDATOR_IDS) {
  throw new AppError('VALIDATOR_IDS must be set (comma-separated)', 500);
}
const VALIDATOR_IDS = process.env.VALIDATOR_IDS.split(',').map((s) => {
  const n = Number(s.trim());
  if (isNaN(n)) throw new AppError(`Invalid validator ID: ${s}`, 400);
  return n;
});
if (VALIDATOR_IDS.length === 0) {
  throw new AppError('VALIDATOR_IDS list cannot be empty', 400);
}

const QUORUM = Math.ceil(VALIDATOR_IDS.length / 2);

// AGGREGATION INTERVAL
const AGG_INTERVAL = Number(process.env.PING_INTERVAL_MS) || 10_000;

// KAFKA TOPIC
const KAFKA_TOPIC = process.env.KAFKA_TOPIC;
if (!KAFKA_TOPIC) {
  throw new AppError('KAFKA_TOPIC must be defined', 500);
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
  responseTime: number;
  location: string;
  timestamp: number; // Added timestamp for TTL
}

const voteBuffer: Record<string, VoteEntry[]> = {};
const VOTE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

function cleanupOldVotes() {
  const now = Date.now();
  for (const key of Object.keys(voteBuffer)) {
    const entries = voteBuffer[key];
    voteBuffer[key] = entries.filter(e => now - e.timestamp < VOTE_TTL_MS);
    if (voteBuffer[key].length === 0) {
      delete voteBuffer[key];
    }
  }
}

// Start Kafka Consumer
export async function startKafkaConsumer() {
  const kafkaClient = new Kafka({
    clientId: 'aggregator',
    brokers: kafkaBrokerList,
    logLevel: logLevel.INFO,
  });

  const consumer = kafkaClient.consumer({ groupId: 'aggregator-group' });
  await consumer.connect();
  info('Aggregator connected to Kafka');

  await consumer.subscribe({ topic: KAFKA_TOPIC!, fromBeginning: false });
  info(`Subscribed to ${KAFKA_TOPIC} topic`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload = JSON.parse(message.value!.toString()) as {
          validatorId: number;
          url: string;
          status: 'UP' | 'DOWN';
          latencyMs: number;
          timestamp: string;
          location: string;
        };

        const timeBucket = payload.timestamp.slice(0, 16);
        const key = `${payload.url}:${timeBucket}`;

        if (processedConsensus.has(key)) return;

        voteBuffer[key] = voteBuffer[key] || [];
        voteBuffer[key].push({
          validatorId: payload.validatorId,
          status: payload.status,
          weight: 1,
          responseTime: payload.latencyMs,
          location: payload.location,
          timestamp: Date.now()
        });

        const individualPingMsg = JSON.stringify({
          type: 'individual-ping',
          url: payload.url,
          status: payload.status,
          latency: payload.latencyMs,
          validatorId: payload.validatorId,
          location: payload.location,
          timestamp: payload.timestamp,
        });
        wsServer.clients.forEach(c => {
          if (c.readyState === c.OPEN) c.send(individualPingMsg);
        });

        voteCounter.inc({ status: payload.status });
        voteLatencyHistogram.observe(payload.latencyMs / 1000);

        if (voteBuffer[key].length >= VALIDATOR_IDS.length) {
          await processQuorum();
        }
      } catch (err) {
        logError(`Error processing Kafka message: ${(err as Error).message}`);
      }
    },
  });
}

startKafkaConsumer().catch(err => {
  logError(`Failed to start Kafka consumer: ${err}`);
  process.exit(1);
});

// GOSSIP ROUTE
app.post('/api/simulate/gossip', async (req: Request, res: Response) => {
  const { site, vote, fromId, responseTime, timeStamp, location } = req.body as {
    site: string;
    vote: { status: 'UP' | 'DOWN'; weight: number };
    fromId: number;
    responseTime: number;
    timeStamp: string;
    location: string;
  };

  if (
    typeof site !== 'string' ||
    typeof fromId !== 'number' ||
    typeof responseTime !== 'number' ||
    typeof timeStamp !== 'string' ||
    typeof location !== 'string' ||
    !vote ||
    (vote.status !== 'UP' && vote.status !== 'DOWN')
  ) {
    throw new AppError('Malformed gossip payload', 400);
  }

  const key = `${site}:${timeStamp}`;
  voteBuffer[key] = voteBuffer[key] || [];
  voteBuffer[key].push({
    validatorId: fromId,
    status: vote.status,
    weight: vote.weight,
    responseTime,
    location,
    timestamp: Date.now()
  });

  info(`Received gossip from ${fromId}@${location} → ${site}: ${vote.status}`);
  res.sendStatus(204);
});

async function processQuorum() {
  const startTime = Date.now();

  for (const key of Object.keys(voteBuffer)) {
    const entries = voteBuffer[key];
    if (entries.length < VALIDATOR_IDS.length) continue;
    const [site, timeBucket] = key.split(':');
    const upCount = entries.filter(e => e.status === 'UP').length;
    const consensus: 'UP' | 'DOWN' = upCount >= entries.length - upCount ? 'UP' : 'DOWN';

    if (processedConsensus.has(key)) continue;

    info(`✔️ Consensus for ${site}@${timeBucket}: ${consensus} (${upCount}/${entries.length} UP)`);
    consensusGauge.set({ url: site }, consensus === 'UP' ? 1 : 0);

    const uniqueIds = Array.from(new Set(entries.map(e => e.validatorId)));
    for (const id of uniqueIds) {
      if (id === 0) continue;
      await prisma.validator.upsert({
        where: { id },
        update: {},
        create: { id, location: entries.find(e => e.validatorId === id)!.location }
      });
    }
    await prisma.validator.upsert({
      where: { id: 0 },
      update: {},
      create: { id: 0, location: 'aggregator' }
    });

    await prisma.validatorLog.createMany({
      data: entries.map(e => ({
        validatorId: e.validatorId,
        site,
        status: e.status,
        latency: e.responseTime,
        timestamp: new Date(timeBucket + ':00')
      }))
    });
    await prisma.validatorLog.create({
      data: {
        validatorId: 0,
        site,
        status: consensus,
        latency: 0,
        timestamp: new Date(timeBucket + ':00')
      }
    });

    const payload = {
      url: site,
      consensus,
      votes: entries.map(e => ({
        status: e.status,
        weight: e.weight,
        responseTime: e.responseTime,
        location: e.location,
        validatorId: e.validatorId
      })),
      timeStamp: timeBucket + ':00',
      upCount,
      totalVotes: entries.length,
      quorum: QUORUM,
      processingTime: (Date.now() - startTime) / 1000
    };
    const msg = JSON.stringify({ type: 'consensus', ...payload });
    wsServer.clients.forEach(c => {
      if (c.readyState === c.OPEN) {
        try { c.send(msg); }
        catch (err) { logError(`Failed WS send: ${(err as Error).message}`); }
      }
    });

    try {
      await sendToTopic(KAFKA_TOPIC!, payload);
    } catch (e) {
      logError(`Kafka publish failed: ${(e as Error).message}`);
    }

    if (consensus === 'DOWN') {
      for (const e of entries.filter(e => e.status === 'DOWN')) {
        const to = ALERT_EMAILS[e.location];
        if (!to) continue;
        try {
          await mailTransporter.sendMail({
            from: process.env.ALERT_FROM!,
            to,
            subject: `ALERT: ${site} DOWN in ${e.location}`,
            text: `Validator ${e.validatorId}@${e.location} reported DOWN at ${timeBucket}:00.`
          });
          info(`✉️ Alert sent to ${to}`);
        } catch (mailErr) {
          logError(`Mail error: ${(mailErr as Error).message}`);
        }
      }
    }

    processedConsensus.add(key);
    delete voteBuffer[key];
    voteLatencyHistogram.observe({ url: site }, (Date.now() - startTime) / 1000);
  }
}

setInterval(cleanupOldVotes, 60 * 1000);
setInterval(() => {
  processQuorum().catch(e =>
    logError(`processQuorum crashed: ${(e as Error).message}`)
  );
}, AGG_INTERVAL);

startServer(SERVER_PORT);
