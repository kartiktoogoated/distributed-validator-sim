// src/server.ts
import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { info, error as logError } from '../../../../utils/logger';
import authRouter from './auth';
import dotenv from "dotenv";
import { startPinger } from '../../../core/pinger';
import statusRouter from "./status"; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== API Routes =====

// Mount the authentication routes under /api/auth.
app.use('/api/auth', authRouter);
app.use('/api', statusRouter);  

// Create a router for simulation endpoints.
const simulationRouter = Router();

/**
 * GET /simulate
 * Dummy simulation endpoint.
 */
simulationRouter.get(
  '/simulate',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const consensus = await new Promise<string>((resolve) =>
        setTimeout(() => resolve('UP'), 1000)
      );
      res.json({ success: true, consensus });
    } catch (err) {
      logError(`Error in /simulate endpoint: ${err}`);
      res.status(500).json({ error: 'Simulation failed' });
    }
  }
);
app.use('/api', simulationRouter);

// ===== WebSocket Server with Consensus/Quorum Logic =====

// Create an HTTP server from the Express app.
const server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server.
const wss = new WebSocketServer({ server });

// In-memory storage for validator votes.
const votes = new Map<number, "UP" | "DOWN">();

// Configure expected number of validators and quorum threshold.
const TOTAL_VALIDATORS = 5; // total validators expected in a round
const QUORUM = 3;           // minimum votes required for a consensus

/**
 * Computes consensus based on votes.
 * Returns "UP" if at least QUORUM votes are "UP", or "DOWN" if at least QUORUM votes are "DOWN".
 * Returns null if no consensus can be determined yet.
 */
function computeConsensus(): "UP" | "DOWN" | null {
  let countUp = 0;
  let countDown = 0;

  votes.forEach((status) => {
    if (status === "UP") countUp++;
    else if (status === "DOWN") countDown++;
  });

  if (countUp >= QUORUM) return "UP";
  if (countDown >= QUORUM) return "DOWN";
  return null;
}

// Handle incoming WebSocket connections.
wss.on('connection', (ws) => {
  info('New WebSocket client connected');

  ws.on('message', (msg: string) => {
    try {
      // Expecting a JSON message with { validatorId: number, status: "UP" | "DOWN" }
      const vote = JSON.parse(msg);
      if (vote && typeof vote.validatorId === "number" && (vote.status === "UP" || vote.status === "DOWN")) {
        // Store or update the vote.
        votes.set(vote.validatorId, vote.status);
        info(`Received vote from validator ${vote.validatorId}: ${vote.status}`);

        // Option 1: If we've received votes from all validators, compute consensus.
        if (votes.size >= TOTAL_VALIDATORS) {
          const consensus = computeConsensus();
          if (consensus !== null) {
            const payload = JSON.stringify({
              consensus,
              votes: Array.from(votes.entries()),
              timeStamp: new Date().toISOString(),
            });
            // Broadcast the consensus to all connected clients.
            wss.clients.forEach(client => {
              if (client.readyState === client.OPEN) {
                client.send(payload);
              }
            });
            // Clear votes for the next round.
            votes.clear();
          }
        }
      } else {
        info("Invalid vote message format");
      }
    } catch (error) {
      logError(`Error processing WS message: ${error}`);
    }
  });

  ws.on('error', (err) => {
    logError(`WebSocket error: ${err}`);
  });
});

// ===== Start the Continuous Pinger (for extra periodic status updates) =====
startPinger(wss);

// ===== Start the Server =====
server.listen(PORT, () => {
  info(`Server is listening on port ${PORT}`);
});
