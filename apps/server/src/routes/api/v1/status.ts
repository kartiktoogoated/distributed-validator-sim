import express, { Request, Response } from "express";
import { WebSocketServer } from "ws";
import { Validator } from "../../../core/Validator";
import { info, warn, error as logError } from "../../../../utils/logger";
import prisma from "../../../prismaClient";

export default function createStatusRouter(ws: WebSocketServer) {
  const router = express.Router();

  router.get("/", async (req: Request, res: Response): Promise<any> => {
    info("Received /api/status request"); // Debug log
    try {
      // Find all real validators (id != 0)
      const validators = await prisma.validator.findMany({ where: { id: { not: 0 } } });
      if (!validators || validators.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No real validators found in database"
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
        validators: validators.map(v => ({ id: v.id, location: v.location })),
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
