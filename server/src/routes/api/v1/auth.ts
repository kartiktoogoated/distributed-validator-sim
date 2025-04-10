import  { Router } from 'express';
import { signup, verifyPendingSignup, signin } from '../../../controllers/authController';

const authRouter = Router();

// Route for user signup
authRouter.post('/signup', signup);

// Route for OTP verification.
authRouter.post('/verify-otp', verifyPendingSignup);

// Route for user sign-in
authRouter.post('/signin', signin);

export default authRouter;