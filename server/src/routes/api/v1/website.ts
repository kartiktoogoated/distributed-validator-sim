import  { Response, Router } from "express";
import prisma from "../../../prismaClient";
import {
  authMiddleware,
  AuthenticatedRequest,
} from "../../../middlewares/authMiddleware";

const websiteRouter = Router();

// Post /api/websites - Add new website for monitoring
websiteRouter.post('/websites', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { url, description } = req.body;

    if (!url) {
        res.status(400).json({ message: "URL is required" });
        return;
    }

    try {
        const existing = await prisma.website.findUnique({ where: { url } });
        if (existing) {
            res.status(400).json({ message: "Website already added" });
            return;
        }

        const website = await prisma.website.create({
            data: {
                url,
                description,
                userId: user!.id,
            },
        });

        res.status(201).json({ message: "Website added", website });
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

websiteRouter.get(
  "/websites",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      const websites = await prisma.website.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      res.json({ websites });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Could not fetch websites", error: error.message });
    }
  }
);

websiteRouter.put('/websites/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { url } = req.body;
    const userId = req.user?.id;

    try {
        const website = await prisma.website.findUnique({ where: { id } });

        if (!website || website.userId !== userId) {
            res.status(403).json({ message: "Not allowed to edit this website" });
            return;
        }

        const updated = await prisma.website.update({
            where: { id },
            data: { url },
        });

        res.json({ message: "Website updated", updated });
    } catch (error: any) {
        res.status(500).json({ message: "Update failed,", error: error.message });
    }
});

websiteRouter.delete('/websites', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        const website = await prisma.website.findUnique({ where: { id } });

        if (!website || website.userId !== userId) {
            res.status(403).json({ message: "Not authorized" });
            return;
        }

        await prisma.website.delete({ where: { id } });
        res.json({ message: "Website deleted" });
    } catch (error: any) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
});

websiteRouter.get('/websites/:id/history', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    try {
        // Validate ownership of the website
        const website = await prisma.website.findUnique({ where: { id } });

        if (!website || website.userId !== userId) {
            res.status(403).json({ message: "Not authorized to view this website's history" });
            return;
        }

        const [logs, total] = await Promise.all([
            prisma.validatorLog.findMany({
                where: { site: website.url },
                orderBy: { timestamp: "desc" },
                skip,
                take: limit,
            }),
            prisma.validatorLog.count({
                where: { site: website.url },
            }),
        ]);

        res.json({
            url: website.url,
            total,
            page,
            pageSize: limit,
            totalPages: Math.ceil(total / limit),
            logs,
        });
        
    } catch(error: any) {
        res.status(500).json({ message: "Failed to fetch history", error: error.message });
    }
});

websiteRouter.put('/websites/:id/pause', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const { paused } = req.body;

    if (typeof paused !== "boolean") {
        res.status(400).json({ message: "Invalid paused state" });
        return;
    }

    try {
        const website = await prisma.website.findUnique({
            where: { id }
        });

        if (!website || website.userId !== userId) {
            res.status(403).json({ message: "Not authorized" });
            return;
        }

        const updated = await prisma.website.update({
            where: { id },
            data: { paused }, 
        });
        
        res.json({ message: `Monitoring ${paused ? "paused" : "resmed"}`,website: updated });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to update state", error: error.message });
    }
});

websiteRouter.get('/websites/:id/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    try {
        const website = await prisma.website.findUnique({ where: { id } });

        if (!website || website.userId !== userId) {
            res.status(403).json({ message: "Not authorized" });
            return;
        }

        const [latestLog, totalLogs, upLogs] = await Promise.all([
            prisma.validatorLog.findFirst({
                where: { site: website?.url, validatorId: 0 },
                orderBy: { timestamp: "desc" },
            }),
            prisma.validatorLog.count({
                where: { site: website?.url, validatorId: 0 },
            }),
            prisma.validatorLog.count({
                where: { site: website.url, validatorId: 0, status: "UP"},
            })
        ]);

        const uptimePercent = totalLogs > 0 ? ((upLogs / totalLogs) * 100).toFixed(2) : "N/A";

        res.json({
            url: website?.url,
            status: latestLog?.status || "N/A",
            lastChecked: latestLog?.timestamp || null,
            uptime: uptimePercent,
            paused: website?.paused,
        });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to fetch summary", error: error.message });
    }
});

websiteRouter.get('/validators/:id/meta', async (req:AuthenticatedRequest, res: Response) => {
    const validatorId = Number(req.params.id);

    if (isNaN(validatorId)) {
        res.status(400).json({ message: "Invalid validator ID" });
        return;
    }

    try {
        const meta = await prisma.validatorMeta.findUnique({
            where: { validatorId },
        });

        if (!meta) {
            res.status(404).json({ message: "Validator not found" });
        }

        res.json({
            validatorId,
            correctVotes: meta!.correctVotes,
            totalVotes: meta!.totalVotes,
            accuracy: meta!.totalVotes > 0 ? (meta!.correctVotes / meta!.totalVotes).toFixed(2) : "0",
            averageLatency: meta!.averageLatency.toFixed(2),
            uptime: meta!.uptimePercent.toFixed(2),
            weight: meta!.weight.toFixed(3),
            lastUpdated: meta!.updatedAt,
        })
    } catch (error: any) {
        res.status(500).json({ message: "Internal error", error: error.message });
    }
});

export default websiteRouter;