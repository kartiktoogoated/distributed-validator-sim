import { Validator, Status } from "./Validator";

export class Hub {
    private validators: Validator[];
    private quorum: number

    constructor(validators: Validator[], quorum: number) {
        this.validators = validators;
        this.quorum = quorum;
    }

    // Check consensus for a given site 
    public checkConsensus(site: string): Status | null {
        const statusCount: Record<Status, number> = { UP: 0, DOWN: 0 };

        this.validators.forEach((validator) => {
            const status = validator.getStatus(site);
            if (status) {
                statusCount[status]++;
            }
        });

        // If either status reaches the quorum threshold, return it.
        if (statusCount.DOWN >= this.quorum) return "DOWN";
        if (statusCount.UP >= this.quorum) return "UP";

        return null; // No consensus reached yet
    }
}