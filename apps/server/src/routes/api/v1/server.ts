import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import { WebSocketServer } from "ws";

import { info, error as logError } from "../../../../utils/logger";
import authRouter from "./auth";
import websiteRouter from "./website";
import createSimulationRouter from "./simulation";
import createStatusRouter from "./status";
import createLogsRouter from "./logs";
import { startKafkaProducer } from "../../../services/producer";
import { startAlertService } from "../../../services/alertService";
import { RaftNode } from "../../../core/raft";
import { initRaftRouter } from "./raftServer";

const app = express();
const PORT = Number(process.env.PORT);

// ── Security & parsing ─────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── HTTP + WS setup ────────────────────
const server = http.createServer(app);

// ▶️ Listen for WebSocket upgrades on `/api/ws`
//    — Vite proxy (ws: true under `/api`) will forward wss://…/api/ws → this
const wss = new WebSocketServer({ server, path: "/api/ws" });

// ── Raft setup ─────────────────────────
if (!process.env.VALIDATOR_ID || !process.env.PEERS) {
  throw new Error("Missing VALIDATOR_ID or PEERS in environment");
}

const nodeId = Number(process.env.VALIDATOR_ID);
const peers = process.env.PEERS.split(",").map((p) =>
  p.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")
);

export const raftNode = new RaftNode(nodeId, peers, (cmd) => {
  const message = JSON.stringify({ type: "raft-commit", data: cmd });
  wss.clients.forEach((c) =>
    c.readyState === c.OPEN && c.send(message)
  );
});

// ── Raft RPC (no rate-limit) ───────────
app.use("/api/raft", initRaftRouter(raftNode));

// ── Global rate-limit ───────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60_000,
    max: 100,
    skip: (req) => req.path.startsWith("/api/raft"),
    message: "Too many requests, please try again later",
  })
);

// ── Your REST routes ────────────────────
app.use("/api/auth", authRouter);
app.use("/api", websiteRouter);
app.use("/api/simulate", createSimulationRouter(wss));
app.use("/api/status", createStatusRouter(wss));
app.use("/api/logs", createLogsRouter());

// ── Kafka producer ──────────────────────
startKafkaProducer().catch((err) => {
  logError(`Kafka init failed: ${err}`);
});

// ── Alert service ───────────────────────
startAlertService(wss).catch((err) => {
  logError(`Failed to start AlertService: ${err.stack || err}`);
  process.exit(1);
});

// ── WS logging ──────────────────────────
wss.on("connection", (client) => {
  info("WebSocket client connected");
  client.on("message", (m) => {
    info(`WS message: ${m}`);
    client.send(`Echo: ${m}`);
  });
  client.on("error", (e) => logError(`WS error: ${e.message}`));
});

// ── Start server ────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  info(`Validator ${nodeId} listening on port ${PORT}`);
});
