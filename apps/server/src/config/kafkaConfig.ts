// src/config/kafkaConfig.ts
import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const envSchema = z.object({
  KAFKA_BOOTSTRAP_SERVERS: z
    .string()
    .nonempty()
    .describe("Comma-separated list of Kafka brokers"),
  KAFKA_CLIENT_ID: z
    .string()
    .default("validator-sim")
    .describe("Kafka clientId"),
});

export type KafkaConfig = z.infer<typeof envSchema>;
export const kafkaConfig = envSchema.parse(process.env);

export const kafkaBrokerList = kafkaConfig.KAFKA_BOOTSTRAP_SERVERS
  .split(",")
  .map((brokerUrl) => brokerUrl.trim());