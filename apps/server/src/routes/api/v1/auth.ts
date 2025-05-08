import { Router } from 'express';
import { signup, verifyPendingSignup, signin } from '../../../controllers/authController';
import { authRateLimiter } from '../../../middlewares/rateLimiter';

const authRouter = Router();

// Apply rate limiter to all auth routes
authRouter.use(authRateLimiter);

// Auth routes
authRouter.post('/signup', signup);
authRouter.post('/verify-otp', verifyPendingSignup);
authRouter.post('/signin', signin);

export default authRouter;