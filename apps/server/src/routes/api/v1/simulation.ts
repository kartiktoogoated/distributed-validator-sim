import dotenv from "dotenv";
dotenv.config();

import express, { Router, Request, Response, NextFunction } from "express";
import { WebSocketServer } from "ws";
import { info, error as logError } from "../../../../utils/logger";
import prisma from "../../../prismaClient";
import {
  Validator,
  Status,
  GossipPayload,
} from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { Hub } from "../../../core/Hub";
import { RaftNode } from "../../../core/raft";

const GOSSIP_ROUNDS = 1;
const PING_INTERVAL_MS = Number(process.env.PING_INTERVAL_MS) || 60_000;

// parse peers from env
const peerAddresses = (process.env.PEERS ?? "")
  .split(",")
  .map((h) =>
    h
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
  )
  .filter(Boolean);

// local validator ID & region
const localValidatorId = Number(process.env.VALIDATOR_ID);
if (isNaN(localValidatorId)) {
  throw new Error("VALIDATOR_ID must be a number");
}
const localLocation = process.env.LOCATION || "unknown";

// single Validator instance
const validatorInstance = new Validator(localValidatorId);
validatorInstance.peers = peerAddresses;

// Raft node (for consensus / replication)
const raftNode = new RaftNode(localValidatorId, peerAddresses, (committed) => {
  info(`Raft committed: ${JSON.stringify(committed)}`);
});

export default function createSimulationRouter(
  wsServer: WebSocketServer
): Router {
  const SimulationRouter = Router();
  SimulationRouter.use(express.json());

  let isLoopRunning = false;
  let monitoredUrl = process.env.DEFAULT_TARGET_URL || "http://example.com";

  // 1) Intake gossip from other validators
  SimulationRouter.post(
    "/gossip",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { site, vote, validatorId, responseTime, timeStamp, location } =
          req.body as GossipPayload;

        if (
          typeof site !== "string" ||
          typeof validatorId !== "number" ||
          typeof responseTime !== "number" ||
          typeof timeStamp !== "string" ||
          typeof location !== "string" ||
          !vote ||
          (vote.status !== "UP" && vote.status !== "DOWN")
        ) {
          res.status(400).send("Malformed gossip payload");
          return;
        }

        validatorInstance.receiveGossip(site, vote, validatorId);
        info(`🔄 Gossip from ${validatorId}@${location} for ${site}: ${vote.status}`);

        res.sendStatus(204);
        return;
      } catch (err) {
        logError(`Gossip handler error: ${err}`);
        next(err);
      }
    }
  );

  // 2) Kick off & one-shot GET /api/simulate
  SimulationRouter.get(
    "/",
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (typeof req.query.url === "string") {
          monitoredUrl = req.query.url;
        }

        if (!isLoopRunning) {
          setInterval(executeRound, PING_INTERVAL_MS);
          isLoopRunning = true;
          info(`🔁 Simulation loop started for Validator ${localValidatorId}`);
        }

        const payload = await executeRound();
        res.json({ success: true, ...payload });
        return;
      } catch (err) {
        logError(`GET /simulation error: ${err}`);
        next(err);
      }
    }
  );

  // 3) Core ping → gossip → consensus round
  async function executeRound(): Promise<{
    url: string;
    consensus: Status;
    votes: Array<{ validatorId: number; status: Status; weight: number }>;
    timeStamp: string;
  }> {
    // a) ping
    const start = Date.now();
    const vote = await validatorInstance.checkWebsite(monitoredUrl);
    const latency = Date.now() - start;
    const timeStamp = new Date().toISOString();

    info(
      `[Ping] Validator ${localValidatorId}@${localLocation}` +
        ` → ${monitoredUrl}: ${vote.status} (${latency}ms)`
    );

    // b) ensure our Validator row exists
    await prisma.validator.upsert({
      where: { id: localValidatorId },
      update: { location: localLocation },
      create: { id: localValidatorId, location: localLocation },
    });

    // c) persist the raw ping
    await prisma.validatorLog.create({
      data: {
        validatorId: localValidatorId,
        site: monitoredUrl,
        status: vote.status,
        timestamp: new Date(timeStamp),
      },
    });

    // d) gossip just once, immediately
    await new GossipManager([validatorInstance], GOSSIP_ROUNDS, localLocation)
      .runGossipRounds(monitoredUrl, latency, timeStamp);

    // e) compute majority-quorum consensus
    const total = peerAddresses.length + 1;
    const quorum = Math.ceil(total / 2);
    const consensusStatus = new Hub([validatorInstance], quorum).checkConsensus(
      monitoredUrl
    ) as Status;

    info(`[Consensus] ${monitoredUrl} → ${consensusStatus} (${quorum}/${total})`);

    // f) build and return payload
    const payload = {
      url: monitoredUrl,
      consensus: consensusStatus,
      votes: [{ validatorId: localValidatorId, status: vote.status, weight: vote.weight }],
      timeStamp,
    };

    // g) Raft-propose
    try {
      raftNode.propose(payload);
    } catch {
      info("Not Raft leader—skipping propose");
    }

    // h) broadcast over WS
    const msg = JSON.stringify(payload);
    wsServer.clients.forEach((c) => {
      if (c.readyState === c.OPEN) c.send(msg);
    });

    return payload;
  }

  return SimulationRouter;
}
