// src/routes/simulation.ts
import express, { Request, Response } from "express";
import { pingAndBroadcast, startPinger } from "../../../core/pinger";
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
      // Extract the target URL from query parameters or fall back to an environment variable/default value.
      const targetUrl = (req.query.url as string) || process.env.DEFAULT_TARGET_URL || "http://example.com";
      
      if (!targetUrl) {
        res.status(400).json({ success: false, message: "Target URL not provided" });
        return;
      }
      
      if (!continuousPingerStarted) {
        startPinger(ws);
        continuousPingerStarted = true;
        info("Continuous pinger started via /api/simulate endpoint.");
      }
      const payload = await pingAndBroadcast(ws, targetUrl);
      res.json({ success: true, ...payload });
    } catch (error: any) {
      logError(`Error in /api/simulate: ${error}`);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  

  return router;
}
