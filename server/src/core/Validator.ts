import { info } from "../../utils/logger";

export type Status = "UP" | "DOWN";

export class Validator {
  public id: number;
  // Using a MAP to hold the status for each site
  private statusMap: Map<string, Status> = new Map();
  // Peers can be injected later; we use dependency injection for better testing
  public peers: Validator[] = [];

  constructor(id: number) {
    this.id = id;
  }

  // Simulate a website check; advanced: can even use generics for diff check types
  public checkWebsite(site: string): Status {
    const status: Status = Math.random() < 0.3 ? "DOWN" : "UP";
    this.statusMap.set(site, status);
    return status;
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
