import crypto from "crypto";
import { prisma } from "./prisma";

const REFRESH_TOKEN_TTL_DAYS = 7;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// The raw refresh token is only ever returned to the client once, at issue
// time — the DB only ever stores its hash, so a leaked database dump alone
// can't be replayed as a valid session (same principle as password hashing).
export async function issueRefreshToken(userId: string) {
  const raw = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt },
  });

  return raw;
}

export async function verifyRefreshToken(raw: string) {
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!record || record.revoked || record.expiresAt < new Date()) return null;
  return record;
}

// Rotation: every refresh consumes the old token and issues a new one. If a
// revoked/already-used token is ever presented again, that's a signal of theft.
export async function rotateRefreshToken(oldRaw: string, userId: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(oldRaw) },
    data: { revoked: true },
  });
  return issueRefreshToken(userId);
}

export async function revokeRefreshToken(raw: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(raw) },
    data: { revoked: true },
  });
}

export async function revokeAllRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
}
