// src/routes/simulation.ts
import express, { Request, Response } from "express";
import { pingAndBroadcast, startPinger } from "../../../core/Pinger";
import { info, error as logError } from "../../../../utils/logger";
import { WebSocketServer } from "ws";

/**
 * Factory function to create a simulation router.
 * The /api/simulate endpoint will trigger an immediate ping and, if not already started,
 * will also start a continuous pinger that updates every interval.
 *
 * @param ws - The WebSocketServer instance to use.
 * @returns An Express Router.
 */
export default function createSimulationRouter(ws: WebSocketServer) {
  const router = express.Router();
  let continuousPingerStarted = false;

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      if (!continuousPingerStarted) {
        startPinger(ws);
        continuousPingerStarted = true;
        info("Continuous pinger started via /api/simulate endpoint.");
      }
      // Trigger an immediate ping.
      const payload = await pingAndBroadcast(ws);
      res.json({ success: true, ...payload });
    } catch (error: any) {
      logError(`Error in /api/simulate: ${error}`);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
}
