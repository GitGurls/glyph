import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { generateSchema, enhanceSchema, collectionAssignSchema } from "../lib/schemas";
import { adjustCredits, MODEL_COSTS } from "../services/credits.service";
import { moderatePrompt } from "../services/moderation.service";
import { enhancePrompt } from "../services/promptEnhancer.service";
import { enqueueJob } from "../services/queue.service";

const router = Router();

// Shared core so both the browser (JWT) and developer API (x-api-key) hit the
// exact same generation + credits + queue path. Body shape is already
// guaranteed by Zod (validate middleware) by the time this runs.
export async function createGenerationJob(userId: string, prompt: string, model: string, res: Response) {
  const cost = MODEL_COSTS[model];

  const moderation = moderatePrompt(prompt);
  if (moderation.flagged) {
    return res.status(422).json({ error: "Prompt failed content moderation", reason: moderation.reason });
  }

  let balance: number;
  try {
    balance = await adjustCredits(userId, -cost, "generation");
  } catch {
    return res.status(402).json({ error: "Not enough credits", required: cost });
  }

  const image = await prisma.image.create({
    data: { userId, prompt, model, cost, status: "QUEUED" },
  });

  await enqueueJob({ imageId: image.id, userId, model, prompt });

  return res.status(202).json({ job: image, creditsRemaining: balance });
}

// ── Browser-facing (JWT) ────────────────────────────────────────────────
router.post("/", requireAuth, rateLimit(20, 60), validate(generateSchema), async (req: AuthedRequest, res) => {
  const { prompt, model } = req.body;
  await createGenerationJob(req.user!.userId, prompt, model, res);
});

router.post("/enhance", requireAuth, rateLimit(30, 60), validate(enhanceSchema), async (req: AuthedRequest, res) => {
  const { prompt } = req.body;
  const enhanced = await enhancePrompt(prompt);
  res.json({ enhanced });
});

router.get("/jobs", requireAuth, async (req: AuthedRequest, res) => {
  const jobs = await prisma.image.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ jobs });
});

router.patch("/jobs/:id/favorite", requireAuth, async (req: AuthedRequest, res) => {
  const job = await prisma.image.findUnique({ where: { id: req.params.id } });
  if (!job || job.userId !== req.user!.userId) return res.status(404).json({ error: "Job not found" });

  const updated = await prisma.image.update({
    where: { id: job.id },
    data: { isFavorite: !job.isFavorite },
  });
  res.json({ job: updated });
});

router.patch("/jobs/:id/visibility", requireAuth, async (req: AuthedRequest, res) => {
  const job = await prisma.image.findUnique({ where: { id: req.params.id } });
  if (!job || job.userId !== req.user!.userId) return res.status(404).json({ error: "Job not found" });

  const updated = await prisma.image.update({
    where: { id: job.id },
    data: { isPublic: !job.isPublic },
  });
  res.json({ job: updated });
});

router.patch("/jobs/:id/collection", requireAuth, validate(collectionAssignSchema), async (req: AuthedRequest, res) => {
  const { collectionId } = req.body;
  const job = await prisma.image.findUnique({ where: { id: req.params.id } });
  if (!job || job.userId !== req.user!.userId) return res.status(404).json({ error: "Job not found" });

  const updated = await prisma.image.update({
    where: { id: job.id },
    data: { collectionId: collectionId || null },
  });
  res.json({ job: updated });
});

export default router;
