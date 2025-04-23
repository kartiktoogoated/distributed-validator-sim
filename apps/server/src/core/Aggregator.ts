import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import http from "http";
import { WebSocketServer } from "ws";
import prisma from "../prismaClient";
import nodemailer from "nodemailer";
import { info, error as logError } from "../../utils/logger";
import { sendToTopic } from "../services/producer";

//
// ── CONFIG ──────────────────────────────────────────────────────────────────
//
const SERVER_PORT = Number(process.env.PORT ?? 3000);

const VALIDATOR_IDS = (process.env.VALIDATOR_IDS ?? "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => !isNaN(n));
if (VALIDATOR_IDS.length === 0) {
  throw new Error("VALIDATOR_IDS must be set to a comma-separated list of numbers");
}

const QUORUM = Math.ceil(VALIDATOR_IDS.length / 2);
const AGGREGATION_INTERVAL_MS = Number(process.env.AGGREGATION_INTERVAL_MS ?? 10000);

const KAFKA_TOPIC = process.env.KAFKA_TOPIC!;
if (!KAFKA_TOPIC) throw new Error("KAFKA_TOPIC must be defined");

const ALERT_EMAILS: Record<string, string> = JSON.parse(
  process.env.LOCATION_EMAILS ?? "{}"
);

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

//
// ── IN-MEMORY BUFFER ────────────────────────────────────────────────────────
//
interface VoteEntry {
  validatorId: number;
  status: "UP" | "DOWN";
  weight: number;
  responseTime: number;
  location: string;
}
const voteBuffer: Record<string, VoteEntry[]> = {};

//
// ── HTTP + WS SETUP ────────────────────────────────────────────────────────
//
const app = express();
app.use(express.json());
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

//
// ── GOSSIP INTAKE ──────────────────────────────────────────────────────────
//
app.post(
  "/api/simulate/gossip",
  (req: Request, res: Response): Promise<any> | undefined => {
    try {
      // destructure & validate
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
        typeof site !== "string" ||
        typeof fromId !== "number" ||
        typeof responseTime !== "number" ||
        typeof timeStamp !== "string" ||
        typeof location !== "string" ||
        !vote ||
        (vote.status !== "UP" && vote.status !== "DOWN")
      ) {
        res.status(400).send("Malformed gossip payload");
        return;
      }

      // buffer the vote
      const bufferKey = `${site}:${timeStamp}`;
      voteBuffer[bufferKey] = voteBuffer[bufferKey] || [];
      voteBuffer[bufferKey].push({
        validatorId: fromId,
        status: vote.status,
        weight: vote.weight,
        responseTime,
        location,
      });

      info(
        `🗳 Received gossip from validator ${fromId}@${location} for ${site}:` +
        ` ${vote.status}`
      );
      res.sendStatus(204);
      return;
    } catch (err) {
      logError(`Gossip handler error: ${err}`);
      res.sendStatus(500);
      return;
    }
  }
);

//
// ── QUORUM PROCESSOR ───────────────────────────────────────────────────────
//
async function processQuorum(): Promise<void> {
  for (const bufferKey of Object.keys(voteBuffer)) {
    const entries = voteBuffer[bufferKey];
    if (entries.length < QUORUM) continue;

    const [site, timeStamp] = bufferKey.split(":");
    const upCount = entries.filter((e) => e.status === "UP").length;
    const consensus: "UP" | "DOWN" =
      upCount >= entries.length - upCount ? "UP" : "DOWN";

    info(
      `✔️ Consensus for ${site} @ ${timeStamp}: ${consensus}` +
      ` (${upCount}/${entries.length} UP)`
    );

    // 1) Persist all individual votes + the consensus entry
    await prisma.validatorLog.createMany({
      data: entries.map((e) => ({
        validatorId: e.validatorId,
        site,
        status: e.status,
        timestamp: new Date(timeStamp),
      })),
    });
    await prisma.validatorLog.create({
      data: {
        validatorId: 0,
        site,
        status: consensus,
        timestamp: new Date(timeStamp),
      },
    });

    // 2) Broadcast over WebSocket
    const payload = { url: site, consensus, votes: entries, timeStamp };
    const message = JSON.stringify(payload);
    wsServer.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });

    // 3) Publish to Kafka
    try {
      await sendToTopic(KAFKA_TOPIC, payload);
    } catch (e) {
      logError(`Kafka publish error: ${e}`);
    }

    // 4) Per-region DOWN alerts
    if (consensus === "DOWN") {
      for (const entry of entries.filter((e) => e.status === "DOWN")) {
        const recipient = ALERT_EMAILS[entry.location];
        if (recipient) {
          try {
            await mailTransporter.sendMail({
              from: process.env.ALERT_FROM,
              to: recipient,
              subject: `ALERT: ${site} DOWN in ${entry.location}`,
              text: `Validator ${entry.validatorId}@${entry.location}` +
                    ` reported DOWN at ${timeStamp}.`,
            });
            info(`✉️ Alert sent to ${recipient}`);
          } catch (mailErr) {
            logError(`Mail error: ${mailErr}`);
          }
        }
      }
    }

    // 5) Clear the buffer for this batch
    delete voteBuffer[bufferKey];
  }
}

//
// ── STARTUP ────────────────────────────────────────────────────────────────
//
server.listen(SERVER_PORT, () => {
  info(`🔌 Aggregator listening on port ${SERVER_PORT}`);
});

// schedule quorum processing at fixed interval
setInterval(processQuorum, AGGREGATION_INTERVAL_MS);
