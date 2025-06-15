// src/metrics.ts
import client from 'prom-client';

export const register = new client.Registry();

// Histogram for raw ping latencies
export const latencyHistogram = new client.Histogram({
  name: 'ping_latency_ms',
  help: 'Latency of each ping in milliseconds',
  buckets: [10, 50, 100, 200, 500, 1000],
});
register.registerMetric(latencyHistogram);

// Counter for up/down status
export const statusCounter = new client.Counter({
  name: 'ping_status_total',
  help: 'Count of ping statuses by result',
  labelNames: ['status'] as const,
});
register.registerMetric(statusCounter);

// Validator metrics
export const validatorSimulationsGauge = new client.Gauge({
  name: 'validator_active_simulations',
  help: 'Number of active simulations per validator',
  labelNames: ['validator_id'] as const,
});
register.registerMetric(validatorSimulationsGauge);

export const validatorUptimeGauge = new client.Gauge({
  name: 'validator_uptime_seconds',
  help: 'Validator uptime in seconds',
  labelNames: ['validator_id'] as const,
});
register.registerMetric(validatorUptimeGauge);

// Aggregator metrics
export const aggregatorValidatorsGauge = new client.Gauge({
  name: 'aggregator_active_validators',
  help: 'Number of active validators connected to aggregator',
});
register.registerMetric(aggregatorValidatorsGauge);

export const aggregatorUptimeGauge = new client.Gauge({
  name: 'aggregator_uptime_seconds',
  help: 'Aggregator uptime in seconds',
});
register.registerMetric(aggregatorUptimeGauge);

// Kafka metrics
export const kafkaMessageCounter = new client.Counter({
  name: 'kafka_messages_total',
  help: 'Total number of Kafka messages processed',
  labelNames: ['topic', 'status'] as const,
});
register.registerMetric(kafkaMessageCounter);

// WebSocket metrics
export const websocketConnectionsGauge = new client.Gauge({
  name: 'websocket_connections',
  help: 'Number of active WebSocket connections',
  labelNames: ['role'] as const,
});
register.registerMetric(websocketConnectionsGauge);

// Add some default metrics (CPU / memory / event loop lag, etc)
client.collectDefaultMetrics({ register });

// Export metrics for use in services
export const metrics = {
  register,
  latencyHistogram,
  statusCounter,
  validatorSimulationsGauge,
  validatorUptimeGauge,
  aggregatorValidatorsGauge,
  aggregatorUptimeGauge,
  kafkaMessageCounter,
  websocketConnectionsGauge
};
