import axios from 'axios'
import { info } from '../../utils/logger'

export type State = 'Follower' | 'Candidate' | 'Leader'

export interface LogEntry {
  term: number
  command: any
}

export interface RequestVoteRPC {
  term: number
  candidateId: number
  lastLogIndex: number
  lastLogTerm: number
}

export interface RequestVoteResult {
  term: number
  voteGranted: boolean
}

export interface AppendEntriesRPC {
  term: number
  leaderId: number
  prevLogIndex: number
  prevLogTerm: number
  entries: LogEntry[]
  leaderCommit: number
}

export interface AppendEntriesResult {
  term: number
  success: boolean
}

export class RaftNode {
  public state: State = 'Follower'
  public currentTerm = 0
  public votedFor: number | null = null
  public log: LogEntry[] = []

  public commitIndex = 0
  public lastApplied = 0

  // for leader:
  public nextIndex: Record<number, number> = {}
  public matchIndex: Record<number, number> = {}

  private electionTimeout?: ReturnType<typeof setTimeout>
  private heartbeatInterval?: ReturnType<typeof setInterval>

  constructor(
    public id: number,
    public peers: string[],        // e.g. ["192.168.1.5:3000", ...]
    private applyCallback: (cmd: any) => void
  ) {
    this.resetElectionTimeout()
  }

  // ————— Election timeout / heartbeat —————

  private resetElectionTimeout() {
    clearTimeout(this.electionTimeout!)
    const timeout = 150 + Math.random() * 150
    this.electionTimeout = setTimeout(() => this.startElection(), timeout)
  }

  private startHeartbeat() {
    clearInterval(this.heartbeatInterval!)
    this.heartbeatInterval = setInterval(
      () => this.broadcastAppendEntries([]),
      50
    )
  }

  // ————— Candidate / election —————

  private votesReceived = 0

  private async startElection() {
    this.state = 'Candidate'
    this.currentTerm++
    this.votedFor = this.id
    this.votesReceived = 1

    const lastLogIndex = this.log.length - 1
    const lastLogTerm  = lastLogIndex >= 0 ? this.log[lastLogIndex].term : 0

    const rpc: RequestVoteRPC = {
      term: this.currentTerm,
      candidateId: this.id,
      lastLogIndex, lastLogTerm
    }

    await Promise.all(this.peers.map(async peer => {
      try {
        const res = await axios.post<RequestVoteResult>(
          `http://${peer}/api/raft/request-vote`, rpc
        )
        if (res.data.voteGranted) {
          this.votesReceived++
          // majority?
          if (this.votesReceived > (this.peers.length + 1) / 2 && this.state === 'Candidate') {
            this.becomeLeader()
          }
        } else if (res.data.term > this.currentTerm) {
          this.becomeFollower(res.data.term)
        }
      } catch (_) {}
    }))

    this.resetElectionTimeout()
  }

  private becomeLeader() {
    this.state = 'Leader'
    info(`Node ${this.id} becomes Leader @ term ${this.currentTerm}`)
    // initialize nextIndex & matchIndex
    const next = this.log.length
    this.peers.forEach((_, i) => {
      this.nextIndex[i] = next
      this.matchIndex[i] = 0
    })
    this.startHeartbeat()
  }

  private becomeFollower(term: number) {
    this.state = 'Follower'
    this.currentTerm = term
    this.votedFor = null
    clearInterval(this.heartbeatInterval!)
    this.resetElectionTimeout()
  }

  // ————— RPC handlers —————

  public async handleRequestVote(rpc: RequestVoteRPC): Promise<RequestVoteResult> {
    if (rpc.term > this.currentTerm) {
      this.becomeFollower(rpc.term)
    }
    const canVote = rpc.term === this.currentTerm &&
      (this.votedFor === null || this.votedFor === rpc.candidateId) &&
      // candidate’s log ≥ ours?
      (rpc.lastLogTerm > (this.log[this.log.length-1]?.term||0) ||
       (rpc.lastLogTerm === (this.log[this.log.length-1]?.term||0) &&
        rpc.lastLogIndex >= this.log.length-1))

    if (canVote) {
      this.votedFor = rpc.candidateId
      this.resetElectionTimeout()
    }
    return { term: this.currentTerm, voteGranted: canVote }
  }

  public async handleAppendEntries(rpc: AppendEntriesRPC): Promise<AppendEntriesResult> {
    if (rpc.term < this.currentTerm) {
      return { term: this.currentTerm, success: false }
    }
    this.becomeFollower(rpc.term)
    this.resetElectionTimeout()

    // consistency check:
    const prev = this.log[rpc.prevLogIndex]
    if (rpc.prevLogIndex >= 0 && (!prev || prev.term !== rpc.prevLogTerm)) {
      return { term: this.currentTerm, success: false }
    }

    // append any new entries
    let idx = rpc.prevLogIndex + 1
    rpc.entries.forEach(entry => {
      if (this.log[idx]?.term !== entry.term) {
        this.log = this.log.slice(0, idx)
        this.log.push(entry)
      }
      idx++
    })

    // update commitIndex
    if (rpc.leaderCommit > this.commitIndex) {
      this.commitIndex = Math.min(rpc.leaderCommit, this.log.length-1)
      while (this.lastApplied < this.commitIndex) {
        this.lastApplied++
        this.applyCallback(this.log[this.lastApplied].command)
      }
    }
    return { term: this.currentTerm, success: true }
  }

  // ————— broadcast heartbeats & log entries —————

  public async broadcastAppendEntries(entries: LogEntry[]) {
    if (this.state !== 'Leader') return
    await Promise.all(this.peers.map(async (peer, i) => {
      const prevIndex = this.nextIndex[i] - 1
      const rpc: AppendEntriesRPC = {
        term: this.currentTerm,
        leaderId: this.id,
        prevLogIndex: prevIndex,
        prevLogTerm: this.log[prevIndex]?.term || 0,
        entries,
        leaderCommit: this.commitIndex
      }
      try {
        const res = await axios.post<AppendEntriesResult>(
          `http://${peer}/api/raft/append-entries`, rpc
        )
        if (res.data.success) {
          this.matchIndex[i] = prevIndex + entries.length
          this.nextIndex[i] = this.matchIndex[i] + 1
          // advance commitIndex if possible (majority replicated)
          for (let N = this.log.length - 1; N > this.commitIndex; N--) {
            const count = [this.id, ...this.peers.map((_, j) => j)]
              .filter(j => this.matchIndex[j] >= N).length
            if (count > (this.peers.length + 1) / 2 && this.log[N].term === this.currentTerm) {
              this.commitIndex = N
              // apply
              while (this.lastApplied < this.commitIndex) {
                this.lastApplied++
                this.applyCallback(this.log[this.lastApplied].command)
              }
              break
            }
          }
        } else if (res.data.term > this.currentTerm) {
          this.becomeFollower(res.data.term)
        } else {
          this.nextIndex[i] = Math.max(0, this.nextIndex[i] - 1)
        }
      } catch (_) {}
    }))
  }

  // ————— client calls —————

  /** called by your simulate loop when you want to replicate a new command */
  public propose(command: any) {
    if (this.state !== 'Leader') {
      throw new Error('Not leader')
    }
    const entry: LogEntry = { term: this.currentTerm, command }
    this.log.push(entry)
    this.broadcastAppendEntries([entry])
  }
}
