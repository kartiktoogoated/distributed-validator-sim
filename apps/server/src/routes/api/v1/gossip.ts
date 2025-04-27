import express, {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";
import { info, warn, error as logError } from "../../../../utils/logger";
import {
  Validator,
  Vote,
  GossipPayload,
} from "../../../core/Validator";

export function initGossipRouter(validator: Validator): Router {
  const router = Router();

  // JSON body parser
  router.use(express.json());

  // POST /api/simulate/gossip
  router.post<{}, any, GossipPayload>(
    "/gossip",
    async (
      req: Request<{}, any, GossipPayload>,
      res: Response,
      next: NextFunction
    ): Promise<any> => {
      try {
        const {
          site,
          validatorId,
          responseTime,
          timeStamp,
          location,
          vote,
        } = req.body;

        // Basic validation
        if (
          typeof site !== "string" ||
          typeof validatorId !== "number" ||
          typeof responseTime !== "number" ||
          typeof timeStamp !== "string" ||
          typeof location !== "string" ||
          typeof vote !== "object"
        ) {
          warn(`Malformed gossip payload: ${JSON.stringify(req.body)}`);
          return res.status(400).send("Malformed gossip payload");
        }

        if (vote.status !== "UP" && vote.status !== "DOWN") {
          warn(`Invalid vote.status: ${vote.status}`);
          return res.status(400).send("Invalid vote.status");
        }

        // Merge into your Validator instance
        validator.receiveGossip(site, vote as Vote, validatorId);

        info(
          `🔄 Gossip received from validator ${validatorId}` +
            ` @${location} for ${site}: ${vote.status}`
        );

        return res.json({ success: true });
      } catch (err: any) {
        logError(`Gossip handler error: ${err.stack || err}`);
        next(err);
      }
    }
  );

  return router;
}
