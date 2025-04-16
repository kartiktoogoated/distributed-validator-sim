import express, { Request, Response } from "express";
import { pingAndBroadcast } from "../../../core/Pinger"; // Adjust the path as needed
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
      // Extract the target URL from query parameters or use a default.
      const targetUrl = (req.query.url as string) || process.env.DEFAULT_TARGET_URL || "http://example.com";
      
      if (!targetUrl) {
        res.status(400).json({ success: false, message: "Target URL not provided" });
        return;
      }
      
      const payload = await pingAndBroadcast(ws, targetUrl);
      info(`Status route ping result: ${JSON.stringify(payload)}`);
      res.json({ success: true, ...payload });
    } catch (error: any) {
      logError(`Error in /status route: ${error}`);
      res.status(500).json({ success: false, message: "Failed to check website status.", error: error.message });
    }
  });
  

  return router;
}
