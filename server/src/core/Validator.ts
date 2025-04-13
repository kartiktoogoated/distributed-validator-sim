import axios from "axios";
import { info } from "../../utils/logger";

export type Status = 'UP' | 'DOWN';

export interface Vote {
  status: Status;
  weight: number;
}

export class Validator {
  public id: number;
  private statusMap: Map<string, Vote> = new Map();
  public peers: Validator[] = [];

  constructor(id: number) {
    this.id = id;
  }

  /**
   * Performs a real HTTP GET request.
   * Returns a Vote where status is 'UP' (for HTTP status 200–399) or 'DOWN'; weight = 1 by default.
   *
   * @param site - The URL to check.
   * @returns A Promise that resolves to a Vote.
   */
  public async checkWebsite(site: string): Promise<Vote> {
    try {
      const response = await axios.get(site, { timeout: 5000 });
      const status: Status = (response.status >= 200 && response.status < 400) ? 'UP' : 'DOWN';
      const vote: Vote = { status, weight: 1 };
      this.statusMap.set(site, vote);
      return vote;
    } catch (error) {
      const vote: Vote = { status: 'DOWN', weight: 1 };
      this.statusMap.set(site, vote);
      return vote;
    }
  }

  /**
   * Gossips the current vote for a site to a subset of peers.
   *
   * @param site - The URL to gossip about.
   */
  public gossip(site: string): void {
    const currentVote = this.statusMap.get(site);
    if (!currentVote) {
      info(`Validator ${this.id} has no status for site ${site} to gossip.`);
      return;
    }
    // Randomize peers and notify 2 peers.
    const peersToNotify = this.peers.sort(() => 0.5 - Math.random()).slice(0, 2);
    peersToNotify.forEach((peer) => {
      try {
        peer.receiveGossip(site, currentVote, this.id);
      } catch (err) {
        info(`Error during gossip from Validator ${this.id} to Validator ${peer.id}: ${err}`);
      }
    });
  }

  /**
   * Receives gossip from a peer; adopts the vote if none exists locally.
   *
   * @param site - The URL.
   * @param vote - The Vote object.
   * @param fromId - The ID of the validator sending the vote.
   */
  public receiveGossip(site: string, vote: Vote, fromId: number): void {
    if (!this.statusMap.has(site)) {
      this.statusMap.set(site, vote);
      info(`Validator ${this.id} received gossip from Validator ${fromId} for site ${site}: ${vote.status} (weight: ${vote.weight})`);
    }
  }

  /**
   * Retrieves the current vote for a site.
   *
   * @param site - The URL.
   * @returns The Vote object or undefined if not set.
   */
  public getStatus(site: string): Vote | undefined {
    return this.statusMap.get(site);
  }
}
