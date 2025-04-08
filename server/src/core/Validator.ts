import axios from 'axios';
import { info } from '../../utils/logger';
export type Status = 'UP' | 'DOWN'

export class Validator {
  public id: number;
  private statusMap: Map<string, Status> = new Map();
  public peers: Validator [] = [];

  constructor(id: number) {
    this.id = id;
  }

  /**
   * Performs a real HTTP GET Request.
   * Returns 'UP' if the site responds w a status code b/w 200 & 399.
   * Returns 'DOWN' if the site errors out, times out, or returns an unexpected status.
   * 
   * @parans site - The URL to check.
   * @returns Promise resolving to 'UP' or 'DOWN'
   */
  public async checkWebsite(site: string): Promise<Status> {
    try {
      // Perform a GET request with a 5-second timeout.
      const response = await axios.get(site, { timeout: 5000});
      // Consider response status codes 200-399 as UP.
      const status: Status = (response.status >= 200 && response.status <400) ? 'UP' : 'DOWN';
      this.statusMap.set(site, status);
      return status;
    } catch (error) {
      // Any error (network err, timeout) is considered as DOWN.
      this.statusMap.set(site, 'DOWN');
      return 'DOWN';
    }
  }

  // Gossip your status to a subset of peers
  public gossip(site: string) {
    const currentStatus = this.statusMap.get(site);
    if (!currentStatus) {
        info(`Validator ${this.id} has not status for site ${site} to gossip.`)
        return;
    }

    // Randomize peers; advanced: use a helper to shuffle an array
    const peersToNotify = this.peers.sort(() => 0.5 - Math.random()).slice(0, 2);
    peersToNotify.forEach((peer) => {
        try {
            peer.recieveGossip(site, currentStatus, this.id)
        } catch (err) {
            info(`Error during gossip from Validator ${this.id} to Validator ${peer.id}: ${err}`);
        }
    });
}

  // Recieve gossip from a peer; optionally, you could merge opinions or use weighted values
  public recieveGossip(site: string, status: Status, fromId: number): void {
    // For now, if this validator hasn't set a status for the site, adopt the recieve status.
    if (!this.statusMap.has(site)) {
      this.statusMap.set(site, status);
      info(`validator ${this.id} recieved gossip from Validator ${fromId} for site ${site}: ${status}`);
    }
  }

  // Get current status for a site
  public getStatus(site: string): Status | undefined {
    return this.statusMap.get(site);
  }
}
