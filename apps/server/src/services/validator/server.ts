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
import createSimulationRouter from "../../routes/api/v1/simulation";
import { WebSocketServer } from "ws";
import http from "http";

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
let lastCheck: any = null;

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

// Add mock Raft vote endpoint
app.post('/api/raft/vote', (req, res) => {
  info(`Received Raft vote request`);
  res.status(200).send({ success: true });
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

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Mount the simulation router for simulation coordination
app.use("/api/simulate", createSimulationRouter(wss));

// Start server
server.listen(PORT, "0.0.0.0", () => {
  info(`🧿 Validator ${validatorId} listening on ${PORT}`);
}); 