import { Router, Request, Response } from "express";
import { RequestVoteRPC, AppendEntriesRPC, RaftNode } from "../../../core/raft";

const raftRouter = Router()
let raftNode: RaftNode

/**
 *  Initialize the raft RPC router with your RaftNode instance.
 */
export function initRaftRouter(node: RaftNode): Router {
    raftNode = node
    return raftRouter
}

/**
 *  RPC to ask for votes during elections.
 */
raftRouter.post(
    '/request-vote',
    async (req: Request, res: Response) => {
        const rpc = req.body as RequestVoteRPC
        const result = await raftNode.handleRequestVote(rpc)
        res.json(result)
    }
)

/**
 *  RPC to append entries (heartbeats or log replication).
 */
raftRouter.post(
    'append-entries',
    async (req: Request, res: Response) => {
        const rpc = req.body as AppendEntriesRPC
        const result = await raftNode.handleAppendEntries(rpc)
        res.json(result)
    }
)

export default raftRouter