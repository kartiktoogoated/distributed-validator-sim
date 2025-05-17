import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { WebSocketServer } from "ws";
import passport from "passport";
import session from "express-session";

import { info, error as logError } from "../../../../utils/logger";
import authRouter from "./auth";
import websiteRouter from "./website";
import createStatusRouter from "./status";
import createLogsRouter from "./logs";
import SolanaRouter from "./verify-wallet";
import { globalRateLimiter } from "../../../middlewares/rateLimiter";
import { register as promRegister } from "../../../metrics";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : (() => { throw new Error('PORT must be set in environment'); })();
const isAggregator = process.env.IS_AGGREGATOR === "true";

// ── Security & parsing ─────────────────
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: "https://www.deepfry.tech", credentials: true }));
app.use(express.json());

// ── Session & Passport setup ─────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Metrics & health ─────────────────
app.get("/metrics", async (_req, res) => {
  try {
    res.setHeader("Content-Type", promRegister.contentType);
    res.end(await promRegister.metrics());
  } catch (err) {
    logError(`Metrics scrape failed: ${err}`);
    res.status(500).end();
  }
});
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy" });
});

// ── HTTP + WS setup ────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ 
  server, 
  path: "/api/ws",
  perMessageDeflate: false // Disable compression for better performance
});

// ── WebSocket logging ────────────────────────────────────────────
wss.on("connection", (client) => {
  info("WebSocket client connected");
  
  // Send initial connection success message
  client.send(JSON.stringify({ type: "connection", status: "connected" }));
  
  client.on("message", (m) => {
    try {
      const data = JSON.parse(m.toString());
      info(`WS message received: ${JSON.stringify(data)}`);
      // Echo back with timestamp
      client.send(JSON.stringify({
        type: "echo",
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      logError(`Failed to parse WS message: ${err}`);
    }
  });
  
  client.on("error", (e) => logError(`WS error: ${e.message}`));
  client.on("close", () => info("WebSocket client disconnected"));
});

// ── Role-based branching ─────────────────────────────
if (isAggregator) {
  info("🚀 Running as Aggregator");

  (async () => {
    const { startKafkaConsumer } = await import("../../../core/Aggregator");
    const { startAlertService } = await import("../../../services/alertService");

    await startKafkaConsumer();
    await startAlertService(wss);

    // Enable Raft for aggregator only
    const { RaftNode } = await import("../../../core/raft");
    const { initRaftRouter } = await import("./raftServer");

    if (!process.env.VALIDATOR_ID) {
      throw new Error("Missing VALIDATOR_ID in environment for Aggregator Raft");
    }

    const nodeId = Number(process.env.VALIDATOR_ID);
    const peers = (process.env.PEERS || "")
      .split(",")
      .map((p) => p.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
      .filter(Boolean);

    info(`Aggregator ${nodeId} starting Raft with peers: [${peers.join(", ")}]`);
    
    // Initialize Raft node with proper error handling
    try {
      const raftNode = new RaftNode(nodeId, peers, (cmd) => {
        const message = JSON.stringify({ type: "raft-commit", data: cmd });
        wss.clients.forEach((c) => { 
          if (c.readyState === c.OPEN) {
            try {
              c.send(message);
            } catch (err) {
              logError(`Failed to send Raft message: ${err}`);
            }
          }
        });
      });
      
      // Mount Raft router
      app.use("/api/raft", initRaftRouter(raftNode));
      info(`Raft router mounted for Aggregator ${nodeId}`);
    } catch (error: unknown) {
      logError(`Failed to initialize Raft for Aggregator ${nodeId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  })();
} else {
  info("🧿 Running as Validator");

  (async () => {
    const { startKafkaProducer } = await import("../../../services/producer");
    await startKafkaProducer();
    const { pollAndGossip } = await import("../../../core/pinger");
    const { default: createSimulationRouter } = await import("./simulation");

    if (!process.env.VALIDATOR_ID) {
      throw new Error("VALIDATOR_ID must be set in validator node");
    }

    app.use("/api/simulate", createSimulationRouter(wss));
    // No Raft setup in validators
  })();
}

// ── Global rate-limit ─────────────────────
app.use(globalRateLimiter);

// ── Common REST routes ────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api", websiteRouter);
app.use("/api/status", createStatusRouter(wss));
app.use("/api/logs", createLogsRouter());
app.use('/api/auth', SolanaRouter);

// ── Start HTTP server ────────────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  const role = isAggregator ? "Aggregator" : "Validator";
  info(`${role} ${process.env.VALIDATOR_ID || ""} listening on port ${PORT}`);
});
