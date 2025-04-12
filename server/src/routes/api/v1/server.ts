// src/routes/api/v1/server.ts
import express, { Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { info, error as logError } from "../../../../utils/logger";
import authRouter from "./auth";
import statusRouter from "./status";  // your status router remains unchanged
import createSimulationRouter from "./simulation"; // Import the simulation router factory
import { pingAndBroadcast, startPinger } from "../../../core/pinger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== API Routes =====
// Mount authentication routes under /api/auth.
app.use("/api/auth", authRouter);
// Mount status route under /api (for on-demand WS ping, if needed).
// app.use("/api/status", statusRouter);

// ===== Create and Configure the HTTP and WebSocket Server =====
// Create an HTTP server from the Express app.
const server = http.createServer(app);

// Create the WebSocket server attached to the HTTP server.
const wss = new WebSocketServer({ server });
wss.on("connection", (ws) => {
  info("New WebSocket client connected");
  
  ws.on("message", (message: string) => {
    info(`Received WS message: ${message}`);
    ws.send(`Echo: ${message}`);
  });
  
  ws.on("error", (err) => {
    logError(`WebSocket error: ${err}`);
  });
});

// Inject the WS server instance into our simulation route.
const simulationRouter = createSimulationRouter(wss);
app.use("/api/simulate", simulationRouter);

// ===== Start the Server =====
server.listen(PORT,  () => {
  info(`Server is listening on port ${PORT}`);
});
