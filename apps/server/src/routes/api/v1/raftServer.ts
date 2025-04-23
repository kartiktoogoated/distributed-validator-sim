import express, {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";
import {
  RequestVoteRPC,
  RequestVoteResult,
  AppendEntriesRPC,
  AppendEntriesResult,
  RaftNode,
} from "../../../core/raft";

const jsonParser = express.json();

export function initRaftRouter(node: RaftNode): Router {
  const router = Router();

  // promise-wrapped JSON parser
  router.use((req: Request, res: Response, next: NextFunction): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      jsonParser(req, res, (err) => (err ? reject(err) : resolve(undefined)));
    })
      .then(() => next())
      .catch(next);
  });

  // RPC for election votes
  router.post(
    "/request-vote",
    async (req: Request, res: Response<RequestVoteResult>): Promise<any> => {
      const rpc = req.body as RequestVoteRPC;
      const result = await node.handleRequestVote(rpc);
      return res.json(result);
    }
  );

  // RPC for heartbeats & log replication
  router.post(
    "/append-entries",
    async (req: Request, res: Response<AppendEntriesResult>): Promise<any> => {
      const rpc = req.body as AppendEntriesRPC;
      const result = await node.handleAppendEntries(rpc);
      return res.json(result);
    }
  );

  // Introspection: cluster/node status
  router.get("/status", async (_req, res: Response): Promise<any> => {
    return res.json({
      id:          node.id,
      state:       node.state,
      currentTerm: node.currentTerm,
      commitIndex: node.commitIndex,
      lastApplied: node.lastApplied,
      nextIndex:   node.nextIndex,
      matchIndex:  node.matchIndex,
    });
  });

  // Introspection: in-memory log entries
  router.get("/log", async (_req, res: Response): Promise<any> => {
    return res.json(node.log);
  });

  return router;
}
