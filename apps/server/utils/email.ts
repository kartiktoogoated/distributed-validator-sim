import nodemailer from 'nodemailer';
import { mailConfig } from '../src/config/mailConfig';
import { info, error } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: mailConfig.SMTP_HOST,
  port: mailConfig.SMTP_PORT,
  secure: mailConfig.SMTP_SECURE,  // false for STARTTLS, true for SSL
  auth: {
    user: mailConfig.SMTP_USER,
    pass: mailConfig.SMTP_PASS,
  },
});

export async function sendOtpEmail(
  to: string,
  otp: string,
  verificationLink?: string
): Promise<void> {
  const linkSection = verificationLink
    ? `\nOr click here to verify: ${verificationLink}\n`
    : '';

  const emailText = `
Hello,

Your one-time password (OTP) is: ${otp}
This is valid for 10 minutes.${linkSection}

If you did not request this, please ignore.

— Your Service Team
`.trim();

  try {
    info(`Sending OTP email to ${to} with subject "Your Verification OTP"`);

    await transporter.sendMail({
      from: mailConfig.MAIL_FROM,  // e.g., 'noreply@yourdomain.com'
      to,
      subject: "Your Verification OTP",
      text: emailText,
    });

    info(`OTP email sent successfully to ${to}`);
  } catch (sendErr: any) {
    error(`Failed to send OTP email to ${to}: ${sendErr.message}`);
    throw sendErr;
  }
}
