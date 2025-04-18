import express, { Request, Response } from "express";
import { info, error as logError } from "../../../../utils/logger";
import { WebSocketServer } from "ws";
import { Validator } from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { Hub } from "../../../core/Hub";
import prisma from "../../../prismaClient";
import dotenv from "dotenv";

dotenv.config();

// Parse PEERS env var into an array of "host:port" strings.
const peerList: string[] = process.env.PEERS
  ? process.env.PEERS.split(",").map(s => s.trim()).filter(Boolean)
  : [];

const TOTAL_VALIDATORS = 5;
const GOSSIP_ROUNDS = 3;
const PING_INTERVAL = 60000; // Interval in milliseconds (60 seconds)

export default function createSimulationRouter(ws: WebSocketServer) {
  const router = express.Router();
  let continuousStarted = false;
  let validators: Validator[] = [];
  let targetUrl: string = "";

  // Helper function to run one simulation round.
  async function runSimulationRound(): Promise<void> {
    try {
      // Each validator performs a website check.
      for (const validator of validators) {
        const vote = await validator.checkWebsite(targetUrl);
        await prisma.validatorLog.create({
          data: {
            validatorId: validator.id,
            site: targetUrl,
            status: vote.status,
            timestamp: new Date(),
          },
        });
        info(`Validator ${validator.id} voted: ${vote.status}`);
      }

      // Run gossip simulation rounds.
      const gossipManager = new GossipManager(validators, GOSSIP_ROUNDS);
      await gossipManager.runGossipRounds(targetUrl);

      // Use the Hub to derive consensus.
      const hub = new Hub(validators, Math.ceil(TOTAL_VALIDATORS / 2));
      const consensus = hub.checkConsensus(targetUrl);

      const timeStamp = new Date().toISOString();
      const votes = validators.map((v) => ({
        validatorId: v.id,
        status: v.getStatus(targetUrl)?.status || "UNKNOWN",
        weight: v.getStatus(targetUrl)?.weight || 1,
      }));

      const payload = { url: targetUrl, consensus, votes, timeStamp };

      // Broadcast payload to all connected WebSocket clients.
      ws.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(payload));
        }
      });
    } catch (err) {
      logError(`Error during simulation round: ${err}`);
    }
  }

  // Route handler for the GET / endpoint
  router.get("/", async (req: Request, res: Response) => {
    try {
      // Determine the target URL.
      targetUrl = (req.query.url as string)
        || process.env.DEFAULT_TARGET_URL
        || "http://example.com";

      if (!targetUrl) {
        res.status(400).json({ success: false, message: "Target URL not provided" });
        return;
      }

      if (!continuousStarted) {
        // Create validators only once.
        validators = Array.from(
          { length: TOTAL_VALIDATORS },
          (_, i) => new Validator(i + 1)
        );

        // Assign the same peerList (host:port) to each validator.
        validators.forEach((validator) => {
          validator.peers = peerList;
        });

        // Start continuous simulation rounds.
        setInterval(runSimulationRound, PING_INTERVAL);
        continuousStarted = true;
        info("Started continuous simulation loop.");
      }

      // Run one round immediately.
      await runSimulationRound();
      res.json({
        success: true,
        message: "Continuous simulation started",
        targetUrl,
      });
    } catch (error: any) {
      logError(`Error in /api/simulate: ${error}`);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}
