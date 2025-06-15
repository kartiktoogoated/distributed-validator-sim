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
const targetWebsiteUrl = process.env.TARGET_WEBSITE_URL || "http://x.com";

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

// Start periodic website check
setInterval(async () => {
  try {
    const { vote, latency } = await validator.checkWebsite(targetWebsiteUrl);
    lastCheck = { vote, latency, timestamp: new Date().toISOString() };
  } catch (error) {
    logError(`Validator ${validatorId} failed to check website ${targetWebsiteUrl}: ${error}`);
  }
}, pingInterval);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Handle WebSocket server lifecycle
wss.on('connection', (ws) => {
  info(`Client connected to validator ${validatorId}`);
  
  ws.on('error', (err) => {
    logError(`WebSocket error: ${err.message}`);
  });

  ws.on('close', () => {
    info(`Client disconnected from validator ${validatorId}`);
  });
});

// Handle server shutdown
process.on('SIGTERM', () => {
  info(`Shutting down validator ${validatorId}...`);
  wss.close(() => {
    info(`WebSocket server closed for validator ${validatorId}`);
    server.close(() => {
      info(`HTTP server closed for validator ${validatorId}`);
      process.exit(0);
    });
  });
});

// Mount the simulation router for simulation coordination
app.use("/api/simulate", createSimulationRouter(wss));

// Start server
server.listen(PORT, "0.0.0.0", () => {
  info(`🧿 Validator ${validatorId} listening on ${PORT}`);
}); 