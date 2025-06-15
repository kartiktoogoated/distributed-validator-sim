import dotenv from "dotenv";
dotenv.config();

if (process.env.IS_AGGREGATOR !== "true") {
  throw new Error("Run this file with IS_AGGREGATOR=true");
}

import express, { Request, Response, RequestHandler } from "express";
import http from "http";
import { info, error as logError } from "../../utils/logger";
import { Counter, Histogram } from "prom-client";
import { kafkaBrokerList } from "../../config/kafkaConfig";
import { Kafka, logLevel } from "kafkajs";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Create logs directory if it doesn't exist
const LOGS_DIR = process.env.LOG_DIR || path.join(process.cwd(), "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Constants for log rotation
const LOG_ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOG_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_LOGS_TO_KEEP = 7; // Keep last 7 days of logs

// Function to get current log file path
function getCurrentLogFile() {
  const date = new Date();
  return path.join(
    LOGS_DIR,
    `validator-logs-${date.toISOString().split("T")[0]}.json`
  );
}

// Function to write log to file
async function writeLogToFile(logData: any) {
  const filePath = getCurrentLogFile();

  try {
    let existingLogs = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingLogs = JSON.parse(fileContent);
    }

    existingLogs.push({
      ...logData,
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(filePath, JSON.stringify(existingLogs, null, 2));

    // Check if file size exceeds limit
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_LOG_SIZE) {
      await rotateLogs();
    }
  } catch (err: any) {
    logError(`Failed to write log: ${err}`);
  }
}

// Function to rotate logs
async function rotateLogs() {
  try {
    const files = fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.startsWith("validator-logs-"))
      .sort()
      .reverse();

    // Upload oldest file to S3 before deleting
    if (files.length > 0) {
      const oldestFile = files[files.length - 1];
      const filePath = path.join(LOGS_DIR, oldestFile);

      if (process.env.S3_BUCKET) {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: `${process.env.S3_PREFIX || 'logs'}/${oldestFile}`,
            Body: fs.readFileSync(filePath),
            ContentType: "application/json",
          })
        );
        info(`Uploaded logs to S3: ${oldestFile}`);
      }

      // Delete file after successful upload
      fs.unlinkSync(filePath);
    }

    // Keep only the last N days of logs
    if (files.length > MAX_LOGS_TO_KEEP) {
      files.slice(MAX_LOGS_TO_KEEP).forEach((file) => {
        fs.unlinkSync(path.join(LOGS_DIR, file));
      });
    }
  } catch (err: any) {
    logError(`Failed to rotate logs: ${err}`);
  }
}

// Start log rotation interval
setInterval(rotateLogs, LOG_ROTATION_INTERVAL);

// Prometheus metrics
const voteCounter = new Counter({
  name: "validator_votes_total",
  help: "Total number of votes received",
  labelNames: ["status"],
});

const voteLatencyHistogram = new Histogram({
  name: "vote_processing_latency_seconds",
  help: "Time taken to process votes and reach consensus",
  labelNames: ["url"],
});

// In-memory storage
const processedConsensus = new Set<string>();

// Kafka topics
const VOTES_TOPIC = process.env.KAFKA_TOPIC || "validator-logs";
const CONSENSUS_TOPIC = process.env.KAFKA_CONSENSUS_TOPIC || "validator-consensus";

// Initialize Kafka producer
const kafka = new Kafka({
  clientId: "aggregator",
  brokers: kafkaBrokerList,
  logLevel: logLevel.INFO,
});

const producer = kafka.producer();

// Connect to Kafka
async function connectKafka() {
  try {
    await producer.connect();
    info("Connected to Kafka");
  } catch (err) {
    logError(`Failed to connect to Kafka: ${err}`);
    throw err;
  }
}

