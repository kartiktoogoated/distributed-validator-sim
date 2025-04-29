import 'express-async-errors';
import dotenv from 'dotenv'
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import prisma from '../prismaClient';
import nodemailer from 'nodemailer';
import { info, warn, error as logError } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import { sendToTopic } from '../services/producer';
import { mailConfig } from '../config/mailConfig';

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
  responseTime: number;
  location: string;
}

const voteBuffer: Record<string, VoteEntry[]> = {};

// GOSSIP ROUTE
app.post(
  '/api/simulate/gossip',
  async (req: Request, res: Response) => {
    const {
      site,
      vote,
      fromId,
      responseTime,
      timeStamp,
      location,
    } = req.body as {
      site: string;
      vote: { status: "UP" | "DOWN"; weight: number };
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

    const key = `${site}: ${timeStamp}`;
    voteBuffer[key] = voteBuffer[key] || [];
    voteBuffer[key].push({
      validatorId: fromId,
      status: vote.status,
      weight: vote.weight,
      responseTime,
      location,
    });

    info(`Received gossip from ${fromId}@${location} → ${site}: ${vote.status}`);
    res.sendStatus(204);
  }
);

// ── PROCESS QUORUM ──────────────────────────────────────────────────────────
async function processQuorum() {
  for (const key of Object.keys(voteBuffer)) {
    const entries = voteBuffer[key];
    if (entries.length < QUORUM) continue;

    const [site, timeStamp] = key.split(':');
    const upCount = entries.filter((e) => e.status === 'UP').length;
    const consensus: 'UP' | 'DOWN' =
      upCount >= entries.length - upCount ? 'UP' : 'DOWN';

    info(`✔️ Consensus for ${site}@${timeStamp}: ${consensus} (${upCount}/${entries.length} UP)`);

    // a) Persist raw votes + consensus, now including latency
    await prisma.validatorLog.createMany({
      data: entries.map((e) => ({
        validatorId: e.validatorId,
        site,
        status: e.status,
        latency: e.responseTime,          // ← added
        timestamp: new Date(timeStamp),
      })),
    });

    await prisma.validatorLog.create({
      data: {
        validatorId: 0,
        site,
        status: consensus,
        latency: 0,                       // ← added
        timestamp: new Date(timeStamp),
      },
    });

    // b) Broadcast WS
    const payload = { url: site, consensus, votes: entries, timeStamp };
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
            text: `Validator ${e.validatorId}@${e.location} reported DOWN at ${timeStamp}.`,
          });
          info(`✉️ Alert sent to ${to}`);
        } catch (mailErr) {
          logError(`Mail error: ${(mailErr as Error).message}`);
        }
      }
    }

    delete voteBuffer[key];
  }
}

// ── SERVER START ────────────────────────────────────────────────────────────
server.listen(SERVER_PORT, () => {
  info(`🔌 Aggregator listening on port ${SERVER_PORT}`);
});

setInterval(() => {
  processQuorum().catch((e) =>
    logError(`processQuorum crashed: ${(e as Error).message}`)
  );
}, AGG_INTERVAL);
