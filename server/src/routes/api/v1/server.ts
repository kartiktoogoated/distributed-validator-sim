// server.ts
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
import { initProducer } from "../../../services/producer";
import { RaftNode } from "../../../core/raft";
import { initRaftRouter } from "./raftServer";

dotenv.config();
const app  = express();
const PORT = Number(process.env.PORT) || 3000;

// — Security middlewares & JSON parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// — HTTP + WebSocket servers
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

// — Build and mount Raft BEFORE rate limiting
if (!process.env.VALIDATOR_ID || !process.env.PEERS) {
  throw new Error("Missing VALIDATOR_ID or PEERS in env");
}
const nodeId = Number(process.env.VALIDATOR_ID);
const peers = process.env.PEERS
  .split(",")
  .map(s => s.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
  .filter(Boolean);

export const raft = new RaftNode(
  nodeId,
  peers,
  committedCmd => {
    const msg = JSON.stringify({ type: "raft-commit", data: committedCmd });
    wss.clients.forEach(c => c.readyState === c.OPEN && c.send(msg));
  }
);

// mount Raft RPCs under /api/raft
app.use("/api/raft", initRaftRouter(raft));

// — Apply rate limiting to everything else, but skip Raft
app.use(rateLimit({
  windowMs: 15 * 60_000,
  max: 100,
  skip: (req) => req.path.startsWith("/api/raft"),
  message: "Too many requests"
}));

// — Mount your other HTTP routes
app.use("/api/auth",      authRouter);
app.use("/api",           websiteRouter);
app.use("/api/simulate",  createSimulationRouter(wss));
app.use("/api",           createStatusRouter(wss));

// — Initialize Kafka producer
initProducer().catch(e => logError(`Kafka init failed: ${e}`));

// — WebSocket connection logging
wss.on("connection", ws => {
  info("WS client connected");
  ws.on("message", msg => {
    info(`WS msg: ${msg}`);
    ws.send(`Echo: ${msg}`);
  });
  ws.on("error", err => logError(`WS error: ${err}`));
});

// — Start listening
server.listen(PORT, "0.0.0.0", () => info(`Listening on ${PORT}`));
