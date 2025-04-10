import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { info } from "../../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET!;

// Utility function to create a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP and set an expiration (10 mins right now)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Create user with isVerified false
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        otp,
        otpExpires,
      },
    });

    // For demo: Log the OTP (in production, send via email/SMS)
    info(`Sent OTP ${otp} to email: ${email}`);

    res.status(201).json({
      message: "User created. Please verify otp sent to your email.",
      userId: user.id,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ message: "Email and OTP are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: "Invalid email" });
      return;
    }
    if (user.isVerified) {
      res.status(400).json({ message: "User already verified" });
      return;
    }
    if (user.otp !== otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }
    if (user.otpExpires && new Date() > user.otpExpires) {
      res.status(400).json({ message: "OTP Expired" });
      return;
    }

    // Mark user as verified and clear OTP fields
    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpires: null,
      },
    });

    res.status(200).json({ message: "User verified successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

export async function signin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      res.status(400).json({ message: "Invalid Credentials" });
      return;
    }
    if (!user.isVerified) {
      res
        .status(403)
        .json({
          message: "User not verified. Please verify your account first.",
        });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Generate a JWT token valid for 1 hour
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ message: "Signin Successful", token });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}
