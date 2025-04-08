import prisma from "./prismaClient";
import { info } from "../utils/logger";

async function fetchLogs() {
    try {
        const logs = await prisma.validatorLog.findMany({
            orderBy: { timestamp: 'desc' },
        });
        console.table(logs);
        process.exit(0);      
    } catch (err) {
        console.error(`Error fetching logs: ${err}`)
        process.exit(1);
    }
}

fetchLogs();