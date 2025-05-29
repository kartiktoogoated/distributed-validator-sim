import dotenv from "dotenv";
dotenv.config();

if (process.env.IS_VALIDATOR !== "true") {
  throw new Error("Run this file with IS_VALIDATOR=true");
}

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { Validator } from "../../core/Validator";
import { info, error as logError } from "../../../utils/logger";
import { register as promRegister } from "../../metrics";
import prisma from "../../prismaClient";

interface ValidatorStatus {
  validatorId: number;
  location: string;
  targetUrl: string;
  lastCheck: {
    vote: {
      status: "UP" | "DOWN";
      weight: number;
    };
    latency: number;
    timestamp: string;
  } | null;
  uptime: number;
}

interface HealthResponse {
  status: "ok";
  validatorId: number;
  location: string;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Validator setup
const validatorId = Number(process.env.VALIDATOR_ID);
const location = process.env.LOCATION || "unknown";
const pingInterval = Number(process.env.PING_INTERVAL_MS) || 30000;

const validator = new Validator(validatorId, location);
let lastCheck: ValidatorStatus["lastCheck"] = null;

// Use correct Kafka env variable
const kafkaBrokers = (process.env.KAFKA_BOOTSTRAP_SERVERS || "kafka:9092").split(",");

// Prometheus metrics endpoint
app.get("/metrics", async (_req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", promRegister.contentType);
    res.end(await promRegister.metrics());
  } catch (err) {
    logError(`Metrics scrape failed: ${err}`);
    res.status(500).end();
  }
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  res.json({ status: "ok", validatorId, location });
});

// Status endpoint
app.get("/status", (_req: Request, res: Response<ValidatorStatus>) => {
  res.json({
    validatorId,
    location,
    targetUrl: lastCheck?.vote.status === "UP" ? "Active" : "Inactive",
    lastCheck,
    uptime: process.uptime()
  });
});

// Function to get target URL from database
async function getTargetUrl(): Promise<string> {
  const website = await prisma.website.findFirst({
    where: { paused: false }
  });
  if (!website) {
    throw new Error("No active websites found in database");
  }
  return website.url;
}

// Start monitoring
info(`🟢 Validator ${validatorId}@${location} starting...`);

setInterval(async () => {
  try {
    const targetUrl = await getTargetUrl();
    const { vote, latency } = await validator.checkWebsite(targetUrl);
    lastCheck = {
      vote,
      latency,
      timestamp: new Date().toISOString()
    };
    info(`Check result for ${targetUrl}: ${vote.status === "UP" ? "✅" : "❌"} (${latency}ms)`);
  } catch (err) {
    logError(`Check failed: ${err}`);
  }
}, pingInterval);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  info(`🧿 Validator ${validatorId} listening on ${PORT}`);
}); 