// src/server.ts
import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { info, error as logError } from '../../../../utils/logger'; 
import authRouter from './auth'; 
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== API Routes =====

// Mount the authentication routes under /api/auth.
app.use('/api/auth', authRouter);

// Create a router for simulation endpoints.
const simulationRouter = Router();

/**
 * GET /simulate
 * Simulates a process (dummy implementation) and returns a consensus result.
 */
simulationRouter.get(
  '/simulate',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // For the simulation, we simply wait 1 second and then return a dummy "UP" consensus.
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

// Mount the simulation router under the "/api" path.
app.use('/api', simulationRouter);

// ===== Create and Configure the HTTP and WebSocket Server =====

// Create an HTTP server from the Express app.
const server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server.
const wss = new WebSocketServer({ server });

// Listen for WebSocket connections.
wss.on('connection', (ws) => {
  info('New WebSocket client connected');

  // Listen for messages from clients.
  ws.on('message', (message: string) => {
    info(`Received WS message: ${message}`);
    // Echo the received message back to the client.
    ws.send(`Echo: ${message}`);
  });

  ws.on('error', (err) => {
    logError(`WebSocket error: ${err}`);
  });
});

// ===== Start the Server =====
server.listen(PORT, () => {
  info(`Server is listening on port ${PORT}`);
});
