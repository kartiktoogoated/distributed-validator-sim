import express, {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";
import { WebSocketServer } from "ws";
import { info, error as logError } from "../../../../utils/logger";
import prisma from "../../../prismaClient";
import {
  Validator,
  Vote,
  Status,
  GossipPayload,
} from "../../../core/Validator";
import { GossipManager } from "../../../core/GossipManager";
import { Hub } from "../../../core/Hub";
import { RaftNode } from "../../../core/raft";

const GOSSIP_ROUNDS    = 3;
const PING_INTERVAL_MS = Number(process.env.PING_INTERVAL_MS ?? 60000);

// parse peer addresses (host:port)
const peerAddresses = (process.env.PEERS ?? "")
  .split(",")
  .map(h => h.trim().replace(/^https?:\/\//, "").replace(/\/+$/, ""))
  .filter(Boolean);

// local validator/raft IDs & region tag
const localValidatorId = Number(process.env.VALIDATOR_ID);
if (isNaN(localValidatorId)) throw new Error("VALIDATOR_ID must be a number");
const localLocation = process.env.LOCATION ?? "unknown";

// single Validator instance
const validatorInstance = new Validator(localValidatorId);
validatorInstance.peers = peerAddresses;

// Raft node for this VM
const raftNode = new RaftNode(
  localValidatorId,
  peerAddresses,
  committedCommand => {
    info(`Raft committed command: ${JSON.stringify(committedCommand)}`);
  }
);

export default function createSimulationRouter(
  wsServer: WebSocketServer
): Router {
  const router = Router();
  router.use(express.json());

  let isLoopRunning = false;
  let monitoredUrl   = process.env.DEFAULT_TARGET_URL ?? "http://example.com";

  // 1) intake gossip from peers
  router.post<{}, any, GossipPayload>(
    "/gossip",
    async (req, res, next): Promise<any> => {
      try {
        const { site, vote, validatorId, responseTime, timeStamp, location } = req.body;
        // basic validation...
        if (!site || !validatorId || !vote || (vote.status !== "UP" && vote.status !== "DOWN")) {
          return res.status(400).send("Malformed gossip payload");
        }
        validatorInstance.receiveGossip(site, vote, validatorId);
        info(`🔄 Gossip from ${validatorId}@${location} for ${site}: ${vote.status}`);
        return res.sendStatus(204);
      } catch (err) {
        logError(`Gossip handler error: ${err}`);
        return next(err);
      }
    }
  );

  // 2) trigger one round (and start loop)
  router.get(
    "/",
    async (req, res, next): Promise<any> => {
      try {
        if (typeof req.query.url === "string") {
          monitoredUrl = req.query.url;
        }

        if (!isLoopRunning) {
          setInterval(executeSimulationRound, PING_INTERVAL_MS);
          isLoopRunning = true;
          info(`🔁 Simulation loop started for Validator ${localValidatorId}`);
        }

        // run one round immediately and return its payload
        const payload = await executeSimulationRound();
        return res.json({ success: true, ...payload });
      } catch (err) {
        logError(`GET /simulation error: ${err}`);
        return next(err);
      }
    }
  );

  // 3) core loop: ping → seed Validator → log → gossip → consensus → raft → ws
  async function executeSimulationRound(): Promise<{
    url: string;
    consensus: Status;
    votes: Array<{ validatorId: number; status: Status; weight: number }>;
    timeStamp: string;
  }> {
    // a) ping
    const startTime = Date.now();
    const vote      = await validatorInstance.checkWebsite(monitoredUrl);
    const latency   = Date.now() - startTime;
    const timeStamp = new Date().toISOString();

    info(`[Ping] Validator ${localValidatorId}@${localLocation} → ${monitoredUrl}: ${vote.status} (${latency}ms)`);

    // **NEW**: make sure the Validator record exists before we write its log
    await prisma.validator.upsert({
      where: { id: localValidatorId },
      update: { location: localLocation },
      create: { id: localValidatorId, location: localLocation },
    });

    // b) persist the raw ping
    await prisma.validatorLog.create({
      data: {
        validatorId: localValidatorId,
        site:        monitoredUrl,
        status:      vote.status,
        timestamp:   new Date(timeStamp),
      },
    });

    // c) gossip rounds
    await new GossipManager(
      [validatorInstance],
      GOSSIP_ROUNDS,
      localLocation
    ).runGossipRounds(monitoredUrl, latency, timeStamp);

    // d) compute majority consensus
    const total           = peerAddresses.length + 1;
    const quorum          = Math.ceil(total / 2);
    const consensusStatus = new Hub(
      [validatorInstance],
      quorum
    ).checkConsensus(monitoredUrl) as Status;

    info(`[Consensus] ${monitoredUrl} → ${consensusStatus} (${quorum}/${total})`);

    // e) build payload
    const payload = {
      url:       monitoredUrl,
      consensus: consensusStatus,
      votes: [
        {
          validatorId: localValidatorId,
          status:      validatorInstance.getStatus(monitoredUrl)!.status,
          weight:      validatorInstance.getStatus(monitoredUrl)!.weight,
        },
      ],
      timeStamp,
    };

    // f) Raft propose
    try {
      raftNode.propose(payload);
    } catch {
      info("Not Raft leader—skipping propose");
    }

    // g) WS broadcast
    const msg = JSON.stringify(payload);
    wsServer.clients.forEach(c => {
      if (c.readyState === c.OPEN) c.send(msg);
    });

    return payload;
  }

  return router;
}
