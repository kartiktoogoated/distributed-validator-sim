import express, { Request, Response } from "express";
import { WebSocketServer } from "ws";
import { Validator } from "../../../core/Validator";
import { info, warn, error as logError } from "../../../../utils/logger";

export default function createStatusRouter(ws: WebSocketServer) {
  const router = express.Router();

  router.get("/", async (req: Request, res: Response): Promise<any> => {
    try {
      // figure out which URL to ping
      const targetUrl =
        (req.query.url as string) ||
        process.env.DEFAULT_TARGET_URL ||
        "http://google.com";
      info(`Status check requested for ${targetUrl}`);

      // run a single checkWebsite() locally
      const validatorId = Number(process.env.VALIDATOR_ID);
      if (isNaN(validatorId)) {
        warn(`Invalid VALIDATOR_ID: ${process.env.VALIDATOR_ID}`);
        return res
          .status(500)
          .json({ success: false, message: "VALIDATOR_ID must be defined" });
      }

      const validator = new Validator(validatorId);
      const vote = await validator.checkWebsite(targetUrl);

      info(`Status ping for ${targetUrl}: ${vote.status} (${vote.weight})`);

      // return exactly the fields you want
      return res.json({
        success: true,
        url: targetUrl,
        status: vote.status,
        weight: vote.weight,
      });
    } catch (err: any) {
      logError(`Status error: ${err.stack || err}`);
      return res
        .status(500)
        .json({ success: false, message: err.message || "Unknown error" });
    }
  });

  return router;
}
