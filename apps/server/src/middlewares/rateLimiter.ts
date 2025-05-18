import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Default rate limit settings
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 100;

// Create a rate limiter with custom settings
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skip?: (req: Request) => boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || DEFAULT_WINDOW_MS,
    max: options.max || DEFAULT_MAX_REQUESTS,
    message: options.message || "Too many requests, please try again later",
    skip: options.skip,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

// Pre-configured rate limiters
export const globalRateLimiter = createRateLimiter({
  windowMs: DEFAULT_WINDOW_MS,
  max: DEFAULT_MAX_REQUESTS,
  skip: (req) => {
    // Skip rate limiting for dashboard and Raft endpoints
    return (
      req.path.startsWith("/api/raft") ||
      req.path.startsWith("/api/simulate") ||
      req.path.startsWith("/api/logs") ||
      req.path.startsWith("/api/ws")
    );
  },
});

export const authRateLimiter = createRateLimiter({
  windowMs: DEFAULT_WINDOW_MS,
  max: 5, // More restrictive for auth endpoints
  message: "Too many auth requests, please try again later",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: DEFAULT_WINDOW_MS,
  max: 50, // Moderate limit for API endpoints
  message: "API rate limit exceeded, please try again later",
  skip: (req) => {
    // Skip rate limiting for dashboard endpoints
    return (
      req.path.startsWith("/api/simulate") ||
      req.path.startsWith("/api/logs") ||
      req.path.startsWith("/api/ws")
    );
  },
}); 