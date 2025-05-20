import ping from "ping";
import * as dns from "dns";
import { promisify } from "util";
import { info, warn, error as logError } from "../../utils/logger";
import { sendToTopic } from "../services/producer";

export type Status = "UP" | "DOWN";
export interface Vote {
  status: Status;
  weight: number;
}

export interface GossipPayload {
  site: string;
  vote: Vote;
  validatorId: number;
  responseTime: number;
  timeStamp: string;
  location: string;
}

// ── DNS Cache ─────────────────────────────────────
const lookup = promisify(dns.lookup);
const dnsCache = new Map<string, { address: string; family: number }>();
const skipFirstPingForSite = new Set<string>();

async function cachedLookup(hostname: string) {
  const cached = dnsCache.get(hostname);
  if (cached) {
    info(`DNS cache hit: ${hostname} -> ${cached.address}`);
    return cached;
  }

  try {
    const result = await lookup(hostname, { family: 0, verbatim: true });
    dnsCache.set(hostname, result);
    info(`DNS cache miss: resolved ${hostname} -> ${result.address}`);
    return result;
  } catch (err) {
    logError(`DNS lookup failed for ${hostname}: ${(err as Error).message}`);
    throw err;
  }
}

// ── Validator Class ───────────────────────────────
export class Validator {
  public readonly id: number;
  public peers: string[] = [];
  private lastVotes = new Map<string, Vote>();
  private location: string;

  constructor(id: number, location: string = process.env.LOCATION || 'unknown') {
    this.id = id;
    this.location = location;
  }

  /**
   * ICMP-ping with DNS caching. Skips first latency-inflated result.
   */
  public async checkWebsite(siteUrl: string): Promise<Vote> {
    const { hostname } = new URL(siteUrl);
    let address: string;

    try {
      const dnsResult = await cachedLookup(hostname);
      address = dnsResult.address;
    } catch (err) {
      return { status: "DOWN", weight: 1 };
    }

    const start = Date.now();
    let status: Status = "DOWN";
    let latency = 0;

    try {
      const res = await ping.promise.probe(address, { timeout: 3 });
      status = res.alive ? "UP" : "DOWN";
      if (status === "UP") latency = Date.now() - start;
      else warn(`Ping responded DOWN for ${siteUrl}`);
    } catch (err) {
      logError(`Ping error for ${siteUrl}: ${(err as Error).message}`);
    }

    const vote: Vote = { status, weight: 1 };
    this.lastVotes.set(siteUrl, vote);

    // 🚫 Skip the first ping due to DNS warm-up latency
    if (!skipFirstPingForSite.has(siteUrl)) {
      skipFirstPingForSite.add(siteUrl);
      info(`Skipped first ping result for ${siteUrl} (DNS warm-up)`);
      return vote;
    }

    try {
      await sendToTopic("validator-logs", {
        validatorId: this.id,
        url: siteUrl,
        status,
        latencyMs: latency,
        timestamp: new Date().toISOString(),
        location: this.location,
      });
      info(`📡 ${this.id}@${this.location} pinged ${siteUrl}: ${status} (${latency}ms)`);
    } catch (err) {
      logError(`Failed to send to Kafka: ${(err as Error).message}`);
    }

    return vote;
  }

  /**
   * Broadcast vote via HTTP POST to peers.
   */
  public gossip(
    siteUrl: string,
    responseTime: number,
    timeStamp: string,
    location: string
  ): void {
    const vote = this.lastVotes.get(siteUrl);
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
    };

    info(`Gossiping ${siteUrl} (${vote.status}) to ${this.peers.length} peers`);
    this.peers.forEach((peer) => {
      fetch(`http://${peer}/api/simulate/gossip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => info(`🔗 Validator ${this.id} → ${peer}: ${vote.status}`))
        .catch((err) =>
          info(`❌ Validator ${this.id} → ${peer} failed: ${err.message}`)
        );
    });
  }

  public receiveGossip(siteUrl: string, vote: Vote, from: number): void {
    this.lastVotes.set(siteUrl, vote);
    info(`🔄 Validator ${this.id} got gossip from ${from} for ${siteUrl}: ${vote.status}`);
  }

  public getStatus(siteUrl: string): Vote | undefined {
    return this.lastVotes.get(siteUrl);
  }
}
