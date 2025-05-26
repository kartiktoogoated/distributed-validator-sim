import dotenv from "dotenv";
dotenv.config();

if (process.env.IS_AGGREGATOR !== "true") {
  throw new Error("Run this file with IS_AGGREGATOR=true");
}

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import passport from "passport";
import session from "express-session";
import axios, { AxiosError } from "axios";
import { Validator } from "../../core/Validator";
import { info, error as logError } from "../../utils/logger";
import { register as promRegister } from "../../metrics";
import { startKafkaProducer } from "../../services/producer";
import { startAlertService } from "../../services/alertService";
import { globalRateLimiter } from "../../middlewares/rateLimiter";
import { Kafka, logLevel } from "kafkajs";

// Import all route modules
import authRouter from "../../routes/api/v1/auth";
import websiteRouter from "../../routes/api/v1/website";
import createSimulationRouter from "../../routes/api/v1/simulation";
import createStatusRouter from "../../routes/api/v1/status";
import createLogsRouter from "../../routes/api/v1/logs";
import SolanaRouter from "../../routes/api/v1/verify-wallet";

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

interface ValidatorResponse {
  url: string;
  status?: ValidatorStatus;
  error?: string;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: "https://www.deepfry.tech", credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "default-secret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

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

// HTTP + WS setup
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/ws" });

// Global rate-limit
app.use(globalRateLimiter);

// REST routes
app.use("/api/auth", authRouter);
app.use("/api", websiteRouter);
app.use("/api/simulate", createSimulationRouter(wss));
app.use("/api/status", createStatusRouter(wss));
app.use("/api/logs", createLogsRouter());
app.use('/api/auth', SolanaRouter);

// Validator setup (Aggregator also acts as a validator)
const validatorId = Number(process.env.VALIDATOR_ID);
const location = process.env.LOCATION!;
const targetUrl = process.env.TARGET_URL!;
const pingInterval = Number(process.env.PING_INTERVAL_MS) || 30000;

const validator = new Validator(validatorId, location);
let lastCheck: ValidatorStatus["lastCheck"] = null;

// Validator endpoints
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", validatorId, location });
});

app.get("/status", (_req: Request, res: Response<ValidatorStatus>) => {
  res.json({
    validatorId,
    location,
    targetUrl,
    lastCheck,
    uptime: process.uptime()
  });
});

// Validator Status Collection
const kafkaBrokers = (process.env.KAFKA_BOOTSTRAP_SERVERS || "kafka:9092").split(",");
const kafkaClient = new Kafka({
  clientId: 'aggregator',
  brokers: kafkaBrokers,
  logLevel: logLevel.INFO,
});

const peers = (process.env.PEERS || "validator1:3000,validator2:3000")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

const collectionInterval = Number(process.env.COLLECTION_INTERVAL_MS) || 30000;

async function collectValidatorStatus(): Promise<ValidatorResponse[]> {
  const results = await Promise.allSettled(
    peers.map(async (validatorUrl) => {
      try {
        const response = await axios.get<ValidatorStatus>(`${validatorUrl}/status`);
        return {
          url: validatorUrl,
          status: response.data
        };
      } catch (err) {
        const error = err as AxiosError;
        logError(`Failed to collect status from ${validatorUrl}: ${error.message}`);
        return {
          url: validatorUrl,
          error: error.message
        };
      }
    })
  );

  const status = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      url: peers[index],
      error: result.reason instanceof Error ? result.reason.message : String(result.reason)
    };
  });

  // Broadcast to WebSocket clients
  const msg: WebSocketMessage = { type: "validator-status", data: status };
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) client.send(JSON.stringify(msg));
  });

  return status;
}

// Start collecting validator status
setInterval(collectValidatorStatus, collectionInterval);

// Start monitoring (Aggregator also acts as a validator)
info(`🟢 Aggregator ${validatorId}@${location} is watching ${targetUrl}`);

setInterval(async () => {
  try {
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

// Add validator status endpoint
app.get("/api/validators", async (_req: Request, res: Response<ValidatorResponse[]>) => {
  try {
    const status = await collectValidatorStatus();
    res.json(status);
  } catch (err) {
    logError(`Failed to collect validator status: ${err}`);
    res.status(500).json([{ url: "error", error: "Failed to collect validator status" }]);
  }
});

// Kafka + Alerts
startKafkaProducer().catch((err) => logError(`Kafka init failed: ${err}`));
startAlertService(wss).catch((err) => {
  logError(`AlertService failed: ${err}`);
  process.exit(1);
});

// WebSocket logging
wss.on("connection", (client: WebSocket) => {
  info("WebSocket client connected");
  client.on("message", (m: string) => info(`WS: ${m}`));
  client.on("error", (e: Error) => logError(`WS error: ${e.message}`));
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  info(`🧿 Aggregator listening on ${PORT}`);
});