import { WebSocketServer } from 'ws';
import { Kafka, Consumer } from 'kafkajs';
import logger from '../../utils/logger';
import { metrics } from '../../metrics';
import prisma from '../../prismaClient';

export class AggregatorService {
  private wss: WebSocketServer;
  private consumer: Consumer;
  private activeValidators: Map<string, any>;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.activeValidators = new Map();
    
    // Initialize Kafka consumer
    const kafka = new Kafka({
      clientId: 'aggregator',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
    });
    this.consumer = kafka.consumer({ groupId: 'aggregator-group' });
  }

  async start() {
    await this.consumer.connect();
    await this.setupKafkaConsumer();
    this.setupWebSocket();
  }

  private async setupKafkaConsumer() {
    // Subscribe to validator topics
    await this.consumer.subscribe({ 
      topics: ['validator-reports', 'validator-status'],
      fromBeginning: true 
    });

    // Process messages
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          if (!value) return;

          const data = JSON.parse(value);
          
          // Process validator reports
          if (topic === 'validator-reports') {
            await this.processValidatorReport(data);
          }
          
          // Process validator status updates
          if (topic === 'validator-status') {
            await this.processValidatorStatus(data);
          }

          // Broadcast updates to connected clients
          this.broadcastUpdate(topic, data);
        } catch (error) {
          logger.error('Error processing message:', error);
        }
      },
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      logger.info('New WebSocket connection established');
      
      // Send initial aggregator status
      ws.send(JSON.stringify({
        type: 'status',
        data: this.getStatus()
      }));

      ws.on('close', () => {
        logger.info('WebSocket connection closed');
      });
    });
  }

  private async processValidatorReport(data: any) {
    // Store report in database
    await prisma.validatorReport.create({
      data: {
        validatorId: data.validatorId,
        timestamp: new Date(),
        data: data
      }
    });

    // Update active validators
    this.activeValidators.set(data.validatorId, {
      ...this.activeValidators.get(data.validatorId),
      lastReport: new Date(),
      reportData: data
    });
  }

  private async processValidatorStatus(data: any) {
    // Update validator status in database
    await prisma.validatorStatus.upsert({
      where: { validatorId: data.validatorId },
      update: {
        status: data.status,
        lastSeen: new Date()
      },
      create: {
        validatorId: data.validatorId,
        status: data.status,
        lastSeen: new Date()
      }
    });

    // Update active validators
    this.activeValidators.set(data.validatorId, {
      ...this.activeValidators.get(data.validatorId),
      lastSeen: new Date(),
      status: data.status
    });
  }

  getStatus() {
    return {
      activeValidators: this.activeValidators.size,
      uptime: process.uptime()
    };
  }

  getActiveValidators() {
    return Array.from(this.activeValidators.values());
  }

  getMetrics() {
    return {
      activeValidators: this.activeValidators.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  private broadcastUpdate(topic: string, data: any) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ topic, data }));
      }
    });
  }
} 