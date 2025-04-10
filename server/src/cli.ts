// src/services/email.service.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail", // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

/**
 * Sends an OTP email for verification.
 * @param to Recipient email address.
 * @param otp The OTP code.
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP for Email Verification",
    text: `Hello,

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for the next 10 minutes.

If you did not request this, please ignore this email.

Thank you.`,
  };

  await transporter.sendMail(mailOptions);
}
