import axios from 'axios';
import { info } from '../../utils/logger';

export type Status = 'UP' | 'DOWN';

export interface Vote {
  status: Status;
  weight: number;
}

export interface GossipPayload {
  site:         string;
  vote:         Vote;
  validatorId:  number;
  responseTime: number;
  timeStamp:    string;
  location:     string;
}

export class Validator {
  public readonly id: number;
  public peers: string[] = [];
  private lastVotes = new Map<string, Vote>();

  constructor(validatorId: number) {
    this.id = validatorId;
  }

  /**
   * Ping the site and record a vote (UP or DOWN), logging the result.
   */
  public async checkWebsite(siteUrl: string): Promise<Vote> {
    const startTime = Date.now();
    let vote: Vote;

    try {
      const response = await axios.get(siteUrl, { timeout: 5000 });
      const status: Status =
        response.status >= 200 && response.status < 400 ? 'UP' : 'DOWN';
      vote = { status, weight: 1 };
    } catch {
      vote = { status: 'DOWN', weight: 1 };
    }

    const latency = Date.now() - startTime;
    this.lastVotes.set(siteUrl, vote);
    info(`📡 Validator ${this.id} pinged ${siteUrl}: ${vote.status} (latency ${latency}ms)`);
    return vote;
  }

  /**
   * Gossip your last vote for siteUrl to all peers, with a bit of jitter.
   */
  public gossip(
    siteUrl: string,
    responseTime: number,
    timeStamp: string,
    location: string
  ): void {
    const vote = this.lastVotes.get(siteUrl);
    if (!vote) return;

    // Simulate ~20% dropped messages
    if (Math.random() < 0.2) return;

    const jitterMs = Math.floor(Math.random() * 300) + 100;
    setTimeout(() => {
      const payload: GossipPayload = {
        site:         siteUrl,
        vote,
        validatorId:  this.id,
        responseTime,
        timeStamp,
        location,
      };

      this.peers.forEach((peerAddress) => {
        axios
          .post(`http://${peerAddress}/api/simulate/gossip`, payload, { timeout: 3000 })
          .then(() => info(`🔗 Validator ${this.id} → ${peerAddress}: ${vote.status}`))
          .catch((err) =>
            info(`❌ Validator ${this.id} failed to gossip to ${peerAddress}: ${err.message}`)
          );
      });
    }, jitterMs);
  }

  /**
   * Merge in a vote you received from a peer.
   */
  public receiveGossip(siteUrl: string, vote: Vote, fromValidatorId: number): void {
    this.lastVotes.set(siteUrl, vote);
    info(
      `🔄 Validator ${this.id} received gossip from ${fromValidatorId}` +
      ` for ${siteUrl}: ${vote.status}`
    );
  }

  /**
   * Get the last vote recorded for a given site.
   */
  public getStatus(siteUrl: string): Vote | undefined {
    return this.lastVotes.get(siteUrl);
  }
}
