import { Validator, Status } from "./Validator";

export class Hub {
  private validators: Validator[];
  private quorum: number;

  constructor(validators: Validator[], quorum: number) {
    this.validators = validators;
    this.quorum = quorum;
  }

  /**
   * Check consensus for a given site.
   * Aggregates the statuses from each validator, counting "UP" vs "DOWN".
   * If either reaches the quorum threshold, return that status, else null.
   */
  public checkConsensus(site: string): Status | null {
    let upWeight = 0;
    let downWeight = 0;
  
    this.validators.forEach((validator) => {
      const vote = validator.getStatus(site);
      if (vote) {
        if (vote.status === "UP") {
          upWeight += vote.weight;
        } else {
          downWeight += vote.weight;
        }
      }
    });
  
    if (downWeight >= this.quorum) return "DOWN";
    if (upWeight >= this.quorum) return "UP";
    return null;
  }
}  