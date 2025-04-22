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
    await consumer.subscribe({ topic: "health-alerts", fromBeginning: false });

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
                const alert= JSON.parse(message.value!.toString()) as {
                    userId: string;
                    url: string;
                    status: string;
                    timestamp: string;
                };

                // lookup user
                const userRecord = await prisma.user.findUnique({ where: { id: alert.userId } });
                if (!userRecord?.email) {
                    warn(`No email found for user${alert.userId}, skippinh alert`);
                    return;
                }

                // send email
                await transporter.sendMail({
                    from : mailConfig.MAIL_FROM,
                    to: userRecord.email,
                    subject: `Site Down: ${alert.url}`,
                    text: `
                    Hello ${userRecord.email},
                    
                    Your monitoredsite (${alert.url}) reported DOWN at ${alert.timestamp}.
                    
                    Please check immediately.
                    
                    -Uptime Monitor
                        `.trim(),
                });

                info(`Alert cmailed to ${userRecord.email}`);
            } catch (err) {
                error(`Error processing alert message: ${err}`);
            }
        },
    });
}

// Start the service when this module is run directly
if (require.main === module) {
    startAlertService().catch((err) => {
        error(`Fatal error starting alert service: ${err}`);
        process.exit(1);
    });
}