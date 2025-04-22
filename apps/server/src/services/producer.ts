import { Kafka, logLevel } from "kafkajs";
import { info, warn, error as logError } from "../../utils/logger";
import { kafkaBrokerList, kafkaConfig } from "../config/kafkaConfig";

// Payload types
export interface LogEntry {
  validatorId: number;
  url: string;
  status: "UP" | "DOWN";
  latencyMs: number;
  timestamp: string;
}

export interface AlertEntry extends LogEntry {
  userId: number;
}

export interface OtpRequest {
  userId: string;
  email: string;
  otp: string;
  verificationLink?: string;
}

// Kafka client and producer setup
const kafkaClient = new Kafka({
  clientId: kafkaConfig.KAFKA_CLIENT_ID,
  brokers: kafkaBrokerList,
  logLevel: logLevel.INFO,
});

export const kafkaProducer = kafkaClient.producer();

export async function startKafkaProducer(): Promise<void> {
  try {
    await kafkaProducer.connect();
    info(`✅ Kafka producer connected to: ${kafkaBrokerList.join(", ")}`);
  } catch (err) {
    logError(`❌ Failed to connect Kafka producer: ${err}`);
    process.exit(1);
  }
}

// ——— Internal helper to send JSON to a topic —————————
export async function sendToTopic<T>(topic: string, payload: T): Promise<void> {
  try {
    await kafkaProducer.send({
      topic,
      messages: [
        {
          key: String(
            (payload as any).validatorId ?? (payload as any).userId
          ),
          value: JSON.stringify(payload),
        },
      ],
    });
  } catch (err) {
    throw err;
  }
}

// ——— Publish a health check log, and optionally enqueue an alert ——
export async function publishHealthCheck(
  entry: LogEntry,
  alertUserId?: number
): Promise<void> {
  try {
    await sendToTopic("health-logs", entry);
    info(`Logged [${entry.status}] for ${entry.url}`);

    if (entry.status === "DOWN" && alertUserId !== undefined) {
      const alertPayload: AlertEntry = { ...entry, userId: alertUserId };
      await sendToTopic("health-alerts", alertPayload);
      warn(`Enqueued alert for user ${alertUserId} on ${entry.url}`);
    }
  } catch (err) {
    logError(`Error publishing health check: ${err}`);
  }
}

// ——— Publish an OTP request to be consumed by your OTP service ———
export async function publishOtpRequest(request: OtpRequest): Promise<void> {
  try {
    await sendToTopic("otp-requests", request);
    info(`Enqueued OTP request for user ${request.userId}`);
  } catch (err) {
    logError(`Failed to enqueue OTP request for user ${request.userId}: ${err}`);
  }
}
