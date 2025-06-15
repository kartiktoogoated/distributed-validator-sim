// import dotenv from "dotenv";
// dotenv.config();

// if (process.env.IS_API_SERVER !== "true") {
//   throw new Error("Run this file with IS_API_SERVER=true");
// }

// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import http from "http";
// import { WebSocketServer } from "ws";
// import passport from "passport";
// import session from "express-session";
// import { info, error as logError } from "../../../utils/logger";
// import { register as promRegister } from "../../metrics";
// import prisma from "../../prismaClient";
// import { Kafka, logLevel } from "kafkajs";
// import { kafkaBrokerList } from "../../config/kafkaConfig";

// const app = express();
// const PORT = Number(process.env.PORT) || 3000;

// // Security & parsing
// app.use(helmet());
// app.use(
//   cors({
//     origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
//     credentials: true,
//   })
// );
// app.use(express.json());

// // Session & Passport setup
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "your-secret-key",
//     resave: false,
//     saveUninitialized: false,
//   })
// );
// app.use(passport.initialize());
// app.use(passport.session());

// // HTTP + WS setup
// const server = http.createServer(app);
// const wss = new WebSocketServer({ server, path: "/api/ws" });

// // Prometheus metrics endpoint
// app.get("/metrics", async (_req, res) => {
//   try {
//     res.setHeader("Content-Type", promRegister.contentType);
//     res.end(await promRegister.metrics());
//   } catch (err) {
//     logError(`Metrics scrape failed: ${err}`);
//     res.status(500).end();
//   }
// });

// // Health check endpoint
// app.get("/health", (_req, res) => {
//   res.json({ status: "ok", service: "api-server" });
// });

// // API Routes
// app.get("/api/websites", async (_req, res) => {
//   try {
//     const websites = await prisma.website.findMany();
//     res.json({ success: true, websites });
//   } catch (err) {
//     logError(`Failed to fetch websites: ${err}`);
//     res.status(500).json({ success: false, error: "Failed to fetch websites" });
//   }
// });

// // WebSocket setup
// wss.on("connection", (client) => {
//   info("WebSocket client connected");
  
//   client.on("message", (message) => {
//     try {
//       const data = JSON.parse(message.toString());
//       info(`WS message: ${JSON.stringify(data)}`);
//       // Handle incoming WebSocket messages here
//     } catch (err) {
//       logError(`WS message error: ${err}`);
//     }
//   });

//   client.on("error", (err) => {
//     logError(`WS error: ${err.message}`);
//   });

//   client.on("close", () => {
//     info("WebSocket client disconnected");
//   });
// });

// // Kafka consumer for real-time updates
// async function startKafkaConsumer() {
//   const kafkaClient = new Kafka({
//     clientId: "api-server",
//     brokers: kafkaBrokerList,
//     logLevel: logLevel.INFO,
//   });

//   const consumer = kafkaClient.consumer({ groupId: "api-server-group" });

//   await consumer.connect();
//   info("API Server connected to Kafka");

//   await consumer.subscribe({ topic: "validator-logs", fromBeginning: false });
//   info("Subscribed to validator-logs topic");

//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       try {
//         const payload = JSON.parse(message.value!.toString());
        
//         // Broadcast to all WebSocket clients
//         const msg = JSON.stringify({
//           type: "validator-log",
//           data: payload,
//         });
        
//         wss.clients.forEach((client) => {
//           if (client.readyState === client.OPEN) {
//             client.send(msg);
//           }
//         });
//       } catch (err) {
//         logError(`Error processing Kafka message: ${err}`);
//       }
//     },
//   });
// }

// // Start Kafka consumer
// startKafkaConsumer().catch((err) => {
//   logError(`Failed to start Kafka consumer: ${err}`);
//   process.exit(1);
// });

// // Start server
// server.listen(PORT, "0.0.0.0", () => {
//   info(`🚀 API Server listening on port ${PORT}`);
// }); 