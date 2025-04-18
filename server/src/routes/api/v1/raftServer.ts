import express, { Router, Request, Response } from "express";
import {
  RequestVoteRPC,
  AppendEntriesRPC,
  RaftNode,
} from "../../../core/raft";

export function initRaftRouter(node: RaftNode): Router {
  const router = Router();
  router.use(express.json());

  // RPC for election votes
  router.post("/request-vote", async (req: Request, res: Response) => {
    const rpc = req.body as RequestVoteRPC;
    const result = await node.handleRequestVote(rpc);
    res.json(result);
  });

  // RPC for heartbeats & log replication
  router.post("/append-entries", async (req: Request, res: Response) => {
    const rpc = req.body as AppendEntriesRPC;
    const result = await node.handleAppendEntries(rpc);
    res.json(result);
  });

  return router;
}
