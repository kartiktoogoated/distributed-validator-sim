// src/core/pinger.ts
import axios from "axios";
import { WebSocketServer } from "ws";
import { info } from "../../utils/logger";
import { Validator } from "./Validator";

// The target URL to check.
const TARGET_URL = "https://awewarad.com";
// The interval (in ms) between pings (used when running continuously).
const PING_INTERVAL = 60000; // 60 seconds
// Timeout for each ping (in ms)

const validator = new Validator(1);

/**
 * Performs a ping of the target URL using the Validator,
 * broadcasts the result to all connected WS clients, and returns the payload.
 */
export async function pingAndBroadcast(wss: WebSocketServer): Promise<{ url: string; status: string; timeStamp: string }> {
  try {
    const status = await validator.checkWebsite(TARGET_URL);
    const payload = {
      url: TARGET_URL,
      status,
      timeStamp: new Date().toISOString(),
    };

    info(`Pinged ${TARGET_URL}: ${status} at ${payload.timeStamp}`);

    const message = JSON.stringify(payload);
    // Broadcast to all connected WS clients.
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
 * (Used if you want continuous updates independent of HTTP triggers.)
 */
export function startPinger(wss: WebSocketServer): void {
  // Trigger a ping immediately.
  pingAndBroadcast(wss);
  // Then set up an interval to ping every PING_INTERVAL.
  setInterval(() => {
    pingAndBroadcast(wss);
  }, PING_INTERVAL);
}
