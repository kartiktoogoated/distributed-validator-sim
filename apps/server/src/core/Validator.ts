import ping from 'ping'
import * as dns from 'dns'
import { promisify } from 'util'
import { info, warn, error as logError } from '../../utils/logger'

export type Status = 'UP' | 'DOWN'
export interface Vote { status: Status; weight: number }

export interface GossipPayload {
  site: string
  vote: Vote
  validatorId: number
  responseTime: number
  timeStamp: string
  location: string
}

// ── simple in-process DNS cache ───────────────────────────────────────────────
const lookup = promisify(dns.lookup)
const dnsCache = new Map<string, { address: string; family: number }>()

async function cachedLookup(hostname: string) {
  const cached = dnsCache.get(hostname)
  if (cached) {
    info(`DNS cache hit: ${hostname} -> ${cached.address}`)
    return cached;
  }

  let result;
  try {
    result = await lookup(hostname, { family: 0, verbatim: true })
    dnsCache.set(hostname, result)
    info(`DNS cache miss: resolved ${hostname} -> ${result.address}`)
    return result;
  } catch (err) {
    logError(`DNS lookup failed for ${hostname}: ${(err as Error).message}`);
    throw err
  }
}

export class Validator {
  public readonly id: number
  public peers: string[] = []
  private lastVotes = new Map<string, Vote>()

  constructor(id: number) {
    this.id = id
  }

  /**
   * ICMP-ping (no TCP/TLS), with cached DNS.
   */
  public async checkWebsite(siteUrl: string): Promise<Vote> {
    const { hostname } = new URL(siteUrl)
    const start = Date.now()

    let status: Status = 'DOWN'
    try {
      const { address } = await cachedLookup(hostname)
      // ping once with a 3 s timeout
      const res = await ping.promise.probe(address, { timeout: 3 })
      status = res.alive ? 'UP' : 'DOWN'

      if (!res.alive) {
        warn(`Ping responded DOWN for ${siteUrl}`)
      }
    } catch (err){
      logError(`checkWebsite error for ${siteUrl}: ${(err as Error).message}`);
      status = 'DOWN';
    }

    const latency = Date.now() - start
    const vote: Vote = { status, weight: 1 }
    this.lastVotes.set(siteUrl, vote)
    info(`📡 Validator ${this.id} pinged ${siteUrl}: ${status} (icmp ${latency} ms)`)
    return vote
  }

  /**
   * Fire off your last vote to all peers immediately—no jitter, 1 round only.
   */
  public gossip(
    siteUrl: string,
    responseTime: number,
    timeStamp: string,
    location: string
  ): void {
    const vote = this.lastVotes.get(siteUrl)
    if (!vote) {
      warn(`No cached vote for ${siteUrl}, skipping gossip`);
      return;
    }

    const payload: GossipPayload = {
      site: siteUrl,
      vote,
      validatorId: this.id,
      responseTime,
      timeStamp,
      location,
    }

    info(`Gossiping ${siteUrl} (${vote.status}) to ${this.peers.length} peers`)
    this.peers.forEach(peer => {
      fetch(`http://${peer}/api/simulate/gossip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // you can polyfill fetch or use node-fetch
      })
      .then(() => info(`🔗 Validator ${this.id} → ${peer}: ${vote.status}`))
      .catch(err => info(`❌ Validator ${this.id} → ${peer} failed: ${err.message}`))
    })
  }

  public receiveGossip(siteUrl: string, vote: Vote, from: number): void {
    this.lastVotes.set(siteUrl, vote)
    info(`🔄 Validator ${this.id} got gossip from ${from} for ${siteUrl}: ${vote.status}`)
  }

  public getStatus(siteUrl: string): Vote | undefined {
    return this.lastVotes.get(siteUrl)
  }
}
