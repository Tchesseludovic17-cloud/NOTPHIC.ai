import type { RequestHandler } from "express";
import { logger } from "../lib/logger";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const limiter = new Map<string, RateLimitEntry>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max 100 requests per window

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limiter.entries()) {
    if (entry.resetTime < now) {
      limiter.delete(key);
    }
  }
}, 60 * 60 * 1000);

export function rateLimitMiddleware(): RequestHandler {
  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();

    let entry = limiter.get(key);
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + WINDOW_MS };
      limiter.set(key, entry);
    }

    entry.count++;

    if (entry.count > MAX_REQUESTS) {
      logger.warn({ ip: key, count: entry.count }, "Rate limit exceeded");
      return res.status(429).json({ error: "Too many requests, please try again later" });
    }

    next();
  };
}
