import { WebSocketServer } from 'ws';
import { Kafka, Producer } from 'kafkajs';
import logger, { info, error } from '../../utils/logger';
import { metrics } from '../../metrics';
import prisma from '../../prismaClient';

export class ValidatorService {
  private wss: WebSocketServer;
  private producer: Producer;
  private validatorId: string;
  private activeSimulations: Map<string, any>;

  constructor(validatorId: string, wss: WebSocketServer) {
    this.validatorId = validatorId;
    this.wss = wss;
    this.activeSimulations = new Map();
    
    // Initialize Kafka producer
    const kafka = new Kafka({
      clientId: `validator-${validatorId}`,
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
    });
    this.producer = kafka.producer();
  }

  async start() {
    await this.producer.connect();
    this.setupWebSocket();
    this.startStatusUpdates();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      info('New WebSocket connection established');
      
      // Send initial validator status
      ws.send(JSON.stringify({
        type: 'status',
        data: this.getStatus()
      }));

      ws.on('close', () => {
        info('WebSocket connection closed');
      });
    });
  }

  private startStatusUpdates() {
    setInterval(async () => {
      try {
        const status = this.getStatus();
        await this.producer.send({
          topic: 'validator-status',
          messages: [{
            key: this.validatorId,
            value: JSON.stringify(status)
          }]
        });
      } catch (error) {
        error('Error sending status update:', error);
      }
    }, 5000);
  }

  async startSimulation(targetUrl: string, duration?: number) {
    const simulationId = `sim_${Date.now()}`;
    
    // Store simulation details
    this.activeSimulations.set(simulationId, {
      id: simulationId,
      targetUrl,
      startTime: new Date(),
      duration,
      status: 'running'
    });

    // Log simulation start
    await prisma.validatorLog.create({
      data: {
        validatorId: this.validatorId,
        site: targetUrl,
        status: 'UP',
        timestamp: new Date()
      }
    });

    // Broadcast to WebSocket clients
    this.broadcastUpdate('simulation_started', {
      simulationId,
      targetUrl,
      startTime: new Date()
    });

    return this.activeSimulations.get(simulationId);
  }

  async stopSimulation(simulationId: string) {
    const simulation = this.activeSimulations.get(simulationId);
    if (!simulation) {
      throw new Error('Simulation not found');
    }

    simulation.status = 'stopped';
    simulation.endTime = new Date();

    // Log simulation end
    await prisma.validatorLog.create({
      data: {
        validatorId: this.validatorId,
        site: simulation.targetUrl,
        status: 'DOWN',
        timestamp: new Date()
      }
    });

    // Broadcast to WebSocket clients
    this.broadcastUpdate('simulation_stopped', {
      simulationId,
      endTime: new Date()
    });

    return simulation;
  }

  getStatus() {
    return {
      id: this.validatorId,
      status: 'active',
      activeSimulations: this.activeSimulations.size,
      uptime: process.uptime()
    };
  }

  getActiveSimulations() {
    return Array.from(this.activeSimulations.values());
  }

  getMetrics() {
    return {
      activeSimulations: this.activeSimulations.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  getLogs(options: { limit: number; level?: string }) {
    return prisma.validatorLog.findMany({
      where: {
        validatorId: this.validatorId,
        ...(options.level && { level: options.level })
      },
      orderBy: { timestamp: 'desc' },
      take: options.limit
    });
  }

  getSimulationLogs(simulationId: string, options: { limit: number; level?: string }) {
    return prisma.validatorLog.findMany({
      where: {
        validatorId: this.validatorId,
        simulationId,
        ...(options.level && { level: options.level })
      },
      orderBy: { timestamp: 'desc' },
      take: options.limit
    });
  }

  getErrorLogs(limit: number) {
    return prisma.validatorLog.findMany({
      where: {
        validatorId: this.validatorId,
        status: 'DOWN'
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  private broadcastUpdate(type: string, data: any) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  }
} 