import  { Router } from 'express';
import { signup, verifyPendingSignup, signin } from '../../../controllers/authController';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests 
    message: "Too many auth requests, please try again later",
  });

const authRouter = Router();

authRouter.use(authLimiter);

// Route for user signup
authRouter.post('/signup', signup);

// Route for OTP verification.
authRouter.post('/verify-otp', verifyPendingSignup);

// Route for user sign-in
authRouter.post('/signin', signin);

export default authRouter;