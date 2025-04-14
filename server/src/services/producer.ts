import { Kafka } from "kafkajs";
import { info } from "../../utils/logger";

const kafka = new Kafka({
  clientId: 'validator-sim',
  brokers: ['localhost:9092'],
});

export const producer = kafka.producer();

export async function initProducer(): Promise<void> {
  await producer.connect();
  console.log('Kafka Producer connected');
}

export async function sendMessage(topic: string, message: string): Promise<void> {
  await producer.send({
    topic,
    messages: [{ value: message }],
  });
}

export async function safeSendMessage(topic: string, message: string): Promise<void> {
  try {
    await sendMessage(topic, message);
  } catch (err) {
    info(`Kafka send failed, retrying in 5 seconds: ${err}`);
    setTimeout(async () => {
      try {
        await sendMessage(topic, message);
        info(`Retry succeeded for topic ${topic}`);
      } catch (retryErr) {
        info(`Retry failed for topic ${topic}: ${retryErr}`);
      }
    }, 5000);
  }
}
