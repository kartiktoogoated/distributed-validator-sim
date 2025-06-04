import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { WebSocketServer } from "ws";
import passport from "passport";
import session from "express-session";
import { info, error as logError } from "../../../utils/logger";
import authRouter from "../../routes/api/v1/auth";
import websiteRouter from "../../routes/api/v1/website";
import createStatusRouter from "../../routes/api/v1/status";
import createLogsRouter from "../../routes/api/v1/logs";
import SolanaRouter from "../../routes/api/v1/verify-wallet";
import { globalRateLimiter } from "../../middlewares/rateLimiter";
import { register as promRegister } from "../../metrics";
import "../../config/passport";

const app = express();
const PORT = Number(process.env.PORT) || 3004;

// Trust proxy for rate limiting behind Docker
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(globalRateLimiter);

app.get("/metrics", async (_req, res) => {
  try {
    res.setHeader("Content-Type", promRegister.contentType);
    res.end(await promRegister.metrics());
  } catch (err) {
    logError(`Metrics scrape failed: ${err}`);
    res.status(500).end();
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/ws" });

app.use("/api/auth", authRouter);
app.use("/api", websiteRouter);
app.use("/api/status", createStatusRouter(wss));
app.use("/api/logs", createLogsRouter());
app.use('/api/auth', SolanaRouter);

wss.on("connection", (client) => {
  info("WebSocket client connected");
  client.on("message", (m) => {
    info(`WS message: ${m}`);
    client.send(`Echo: ${m}`);
  });
  client.on("error", (e) => logError(`WS error: ${e.message}`));
});

server.listen(PORT, "0.0.0.0", () => {
  info(`API Server listening on port ${PORT}`);
}); 