import { Kafka } from "kafkajs";
import { info } from "../../utils/logger";

// 1) Grab your broker(s) from the env var (set via .env.docker / docker-compose)
const brokerEnv = process.env.KAFKA_BROKER;
if (!brokerEnv) {
  throw new Error("Missing KAFKA_BROKER env var");
}
// support comma‑separated list if you ever need multiple brokers
const brokers = brokerEnv.split(",").map((b) => b.trim());

// 2) Construct Kafka client with the real brokers
const kafka = new Kafka({
  clientId: "validator-sim",
  brokers,
  // Uncomment to silence the v2 partitioner warning if you like:
  // logCreator: () => ({}),
  // createPartitioner: Partitioners.LegacyPartitioner,
});

export const producer = kafka.producer();

export async function initProducer(): Promise<void> {
  await producer.connect();
  info(`Kafka producer connected to ${brokers.join(",")}`);
}

export async function sendMessage(topic: string, message: string): Promise<void> {
  await producer.send({
    topic,
    messages: [{ value: message }],
  });
}

export async function safeSendMessage(
  topic: string,
  message: string
): Promise<void> {
  try {
    await sendMessage(topic, message);
  } catch (err) {
    info(`Kafka send failed, retrying in 5s: ${err}`);
    setTimeout(async () => {
      try {
        await sendMessage(topic, message);
        info(`Retry succeeded for topic ${topic}`);
      } catch (retryErr) {
        info(`Retry still failed for topic ${topic}: ${retryErr}`);
      }
    }, 5000);
  }
}
