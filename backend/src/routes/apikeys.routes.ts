import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { apiKeyCreateSchema } from "../lib/schemas";

const router = Router();

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ keys });
});

router.post("/", requireAuth, validate(apiKeyCreateSchema), async (req: AuthedRequest, res) => {
  const { label } = req.body;
  const key = `glyph_sk_${nanoid(32)}`;
  const created = await prisma.apiKey.create({
    data: { userId: req.user!.userId, key, label: label || "Untitled key" },
  });
  res.status(201).json({ key: created }); // full key value only ever returned once, on creation
});

router.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
  if (!key || key.userId !== req.user!.userId) return res.status(404).json({ error: "Key not found" });

  await prisma.apiKey.update({ where: { id: key.id }, data: { revoked: true } });
  res.json({ success: true });
});

export default router;
