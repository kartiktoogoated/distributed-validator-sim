import express, { Request, Response } from "express";
import { pingAndBroadcast } from "../../../core/pinger"; // Adjust the path as needed
import { info, error as logError } from "../../../../utils/logger";
import { WebSocketServer } from "ws";

/**
 * Factory function that creates and returns a status router which
 * triggers a ping (via WS) when the /status endpoint is hit.
 *
 * @param ws - The WebSocketServer instance.
 * @returns An Express router.
 */
export default function createStatusRouter(ws: WebSocketServer) {
  const router = express.Router();

  router.get("/status", async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = await pingAndBroadcast(ws);
      info(`Status route ping result: ${JSON.stringify(payload)}`);
      res.json({ success: true, ...payload });
    } catch (error: any) {
      logError(`Error in /status route: ${error}`);
      res.status(500).json({ success: false, message: "Failed to check website status.", error: error.message });
    }
  });

  return router;
}
