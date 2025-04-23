import { Router, Request, Response } from "express";
import prisma from "../../../prismaClient";

export default function createLogsRouter(): Router {
  const router = Router();

  router.get("/logs", async (_req: Request, res: Response) => {
    try {
      const logs = await prisma.validatorLog.findMany({
        include: {
          validator: {
            select: { location: true },
          },
        },
        orderBy: { timestamp: "desc" },
      });

      // return the logs plus region
      res.json({
        success: true,
        logs: logs.map((l) => ({
          id:           l.id,
          validatorId:  l.validatorId,
          region:       l.validator.location,
          site:         l.site,
          status:       l.status,
          timestamp:    l.timestamp,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
