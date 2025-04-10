import { Request, Response } from "express";
import prisma from "../prismaClient";
import jwt from 'jsonwebtoken';
import { info } from "../../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET!;
const VERIFICATION_TOKEN_EXPIRATION = '15m';

/**
 * Generates a verification token using a user's id and email.
 */
export function generateVerificationToken(userId: number, email: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: VERIFICATION_TOKEN_EXPIRATION });
}

/**
 * Controller to verify a user's email using a token in the query string.
 * The token should be passed as a query param "token".
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
    try {
        const token = req.query.token;
        if (!token || typeof token !=='string') {
            res.status(400).json({ message: 'Verification token is required' });
            return;
        }

        let payload: any;
        try {
            payload = jwt.verify(token , JWT_SECRET);
        } catch (error) {
            res.status(400).json({ message: 'Invalid or expired verification token' });
            return;
        }

        // Update user as verified.
        await prisma.user.update({
            where: { id: payload.userId },
            data: {
                isVerified: true,
                otp: null,
                otpExpires: null,
            },
        });

        info(`User with id ${payload.userId} has been verified.`);
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error: any) {
        res
            .status(500)
            .json({ message: 'Internal server error', error: error.message });
    }
}