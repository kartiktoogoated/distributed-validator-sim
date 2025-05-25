import dotenv from "dotenv";
dotenv.config();

if (process.env.IS_AGGREGATOR !== "true") {
  throw new Error("Run this file with IS_AGGREGATOR=true");
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { WebSocketServer } from "ws";
import passport from "passport";
import session from "express-session";

import { info, error as logError } from "../../utils/logger";
import authRouter from "../../routes/api/v1/auth";
import websiteRouter from "../../routes/api/v1/website";
import createSimulationRouter from "../../routes/api/v1/simulation";
import createStatusRouter from "../../routes/api/v1/status";
import createLogsRouter from "../../routes/api/v1/logs";
import SolanaRouter from "../../routes/api/v1/verify-wallet";
import { startKafkaProducer } from "../../services/producer";
import { startAlertService } from "../../services/alertService";
import { globalRateLimiter } from "../../middlewares/rateLimiter";
import { register as promRegister } from "../../metrics";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ── Middleware ─────────────────
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

// ── Prometheus ─────────────────
app.get("/metrics", async (_req, res) => {
  try {
    res.setHeader("Content-Type", promRegister.contentType);
    res.end(await promRegister.metrics());
  } catch (err) {
    logError(`Metrics scrape failed: ${err}`);
    res.status(500).end();
  }
});

// ── HTTP + WS ─────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/ws" });

// ── Raft Setup ─────────────────
(async () => {
  const { RaftNode } = await import("../../core/raft");
  const { initRaftRouter } = await import("../../routes/api/v1/raftServer");

  const nodeId = Number(process.env.VALIDATOR_ID);
  const peers = (process.env.PEERS || "")
    .split(",")
    .map(p => p.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""));

  const raftNode = new RaftNode(nodeId, peers, (cmd) => {
    const msg = JSON.stringify({ type: "raft-commit", data: cmd });
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) client.send(msg);
    });
  });

  app.use("/api/raft", initRaftRouter(raftNode));
})();

// ── Routes ─────────────────────
app.use(globalRateLimiter);
app.use("/api/auth", authRouter);
app.use("/api", websiteRouter);
app.use("/api/simulate", createSimulationRouter(wss));
app.use("/api/status", createStatusRouter(wss));
app.use("/api/logs", createLogsRouter());
app.use("/api/auth", SolanaRouter);

// ── Kafka + Alerts ─────────────
startKafkaProducer().catch((err) => logError(`Kafka init failed: ${err}`));
startAlertService(wss).catch((err) => {
  logError(`AlertService failed: ${err}`);
  process.exit(1);
});

// ── WebSocket log ──────────────
wss.on("connection", (client) => {
  info("WebSocket client connected");
  client.on("message", (m) => info(`WS: ${m}`));
  client.on("error", (e) => logError(`WS error: ${e.message}`));
});

// ── Start ──────────────────────
server.listen(PORT, "0.0.0.0", () => {
  info(`🧿 Aggregator listening on ${PORT}`);
});
