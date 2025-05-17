import dotenv from "dotenv";
dotenv.config();

import express, { Router, Request, Response } from "express";
import { WebSocketServer } from "ws";
import { info, warn, error as logError } from "../../../../utils/logger";
import prisma from "../../../prismaClient";
import { Validator, Status, GossipPayload } from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { RaftNode } from "../../../core/raft";
import { pollAndGossip } from "../../../core/pinger";

// Prometheus metrics
import { latencyHistogram, statusCounter } from "../../../metrics";

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

// single Validator instance + Raft node
const validatorInstance = new Validator(localValidatorId);
validatorInstance.peers = peerAddresses;

export default function createSimulationRouter(
  wsServer: WebSocketServer
): Router {
  const SimulationRouter = Router();
  SimulationRouter.use(express.json());

  let isLoopRunning = false;
  let loopInterval: NodeJS.Timeout | null = null;

  // start the continuous validation loop
  function startValidationLoop() {
    if (isLoopRunning) return;
    isLoopRunning = true;
    info(`🔁 Simulation loop starting for Validator ${localValidatorId}`);
    loopInterval = setInterval(async () => {
      try {
        await pollAndGossip();
      } catch (err) {
        logError(`Failed to poll and gossip in interval: ${err}`);
      }
    }, PING_INTERVAL_MS);
  }

  // stop the continuous validation loop
  function stopValidationLoop() {
    if (!isLoopRunning) return;
    if (loopInterval) {
      clearInterval(loopInterval);
      loopInterval = null;
    }
    isLoopRunning = false;
    info(`🔴 Simulation loop stopped for Validator ${localValidatorId}`);
  }

  // 1) Ingest gossip (unchanged)
  SimulationRouter.post(
    "/gossip",
    async (req: Request<{}, any, GossipPayload>, res) => {
      /* … your existing gossip handler … */
    }
  );

  // 2) Start the loop on demand
  SimulationRouter.post("/start", (_req, res) => {
    startValidationLoop();
    res.json({ success: true, message: "Validation loop started" });
  });

  // 3) Stop the loop on demand
  SimulationRouter.post("/stop", (_req, res) => {
    stopValidationLoop();
    res.json({ success: true, message: "Validation loop stopped" });
  });

  // 4) GET /api/simulation – one-off + ensure loop is running
  SimulationRouter.get("/", async (req: Request, res: Response, next) => {
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

// 5) perform ping→gossip→(Raft & WebSocket) for *one* URL
async function executeRoundForUrl(
  wsServer: WebSocketServer,
  url: string
): Promise<{
  url: string;
  consensus: Status;
  votes: Array<{ validatorId: number; status: Status; weight: number }>;
  timeStamp: string;
}> {
  // — a) ping + log
  let vote: { status: Status; weight: number };
  let latency: number;
  let timeStamp: string;
  try {
    const start = Date.now();
    vote = await validatorInstance.checkWebsite(url);
    latency = Date.now() - start;
    timeStamp = new Date().toISOString();
    info(
      `[Ping] Validator ${localValidatorId}@${localLocation}` +
        ` → ${url}: ${vote.status} (${latency}ms)`
    );

    // ** Prometheus instrumentation **
    latencyHistogram.observe(latency);
    statusCounter.labels(vote.status).inc();
  } catch (err: any) {
    logError(`Ping error for ${url}: ${err.stack || err}`);
    throw err;
  }

  // — b) upsert validator row
  try {
    await prisma.validator.upsert({
      where: { id: localValidatorId },
      update: { location: localLocation },
      create: { id: localValidatorId, location: localLocation },
    });
  } catch (err: any) {
    logError(`DB upsert validator error: ${err.stack || err}`);
  }

  // — c) store raw ping
  try {
    await prisma.validatorLog.create({
      data: {
        validatorId: localValidatorId,
        site: url,
        status: vote.status,
        latency,
        timestamp: new Date(timeStamp),
      },
    });
  } catch (err: any) {
    logError(`DB create validatorLog error: ${err.stack || err}`);
  }

  // — d) gossip
  try {
    await new GossipManager([validatorInstance], GOSSIP_ROUNDS, localLocation)
      .runGossipRounds(url, latency, timeStamp);
  } catch (err: any) {
    logError(`GossipManager error for ${url}: ${err.stack || err}`);
  }

  // — e) build payload
  const payload = {
    url,
    consensus: vote.status,
    votes: [{ validatorId: localValidatorId, status: vote.status, weight: vote.weight }],
    timeStamp,
  };

  // — f) broadcast over WebSocket
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
