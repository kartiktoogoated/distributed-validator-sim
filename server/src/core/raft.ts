import axios from 'axios'
import { info, warn, error as logError } from '../../utils/logger'

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
  public nextIndex: Record<number, number> = {}
  public matchIndex: Record<number, number> = {}

  private electionTimeout?: ReturnType<typeof setTimeout>
  private heartbeatInterval?: ReturnType<typeof setInterval>
  private votesReceived = 0

  constructor(
    public id: number,
    public peers: string[],        // ["host1:port", "host2:port", ...]
    private applyCallback: (cmd: any) => void
  ) {
    info(`Node ${this.id} starting as Follower`)
    this.resetElectionTimeout()
  }

  // ————— Election timeout / heartbeat —————

  private resetElectionTimeout() {
    clearTimeout(this.electionTimeout!)
    const timeout = 150 + Math.random() * 150
    info(`Node ${this.id} resetting election timeout to ${Math.round(timeout)}ms`)
    this.electionTimeout = setTimeout(() => this.startElection(), timeout)
  }

  private startHeartbeat() {
    clearInterval(this.heartbeatInterval!)
    info(`Node ${this.id} starting heartbeat interval`)
    this.heartbeatInterval = setInterval(
      () => this.broadcastAppendEntries([]).catch(err => logError(`Node ${this.id} heartbeat failed: ${err}`)),
      50
    )
  }

  // ————— Candidate / election —————

  private async startElection() {
    this.state = 'Candidate'
    this.currentTerm++
    this.votedFor = this.id
    this.votesReceived = 1
    info(`Node ${this.id} starting election for term ${this.currentTerm}`)

    const lastLogIndex = this.log.length - 1
    const lastLogTerm  = lastLogIndex >= 0 ? this.log[lastLogIndex].term : 0

    const rpc: RequestVoteRPC = {
      term: this.currentTerm,
      candidateId: this.id,
      lastLogIndex, lastLogTerm
    }

    await Promise.all(this.peers.map(async (peer, idx) => {
      try {
        const res = await axios.post<RequestVoteResult>(
          `http://${peer}/api/raft/request-vote`, rpc, { timeout: 500 }
        )
        if (res.data.voteGranted) {
          this.votesReceived++
          info(`Node ${this.id} received vote from ${peer} (${this.votesReceived}/${this.peers.length+1})`)
          if (this.votesReceived > (this.peers.length + 1) / 2 && this.state === 'Candidate') {
            this.becomeLeader()
          }
        } else {
          info(`Node ${peer} denied vote (term ${res.data.term})`)
          if (res.data.term > this.currentTerm) {
            this.becomeFollower(res.data.term)
          }
        }
      } catch (err: any) {
        warn(`Node ${this.id} RequestVote to ${peer} failed: ${err.message || err}`)
      }
    }))

    this.resetElectionTimeout()
  }

  private becomeLeader() {
    this.state = 'Leader'
    info(`Node ${this.id} becomes Leader for term ${this.currentTerm}`)
    const next = this.log.length
    this.peers.forEach((_, i) => {
      this.nextIndex[i] = next
      this.matchIndex[i] = 0
    })
    this.startHeartbeat()
  }

  private becomeFollower(term: number) {
    const oldTerm = this.currentTerm
    this.state = 'Follower'
    this.currentTerm = term
    this.votedFor = null
    clearInterval(this.heartbeatInterval!)
    info(`Node ${this.id} stepping down from term ${oldTerm} to follower at term ${term}`)
    this.resetElectionTimeout()
  }

  // ————— RPC handlers —————

  public async handleRequestVote(rpc: RequestVoteRPC): Promise<RequestVoteResult> {
    try {
      info(`Node ${this.id} received RequestVote: ${JSON.stringify(rpc)}`)
      if (rpc.term > this.currentTerm) {
        this.becomeFollower(rpc.term)
      }

      const lastTerm = this.log[this.log.length-1]?.term || 0
      const lastIdx  = this.log.length - 1
      const upToDate = rpc.lastLogTerm > lastTerm
                    || (rpc.lastLogTerm === lastTerm && rpc.lastLogIndex >= lastIdx)

      const canVote = rpc.term === this.currentTerm
                   && (this.votedFor === null || this.votedFor === rpc.candidateId)
                   && upToDate

      if (canVote) {
        this.votedFor = rpc.candidateId
        this.resetElectionTimeout()
        info(`Node ${this.id} granted vote to ${rpc.candidateId}`)
      } else {
        info(`Node ${this.id} denied vote to ${rpc.candidateId}`)
      }

      return { term: this.currentTerm, voteGranted: canVote }
    } catch (err: any) {
      logError(`Node ${this.id} error in handleRequestVote: ${err}`)
      // on error, refuse vote but report current term
      return { term: this.currentTerm, voteGranted: false }
    }
  }

  public async handleAppendEntries(rpc: AppendEntriesRPC): Promise<AppendEntriesResult> {
    try {
      info(`Node ${this.id} received AppendEntries: ${JSON.stringify(rpc)}`)
      if (rpc.term < this.currentTerm) {
        return { term: this.currentTerm, success: false }
      }

      this.becomeFollower(rpc.term)
      this.resetElectionTimeout()

      // consistency check
      const prev = this.log[rpc.prevLogIndex]
      if (rpc.prevLogIndex >= 0 && (!prev || prev.term !== rpc.prevLogTerm)) {
        warn(`Node ${this.id} consistency check failed at index ${rpc.prevLogIndex}`)
        return { term: this.currentTerm, success: false }
      }

      // append new entries
      let idx = rpc.prevLogIndex + 1
      for (const entry of rpc.entries) {
        if (this.log[idx]?.term !== entry.term) {
          this.log = this.log.slice(0, idx)
          this.log.push(entry)
          info(`Node ${this.id} appended entry at ${idx}: ${JSON.stringify(entry.command)}`)
        }
        idx++
      }

      // advance commitIndex
      if (rpc.leaderCommit > this.commitIndex) {
        this.commitIndex = Math.min(rpc.leaderCommit, this.log.length - 1)
        while (this.lastApplied < this.commitIndex) {
          this.lastApplied++
          info(`Node ${this.id} applying log[${this.lastApplied}]`)
          this.applyCallback(this.log[this.lastApplied].command)
        }
      }

      return { term: this.currentTerm, success: true }
    } catch (err: any) {
      logError(`Node ${this.id} error in handleAppendEntries: ${err}`)
      return { term: this.currentTerm, success: false }
    }
  }

  // ————— broadcast heartbeats & entries —————

  public async broadcastAppendEntries(entries: LogEntry[]): Promise<void> {
    if (this.state !== 'Leader') {
      warn(`Node ${this.id} tried to broadcast while not Leader`)
      return
    }

    await Promise.all(this.peers.map(async (peer, i) => {
      const prevIndex = this.nextIndex[i] - 1
      const rpc: AppendEntriesRPC = {
        term: this.currentTerm,
        leaderId: this.id,
        prevLogIndex: prevIndex,
        prevLogTerm: this.log[prevIndex]?.term || 0,
        entries, leaderCommit: this.commitIndex
      }

      try {
        const res = await axios.post<AppendEntriesResult>(
          `http://${peer}/api/raft/append-entries`, rpc, { timeout: 500 }
        )
        if (res.data.success) {
          this.matchIndex[i] = prevIndex + entries.length
          this.nextIndex[i] = this.matchIndex[i] + 1
          info(`Node ${this.id} replicated to ${peer}: matchIndex=${this.matchIndex[i]}`)
          // try to advance commitIndex on majority
          for (let N = this.log.length - 1; N > this.commitIndex; N--) {
            const count = [this.id, ...this.peers.map((_, j) => j)]
              .filter(j => this.matchIndex[j] >= N).length
            if (count > (this.peers.length + 1) / 2 && this.log[N].term === this.currentTerm) {
              this.commitIndex = N
              info(`Node ${this.id} advancing commitIndex to ${N}`)
              while (this.lastApplied < this.commitIndex) {
                this.lastApplied++
                info(`Node ${this.id} applying log[${this.lastApplied}]`)
                this.applyCallback(this.log[this.lastApplied].command)
              }
              break
            }
          }
        } else {
          if (res.data.term > this.currentTerm) {
            this.becomeFollower(res.data.term)
          }
          this.nextIndex[i] = Math.max(0, this.nextIndex[i] - 1)
          warn(`Node ${this.id} replication to ${peer} not successful, nextIndex now ${this.nextIndex[i]}`)
        }
      } catch (err: any) {
        warn(`Node ${this.id} AppendEntries to ${peer} failed: ${err.message || err}`)
      }
    }))
  }

  // ————— client proposals —————

  public propose(command: any) {
    if (this.state !== 'Leader') {
      const msg = `Node ${this.id} cannot propose, not Leader`
      logError(msg)
      throw new Error(msg)
    }
    const entry: LogEntry = { term: this.currentTerm, command }
    this.log.push(entry)
    info(`Node ${this.id} proposing new command: ${JSON.stringify(command)}`)
    this.broadcastAppendEntries([entry]).catch(err => logError(`Node ${this.id} failed to broadcast proposal: ${err}`))
  }
}
