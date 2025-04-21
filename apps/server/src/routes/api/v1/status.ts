import express, { Request, Response } from "express";
import { pingAndBroadcast } from "../../../core/pinger";
import { info, error as logError } from "../../../../utils/logger";
import { WebSocketServer } from "ws";

export default function createStatusRouter(ws: WebSocketServer) {
  const router = express.Router();

  router.get("/status", async (req: Request, res: Response) => {
    try {
      const targetUrl = (req.query.url as string)
                      || process.env.DEFAULT_TARGET_URL
                      || "http://example.com";

      const payload = await pingAndBroadcast(ws, targetUrl);
      info(`Status ping: ${JSON.stringify(payload)}`);
      res.json({ success: true, ...payload });
    } catch (err: any) {
      logError(`Status error: ${err}`);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  return router;
}
