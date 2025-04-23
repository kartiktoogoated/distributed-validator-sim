import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const logs = await prisma.validatorLog.findMany({
    include: { validator: { select: { id: true, location: true } } },
    orderBy: { timestamp: "desc" },
  });

  console.log("\n📋 Detailed Validator Logs:");
  console.table(
    logs.map((l) => ({
      id:           l.id,
      validatorId:  l.validatorId,
      region:       l.validator.location,
      site:         l.site,
      status:       l.status,
      timestamp:    l.timestamp.toISOString(),
    }))
  );

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
