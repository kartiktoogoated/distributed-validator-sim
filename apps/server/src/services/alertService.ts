import { Kafka, logLevel } from "kafkajs";
import nodemailer from "nodemailer";
import prisma from "../prismaClient";
import { info, warn, error } from "../../utils/logger";
import { kafkaBrokerList } from "../config/kafkaConfig";
import { mailConfig } from "../config/mailConfig";
import { WebSocketServer, WebSocket } from "ws";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function connectWithRetry(kafkaClient: Kafka, consumer: any, retries = 0): Promise<boolean> {
  try {
    await consumer.connect();
    info(`Alert service connected to Kafka`);
    return true;
  } catch (err) {
    if (retries < MAX_RETRIES) {
      warn(`Kafka connection failed (attempt ${retries + 1}/${MAX_RETRIES}): ${err}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectWithRetry(kafkaClient, consumer, retries + 1);
    }
    error(`Failed to connect to Kafka after ${MAX_RETRIES} attempts: ${err}`);
    return false;
  }
}

export async function startAlertService(wsServer: WebSocketServer): Promise<void> {
  let kafkaClient: Kafka | null = null;
  let consumer: any = null;

  try {
    kafkaClient = new Kafka({
      clientId: "alert-service",
      brokers: kafkaBrokerList,
      logLevel: logLevel.INFO,
    });
    consumer = kafkaClient.consumer({ groupId: "alert-service" });

    const connected = await connectWithRetry(kafkaClient, consumer);
    if (!connected) {
      warn("Alert service starting without Kafka - alerts will be disabled");
      return;
    }

    const topic = process.env.KAFKA_TOPIC ?? "validator-logs";
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
      eachMessage: async ({ message }: { message: { value: Buffer } }) => {
        try {
          const payload = JSON.parse(message.value!.toString()) as {
            url: string;
            consensus: "UP" | "DOWN";
            votes?: Array<{
              validatorId: number;
              status: "UP" | "DOWN";
              weight: number;
              responseTime: number;
              location: string;
            }>;
            timeStamp: string;
          };

          // Only process messages with a votes array
          if (!Array.isArray(payload.votes)) {
            return;
          }

          // look up the user's email
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
            const subject = `🚨 ALERT: ${payload.url} DOWN in ${v.location}`;
            const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff4444; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    .metric { margin: 10px 0; }
    .metric-label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚨 Site Down Alert</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We've detected that your monitored site is currently down:</p>
      
      <div class="metric">
        <span class="metric-label">Site URL:</span> ${payload.url}
      </div>
      <div class="metric">
        <span class="metric-label">Status:</span> DOWN
      </div>
      <div class="metric">
        <span class="metric-label">Detected At:</span> ${new Date(payload.timeStamp).toLocaleString()}
      </div>
      <div class="metric">
        <span class="metric-label">Location:</span> ${v.location}
      </div>
      <div class="metric">
        <span class="metric-label">Response Time:</span> ${v.responseTime} ms
      </div>
      <div class="metric">
        <span class="metric-label">Validator ID:</span> ${v.validatorId}
      </div>
      <div class="metric">
        <span class="metric-label">Overall Consensus:</span> ${payload.consensus}
      </div>

      <p>Our team is monitoring the situation and will keep you updated.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>The DeepFry Team</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`.trim();

            try {
              // send mail
              await transporter.sendMail({
                from: mailConfig.MAIL_FROM,
                to: userEmail,
                subject,
                html,
              });
              info(`Email sent: ${payload.url} @ ${v.location} → ${userEmail}`);
            } catch (mailErr) {
              error(`Failed to send email: ${mailErr}`);
              // Continue with WebSocket broadcast even if email fails
            }

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
  } catch (err: any) {
    error(`Failed to start alert service: ${err.stack || err}`);
    // Don't throw - allow the service to continue without alerts
  }
}

// If run standalone...
if (require.main === module) {
  error("Please import startAlertService(wsServer) from your main server entrypoint.");
  process.exit(1);
}
