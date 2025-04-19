import express, { Request, Response } from "express";
import { info, error as logError } from "../../../../utils/logger";
import { WebSocketServer } from "ws";
import { Validator, Vote, Status } from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { Hub } from "../../../core/Hub";
import prisma from "../../../prismaClient";
import dotenv from "dotenv";
import { raft } from "./server";

dotenv.config();

// normalize PEERS → ["host:port", …]
const peerList = (process.env.PEERS || "")
  .split(",")
  .map(s => s.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
  .filter(Boolean);

const TOTAL_VALIDATORS = 5;
const GOSSIP_ROUNDS    = 3;
const PING_INTERVAL    = 60_000;

export default function createSimulationRouter(ws: WebSocketServer) {
  const router = express.Router();
  let started   = false;
  let validators: Validator[] = [];
  let targetUrl = "";

  // 1) Receive gossip posts here
  router.post(
    "/gossip",
    (req: Request, res: Response): void => {
      const { site, vote: rawVote, fromId } = req.body as {
        site: string;
        vote: unknown;
        fromId: number;
      };

      // Validate & narrow the incoming vote
      if (
        typeof rawVote !== "object" ||
        rawVote === null ||
        typeof (rawVote as any).status !== "string" ||
        typeof (rawVote as any).weight !== "number"
      ) {
        res.status(400).send("Malformed vote");
        return;
      }

      const status = (rawVote as any).status;
      if (status !== "UP" && status !== "DOWN") {
        res.status(400).send("Invalid vote.status");
        return;
      }

      const vote: Vote = {
        status: status as Status,
        weight: (rawVote as any).weight,
      };

      validators.forEach(v => v.receiveGossip(site, vote, fromId));
      res.sendStatus(200);
    }
  );

  // 2) Main simulation loop
  async function runSimulationRound() {
    try {
      // ping all validators
      for (const v of validators) {
        const vote = await v.checkWebsite(targetUrl);
        await prisma.validatorLog.create({
          data: {
            validatorId: v.id,
            site:        targetUrl,
            status:      vote.status,
            timestamp:   new Date(),
          },
        });
        info(`Validator ${v.id} voted: ${vote.status}`);
      }

      // gossip
      const gm = new GossipManager(validators, GOSSIP_ROUNDS);
      await gm.runGossipRounds(targetUrl);

      // consensus
      const hub       = new Hub(validators, Math.ceil(TOTAL_VALIDATORS / 2));
      const consensus = hub.checkConsensus(targetUrl);

      const ts    = new Date().toISOString();
      const votes = validators.map(v => ({
        validatorId: v.id,
        status:      v.getStatus(targetUrl)?.status  || "UNKNOWN",
        weight:      v.getStatus(targetUrl)?.weight  || 1
      }));

      const payload = { url: targetUrl, consensus, votes, ts };

      // raft.propose if leader
      try {
        raft.propose(payload);
      } catch {
        info("Not leader—skipping raft.propose");
      }

      // broadcast over WS
      ws.clients.forEach(c => {
        if (c.readyState === c.OPEN) c.send(JSON.stringify(payload));
      });
    } catch (err) {
      logError(`Simulation error: ${err}`);
    }
  }

  // 3) Kick off on GET /
  router.get(
    "/",
    async (req: Request, res: Response): Promise<void> => {
      targetUrl = (req.query.url as string) || process.env.DEFAULT_TARGET_URL || "http://example.com";

      if (!started) {
        validators = Array.from(
          { length: TOTAL_VALIDATORS },
          (_, i) => new Validator(i + 1)
        );
        validators.forEach(v => (v.peers = peerList));
        setInterval(runSimulationRound, PING_INTERVAL);
        started = true;
        info("Simulation loop started");
      }

      await runSimulationRound();
      res.json({ success: true, message: "Simulation kicked off", targetUrl });
    }
  );

  return router;
}
