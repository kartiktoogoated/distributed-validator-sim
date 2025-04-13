import axios from "axios";
import { WebSocketServer } from "ws";
import { info } from "../../utils/logger";
import { Validator, Status, Vote } from "./Validator";

const TARGET_URL = "https://youtube.com";  // Change to the URL you want to check
const PING_INTERVAL = 60000; // Ping every 60 seconds
const TOTAL_VALIDATORS = 5;  // Number of validator instances

/**
 * Performs website checks using multiple Validator instances, computes weighted consensus,
 * broadcasts the result via WebSocket, and returns the payload.
 *
 * @param wss - The WebSocketServer instance.
 * @returns An object with the target URL, computed consensus, individual votes, and a timestamp.
 */
export async function pingAndBroadcast(
  wss: WebSocketServer
): Promise<{ url: string; consensus: Status; votes: Array<{ validatorId: number; status: Status; weight: number }>; timeStamp: string }> {
  try {
    // Create an array of validator instances (IDs 1 .. TOTAL_VALIDATORS)
    const validators = Array.from({ length: TOTAL_VALIDATORS }, (_, i) => new Validator(i + 1));

    // Execute website checks concurrently and get an array of vote results.
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

    // Compute weighted consensus: if total UP weight >= total DOWN weight, consensus is "UP", else "DOWN".
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

    const message = JSON.stringify(payload);
    // Broadcast the result to all connected WS clients.
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
  // Schedule subsequent pings at each PING_INTERVAL.
  setInterval(() => {
    pingAndBroadcast(wss);
  }, PING_INTERVAL);
}
