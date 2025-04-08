import express, { Router } from 'express';
import { signup, verifyOtp, signin } from '../../../controllers/authController';

const authRouter = Router();

// Route for user signup
authRouter.post('/signup', signup);

// Route for OTP verification.
authRouter.post('/verify-otp', verifyOtp);

// Route for user sign-in
authRouter.post('/signin', signin);

export default authRouter;