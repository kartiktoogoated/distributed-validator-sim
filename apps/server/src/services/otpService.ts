import { Kafka, logLevel } from "kafkajs";
import { kafkaBrokerList } from "../config/kafkaConfig";
import { sendOtpEmail } from "../../utils/email";
import { info, warn, error } from "../../utils/logger";

export async function startOtpService(): Promise<void> {
  const kafka = new Kafka({
    clientId: "otp-service",
    brokers: kafkaBrokerList,
    logLevel: logLevel.INFO,
  });
  const consumer = kafka.consumer({ groupId: "otp-service-group" });

  try {
    await consumer.connect();
    info("✅ OTP service connected to Kafka");
    await consumer.subscribe({ topic: "otp-requests", fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const { userId, email, otp, verificationLink } = JSON.parse(
            message.value!.toString()
          ) as {
            userId: string;
            email: string;
            otp: string;
            verificationLink?: string;
          };

          if (!email) {
            warn(`Missing email in OTP request for user ${userId}`);
            return;
          }

          await sendOtpEmail(email, otp, verificationLink);
          info(`OTP processing complete for user ${userId}`);
        } catch (innerErr) {
          error(`Error processing OTP message: ${innerErr}`);
        }
      },
    });
  } catch (err) {
    error(`Fatal OTP service error: ${err}`);
    process.exit(1);
  }
}

if (require.main === module) {
  startOtpService();
}