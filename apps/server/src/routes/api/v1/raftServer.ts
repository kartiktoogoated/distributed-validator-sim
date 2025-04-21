import express, { Router, Request, Response } from "express";
import {
  RequestVoteRPC,
  RequestVoteResult,
  AppendEntriesRPC,
  AppendEntriesResult,
  RaftNode,
} from "../../../core/raft";

export function initRaftRouter(node: RaftNode): Router {
  const router = Router();
  router.use(express.json());

  // RPC for election votes
  router.post("/request-vote", async (req: Request, res: Response<RequestVoteResult>) => {
    const rpc = req.body as RequestVoteRPC;
    const result = await node.handleRequestVote(rpc);
    res.json(result);
  });

  // RPC for heartbeats & log replication
  router.post("/append-entries", async (req: Request, res: Response<AppendEntriesResult>) => {
    const rpc = req.body as AppendEntriesRPC;
    const result = await node.handleAppendEntries(rpc);
    res.json(result);
  });

  // Introspection: cluster/node status
  router.get("/status", (_req, res) => {
    res.json({
      id:          node.id,
      state:       node.state,
      currentTerm: node.currentTerm,
      commitIndex: node.commitIndex,
      lastApplied: node.lastApplied,
      nextIndex:   node.nextIndex,
      matchIndex:  node.matchIndex,
    });
  });

  // Introspection: in‑memory log entries
  router.get("/log", (_req, res) => {
    res.json(node.log);
  });

  return router;
}
