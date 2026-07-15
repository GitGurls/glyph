import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

export interface AuthedRequest extends Request {
  user?: { userId: string; role: "USER" | "ADMIN" };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }
  try {
    const payload = verifyToken(header.replace("Bearer ", ""));
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
