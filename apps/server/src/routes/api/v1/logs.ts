import { Router, Request, Response } from "express";
import prisma from "../../../prismaClient";

export default function createLogsRouter(): Router {
  const router = Router();

  /**
   * GET /api/logs
   * Optional query params:
   *   - limit (number of entries, default 100)
   *   - site  (filter by site URL)
   */
  router.get("/", async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const siteFilter = typeof req.query.site === "string" ? req.query.site : undefined;

    const where = siteFilter
      ? { site: siteFilter }
      : {};

    const entries = await prisma.validatorLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        validator: {
          select: { location: true }
        }
      }
    });

    // map into a friendlier shape
    const result = entries.map((e) => ({
      site:         e.site,
      status:       e.status,
      timestamp:    e.timestamp.toISOString(),
      validatorId:  e.validatorId,
      location:     e.validatorId === 0 ? "consensus" : e.validator?.location ?? "unknown"
    }));

    res.json({ success: true, data: result });
  });

  return router;
}
