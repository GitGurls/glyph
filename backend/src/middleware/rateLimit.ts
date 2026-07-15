import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";

// Redis INCR + EXPIRE sliding-ish window — works correctly across multiple
// API server instances, unlike an in-memory Map which only limits per-process.
export function rateLimit(maxRequests: number, windowSeconds: number) {
  return async (req: Request & { user?: { userId: string } }, res: Response, next: NextFunction) => {
    const key = `ratelimit:${req.user?.userId || req.ip || "anonymous"}:${req.baseUrl}${req.path}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > maxRequests) {
        const ttl = await redis.ttl(key);
        res.setHeader("Retry-After", Math.max(ttl, 1).toString());
        return res.status(429).json({ error: `Rate limit exceeded. Try again in ${Math.max(ttl, 1)}s.` });
      }

      next();
    } catch (err) {
      // Redis being briefly unavailable shouldn't take the whole API down —
      // fail open and log it, rather than 500ing every request.
      console.error("[rateLimit] Redis error, failing open:", err);
      next();
    }
  };
}
