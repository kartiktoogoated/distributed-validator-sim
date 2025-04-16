import express, { Request, Response } from "express";
import { info, error as logError } from "../../../../utils/logger";
import { WebSocketServer } from "ws";
import { Validator } from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { Hub } from "../../../core/Hub";
import prisma from "../../../prismaClient";

const TOTAL_VALIDATORS = 5;
const GOSSIP_ROUNDS = 3;

export default function createSimulationRouter(ws: WebSocketServer) {
  const router = express.Router();
  let continuousPingerStarted = false;

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUrl = (req.query.url as string) || process.env.DEFAULT_TARGET_URL || "http://example.com";
      if (!targetUrl) {
        res.status(400).json({ success: false, message: "Target URL not provided" });
        return;
      }

      // Step 1: Create validators
      const validators: Validator[] = Array.from({ length: TOTAL_VALIDATORS }, (_, i) => new Validator(i + 1));
      validators.forEach((validator, idx) => {
        validator.peers = validators.filter((_, peerIdx) => peerIdx !== idx);
      });

      // Step 2: Each validator performs an actual ping
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

      // Step 3: Start gossip simulation
      const gossipManager = new GossipManager(validators, GOSSIP_ROUNDS);
      await gossipManager.runGossipRounds(targetUrl);

      // Step 4: Use Hub to derive consensus
      const hub = new Hub(validators, Math.ceil(TOTAL_VALIDATORS / 2));
      const consensus = hub.checkConsensus(targetUrl);

      const timeStamp = new Date().toISOString();
      const votes = validators.map(v => ({
        validatorId: v.id,
        status: v.getStatus(targetUrl)?.status || "UNKNOWN",
        weight: v.getStatus(targetUrl)?.weight || 1
      }));

      const payload = {
        url: targetUrl,
        consensus,
        votes,
        timeStamp,
      };

      // Send via WS
      ws.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(payload));
        }
      });

      res.json({ success: true, ...payload });

    } catch (error: any) {
      logError(`Error in /api/simulate: ${error}`);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}
