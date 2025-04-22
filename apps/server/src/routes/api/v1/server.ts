import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { info, error as logError } from "../../../../utils/logger";
import authRouter from "./auth";
import websiteRouter from "./website";
import createSimulationRouter from "./simulation";
import createStatusRouter from "./status";
import { startKafkaProducer } from "../../../services/producer"; 
import { RaftNode } from "../../../core/raft";
import { initRaftRouter } from "./raftServer";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ── Security & parsing ─────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── HTTP + WS setup ────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ── Raft setup ─────────────────────────
if (!process.env.VALIDATOR_ID || !process.env.PEERS) {
  throw new Error("Missing VALIDATOR_ID or PEERS in environment");
}

const nodeId = Number(process.env.VALIDATOR_ID);
const peers = process.env.PEERS.split(",").map(raw =>
  raw.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")
);

export const raft = new RaftNode(nodeId, peers, committedCommand => {
  const message = JSON.stringify({ type: "raft-commit", data: committedCommand });
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) client.send(message);
  });
});

// ── Raft RPC (no rate‑limit) ───────────
app.use("/api/raft", initRaftRouter(raft));

// ── Global rate‑limit ───────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60_000,
    max: 100,
    skip: req => req.path.startsWith("/api/raft"),
    message: "Too many requests, please try again later",
  })
);

// ── Your routes ─────────────────────────
app.use("/api/auth", authRouter);
app.use("/api", websiteRouter);
app.use("/api/simulate", createSimulationRouter(wss));
app.use("/api/status", createStatusRouter(wss));

// ── Kafka producer ──────────────────────
startKafkaProducer().catch((initializationError: unknown) => {
  logError(`Kafka initialization failed: ${initializationError}`);
});

// ── WS logging ──────────────────────────
wss.on("connection", wsClient => {
  info("WebSocket client connected");
  wsClient.on("message", message => {
    info(`Received WS message: ${message}`);
    wsClient.send(`Echo: ${message}`);
  });
  wsClient.on("error", (socketError: Error) => {
    logError(`WebSocket client error: ${socketError.message}`);
  });
});

// ── Start server ────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  info(`Validator ${nodeId} listening on port ${PORT}`);
});