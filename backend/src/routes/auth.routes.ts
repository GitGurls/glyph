import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken, verifyRefreshToken } from "../lib/refreshToken";
import { adjustCredits } from "../services/credits.service";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, refreshSchema } from "../lib/schemas";

const router = Router();

router.post("/register", validate(registerSchema), async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name, credits: 0 },
  });

  // Signup bonus goes through the same ledger path as every other credit change.
  const balance = await adjustCredits(user.id, 50, "signup_bonus");

  const token = signToken({ userId: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  res.status(201).json({
    token,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, credits: balance, role: user.role, theme: user.theme },
  });
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken({ userId: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  res.json({
    token,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits, role: user.role, theme: user.theme },
  });
});

// Exchanges a still-valid refresh token for a new short-lived access token,
// rotating the refresh token itself so each one is single-use.
router.post("/refresh", validate(refreshSchema), async (req, res) => {
  const { refreshToken } = req.body;
  const record = await verifyRefreshToken(refreshToken);
  if (!record) return res.status(401).json({ error: "Refresh token is invalid, expired, or already used" });

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) return res.status(401).json({ error: "User no longer exists" });

  const token = signToken({ userId: user.id, role: user.role });
  const newRefreshToken = await rotateRefreshToken(refreshToken, user.id);

  res.json({ token, refreshToken: newRefreshToken });
});

router.post("/logout", validate(refreshSchema), async (req, res) => {
  await revokeRefreshToken(req.body.refreshToken);
  res.json({ success: true });
});

export default router;
