import type { NextFunction, Request, Response } from 'express';

export interface RateLimitOptions {
  /** Sliding window length, milliseconds. */
  windowMs: number;
  /** Maximum requests per IP inside the window. */
  max: number;
  /** Human-readable 429 body message. */
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;

/**
 * Dependency-free in-memory per-IP rate limiter for public endpoints that are
 * reachable without a token (lead intake, employee-ID verification). It runs
 * before validation, so invalid payloads still consume budget — that is the
 * point (they are exactly the spam vector). Memory is bounded by pruning
 * expired buckets once the map grows large. Note `req.ip` reflects the direct
 * peer: behind a reverse proxy, set `trust proxy` so all clients do not share
 * one bucket.
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max } = options;
  const message = options.message ?? 'Too many requests, please try again later.';
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (buckets.size >= MAX_BUCKETS) pruneExpired(buckets, now);
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
      return;
    }
    next();
  };
}

function pruneExpired(buckets: Map<string, Bucket>, now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
