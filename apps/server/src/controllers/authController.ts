import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { info } from "../../utils/logger";
import { sendOtpEmail } from "../services/otp.service";

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Utility function to create a 6-digit OTP.
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Signup endpoint for pending registration.
 * 
 * Behavior:
 * - If a permanent user already exists, returns an error.
 * - If a pending signup exists, update it with a new OTP (and new password, if provided).
 * - Otherwise, create a new pending signup record.
 * - In both cases, send the OTP via email using Nodemailer.
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }

    // Check if a permanent user already exists.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a new OTP and expiration (10 minutes from now).
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Check if a pending signup already exists.
    const existingPending = await prisma.pendingUser.findUnique({ where: { email } });
    if (existingPending) {
      // Update the pending signup record with the new hashed password, OTP, and expiration.
      await prisma.pendingUser.update({
        where: { email },
        data: {
          password: hashedPassword,
          otp,
          otpExpires,
        },
      });
      info(`Updated pending signup for ${email} with new OTP: ${otp}`);
    } else {
      // Create a new pending signup record.
      await prisma.pendingUser.create({
        data: {
          email,
          password: hashedPassword,
          otp,
          otpExpires,
        },
      });
      info(`Created pending signup for ${email} with OTP: ${otp}`);
    }

    // Send OTP email.
    await sendOtpEmail(email, otp);
    info(`OTP sent to email: ${email}`);

    res.status(201).json({
      message: "Pending signup initiated. Please verify the OTP sent to your email.",
      email,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * OTP Verification endpoint.
 * 
 * - Expects email and OTP in the request body.
 * - Validates the OTP and checks its expiration.
 * - If valid, creates a permanent user record in the User table
 *   and deletes the pending signup record.
 */
export async function verifyPendingSignup(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ message: "Email and OTP are required" });
      return;
    }

    const pendingUser = await prisma.pendingUser.findUnique({ where: { email } });
    if (!pendingUser) {
      res.status(400).json({ message: "No pending signup found for this email" });
      return;
    }

    if (pendingUser.otp !== otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }
    if (pendingUser.otpExpires && new Date() > pendingUser.otpExpires) {
      res.status(400).json({ message: "OTP expired" });
      return;
    }

    // Create permanent user record.
    const user = await prisma.user.create({
      data: {
        email: pendingUser.email,
        password: pendingUser.password,
        isVerified: true,
      },
    });

    // Delete the pending signup record.
    await prisma.pendingUser.delete({ where: { email } });

    res.status(200).json({ message: "User created and verified successfully", userId: user.id });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * Signin endpoint.
 * 
 * - Validates email and password.
 * - Checks if the user exists and is verified.
 * - Compares the provided password with the stored hash.
 * - Generates a JWT for the authenticated session.
 */
export async function signin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Signin Successful", token });
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