// Process quorum
async function processQuorum(payload: any) {
  try {
    const { 
      url, 
      timestamp, 
      status, 
      latencyMs, 
      validatorId, 
      location, 
      icmpStatus, 
      httpStatus, 
      httpCode, 
      failureReason 
    } = payload;

    // Validate required fields
    if (!url || !timestamp || !status || !validatorId || !location) {
      logError(`Invalid payload received: ${JSON.stringify(payload)}`);
      return;
    }

    const key = `${url}__${timestamp}`;

    if (processedConsensus.has(key)) return;

    // Send to validator-votes topic for individual validator alerts
    await producer.send({
      topic: VOTES_TOPIC,
      messages: [
        {
          key: `${url}__${validatorId}__${timestamp}`,
          value: JSON.stringify({
            type: "vote",
            validatorId,
            url,
            status,
            latencyMs,
            timestamp,
            location,
            icmpStatus,
            httpStatus,
            httpCode,
            failureReason
          }),
        },
      ],
    });

    // Send to consensus topic for overall status
    await producer.send({
      topic: CONSENSUS_TOPIC,
      messages: [
        {
          key,
          value: JSON.stringify({
            type: "consensus",
            url,
            consensus: status,
            votes: [
              {
                validatorId,
                status,
                weight: 1,
                latencyMs,
                location,
                timestamp: new Date(timestamp).getTime(),
              },
            ],
            timestamp,
          }),
        },
      ],
    });

    processedConsensus.add(key);
  } catch (err) {
    logError(`Error processing quorum: ${err}`);
  }
}

// Main server function
async function startServer() {
  try {
    const app = express();
    app.use(express.json());

    // Add health check endpoint
    app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', service: 'aggregator' });
    });

    // Add endpoint to get historical logs
    app.get("/api/historical-logs", (async (
      req: Request,
      res: Response
    ): Promise<void> => {
      try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
          res.status(400).json({ error: "startDate and endDate are required " });
          return;
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        const logs: any[] = [];

        // Get logs from local files
        const files = fs
          .readdirSync(LOGS_DIR)
          .filter((f) => f.startsWith("validator-logs-"))
          .sort();

        for (const file of files) {
          const fileDate = new Date(
            file.replace("validator-logs-", "").replace(".json", "")
          );
          if (fileDate >= start && fileDate <= end) {
            const filePath = path.join(LOGS_DIR, file);
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const fileLogs = JSON.parse(fileContent);
            logs.push(...fileLogs);
          }
        }

        // Get logs from S3 if needed
        if (process.env.S3_BUCKET) {
          const s3Files = await s3Client.send(
            new GetObjectCommand({
              Bucket: process.env.S3_BUCKET,
              Key: `${process.env.S3_PREFIX || 'logs'}/validator-logs-${start.toISOString().split("T")[0]}.json`,
            })
          );

          if (s3Files.Body) {
            const s3Logs = JSON.parse(await s3Files.Body.transformToString());
            logs.push(...s3Logs);
          }
        }

        // Filter and sort logs
        const filteredLogs = logs
          .filter((log) => {
            const logDate = new Date(log.timestamp);
            return logDate >= start && logDate <= end;
          })
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

        res.json({ logs: filteredLogs });
      } catch (err: any) {
        logError(`Failed to get historical logs: ${err}`);
        res.status(500).json({ error: `Failed to get historical logs` });
      }
    }) as RequestHandler);

    // Setup HTTP server
    const server = http.createServer(app);

    // Add WebSocket server for validator connections
    const validatorWss = new WebSocketServer({
      server,
      path: "/ws",
    });

    // Handle validator WebSocket connections
    validatorWss.on("connection", (ws) => {
      info("Validator connected via WebSocket");

      ws.on("message", async (message) => {
        try {
          const payload = JSON.parse(message.toString());

          if (payload.type === "vote") {
            const timestampMs = new Date(payload.timestamp).getTime();
            const normalizedTimestamp = new Date(
              Math.floor(timestampMs / 1000) * 1000
            ).toISOString();

            // Write to log file
            await writeLogToFile({
              type: "vote",
              ...payload,
              timestamp: normalizedTimestamp,
            });

            // Update metrics
            voteCounter.inc({ status: payload.status });
            voteLatencyHistogram.observe(payload.latencyMs / 1000);

            // Send to Kafka and process quorum
            await processQuorum({
              ...payload,
              timestamp: normalizedTimestamp,
            });
          }
        } catch (err) {
          logError(
            `Error processing WebSocket message: ${(err as Error).message}`
          );
        }
      });

      ws.on("error", (err) => {
        logError(`WebSocket error: ${err.message}`);
      });

      ws.on("close", () => {
        info("Validator disconnected from WebSocket");
      });
    });

    // Connect to Kafka
    await connectKafka();
    
    // Start the server
    server.listen(PORT, "0.0.0.0", () => {
      info(`🧿 Aggregator listening on ${PORT}`);
    });
  } catch (err) {
    logError(`Failed to start server: ${err}`);
    process.exit(1);
  }
}

// Start the server
startServer(); 