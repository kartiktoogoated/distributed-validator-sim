import express, { Response, Router } from "express";
import prisma from "prismaClient";
import { authMiddleware, AuthenticatedRequest } from "middlewares/authMiddleware";

const websiteRouter = Router();

// Post /api/websites - Add new website for monitoring
websiteRouter.post('/websites', authMiddleware,  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { url } = req.body;

    if (!url) {
        res.status(400).json({ success: false, message: "URL is required" });
        return;
    }

    try {
        const website = await prisma.website.create({
            data: {
                url,
                userId: user!.id,
            },
        });

        res.status(201).json({ success: true, website });
        return;
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to add website" })
    }
});

export default websiteRouter;