import { Kafka, Partitioners, logLevel } from "kafkajs";
import { info, warn, error } from "../../utils/logger";
import { kafkaBrokerList, kafkaConfig } from "../config/kafkaConfig";

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

const kafkaClient = new Kafka({
  clientId: kafkaConfig.KAFKA_CLIENT_ID,
  brokers: kafkaBrokerList,
  logLevel: logLevel.INFO,
});

export const kafkaProducer = kafkaClient.producer();

export async function startKafkaProducer(): Promise<void> {
  try {
    await kafkaProducer.connect();
    info(`Kafka producer connected to: ${kafkaBrokerList.join(", ")}`);
  } catch (err) {
    error(`Failed to connect Kafka producer: ${err}`);
    process.exit(1);
  }
}