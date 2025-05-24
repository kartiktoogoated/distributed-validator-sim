import dotenv from "dotenv";
dotenv.config();

import express, { Router, Request, Response } from "express";
import { WebSocketServer } from "ws";
import { info, warn, error as logError } from "../../../../utils/logger";
import prisma from "../../../prismaClient";
import { Validator, Status, GossipPayload } from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { RaftNode } from "../../../core/raft";
import { latencyHistogram, statusCounter } from "../../../metrics";

const GOSSIP_ROUNDS = 1;
const PING_INTERVAL_MS = Number(process.env.PING_INTERVAL_MS) || 60_000;

const peerAddresses = (process.env.PEERS ?? "")
  .split(",")
  .map((h) => h.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
  .filter(Boolean);

const localValidatorId = Number(process.env.VALIDATOR_ID);
if (isNaN(localValidatorId)) throw new Error("VALIDATOR_ID must be a number");

const localLocation = process.env.LOCATION || "unknown";

const validatorInstance = new Validator(localValidatorId);
validatorInstance.peers = peerAddresses;

const raftNode = new RaftNode(localValidatorId, peerAddresses, (committed) => {
  info(`Raft committed: ${JSON.stringify(committed)}`);
});

export default function createSimulationRouter(
  wsServer: WebSocketServer
): Router {
  const SimulationRouter = Router();
  SimulationRouter.use(express.json());

  let isLoopRunning = false;
  let loopInterval: NodeJS.Timeout | null = null;

  function startValidationLoop() {
    if (isLoopRunning) return;
    isLoopRunning = true;
    info(`🔁 Simulation loop starting for Validator ${localValidatorId}`);
    loopInterval = setInterval(async () => {
      try {
        const sites = await prisma.website.findMany({ where: { paused: false } });
        await Promise.all(
          sites.map((w) =>
            executeRoundForUrl(wsServer, w.url).catch((err) =>
              logError(`Loop round failed for ${w.url}: ${err}`)
            )
          )
        );
      } catch (err) {
        logError(`Failed to fetch websites in interval: ${err}`);
      }
    }, PING_INTERVAL_MS);
  }

  function stopValidationLoop() {
    if (!isLoopRunning) return;
    if (loopInterval) clearInterval(loopInterval);
    isLoopRunning = false;
    info(`🔴 Simulation loop stopped for Validator ${localValidatorId}`);
  }

  SimulationRouter.post("/gossip", async (req: Request<{}, any, GossipPayload>, res) => {
    // TODO: Add your gossip handler if needed
    res.sendStatus(204);
  });

  SimulationRouter.post("/start", (_req, res) => {
    startValidationLoop();
    res.json({ success: true, message: "Validation loop started" });
  });

  SimulationRouter.post("/stop", (_req, res) => {
    stopValidationLoop();
    res.json({ success: true, message: "Validation loop stopped" });
  });

  SimulationRouter.get("/", async (_req: Request, res: Response, next) => {
    try {
      startValidationLoop();
      const sites = await prisma.website.findMany({ where: { paused: false } });
      const payloads = await Promise.all(
        sites.map((w) => executeRoundForUrl(wsServer, w.url))
      );
      res.json({ success: true, payloads });
    } catch (err: any) {
      logError(`GET /simulation error: ${err.stack || err}`);
      next(err);
    }
  });

  return SimulationRouter;
}

async function executeRoundForUrl(
  wsServer: WebSocketServer,
  url: string
): Promise<{
  url: string;
  consensus: Status;
  votes: Array<{ validatorId: number; status: Status; weight: number }>;
  timeStamp: string;
}> {
  let voteResult: { vote: { status: Status; weight: number }; latency: number };
  let timeStamp: string;

  try {
    voteResult = await validatorInstance.checkWebsite(url);
    timeStamp = new Date().toISOString();

    info(`[Ping] Validator ${localValidatorId}@${localLocation} → ${url}: ${voteResult.vote.status} (${voteResult.latency}ms)`);

    // ✅ Only observe valid numbers
    if (typeof voteResult.latency === "number" && !isNaN(voteResult.latency)) {
      latencyHistogram.observe(voteResult.latency);
    }

    statusCounter.labels(voteResult.vote.status).inc();
  } catch (err: any) {
    logError(`Ping error for ${url}: ${err.stack || err}`);
    throw err;
  }

  try {
    await prisma.validator.upsert({
      where: { id: localValidatorId },
      update: { location: localLocation },
      create: { id: localValidatorId, location: localLocation },
    });
  } catch (err: any) {
    logError(`DB upsert validator error: ${err.stack || err}`);
  }

  try {
    await new GossipManager([validatorInstance], GOSSIP_ROUNDS, localLocation).runGossipRounds(
      url,
      voteResult.latency,
      timeStamp
    );
  } catch (err: any) {
    logError(`GossipManager error for ${url}: ${err.stack || err}`);
  }

  const payload = {
    url,
    consensus: voteResult.vote.status,
    votes: [
      {
        validatorId: localValidatorId,
        status: voteResult.vote.status,
        weight: voteResult.vote.weight,
      },
    ],
    timeStamp,
  };

  try {
    raftNode.propose(payload);
    info(`Raft propose successful for ${url}`);
  } catch {
    info("Not Raft leader—skipping propose");
  }

  try {
    const msg = JSON.stringify(payload);
    wsServer.clients.forEach((c) => {
      if (c.readyState === c.OPEN) c.send(msg);
    });
  } catch (err: any) {
    logError(`WebSocket broadcast error for ${url}: ${err.stack || err}`);
  }

  return payload;
}
