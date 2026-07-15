import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface JwtPayload {
  userId: string;
  role: "USER" | "ADMIN";
}

// Short-lived on purpose — a leaked access token is only useful for 15 minutes.
// Long-lived sessions are handled by the refresh token instead (see refreshToken.ts).
export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: "15m" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
