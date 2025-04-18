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

// security & JSON
app.use(helmet(), cors(), express.json());
app.use(rateLimit({ windowMs:15*60_000, max:100, message:"Too many requests" }));

// mount existing routes
app.use("/api/auth", authRouter);
app.use("/api",     websiteRouter);

// create HTTP & WS servers
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });
wss.on("connection", ws => {
  info("WS client connected");
  ws.on("message", msg => { info(`WS msg: ${msg}`); ws.send(`Echo: ${msg}`); });
  ws.on("error", err => logError(`WS error: ${err}`));
});

// build RaftNode once
const nodeId = Number(process.env.VALIDATOR_ID) || 1;
const peers  = (process.env.PEERS||"")
             .split(",").map(s=>s.trim()).filter(Boolean);

export const raft = new RaftNode(
  nodeId,
  peers,
  committedCmd => {
    // on commit → broadcast "raft-commit"
    const m = JSON.stringify({ type:"raft-commit", data:committedCmd });
    wss.clients.forEach(c => c.readyState === c.OPEN && c.send(m));
  }
);

// mount Raft RPC
app.use("/api/raft", initRaftRouter(raft));

// init Kafka (unchanged)
initProducer().catch(e => logError(`Kafka init failed: ${e}`));

// mount simulate & status
app.use("/api/simulate", createSimulationRouter(wss));
app.use("/api",          createStatusRouter(wss));

// start listening
server.listen(PORT, () => info(`Listening on ${PORT}`));
