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
import createSimulationRouter from "./simulation";
import createStatusRouter from "./status";
import createLogsRouter from "./logs";
import SolanaRouter from "./verify-wallet";
import { startKafkaProducer } from "../../../services/producer";
import { startAlertService } from "../../../services/alertService";
import { globalRateLimiter } from "../../../middlewares/rateLimiter";
import { register as promRegister } from "../../../metrics";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ── Security & parsing ─────────────────
app.use(helmet());
app.use(
  cors({
    origin: "https://www.deepfry.tech",
    credentials: true,
  })
);
app.use(express.json());

// ── Session & Passport setup ─────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ── Prometheus metrics endpoint ───────────────────
app.get("/metrics", async (_req, res) => {
  try {
    res.setHeader("Content-Type", promRegister.contentType);
    res.end(await promRegister.metrics());
  } catch (err) {
    logError(`Metrics scrape failed: ${err}`);
    res.status(500).end();
  }
});

// ── HTTP + WS setup ────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/ws" });

// ── Raft setup (only for aggregators) ─────────────────────────────
let raftNode;
const isAggregator = process.env.IS_AGGREGATOR === "true";

if (isAggregator) {
  (async () => {
    const { RaftNode } = await import("../../../core/raft");
    const { initRaftRouter } = await import("./raftServer");

    if (!process.env.VALIDATOR_ID || process.env.PEERS === undefined) {
      throw new Error("Missing VALIDATOR_ID or PEERS in environment");
    }

    const nodeId = Number(process.env.VALIDATOR_ID);
    const peers = (process.env.PEERS || "")
      .split(",")
      .map((p) =>
        p
          .trim()
          .replace(/^https?:\/\//, "")
          .replace(/\/+$/, "")
      )
      .filter(Boolean);

    info(`Aggregator ${nodeId} starting with peers: [${peers.join(", ")}]`);

    raftNode = new RaftNode(nodeId, peers, (cmd) => {
      const message = JSON.stringify({ type: "raft-commit", data: cmd });
      wss.clients.forEach((c) => {
        if (c.readyState === c.OPEN) c.send(message);
      });
    });

    app.use("/api/raft", initRaftRouter(raftNode));
  })();
} else {
  info("🧿 Validator node: Raft setup skipped.");
}

// ── Global rate-limit ─────────────────────
app.use(globalRateLimiter);

// ── REST routes ──────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api", websiteRouter);
app.use("/api/simulate", createSimulationRouter(wss));
app.use("/api/status", createStatusRouter(wss));
app.use("/api/logs", createLogsRouter());
app.use('/api/auth', SolanaRouter);

// ── Kafka producer ───────────────────────────────────────────────
startKafkaProducer().catch((err) => {
  logError(`Kafka init failed: ${err}`);
});

// ── Alert service ────────────────────────────────────────────────
startAlertService(wss).catch((err) => {
  logError(`Failed to start AlertService: ${err.stack || err}`);
  process.exit(1);
});

// ── WebSocket logging ────────────────────────────────────────────
wss.on("connection", (client) => {
  info("WebSocket client connected");
  client.on("message", (m) => {
    info(`WS message: ${m}`);
    client.send(`Echo: ${m}`);
  });
  client.on("error", (e) => logError(`WS error: ${e.message}`));
});

// ── Start HTTP server ────────────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  const role = isAggregator ? "Aggregator" : "Validator";
  info(`${role} ${process.env.VALIDATOR_ID || ""} listening on port ${PORT}`);
});
