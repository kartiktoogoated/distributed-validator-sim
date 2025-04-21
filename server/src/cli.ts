import prisma from "./prismaClient";

async function fetchLogs(): Promise<void> {
  try {
    const logs = await prisma.validatorLog.findMany({
      orderBy: { timestamp: 'desc' },
    });
    console.table(logs);
    process.exit(0);
  } catch (error: any) {
    console.error(`Error fetching logs: ${error.message}`);
    process.exit(1);
  }
}

fetchLogs();
