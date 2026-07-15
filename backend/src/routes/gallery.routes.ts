import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { collectionCreateSchema } from "../lib/schemas";

const router = Router();

// Public gallery — no auth required. Simple contains-based search on prompt text;
// swap for Postgres full-text search (tsvector) or Elasticsearch once volume justifies it.
router.get("/public", async (req, res) => {
  const { q, model } = req.query;
  const jobs = await prisma.image.findMany({
    where: {
      isPublic: true,
      status: "COMPLETED",
      ...(q ? { prompt: { contains: String(q) } } : {}),
      ...(model ? { model: String(model) } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { user: { select: { name: true, email: true } } },
  });
  res.json({ jobs });
});

router.get("/favorites", requireAuth, async (req: AuthedRequest, res) => {
  const jobs = await prisma.image.findMany({
    where: { userId: req.user!.userId, isFavorite: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ jobs });
});

// ── Collections (albums) ────────────────────────────────────────────────
router.get("/collections", requireAuth, async (req: AuthedRequest, res) => {
  const collections = await prisma.collection.findMany({
    where: { userId: req.user!.userId },
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ collections });
});

router.post("/collections", requireAuth, validate(collectionCreateSchema), async (req: AuthedRequest, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Collection name is required" });
  const collection = await prisma.collection.create({ data: { name, userId: req.user!.userId } });
  res.status(201).json({ collection });
});

router.delete("/collections/:id", requireAuth, async (req: AuthedRequest, res) => {
  const collection = await prisma.collection.findUnique({ where: { id: req.params.id } });
  if (!collection || collection.userId !== req.user!.userId) {
    return res.status(404).json({ error: "Collection not found" });
  }
  await prisma.collection.delete({ where: { id: collection.id } });
  res.json({ success: true });
});

// ── Prompt templates ────────────────────────────────────────────────────
router.get("/templates", async (_req, res) => {
  const templates = await prisma.promptTemplate.findMany({ orderBy: { category: "asc" } });
  res.json({ templates });
});

export default router;
