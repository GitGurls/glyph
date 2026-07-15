import { Router } from "express";
import { requireApiKey, ApiKeyRequest } from "../middleware/apiKeyAuth";
import { rateLimit } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { generateSchema } from "../lib/schemas";
import { createGenerationJob } from "./generate.routes";
import { prisma } from "../lib/prisma";

const router = Router();

// Mounted at /v1 — this is what "API access for developers" actually means:
// an external caller with an API key hits the same queue + credits + moderation
// pipeline the web app uses, just authenticated differently.
router.post("/generate", requireApiKey, rateLimit(10, 60), validate(generateSchema), async (req: ApiKeyRequest, res) => {
  const { prompt, model } = req.body;
  await createGenerationJob(req.apiUser!.userId, prompt, model, res);
});

router.get("/jobs/:id", requireApiKey, async (req: ApiKeyRequest, res) => {
  const job = await prisma.image.findUnique({ where: { id: req.params.id } });
  if (!job || job.userId !== req.apiUser!.userId) return res.status(404).json({ error: "Job not found" });
  res.json({ job });
});

export default router;
