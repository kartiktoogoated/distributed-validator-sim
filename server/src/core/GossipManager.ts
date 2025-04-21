import { Validator, Vote, Status } from "./Validator";
import { info } from "../../utils/logger";

export class GossipManager {
    private validators: Validator[];
    private rounds: number;

    constructor(validators: Validator[], rounds: number) {
        this.validators = validators;
        this.rounds = rounds;
    }

    /**
     * Runs multiple rounds of gossip.
     * 
     * In each round, each validator gossips its current vote to a subset of peers.
     * Between rounds, the system waits for a random delay (to simulate a noisy network).
     */
    public async runGossipRounds(site: string): Promise<void> {
        for (let round = 1; round <= this.rounds; round++) {
            info(`Starting gossip round ${round}`);
            this.validators.forEach((validator) => {
                validator.gossip(site);
            });
            const delay = this.getRandomDelay(500, 1500);
            await this.delay(delay);
            info(`Completed gossip round ${round}`);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private getRandomDelay(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min +1)) + min;
    }
}