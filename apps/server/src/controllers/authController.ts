import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { info } from "../../utils/logger";
import { sendOtpEmail } from "../../utils/email";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

/**
 * Utility function to create a 6-digit OTP.
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Signup endpoint for pending registration.
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, confirmPassword } = req.body as {
      email: string;
      password: string;
      confirmPassword: string;
    };

    if (!email || !password || !confirmPassword) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP + expiration (10m)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert pendingUser record
    const pendingUser = await prisma.pendingUser.upsert({
      where: { email },
      update: { password: hashedPassword, otp, otpExpires },
      create: { email, password: hashedPassword, otp, otpExpires },
    });

    info(`Pending signup for ${email} with OTP`);

    // Send OTP email
    await sendOtpEmail(pendingUser.email, otp);
    info(`Sent OTP email to ${email}`);

    res.status(201).json({
      message: "Pending signup initiated. Please check your email for the OTP.",
      email,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * OTP Verification endpoint.
 */
export async function verifyPendingSignup(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, otp } = req.body as { email: string; otp: string };

    if (!email || !otp) {
      res.status(400).json({ message: "Email and OTP are required" });
      return;
    }

    const pendingUser = await prisma.pendingUser.findUnique({
      where: { email },
    });
    if (!pendingUser) {
      res
        .status(400)
        .json({ message: "No pending signup found for this email" });
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

    // Create permanent User
    const user = await prisma.user.create({
      data: {
        email: pendingUser.email,
        password: pendingUser.password,
        isVerified: true,
      },
    });

    // Remove pending record
    await prisma.pendingUser.delete({ where: { email } });

    res.status(200).json({
      message: "User verified and created successfully",
      userId: user.id,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Signin endpoint.
 */
export async function signin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

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
      res.status(400).json({ message: "Invalid password" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Signin successful",
      token,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}
