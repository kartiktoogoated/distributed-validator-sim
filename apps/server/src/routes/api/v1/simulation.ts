import dotenv from "dotenv";
dotenv.config();

import express, { Router, Request, Response, NextFunction } from "express";
import { WebSocketServer } from "ws";
import { info, warn, error as logError } from "../../../../utils/logger";
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

// move monitoredUrl to module scope so executeRound can see it
let monitoredUrl = process.env.DEFAULT_TARGET_URL || "http://example.com";

export default function createSimulationRouter(
  wsServer: WebSocketServer
): Router {
  const SimulationRouter = Router();
  SimulationRouter.use(express.json());

  let isLoopRunning = false;

  // 1) Intake gossip from other validators
  SimulationRouter.post(
    "/gossip",
    async (req: Request<{}, any, GossipPayload>, res: Response, next: NextFunction) => {
      try {
        const { site, vote, validatorId, responseTime, timeStamp, location } =
          req.body;

        if (
          typeof site !== "string" ||
          typeof validatorId !== "number" ||
          typeof responseTime !== "number" ||
          typeof timeStamp !== "string" ||
          typeof location !== "string" ||
          !vote ||
          (vote.status !== "UP" && vote.status !== "DOWN")
        ) {
          warn(`Malformed gossip payload: ${JSON.stringify(req.body)}`);
          res.status(400).send("Malformed gossip payload");
          return;
        }

        validatorInstance.receiveGossip(site, vote, validatorId);
        info(`🔄 Gossip from ${validatorId}@${location} for ${site}: ${vote.status}`);
        res.sendStatus(204);
      } catch (err: any) {
        logError(`Gossip handler error: ${err.stack || err}`);
        next(err);
      }
    }
  );

  // 2) Kick off & one-shot GET /api/simulate
  SimulationRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (typeof req.query.url === "string") {
        monitoredUrl = req.query.url;
        info(`Monitored URL updated to ${monitoredUrl}`);
      }

      if (!isLoopRunning) {
        setInterval(() => {
          executeRound(wsServer).catch(err =>
            logError(`executeRound failed: ${err.stack || err}`)
          );
        }, PING_INTERVAL_MS);
        isLoopRunning = true;
        info(`🔁 Simulation loop started for Validator ${localValidatorId}`);
      }

      const payload = await executeRound(wsServer);
      res.json({ success: true, ...payload });
      // no `return res.json(...)` to keep return type void
    } catch (err: any) {
      logError(`GET /simulation error: ${err.stack || err}`);
      next(err);
    }
  });

  return SimulationRouter;
}

// 3) Core ping → gossip → consensus round
async function executeRound(wsServer: WebSocketServer): Promise<{
  url: string;
  consensus: Status;
  votes: Array<{ validatorId: number; status: Status; weight: number }>;
  timeStamp: string;
}> {
  // a) ping
  let vote, latency, timeStamp: string;
  try {
    const start = Date.now();
    vote = await validatorInstance.checkWebsite(monitoredUrl);
    latency = Date.now() - start;
    timeStamp = new Date().toISOString();
    info(
      `[Ping] Validator ${localValidatorId}@${localLocation}` +
        ` → ${monitoredUrl}: ${vote.status} (${latency}ms)`
    );
  } catch (err: any) {
    logError(`Ping error for ${monitoredUrl}: ${err.stack || err}`);
    throw err;
  }

  // b) ensure our Validator row exists
  try {
    await prisma.validator.upsert({
      where: { id: localValidatorId },
      update: { location: localLocation },
      create: { id: localValidatorId, location: localLocation },
    });
    info(`Upserted validator ${localValidatorId}@${localLocation}`);
  } catch (err: any) {
    logError(`DB upsert validator error: ${err.stack || err}`);
  }

  // c) persist the raw ping
  try {
    await prisma.validatorLog.create({
      data: {
        validatorId: localValidatorId,
        site: monitoredUrl,
        status: vote.status,
        timestamp: new Date(timeStamp),
      },
    });
    info(`Logged ping for ${monitoredUrl}`);
  } catch (err: any) {
    logError(`DB create validatorLog error: ${err.stack || err}`);
  }

  // d) gossip just once, immediately
  try {
    await new GossipManager([validatorInstance], GOSSIP_ROUNDS, localLocation)
      .runGossipRounds(monitoredUrl, latency, timeStamp);
    info(`GossipManager completed gossip rounds`);
  } catch (err: any) {
    logError(`GossipManager error: ${err.stack || err}`);
  }

  // e) compute majority-quorum consensus
  let consensusStatus: Status = vote.status;
  try {
    const total = peerAddresses.length + 1;
    const quorum = Math.ceil(total / 2);
    consensusStatus = new Hub([validatorInstance], quorum).checkConsensus(
      monitoredUrl
    ) as Status;
    info(`[Consensus] ${monitoredUrl} → ${consensusStatus} (${quorum}/${total})`);
  } catch (err: any) {
    logError(`Consensus computation error: ${err.stack || err}`);
  }

  // f) build payload
  const payload = {
    url: monitoredUrl,
    consensus: consensusStatus,
    votes: [{ validatorId: localValidatorId, status: vote.status, weight: vote.weight }],
    timeStamp,
  };

  // g) Raft-propose
  try {
    raftNode.propose(payload);
    info(`Raft propose successful`);
  } catch {
    info("Not Raft leader—skipping propose");
  }

  // h) broadcast over WS
  try {
    const msg = JSON.stringify(payload);
    wsServer.clients.forEach(c => {
      if (c.readyState === c.OPEN) c.send(msg);
    });
    info(`Broadcasted payload over WebSocket`);
  } catch (err: any) {
    logError(`WebSocket broadcast error: ${err.stack || err}`);
  }

  return payload;
}
