import { info, error as logError } from "../utils/logger";
import { AppError } from "../utils/errors";
import { Validator } from "./core/Validator";
import { Hub } from "./core/Hub";
import { GossipManager } from "./core/GossipManager";
import prisma from "./prismaClient";

const NUM_VALIDATORS = 5;
const QUORUM = 3;
const SITE = "https://google.com";

async function main() {
    try {
        info('Starting distributed validator simulation...');

        // 1. Create Validators.
        const validators: Validator[] = Array.from(
            { length: NUM_VALIDATORS },
            (_, i) => new Validator(i)
        );

        // 2. Assign peers (each validator gets all other validators as peers).
        validators.forEach((validator, idx) => {
            validator.peers = validators.filter((_, peerIdx) => peerIdx !== idx);
        });

        // 3. Each validator performs a real website check and logs the result to the database.
        for (const validator of validators) {
            // Await the HTTP check.
            const result = await validator.checkWebsite(SITE);
            info(`Validator ${validator.id} real HTTP check: ${result}`);

            // Insert the result into the ValidatorLog table via Prisma.
            await prisma.validatorLog.create({
                data: {
                    validatorId: validator.id,
                    site: SITE,
                    status: result,
                },
            });
        }

        // 4. Run multiple rounds of gossip.
        const gossipManager = new GossipManager(validators, 3);
        gossipManager.runGossipRounds(SITE);

        // 5. Determine consensus via the Hub.
        const hub = new Hub(validators, QUORUM);
        const consensus = hub.checkConsensus(SITE);
        info(`Consensus for ${SITE}: ${consensus ?? "No consensus reached"}`);      
    } catch (err){
        if (err instanceof AppError) {
            logError(`AppError caught: ${err.message}`);
        } else {
            logError(`Unexpected error: ${err}`);
        }
    } finally {
        info('Simulation complete. Cleaning up resources...');
        await prisma.$disconnect();
    }
}

main();