import { Router, Request, Response } from "express";
import { info } from "../../../../utils/logger";
import { Validator, Vote } from "../../../core/Validator"; // fix path if needed

const gossipRouter = Router();
let localValidator: Validator;

/**
 * Call this from server.ts to wire up your validator and
 * return the Router for Express.
 */
export function initGossipRouter(validator: Validator): Router {
  localValidator = validator;
  return gossipRouter;
}

gossipRouter.post("/gossip", (req: Request, res: Response) => {
  const { site, vote, fromId } = req.body as {
    site: string;
    vote: Vote;
    fromId: number;
  };
  localValidator.receiveGossip(site, vote, fromId);
  info(`Gossip received from ${fromId} for ${site}`);
  res.json({ success: true });
});
