import { Request, Response } from "express";
import prisma from "../prismaClient";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { info } from "../../utils/logger";
import { sendOtpEmail } from "../../utils/email";

const JWT_SECRET = process.env.JWT_SECRET!;

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
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }

    // 1) Prevent duplicate permanent users
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // 2) Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3) Generate OTP + expiration (10m)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // 4) Upsert pendingUser record
    let pendingRecord = await prisma.pendingUser.findUnique({ where: { email } });
    if (pendingRecord) {
      pendingRecord = await prisma.pendingUser.update({
        where: { email },
        data: { password: hashedPassword, otp, otpExpires },
      });
      info(`Updated pending signup for ${email} with new OTP`);
    } else {
      pendingRecord = await prisma.pendingUser.create({
        data: { email, password: hashedPassword, otp, otpExpires },
      });
      info(`Created pending signup for ${email} with OTP`);
    }

    // 5) Enqueue OTP email via Kafka (no verificationLink yet)
    await sendOtpEmail(pendingRecord.email, otp);
    info(`Sent OTP email directly to ${email}`);

    // 6) Response
    res.status(201).json({
      message: "Pending signup initiated. Please check your email for the OTP.",
      email,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * OTP Verification endpoint.
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

    // 1) Create permanent user
    const user = await prisma.user.create({
      data: {
        email: pendingUser.email,
        password: pendingUser.password,
        isVerified: true,
      },
    });

    // 2) Remove pending record
    await prisma.pendingUser.delete({ where: { email } });

    res.status(200).json({
      message: "User verified and created successfully",
      userId: user.id,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

/**
 * Signin endpoint.
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
    res.status(200).json({ message: "Signin successful", token });
  } catch (err: any) {
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}
