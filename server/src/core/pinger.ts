import { WebSocketServer } from "ws";
import { info } from "../../utils/logger";
import prisma from "../prismaClient"; // adjust the path as needed
import { Validator, Status, Vote } from "./Validator";
import { safeSendMessage, sendMessage } from "../services/producer";

const TARGET_URL = "https://youtube.com"; // Change this URL as needed
const PING_INTERVAL = 60000; // Ping every 60 seconds
const TOTAL_VALIDATORS = 5; // Number of validator instances

/**
 * Performs website checks using multiple Validator instances, computes weighted consensus,
 * logs each vote and the consensus into the database, broadcasts the result via WebSocket,
 * and returns the payload.
 *
 * @param wss - The WebSocketServer instance.
 * @returns An object with the target URL, computed consensus, individual votes, and a timestamp.
 */
export async function pingAndBroadcast(wss: WebSocketServer): Promise<{
  url: string;
  consensus: Status;
  votes: Array<{ validatorId: number; status: Status; weight: number }>;
  timeStamp: string;
}> {
  try {
    const validators = Array.from(
      { length: TOTAL_VALIDATORS },
      (_, i) => new Validator(i + 1)
    );
    const votesResult = await Promise.all(
      validators.map(async (validator) => {
        const start = Date.now();
        const vote = await validator.checkWebsite(TARGET_URL);
        const responseTime = Date.now() - start;
        return {
          validatorId: validator.id,
          status: vote.status,
          weight: vote.weight,
          responseTime,
        };
      })
    );

    let totalUp = 0,
      totalDown = 0;
    votesResult.forEach((vote) => {
      if (vote.status === "UP") totalUp += vote.weight;
      else if (vote.status === "DOWN") totalDown += vote.weight;
    });

    const consensus: Status = totalUp >= totalDown ? "UP" : "DOWN";
    const timeStamp = new Date().toISOString();
    const payload = {
      url: TARGET_URL,
      consensus,
      votes: votesResult,
      timeStamp,
    };

    info(`Pinged ${TARGET_URL}: consensus ${consensus} at ${timeStamp}`);

    // log each validators vote and overall consensus to the DB.
    for (const vote of votesResult) {
      await prisma.validatorLog.create({
        data: {
          validatorId: vote.validatorId,
          site: TARGET_URL,
          status: vote.status,
          timestamp: new Date(),
        },
      });
    }
    await prisma.validatorLog.create({
      data: {
        validatorId: 0,
        site: TARGET_URL,
        status: consensus,
        timestamp: new Date(),
      },
    });

    const message = JSON.stringify(payload);
    // Broadcast via WebSocket:
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(message);
        } catch (err) {
          info(`WebSocket send error: ${err}`);
        }
      }
    });

    // Publish to kafka topic "validator-status"
    await safeSendMessage("validator-status", message);
    return payload;
  } catch (error) {
    info(`Error during ping: ${error}`);
    throw error;
  }
}

/**
 * Starts continuous pinging.
 *
 * @param wss - The WebSocketServer instance.
 */

export function startPinger(wss: WebSocketServer) {
  pingAndBroadcast(wss);
  setInterval(() => {
    pingAndBroadcast(wss).catch((err) => info(`Initial ping error: ${err}`));
  }, PING_INTERVAL);
}


/**
 * Update validator metadata with a new vote.
 * 
 * @param validatorId - The ID of the validator
 * @param isCorrect - Whether the validatos vote matched consensus
 * @param responseTime - The response time in milliseconds
 * @param wasSuccessful - Boolean indicating if the HTTP check succeeded
 */

async function updateValidatorMetadata(validatorId: number, isCorrect: boolean, responseTime: number, wasSuccessful: boolean): Promise<void> {
  // First, fetch the current metadata if it exists.
  const current = await prisma.validatorMeta.findUnique({ where: { validatorId } });

  if (current) {
    // Update counts and recalculate values.
    const newTotal = current.totalVotes + 1;
    const newCorrect = current.correctVotes + (isCorrect ? 1 : 0);
    const newLatency = ((current.averageLatency * current.totalVotes) + responseTime / newTotal);
    const newUptime = ((current.uptimePercent/100 * current.totalVotes) + (wasSuccessful ? 1 : 0)) / newTotal * 100;

    // Calculate a new weight based on factors
    // Weight = (AccuracyRatio * 0.5) + ((100 - LatencyFactor) * 0.3) +  (Uptime * 0.2)
    const accuracyRatio = newCorrect / newTotal;
    // Assume latency factor: lower latency yields higher score
    const latencyScore = 1 - Math.min(newLatency / 5000, 1);
    const uptimeScore = newUptime / 100;
    const newWeight = (accuracyRatio * 0.5) + (latencyScore * 0.3) + (uptimeScore * 0.2);

    // Update the record.
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
    // Create a new meta record.
    const accuracyRatio = isCorrect ? 1 : 0;
    // Assume a default latency and success implies 100%
    const uptime = wasSuccessful ? 100 : 0;
    const weight = (accuracyRatio * 0.5) + ((wasSuccessful ? 1: 0) * 0.2) + (1 - Math.min(responseTime / 5000, 1) * 0.3);
    await prisma.validatorMeta.create({
      data: {
        validatorId,
        correctVotes: isCorrect ? 1: 0,
        totalVotes: 1,
        averageLatency: responseTime,
        uptimePercent: uptime,
        weight,
      },
    });
  }
}