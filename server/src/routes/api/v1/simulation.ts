import express, { Request, Response } from "express";
import { info, error as logError } from "../../../../utils/logger";
import { WebSocketServer } from "ws";
import { Validator } from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { Hub } from "../../../core/Hub";
import prisma from "../../../prismaClient";
import dotenv from "dotenv";
import { raft } from "./server";  // ← same RaftNode instance exported from server.ts

dotenv.config();

const peerList = (process.env.PEERS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const TOTAL_VALIDATORS = 5;
const GOSSIP_ROUNDS    = 3;
const PING_INTERVAL    = 60_000;

export default function createSimulationRouter(ws: WebSocketServer) {
  const router = express.Router();
  let started   = false;
  let validators: Validator[] = [];
  let targetUrl = "";

  async function runSimulationRound() {
    try {
      // 1) each validator pings
      for (const v of validators) {
        const vote = await v.checkWebsite(targetUrl);
        await prisma.validatorLog.create({
          data: {
            validatorId: v.id,
            site: targetUrl,
            status: vote.status,
            timestamp: new Date(),
          },
        });
        info(`Validator ${v.id} voted: ${vote.status}`);
      }

      // 2) gossip
      const gm = new GossipManager(validators, GOSSIP_ROUNDS);
      await gm.runGossipRounds(targetUrl);

      // 3) hub consensus
      const hub       = new Hub(validators, Math.ceil(TOTAL_VALIDATORS/2));
      const consensus = hub.checkConsensus(targetUrl);

      const ts    = new Date().toISOString();
      const votes = validators.map(v => ({
        validatorId: v.id,
        status:      v.getStatus(targetUrl)?.status  || "UNKNOWN",
        weight:      v.getStatus(targetUrl)?.weight  || 1
      }));

      const payload = { url: targetUrl, consensus, votes, ts };

      // 4) if I'm leader, propose into Raft
      try {
        raft.propose(payload);
      } catch (_) {
        info("Not leader—skipping raft.propose");
      }

      // 5) push immedately so leader node UI sees it
      ws.clients.forEach(c => {
        if (c.readyState === c.OPEN) c.send(JSON.stringify(payload));
      });
    } catch (err) {
      logError(`Simulation error: ${err}`);
    }
  }

  router.get("/", async (req: Request, res: Response) => {
    targetUrl = (req.query.url as string)
             || process.env.DEFAULT_TARGET_URL
             || "http://example.com";

    if (!started) {
      validators = Array.from({length: TOTAL_VALIDATORS}, (_, i) => new Validator(i+1));
      validators.forEach(v => v.peers = peerList);
      setInterval(runSimulationRound, PING_INTERVAL);
      started = true;
      info("Simulation loop started");
    }

    await runSimulationRound();
    res.json({ success: true, message: "Simulation kicked off", targetUrl });
  });

  return router;
}
