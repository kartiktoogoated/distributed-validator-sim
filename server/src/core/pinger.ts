import axios from "axios";
import { WebSocketServer } from "ws";
import { info } from "../../utils/logger";
import prisma from "../prismaClient"; // adjust the path as needed
import { Validator, Status, Vote } from "./Validator";

const TARGET_URL = "https://youtube.com";  // Change this URL as needed
const PING_INTERVAL = 60000; // Ping every 60 seconds
const TOTAL_VALIDATORS = 5;  // Number of validator instances

/**
 * Performs website checks using multiple Validator instances, computes weighted consensus,
 * logs each vote and the consensus into the database, broadcasts the result via WebSocket,
 * and returns the payload.
 *
 * @param wss - The WebSocketServer instance.
 * @returns An object with the target URL, computed consensus, individual votes, and a timestamp.
 */
export async function pingAndBroadcast(
  wss: WebSocketServer
): Promise<{ url: string; consensus: Status; votes: Array<{ validatorId: number; status: Status; weight: number }>; timeStamp: string }> {
  try {
    // Create an array of validator instances.
    const validators = Array.from({ length: TOTAL_VALIDATORS }, (_, i) => new Validator(i + 1));

    // Run checks concurrently.
    const votesResult = await Promise.all(
      validators.map(async (validator) => {
        const vote = await validator.checkWebsite(TARGET_URL);
        return {
          validatorId: validator.id,
          status: vote.status,
          weight: vote.weight,
        };
      })
    );

    // Compute weighted consensus.
    let totalUp = 0, totalDown = 0;
    votesResult.forEach((vote) => {
      if (vote.status === "UP") {
        totalUp += vote.weight;
      } else if (vote.status === "DOWN") {
        totalDown += vote.weight;
      }
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

    // Log individual validator votes into the database.
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

    // Log the consensus result (using validatorId = 0 as a marker for consensus).
    await prisma.validatorLog.create({
      data: {
        validatorId: 0,
        site: TARGET_URL,
        status: consensus,
        timestamp: new Date(),
      },
    });

    // Broadcast the payload to all connected WS clients.
    const message = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });

    return payload;
  } catch (error) {
    info(`Error during ping: ${error}`);
    throw error;
  }
}

/**
 * Starts the continuous ping process.
 *
 * @param wss - The WebSocketServer instance.
 */
export function startPinger(wss: WebSocketServer): void {
  // Trigger an immediate ping.
  pingAndBroadcast(wss);
  // Then schedule subsequent pings.
  setInterval(() => {
    pingAndBroadcast(wss);
  }, PING_INTERVAL);
}
