import axios from "axios";
import { WebSocketServer } from "ws";
import { info } from "../../utils/logger";
import { Validator, VoteStatus, Vote } from "./Validator";
import { timeStamp } from "console";

// Target URL
const TARGET_URL = "https://youtube.com";
// Timrout interval between pings
const PING_INTERVAL = 60000;

const TOTAL_VALIDATORS = 5;

/**
 * Performs website checks using multiple Validator instances, computes weighted consensus,
 * broadcasts the result via WebSocket, and returns the payload.
 *
 * @param wss - The WebSocketServer instance.
 * @returns An object with the target URL, consensus result, individual votes, and a timestamp.
 */
export async function pingAndBroadcast(
  wss: WebSocketServer
): Promise<{
  url: string;
  consensus: VoteStatus;
  votes: Array<{ validatorId: number; status: VoteStatus; weight: number }>;
  timeStamp: string;
}> {
  try {
    // Create an array of validator instances.
    const validators = Array.from(
      { length: TOTAL_VALIDATORS },
      (_, i) => new Validator(i + 1)
    );

    // Have each validator check website concurrently.
    // Each check returns a Vote object
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

    // Compute weighted consensus
    let totalUp = 0,
      totalDown = 0;
    votesResult.forEach((vote) => {
      if (vote.status === "UP") {
        totalUp += vote.weight;
      } else if (vote.status === "DOWN") {
        totalDown += vote.weight;
      }
    });

    const consensus: VoteStatus = totalUp >= totalDown ? "UP" : "DOWN";

    const timeStamp = new Date().toISOString();
    const payload = {
      url: TARGET_URL,
      consensus,
      votes: votesResult,
      timeStamp,
    };

    info(`Pinged ${TARGET_URL}: consensus ${consensus} at ${timeStamp}`);

    const message = JSON.stringify(payload);

    // Broadcast the payload to all connected WS clients
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
  // Trigger a ping immediately
  pingAndBroadcast(wss);
  // Set an interval ping at each PING_INTERVAL
  setInterval(() => {
    pingAndBroadcast(wss);
  }, PING_INTERVAL);
}