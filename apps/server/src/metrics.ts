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

// Add some default metrics (CPU / memory / event loop lag, etc)
client.collectDefaultMetrics({ register });
