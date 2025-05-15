import { Router, Request, Response } from 'express';
import { signup, verifyPendingSignup, signin } from '../../../controllers/authController';
import { authRateLimiter } from '../../../middlewares/rateLimiter';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import prisma from '../../../prismaClient';
import { googleAuth, googleCallback, handleGoogleSuccess } from '../../../controllers/googleController';

const authRouter = Router();

// Rate limiter for all auth routes
authRouter.use(authRateLimiter);

// Email/OTP-based auth
authRouter.post('/signup', signup);
authRouter.post('/verify-otp', verifyPendingSignup);
authRouter.post('/signin', signin);

// Google OAuth routes
authRouter.get('/google', googleAuth);
authRouter.get('/google/callback', googleCallback, handleGoogleSuccess);

authRouter.post('/verify-wallet', async (req: Request, res: Response): Promise<void> => {
    try {
        const { wallet, message, signature } = req.body as {
            wallet: string;
            message: string;
            signature: number[];
        };

        if (!wallet || !message) {
            res.status(400).json({ success: false, error: 'Invalid payload' });
            return;
        }

        const publicKey = new PublicKey(wallet);
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = Uint8Array.from(signature);

        const isValid = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKey.toBytes(),
        );

        if (!isValid) {
            res.status(401).json({ success: false, error: 'Invalid signature' });
            return;
        }

        await prisma.validator.upsert({
            where: { wallet },
            update: {},
            create: {
                wallet,
                location: "unknown" 
            }
        });

        res.status(200).json({ success: true });
        return;
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Internal server error' });
        return;
    }
});

export default authRouter;
