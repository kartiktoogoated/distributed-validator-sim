import dotenv from 'dotenv';
dotenv.config();

import { WebSocketServer } from "ws";
import { info } from "../../utils/logger";
import prisma from "../prismaClient";
import { Validator, Status, Vote } from "./Validator";
import { sendToTopic } from "../services/producer";

const PING_INTERVAL = 60_000;
const STATUS_TOPIC = process.env.KAFKA_TOPIC ?? "validator-status";

export async function pingAndBroadcast(
  wss: WebSocketServer,
  targetUrl: string
): Promise<{
  url: string;
  consensus: Status;
  votes: Array<{ validatorId: number; status: Status; weight: number; responseTime: number }>;
  timeStamp: string;
}> {
  try {
    const id = Number(process.env.VALIDATOR_ID);
    const peersEnv = process.env.PEERS || "";
    const peers = peersEnv.split(",").map(p => p.trim()).filter(Boolean);

    const validator = new Validator(id);
    validator.peers = peers;

    const start = Date.now();
    const vote = await validator.checkWebsite(targetUrl);
    const responseTime = Date.now() - start;

    const voteResult = {
      validatorId: validator.id,
      status: vote.status,
      weight: vote.weight,
      responseTime,
    };

    const consensus: Status = voteResult.status;
    const timeStamp = new Date().toISOString();
    const payload = { url: targetUrl, consensus, votes: [voteResult], timeStamp };

    info(`Pinged ${targetUrl}: consensus ${consensus} at ${timeStamp}`);

    // log individual vote
    await prisma.validatorLog.create({
      data: {
        validatorId: voteResult.validatorId,
        site: targetUrl,
        status: voteResult.status,
        timestamp: new Date(timeStamp),
      },
    });

    // log overall consensus
    await prisma.validatorLog.create({
      data: {
        validatorId: 0,
        site: targetUrl,
        status: consensus,
        timestamp: new Date(timeStamp),
      },
    });

    // broadcast over WebSocket
    const message = JSON.stringify(payload);
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        try { client.send(message); }
        catch (err) { info(`WS send err: ${err}`); }
      }
    });

    // publish to Kafka
    await sendToTopic(STATUS_TOPIC, payload);

    return payload;
  } catch (err) {
    info(`Error during ping: ${err}`);
    throw err;
  }
}

export function startPinger(wss: WebSocketServer) {
  async function pingWebsites() {
    try {
      const websites = await prisma.website.findMany({ where: { paused: false } });
      for (const w of websites) {
        await pingAndBroadcast(wss, w.url);
      }
    } catch (err) {
      info(`Error fetching websites: ${err}`);
    }
  }

  pingWebsites();
  setInterval(() => {
    pingWebsites().catch(e => info(`Periodic ping error: ${e}`));
  }, PING_INTERVAL);
}

export async function updateValidatorMetadata(
  validatorId: number,
  isCorrect: boolean,
  responseTime: number,
  wasSuccessful: boolean
): Promise<void> {
  const current = await prisma.validatorMeta.findUnique({ where: { validatorId } });

  if (current) {
    const newTotal = current.totalVotes + 1;
    const newCorrect = current.correctVotes + (isCorrect ? 1 : 0);
    const newLatency = ((current.averageLatency * current.totalVotes) + responseTime) / newTotal;
    const newUptime = (((current.uptimePercent / 100) * current.totalVotes) + (wasSuccessful ? 1 : 0)) / newTotal * 100;
    const accuracyRatio = newCorrect / newTotal;
    const latencyScore = 1 - Math.min(newLatency / 5000, 1);
    const uptimeScore = newUptime / 100;
    const newWeight = (accuracyRatio * 0.5) + (latencyScore * 0.3) + (uptimeScore * 0.2);

    await prisma.validatorMeta.update({
      where: { validatorId },
      data: {
        correctVotes: newCorrect,
        totalVotes: newTotal,
        averageLatency: newLatency,
        uptimePercent: newUptime,
        weight: newWeight,
      },
    });
  } else {
    const accuracyRatio = isCorrect ? 1 : 0;
    const uptime = wasSuccessful ? 100 : 0;
    const weight =
      (accuracyRatio * 0.5) +
      ((wasSuccessful ? 1 : 0) * 0.2) +
      (1 - Math.min(responseTime / 5000, 1) * 0.3);

    await prisma.validatorMeta.create({
      data: {
        validatorId,
        correctVotes: isCorrect ? 1 : 0,
        totalVotes: 1,
        averageLatency: responseTime,
        uptimePercent: uptime,
        weight,
      },
    });
  }
}