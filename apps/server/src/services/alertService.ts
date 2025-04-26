import { Kafka, logLevel } from "kafkajs";
import nodemailer from "nodemailer";
import prisma from "../prismaClient";
import { info, warn, error } from "../../utils/logger";
import { kafkaBrokerList } from "../config/kafkaConfig";
import { mailConfig } from "../config/mailConfig";
import { WebSocketServer, WebSocket } from "ws";

export async function startAlertService(wsServer: WebSocketServer): Promise<void> {
  const kafkaClient = new Kafka({
    clientId: "alert-service",
    brokers: kafkaBrokerList,
    logLevel: logLevel.INFO,
  });
  const consumer = kafkaClient.consumer({ groupId: "alert-service" });

  await consumer.connect();
  info(`Alert service connected to Kafka`);

  const topic = process.env.VALIDATOR_STATUS_TOPIC ?? "validator-status";
  await consumer.subscribe({ topic, fromBeginning: false });
  info(`Subscribed to topic '${topic}'`);

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

        // look up the user’s email
        const siteRecord = await prisma.website.findUnique({
          where: { url: payload.url },
          select: { user: { select: { email: true } } },
        });
        const userEmail = siteRecord?.user.email;
        if (!userEmail) {
          warn(`No user/email for site '${payload.url}', skipping alerts.`);
          return;
        }

        // for each DOWN vote, email + WS-broadcast
        for (const v of payload.votes.filter((v) => v.status === "DOWN")) {
          const subject = `ALERT: ${payload.url} DOWN in ${v.location}`;
          const text = `
Your monitored site (${payload.url}) went DOWN at ${payload.timeStamp}.

• Validator ID: ${v.validatorId}
• Location: ${v.location}
• Response time: ${v.responseTime} ms
• Overall consensus: ${payload.consensus}

— Uptime Monitor
`.trim();

          // send mail
          await transporter.sendMail({
            from: mailConfig.MAIL_FROM,
            to: userEmail,
            subject,
            text,
          });
          info(`Email sent: ${payload.url} @ ${v.location} → ${userEmail}`);

          // broadcast to frontend
          const wsEvent = {
            type: "REGION_DOWN",
            data: {
              url: payload.url,
              validatorId: v.validatorId,
              location: v.location,
              responseTime: v.responseTime,
              consensus: payload.consensus,
              timeStamp: payload.timeStamp,
            },
          };
          wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(wsEvent));
            }
          });
          info(`WS broadcast: REGION_DOWN for ${payload.url} @ ${v.location}`);
        }
      } catch (err: any) {
        error(`Error in alertService.eachMessage: ${err.stack || err}`);
      }
    },
  });
}

// If run standalone...
if (require.main === module) {
  // You’ll need to import or instantiate a WS server here if you do this.
  error("Please import startAlertService(wsServer) from your main server entrypoint.");
  process.exit(1);
}
