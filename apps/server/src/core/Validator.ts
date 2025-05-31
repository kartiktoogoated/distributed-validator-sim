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
  latencyMs: number;
  timestamp: string;
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
  const result = await lookup(hostname, { family: 0, verbatim: true });
  dnsCache.set(hostname, result);
  info(`DNS cache miss: resolved ${hostname} -> ${result.address}`);
  return result;
}

// ── Validator Class ───────────────────────────────
export class Validator {
  public readonly id: number;
  public peers: string[] = [];
  private lastVotes = new Map<string, Vote>();
  private location: string;

  constructor(id: number, location: string = process.env.LOCATION || "unknown") {
    this.id = id;
    this.location = location;
  }

  private recordVote(origin: string, status: Status, weight: number): Vote {
    const vote: Vote = { status, weight };
    this.lastVotes.set(origin, vote);
    return vote;
  }

  /**
   * ICMP-ping + HTTP check. Returns status + latency.
   */
  public async checkWebsite(siteUrl: string): Promise<{ vote: Vote; latency: number }> {
    const origin = new URL(siteUrl).origin;
    const hostname = new URL(siteUrl).hostname;

    // DNS resolve
    let address: string;
    try {
      address = (await cachedLookup(hostname)).address;
    } catch {
      return { vote: this.recordVote(origin, "DOWN", 1), latency: 0 };
    }

    // ICMP ping
    const icmpStart = Date.now();
    let icmpLatency = 0;
    let icmpStatus: Status = "DOWN";
    try {
      const res = await ping.promise.probe(address, { timeout: 2 });
      if (res.alive) {
        icmpStatus = "UP";
        icmpLatency = Date.now() - icmpStart;
      }
    } catch (err: any) {
      logError(`ICMP ping error for ${origin}: ${err.message}`);
    }

    // HTTP check
    let httpStatus: Status = "DOWN";
    let httpCode: number | null = null;
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 3000);
    try {
      const r = await fetch(siteUrl, { signal: controller.signal });
      httpCode = r.status;
      httpStatus = r.status >= 200 && r.status < 400 ? "UP" : "DOWN";
    } catch {
      httpStatus = "DOWN";
    } finally {
      clearTimeout(to);
    }

    const finalStatus: Status = httpStatus;
    const reportedLatency = finalStatus === "UP" ? icmpLatency : 0;

    // Skip first ping
    if (!skipFirstPingForSite.has(origin)) {
      skipFirstPingForSite.add(origin);
      info(`Skipped first ping for ${origin} (DNS warm-up)`);
      return { vote: this.recordVote(origin, finalStatus, 1), latency: reportedLatency };
    }

    // Send to Kafka
    try {
      await sendToTopic("validator-logs", {
        validatorId: this.id,
        url: origin,
        status: finalStatus,
        latencyMs: reportedLatency,
        timestamp: new Date().toISOString(),
        location: this.location,
        icmpLatencyMs: icmpLatency,
        icmpStatus,
        httpStatus,
        httpCode,
      });

      info(`✅ Validator ${this.id}@${this.location} → ${origin}`);
      info(`   └─ ICMP ${icmpStatus === "UP" ? "🟢" : "🔴"}: ${icmpLatency}ms`);
      info(`   └─ HTTP ${httpCode ?? "ERR"}: ${httpStatus}`);
      info(`   └─ Final: ${finalStatus} (Reported: ${reportedLatency}ms)`);
    } catch (err: any) {
      logError(`Kafka send failed: ${err.message}`);
    }

    return { vote: this.recordVote(origin, finalStatus, 1), latency: reportedLatency };
  }

  public gossip(
    siteUrl: string,
    latencyMs: number,
    timestamp: string,
    location: string
  ): void {
    const vote = this.lastVotes.get(siteUrl);
    if (!vote) {
      warn(`No cached vote for ${siteUrl}, skipping gossip`);
      return;
    }

    // Ensure timestamp is a valid ISO string
    const validTimestamp = (typeof timestamp === 'string' && !isNaN(new Date(timestamp).getTime()))
      ? timestamp
      : new Date().toISOString();

    const payload: GossipPayload = {
      site: siteUrl,
      vote,
      validatorId: this.id,
      latencyMs,
      timestamp: validTimestamp,
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

  public getStatus(siteUrl: string): Vote | undefined {
    return this.lastVotes.get(siteUrl);
  }

  public receiveGossip(siteUrl: string, vote: Vote, from: number): void {
    this.lastVotes.set(siteUrl, vote);
    info(`🔄 Validator ${this.id} got gossip from ${from} for ${siteUrl}: ${vote.status}`);
  }
}