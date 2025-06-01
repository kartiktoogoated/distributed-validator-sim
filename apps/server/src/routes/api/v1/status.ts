import express, { Request, Response } from "express";
import { WebSocketServer } from "ws";
import { Validator } from "../../../core/Validator";
import { info, warn, error as logError } from "../../../../utils/logger";
import prisma from "../../../prismaClient";

export default function createStatusRouter(ws: WebSocketServer) {
  const router = express.Router();

  router.get("/", async (req: Request, res: Response): Promise<any> => {
    try {
      // Find the first validator in the database
      const validator = await prisma.validator.findFirst();
      if (!validator) {
        return res.status(404).json({
          success: false,
          message: "No validator found in database"
        });
      }
      // Fetch the first non-paused website
      const website = await prisma.website.findFirst({ where: { paused: false } });
      const targetUrl = website ? website.url : null;
      // Optionally, run a checkWebsite for status (uncomment if needed)
      // const validatorInstance = new Validator(validator.id);
      // const vote = await validatorInstance.checkWebsite(targetUrl);
      return res.json({
        success: true,
        validatorId: validator.id,
        url: targetUrl,
        // status: vote?.vote.status, // Uncomment if you want live status
        // weight: vote?.vote.weight, // Uncomment if you want live weight
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
