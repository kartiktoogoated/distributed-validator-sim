import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { info, error as logError } from "../../../../utils/logger";
import authRouter from "./auth";
import createSimulationRouter from "./simulation"; 
import { initProducer } from "../../../services/producer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import createStatusRouter from "./status";
import websiteRouter from "./website";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Security Middleware =====
app.use(helmet());

// ===== CORS & JSONMiddleware =====
app.use(cors());
app.use(express.json());

// ===== Rate Limiting =====
// Limiting each IP to 100 req per 15 mins
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later"
})

app.use(limiter);

// ===== API Routes =====
// Mount authentication routes under /api/auth.
app.use("/api/auth", authRouter);
app.use('/api', websiteRouter);

// ===== Create and Configure the HTTP and WebSocket Server =====
// Create an HTTP server from the Express app.
const server = http.createServer(app);

// Create the WebSocket server attached to the HTTP server.
const wss = new WebSocketServer({ server });
wss.on("connection", (ws) => {
  info("New WebSocket client connected");
  
  ws.on("message", (message: string) => {
    info(`Received WS message: ${message}`);
    ws.send(`Echo: ${message}`);
  });
  
  ws.on("error", (err) => {
    logError(`WebSocket error: ${err}`);
  });
});

initProducer().catch((err) => {
  console.error("Kafka producer failed to initialize", err);
});

// Inject the WS server instance into our simulation route.
const simulationRouter = createSimulationRouter(wss);
app.use("/api/simulate", simulationRouter);

const statusRouter = createStatusRouter(wss);
app.use('/api', statusRouter);

// ===== Start the Server =====
server.listen(PORT,  () => {
  info(`Server is listening on port ${PORT}`);
});
