import axios from 'axios';
import { info } from '../../utils/logger';

export type VoteStatus = 'UP' | 'DOWN'
export interface Vote {
  status: VoteStatus;
  weight: number
}

export class Validator {
  public id: number;
  private statusMap: Map<string, Vote> = new Map();
  public peers: Validator [] = [];

  constructor(id: number) {
    this.id = id;
  }

  /**
   * Performs a real HTTP GET Request.
   * Returns 'UP' if the site responds w a status code b/w 200 & 399.
   * Returns 'DOWN' if the site errors out, times out, or returns an unexpected status.
   * 
   * @params site - The URL to check.
   * @returns Promise resolving to 'UP' or 'DOWN'
   */
  public async checkWebsite(site: string): Promise<Vote> {
    try {
      // Perform a GET request with a 5-second timeout.
      const response = await axios.get(site, { timeout: 5000});
      // Consider response status codes 200-399 as UP.
      const vote: Vote = response.status >= 200 && response.status <400
        ? { status: 'UP', weight: 1 }
        : { status: 'DOWN', weight: 1};
        this.statusMap.set(site, vote);
        return vote;
      } catch (error) {
      // Any error (network err, timeout) is considered as DOWN.
      const vote: Vote = {status: 'DOWN', weight: 1 };
      this.statusMap.set(site, vote);
      return vote;
    }
  }

  /**
   * Gossip your status to a subset of peers.
   * This method sends your current vote for a given site to some of your peers.
   *
   * @param site - The URL whose status will be gossiped.
   */
  public gossip(site: string): void {
    const currentVote = this.statusMap.get(site);
    if (!currentVote) {
      info(`Validator ${this.id} has no status for site ${site} to gossip.`);
      return;
    }
    
    // Randomize peers and select 2 peers to notify.
    const peersToNotify = this.peers.sort(() => 0.5 - Math.random()).slice(0, 2);
    peersToNotify.forEach((peer) => {
      try {
        peer.recieveGossip(site, currentVote, this.id);
      } catch (err) {
        info(`Error during gossip from Validator ${this.id} to Validator ${peer.id}: ${err}`);
      }
    });
  }

  /**
   * Receives gossip from another validator.
   * If this validator hasn't set a status for the given site, adopt the received vote.
   *
   * @param site - The URL the vote is about.
   * @param vote - The Vote object received.
   * @param fromId - The sender validator's ID.
   */
  public recieveGossip(site: string, vote: Vote, fromId: number): void {
    if (!this.statusMap.has(site)) {
      this.statusMap.set(site, vote);
      info(`Validator ${this.id} received gossip from Validator ${fromId} for site ${site}: ${vote.status} (weight: ${vote.weight})`);
    }
  }

  /**
   * Retrieves the current vote for a given site.
   *
   * @param site - The site URL.
   * @returns The Vote object, if available.
   */
  public getStatus(site: string): Vote | undefined {
    return this.statusMap.get(site);
  }
}
