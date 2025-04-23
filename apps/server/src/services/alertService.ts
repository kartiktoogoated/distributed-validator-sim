import { Kafka, logLevel } from "kafkajs";
import nodemailer from "nodemailer";
import prisma from "../prismaClient";
import { info, warn, error } from "../../utils/logger";
import { kafkaBrokerList } from "../config/kafkaConfig";
import { mailConfig } from "../config/mailConfig";

export async function startAlertService(): Promise<void> {
  const kafkaClient = new Kafka({
    clientId: "alert-service",
    brokers: kafkaBrokerList,
    logLevel: logLevel.INFO,
  });
  const consumer = kafkaClient.consumer({ groupId: "alert-service" });

  // connect & subscribe
  await consumer.connect();
  info(`Alert service connected to Kafka`);
  const topic = process.env.VALIDATOR_STATUS_TOPIC ?? "validator-status";
  await consumer.subscribe({ topic, fromBeginning: false });
  info(`Subscribed to topic '${topic}'`);

  // prepare mailer
  const transporter = nodemailer.createTransport({
    host: mailConfig.SMTP_HOST,
    port: mailConfig.SMTP_PORT,
    secure: mailConfig.SMTP_SECURE,
    auth: {
      user: mailConfig.SMTP_USER,
      pass: mailConfig.SMTP_PASS,
    },
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        // parse the consensus payload
        const payload = JSON.parse(message.value!.toString()) as {
          url: string;
          consensus: "UP" | "DOWN";
          votes: Array<{
            validatorId: number;
            status: "UP" | "DOWN";
            weight: number;
            responseTime: number;
            location: string;
          }>;
          timeStamp: string;
        };

        // find the website→user so we know who to email
        const siteRecord = await prisma.website.findUnique({
          where: { url: payload.url },
          select: { user: { select: { email: true } } },
        });
        const userEmail = siteRecord?.user.email;
        if (!userEmail) {
          warn(`No user/email found for site '${payload.url}', skipping alerts.`);
          return;
        }

        // send one email per DOWN vote (location‑aware)
        for (const v of payload.votes.filter((v) => v.status === "DOWN")) {
          const subject = `ALERT: ${payload.url} DOWN in ${v.location}`;
          const text = `
Hello,

Your monitored site (${payload.url}) reported DOWN at ${payload.timeStamp}.
  
• Validator ID: ${v.validatorId}  
• Location: ${v.location}  
• Response time: ${v.responseTime} ms  
• Overall consensus: ${payload.consensus}  

Please investigate.

— Uptime Monitor
`.trim();

          await transporter.sendMail({
            from: mailConfig.MAIL_FROM,
            to: userEmail,
            subject,
            text,
          });
          info(`Sent DOWN alert for ${payload.url} @ ${v.location} to ${userEmail}`);
        }
      } catch (err: any) {
        error(`Error processing alert message: ${err.stack || err}`);
      }
    },
  });
}

// If run directly, start the service
if (require.main === module) {
  startAlertService().catch((err) => {
    error(`Fatal error starting alert service: ${err.stack || err}`);
    process.exit(1);
  });
}
