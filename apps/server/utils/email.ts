import nodemailer from 'nodemailer';
import { info, error } from '../utils/logger';
import { mailConfig } from '../src/config/mailConfig';

const transporter = nodemailer.createTransport({
  host: mailConfig.SMTP_HOST,
  port: mailConfig.SMTP_PORT,
  secure: mailConfig.SMTP_SECURE,
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
    ? `<div class="metric">
        <span class="metric-label">Verification Link:</span>
        <a href="${verificationLink}" class="verification-link">Click here to verify</a>
      </div>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4a90e2; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .metric { margin: 10px 0; }
    .metric-label { font-weight: bold; }
    .otp-code { 
      font-size: 24px; 
      font-weight: bold; 
      color: #4a90e2; 
      letter-spacing: 2px;
      padding: 10px;
      background: #f0f0f0;
      border-radius: 4px;
      text-align: center;
      margin: 20px 0;
    }
    .verification-link {
      color: #4a90e2;
      text-decoration: none;
    }
    .verification-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔐 Your Verification Code</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Please use the following code to verify your account:</p>
      
      <div class="otp-code">${otp}</div>

      <div class="metric">
        <span class="metric-label">Valid For:</span> 10 minutes
      </div>
      ${linkSection}

      <p>If you did not request this verification code, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>The DeepFry Team</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`.trim();

  try {
    info(`Sending OTP email to ${to}`);

    await transporter.sendMail({
      from: mailConfig.MAIL_FROM,
      to,
      subject: "🔐 Your Verification Code",
      html,
    });

    info(`OTP email sent successfully to ${to}`);
  } catch (sendErr: any) {
    error(`Failed to send OTP email to ${to}: ${sendErr.message}`);
    throw sendErr;
  }
}
