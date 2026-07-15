import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export interface ApiKeyRequest extends Request {
  apiUser?: { userId: string };
}

// Lets external developers call the generation API directly with `x-api-key`,
// mirroring how the frontend uses JWT — same underlying job queue either way.
export async function requireApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const key = req.header("x-api-key");
  if (!key) return res.status(401).json({ error: "Missing x-api-key header" });

  const record = await prisma.apiKey.findUnique({ where: { key } });
  if (!record || record.revoked) {
    return res.status(401).json({ error: "Invalid or revoked API key" });
  }

  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  req.apiUser = { userId: record.userId };
  next();
}
