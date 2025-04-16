import { WebSocketServer } from "ws";
import { info } from "../../utils/logger";
import prisma from "../prismaClient"; 
import { Validator, Status, Vote } from "./Validator";
import { safeSendMessage } from "../services/producer";
import dotenv from 'dotenv'

dotenv.config();

const PING_INTERVAL = 60000;
const TOTAL_VALIDATORS = 5;

/**
 * Performs website checks for a given URL using multiple Validator instances,
 * computes weighted consensus, logs each vote and the consensus into the database,
 * broadcasts the result via WebSocket, and returns the payload.
 *
 * @param wss - The WebSocketServer instance.
 * @param targetUrl - The URL to check.
 * @returns An object with the target URL, computed consensus, individual votes, and a timestamp.
 */
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
    // Create validator instances for the ping cycle.
    const validators = Array.from(
      { length: TOTAL_VALIDATORS },
      (_, i) => new Validator(i + 1)
    );

    // Run the website check on each validator.
    const votesResult = await Promise.all(
      validators.map(async (validator) => {
        const start = Date.now();
        const vote = await validator.checkWebsite(targetUrl);
        const responseTime = Date.now() - start;
        return {
          validatorId: validator.id,
          status: vote.status,
          weight: vote.weight,
          responseTime,
        };
      })
    );

    // Compute weighted consensus.
    let totalUp = 0, totalDown = 0;
    votesResult.forEach((vote) => {
      if (vote.status === "UP") totalUp += vote.weight;
      else if (vote.status === "DOWN") totalDown += vote.weight;
    });
    const consensus: Status = totalUp >= totalDown ? "UP" : "DOWN";
    const timeStamp = new Date().toISOString();
    const payload = {
      url: targetUrl,
      consensus,
      votes: votesResult,
      timeStamp,
    };

    info(`Pinged ${targetUrl}: consensus ${consensus} at ${timeStamp}`);

    // Log each validator's vote.
    for (const vote of votesResult) {
      await prisma.validatorLog.create({
        data: {
          validatorId: vote.validatorId,
          site: targetUrl,
          status: vote.status,
          timestamp: new Date(),
        },
      });
    }
    // Log overall consensus with validatorId 0.
    await prisma.validatorLog.create({
      data: {
        validatorId: 0,
        site: targetUrl,
        status: consensus,
        timestamp: new Date(),
      },
    });

    const message = JSON.stringify(payload);
    // Broadcast via WebSocket.
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(message);
        } catch (err) {
          info(`WebSocket send error: ${err}`);
        }
      }
    });

    // Publish message to Kafka topic "validator-status".
    await safeSendMessage("validator-status", message);
    return payload;
  } catch (error) {
    info(`Error during ping: ${error}`);
    throw error;
  }
}

/**
 * Starts continuous pinging for all websites stored in the database.
 *
 * @param wss - The WebSocketServer instance.
 */
export function startPinger(wss: WebSocketServer) {
  async function pingWebsites() {
    try {
      // Fetch all websites that users have added for monitoring.
      const websites = await prisma.website.findMany({
        where: { paused: false },
      });
      for (const website of websites) {
        await pingAndBroadcast(wss, website.url);
      }
    } catch (err) {
      info(`Error fetching websites: ${err}`);
    }
  }
  // Kick off an initial ping of all websites.
  pingWebsites();
  // Then schedule pings to occur every PING_INTERVAL milliseconds.
  setInterval(() => {
    pingWebsites().catch((err) => info(`Error during periodic ping: ${err}`));
  }, PING_INTERVAL);
}

/**
 * Update validator metadata with a new vote.
 * 
 * @param validatorId - The ID of the validator.
 * @param isCorrect - Whether the validator's vote matched consensus.
 * @param responseTime - The response time in milliseconds.
 * @param wasSuccessful - Boolean indicating if the HTTP check succeeded.
 */
async function updateValidatorMetadata(
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
    const weight = (accuracyRatio * 0.5) + ((wasSuccessful ? 1 : 0) * 0.2) + (1 - Math.min(responseTime / 5000, 1) * 0.3);
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