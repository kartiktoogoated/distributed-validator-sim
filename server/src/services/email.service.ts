import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true, // Enable debug information
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("Error verifying transporter configuration:", error);
  } else {
    console.log("Transporter configuration is correct. Ready to send emails.");
  }
});

/**
 * Sends an OTP email for verification.
 *
 * @param to - The recipient's email address.
 * @param otp - The one-time password.
 * @param verificationLink - A link for verification (optional).
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  verificationLink?: string
): Promise<void> {
  // Build the email text conditionally if a link is provided.
  const linkText = verificationLink ? 
    `Alternatively, you can verify your email by clicking the link below:
${verificationLink}` : "";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP for Email Verification",
    text: `Hello,

Your One-Time Password (OTP) is: ${otp}

${linkText}

This OTP is valid for the next 10 minutes.

If you did not request this, please ignore this email.

Thank you.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}
