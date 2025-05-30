import dotenv from "dotenv";
dotenv.config();

if (process.env.IS_AGGREGATOR !== "true") {
  throw new Error("Run this file with IS_AGGREGATOR=true");
}

import express, { Request, Response } from "express";
import http from "http";
import { info, error as logError } from "../../utils/logger";
import { Counter, Gauge, Histogram } from 'prom-client';
import { sendToTopic } from '../../services/producer';
import { mailConfig } from '../../config/mailConfig';
import { kafkaBrokerList } from '../../config/kafkaConfig';
import nodemailer from 'nodemailer';
import { Kafka, logLevel } from "kafkajs";
import prisma from "../../prismaClient";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Minimal health endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);

// --- BEGIN QUORUM/KAFKA LOGIC ---
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
const KAFKA_TOPIC = process.env.KAFKA_TOPIC ?? 'validator-logs';
const AGG_INTERVAL = Number(process.env.PING_INTERVAL_MS) || 10_000;
const VALIDATOR_IDS = (process.env.VALIDATOR_IDS || '').split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
const QUORUM = Math.ceil(VALIDATOR_IDS.length / 2);
let ALERT_EMAILS: Record<string, string> = {};
if (process.env.LOCATION_EMAILS) {
  try { ALERT_EMAILS = JSON.parse(process.env.LOCATION_EMAILS); } catch { ALERT_EMAILS = {}; }
}
const mailTransporter = nodemailer.createTransport({
  host: mailConfig.SMTP_HOST,
  port: Number(mailConfig.SMTP_PORT),
  secure: mailConfig.SMTP_SECURE,
  auth: { user: mailConfig.SMTP_USER, pass: mailConfig.SMTP_PASS },
});
const voteBuffer: Record<string, any[]> = {};
const VOTE_TTL_MS = 5 * 60 * 1000;
function cleanupOldVotes() {
  const now = Date.now();
  for (const key of Object.keys(voteBuffer)) {
    const entries = voteBuffer[key];
    if (entries.length === 0) continue;
    voteBuffer[key] = entries.filter(entry => now - entry.timestamp < VOTE_TTL_MS);
    if (voteBuffer[key].length === 0) delete voteBuffer[key];
  }
}
async function processQuorum() {
  const startTime = Date.now();
  for (const key of Object.keys(voteBuffer)) {
    const entries = voteBuffer[key];
    if (entries.length < QUORUM) continue;
    const [site, timeStamp] = key.split(':');
    const upCount = entries.filter((e) => e.status === 'UP').length;
    const consensus = upCount >= entries.length - upCount ? 'UP' : 'DOWN';
    if (processedConsensus.has(key)) continue;
    consensusGauge.set({ url: site }, consensus === 'UP' ? 1 : 0);
    await prisma.validatorLog.createMany({ data: entries.map((e) => ({ validatorId: e.validatorId, site, status: e.status, latency: e.latencyMs ?? 0, timestamp: new Date(timeStamp), })), });
    await prisma.validatorLog.create({ data: { validatorId: 0, site, status: consensus, latency: 0, timestamp: new Date(timeStamp), }, });
    const payload = { url: site, consensus, votes: entries, timeStamp };
    try { await sendToTopic(KAFKA_TOPIC, payload); } catch (e) { logError(`Kafka publish failed: ${(e as Error).message}`); }
    if (consensus === 'DOWN') {
      for (const e of entries.filter((e) => e.status === 'DOWN')) {
        const to = ALERT_EMAILS[e.location];
        if (!to) continue;
        try {
          await mailTransporter.sendMail({ from: process.env.ALERT_FROM!, to, subject: `ALERT: ${site} DOWN in ${e.location}`, text: `Validator ${e.validatorId}@${e.location} reported DOWN at ${timeStamp}.`, });
          info(`✉️ Alert sent to ${to}`);
        } catch (mailErr) { logError(`Mail error: ${(mailErr as Error).message}`); }
      }
    }
    processedConsensus.add(key);
    delete voteBuffer[key];
    const processingTime = (Date.now() - startTime) / 1000;
    voteLatencyHistogram.observe({ url: site }, processingTime);
  }
}
async function startKafkaConsumer() {
  const kafkaClient = new Kafka({ clientId: 'aggregator', brokers: kafkaBrokerList, logLevel: logLevel.INFO, });
  const consumer = kafkaClient.consumer({ groupId: 'aggregator-group' });
  await consumer.connect();
  info('Aggregator connected to Kafka');
  await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });
  info('Subscribed to validator-logs topic');
  await consumer.run({ eachMessage: async ({ message }) => {
    try {
      const payload = JSON.parse(message.value!.toString());
      const key = `${payload.url}:${payload.timestamp}`;
      if (processedConsensus.has(key)) return;
      voteBuffer[key] = voteBuffer[key] || [];
      voteBuffer[key].push({ validatorId: payload.validatorId, status: payload.status, weight: 1, latencyMs: payload.latencyMs, location: payload.location, timestamp: Date.now() });
      voteCounter.inc({ status: payload.status });
      voteLatencyHistogram.observe(payload.latencyMs / 1000);
      if (voteBuffer[key].length >= QUORUM) { await processQuorum(); }
    } catch (err) { logError(`Error processing Kafka message: ${(err as Error).message}`); }
  }, });
}
startKafkaConsumer().catch((err) => { logError(`Failed to start Kafka consumer: ${err}`); process.exit(1); });
setInterval(cleanupOldVotes, 60 * 1000);
setInterval(() => { processQuorum().catch((e) => logError(`processQuorum crashed: ${(e as Error).message}`)); }, AGG_INTERVAL);
// --- END QUORUM/KAFKA LOGIC ---

// Start server
server.listen(PORT, "0.0.0.0", () => {
  info(`🧿 Aggregator listening on ${PORT}`);
});