import axios from "axios";
import { info } from "../../utils/logger";

export type Status = "UP" | "DOWN";
export interface Vote { status: Status; weight: number; }

export class Validator {
  public id: number;
  private statusMap = new Map<string, Vote>();
  public peers: string[] = [];

  constructor(id: number) {
    this.id = id;
  }

  public async checkWebsite(site: string): Promise<Vote> {
    try {
      const res = await axios.get(site, { timeout: 5000 });
      const status: Status = res.status >= 200 && res.status < 400 ? "UP" : "DOWN";
      const vote: Vote = { status, weight: 1 };
      this.statusMap.set(site, vote);
      return vote;
    } catch {
      const vote: Vote = { status: "DOWN", weight: 1 };
      this.statusMap.set(site, vote);
      return vote;
    }
  }

  public async gossip(site: string): Promise<void> {
    const currentVote = this.statusMap.get(site);
    if (!currentVote) return;

    if (Math.random() < 0.2) return;

    const jitter = Math.floor(Math.random() * 300) + 100;
    setTimeout(() => {
      for (const peer of this.peers) {
        const url = `http://${peer}/api/simulate/gossip`;
        axios
          .post(url, { site, vote: currentVote, fromId: this.id }, { timeout: 3000 })
          .then(() => info(`Validator ${this.id} → ${peer}: ${currentVote.status}`))
          .catch(err => info(`Validator ${this.id} fail → ${peer}: ${err.message}`));
      }
    }, jitter);
  }

  public receiveGossip(site: string, vote: Vote, fromId: number): void {
    this.statusMap.set(site, vote);
    info(`Validator ${this.id} got gossip from ${fromId} for ${site}: ${vote.status}`);
  }

  public getStatus(site: string): Vote | undefined {
    return this.statusMap.get(site);
  }
}
