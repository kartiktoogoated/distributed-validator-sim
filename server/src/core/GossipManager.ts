import { Validator } from "./Validator";
import { info } from "../../utils/logger";

export class GossipManager {
    private validators: Validator[];
    private rounds: number;

    constructor(validators: Validator[], rounds: number = 3) {
        this.validators = validators;
        this.rounds = rounds;
    }

    // Rum multiple rounds of gossip
    public runGossipRounds(site: string): void {
        for( let i = 0; i< this.rounds; i++) {
            info(`\n--- Gossip Round ${i + 1} ---`);
            this.validators.forEach((validator) => {
                try {
                    validator.gossip(site)
                } catch (err){
                    info(`Error during gossip round: ${err}`)
                }
            });
        }
    }
}