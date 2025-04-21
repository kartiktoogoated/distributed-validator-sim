import { Router, Request, Response, NextFunction } from "express";
import { WebSocketServer } from "ws";
import { info, error as logError } from "../../../../utils/logger";
import { Validator, Vote, Status } from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { Hub } from "../../../core/Hub";
import prisma from "../../../prismaClient";
import dotenv from "dotenv";
import { raft } from "./server";

dotenv.config();

const GOSSIP_ROUNDS = 3;
const PING_INTERVAL = 60_000;

const peerList = (process.env.PEERS || "")
  .split(",")
  .map(s => s.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
  .filter(Boolean);

export default function createSimulationRouter(ws: WebSocketServer): Router {
  const router = Router();
  let started = false;
  let validator!: Validator;
  let targetUrl = "";

  router.post("/gossip", (req: Request, res: Response, next: NextFunction) => {
    try {
      const { site, vote: rawVote, fromId } = req.body as {
        site: string;
        vote: unknown;
        fromId: number;
      };

      if (
        typeof rawVote !== "object" ||
        rawVote === null ||
        typeof (rawVote as any).status !== "string" ||
        typeof (rawVote as any).weight !== "number"
      ) {
        res.status(400).send("Malformed vote");
        return;
      }

      const { status, weight } = rawVote as Vote;
      if (status !== "UP" && status !== "DOWN") {
        res.status(400).send("Invalid vote.status");
        return;
      }

      validator.receiveGossip(site, { status, weight }, fromId);
      res.sendStatus(200);
    } catch (err) {
      logError(`Gossip handler error: ${err}`);
      next(err);
    }
  });

  async function runSimulationRound() {
    try {
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

      await new GossipManager([validator], GOSSIP_ROUNDS).runGossipRounds(targetUrl);

      const totalNodes = peerList.length + 1;
      const quorum = Math.ceil(totalNodes / 2);
      const consensus = new Hub([validator], quorum).checkConsensus(targetUrl);

      const ts = new Date().toISOString();
      const votes = [
        {
          validatorId: validator.id,
          status: validator.getStatus(targetUrl)?.status ?? "UNKNOWN",
          weight: validator.getStatus(targetUrl)?.weight ?? 1,
        },
      ];
      const payload = { url: targetUrl, consensus, votes, ts };

      try {
        raft.propose(payload);
      } catch {
        info("Not leader—skipping raft.propose");
      }

      const msg = JSON.stringify(payload);
      ws.clients.forEach(c => {
        if (c.readyState === c.OPEN) c.send(msg);
      });
    } catch (err) {
      logError(`Simulation error: ${err}`);
    }
  }

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      targetUrl =
        (req.query.url as string) ||
        process.env.DEFAULT_TARGET_URL! ||
        "http://example.com";

      if (!started) {
        const id = Number(process.env.VALIDATOR_ID);
        if (isNaN(id)) throw new Error("VALIDATOR_ID must be a number");
        validator = new Validator(id);
        validator.peers = peerList;
        setInterval(runSimulationRound, PING_INTERVAL);
        started = true;
        info(`Simulation loop started for Validator ${id}`);
      }

      await runSimulationRound();
      res.json({ success: true, message: "Simulation kicked off", targetUrl });
    } catch (err) {
      logError(`GET / simulation error: ${err}`);
      next(err);
    }
  });

  return router;
}
