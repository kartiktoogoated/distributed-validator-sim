// apps/server/src/routes/api/v1/logs.ts
import { Router, Request, Response } from "express";
import prisma from "../../../prismaClient";

export default function createLogsRouter(): Router {
  const router = Router();

  router.get("/", async (_req: Request, res: Response) => {
    try {
      const logs = await prisma.validatorLog.findMany({
        include: {
          validator: {
            select: { location: true },
          },
        },
        orderBy: { timestamp: "desc" },
      });

      // return the logs plus region and latency
      res.json({
        success: true,
        logs: logs.map((log: any) => ({
          id:           log.id,
          validatorId:  log.validatorId,
          region:       log.validator.location,
          site:         log.site,
          status:       log.status,
          latency:      log.latency,       // new field
          timestamp:    log.timestamp,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
