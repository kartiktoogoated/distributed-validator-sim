import express, { Request, Response } from "express";
import { WebSocketServer } from "ws";
import { Validator } from "../../../core/Validator";
import { info, warn, error as logError } from "../../../../utils/logger";
import prisma from "../../../prismaClient";

export default function createStatusRouter(ws: WebSocketServer) {
  const router = express.Router();

  router.get("/", async (req: Request, res: Response): Promise<any> => {
    try {
      // Get the first non-paused website from the database
      const website = await prisma.website.findFirst({
        where: { paused: false }
      });

      if (!website) {
        return res.status(404).json({ 
          success: false, 
          message: "No active websites found in database" 
        });
      }

      const targetUrl = website.url;
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

      info(`Status ping for ${targetUrl}: ${vote.vote.status} (${vote.vote.weight})`);

      // return exactly the fields you want
      return res.json({
        success: true,
        validatorId,
        url: targetUrl,
        status: vote.vote.status,
        weight: vote.vote.weight,
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
