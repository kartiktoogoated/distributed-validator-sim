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
import { initGossipRouter } from "./gossip";
import { initProducer } from "../../../services/producer";
import { Validator } from "../../../core/Validator"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Security & Middleware =====
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later"
}));

// ===== API Routes (no change) =====
app.use("/api/auth", authRouter);
app.use("/api", websiteRouter);

// ===== Instantiate Local Validator & Peers =====
const validatorId = Number(process.env.VALIDATOR_ID) || 1;
const peersEnv = process.env.PEERS || "";  
const peerList = peersEnv.split(",").map(s => s.trim()).filter(Boolean);

const localValidator = new Validator(validatorId);
localValidator.peers = peerList;    // e.g. ["192.168.1.10:3000","192.168.1.11:3000"]

// ===== Gossip Endpoint =====
app.use("/api", initGossipRouter(localValidator));

// ===== HTTP & WebSocket Server Setup =====
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", ws => {
  info("New WebSocket client connected");
  ws.on("message", (msg: string) => {
    info(`WS message: ${msg}`);
    ws.send(`Echo: ${msg}`);
  });
  ws.on("error", err => logError(`WebSocket error: ${err}`));
});

// ===== Kafka Producer =====
initProducer().catch(err => {
  logError(`Kafka producer init failed: ${err}`);
});

// ===== Simulation & Status Routes =====
app.use("/api/simulate", createSimulationRouter(wss));
app.use("/api", createStatusRouter(wss));

// ===== Start Listening =====
server.listen(PORT, () => {
  info(`Server is listening on port ${PORT}`);
});
