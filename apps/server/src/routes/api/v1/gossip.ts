import express, {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";
import { info } from "../../../../utils/logger";
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
  //   <Params={}, ResBody=any, ReqBody=GossipPayload>
  router.post<{}, any, GossipPayload>(
    "/gossip",
    async (
      req: Request<{}, any, GossipPayload>,
      res: Response
    ): Promise<any> => {
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
        typeof site         !== "string"  ||
        typeof validatorId  !== "number"  ||
        typeof responseTime !== "number"  ||
        typeof timeStamp    !== "string"  ||
        typeof location     !== "string"  ||
        typeof vote         !== "object"  
      ) {
        return res.status(400).send("Malformed gossip payload");
      }

      if (vote.status !== "UP" && vote.status !== "DOWN") {
        return res.status(400).send("Invalid vote.status");
      }

      // Merge into your Validator instance
      validator.receiveGossip(site, vote as Vote, validatorId);

      info(
        `🔄 Gossip received from validator ${validatorId}` +
        ` @${location} for ${site}: ${vote.status}`
      );

      return res.json({ success: true });
    }
  );

  return router;
}
