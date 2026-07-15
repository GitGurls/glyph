import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { roleUpdateSchema, moderationResolveSchema } from "../lib/schemas";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/stats", async (_req, res) => {
  const [totalUsers, totalJobs, completedJobs, flaggedJobs, byModel, creditsIssued, creditsSpent] =
    await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.image.count({ where: { status: "COMPLETED" } }),
      prisma.image.count({ where: { status: "FLAGGED" } }),
      prisma.image.groupBy({ by: ["model"], _count: { model: true } }),
      prisma.creditTransaction.aggregate({ _sum: { amount: true }, where: { amount: { gt: 0 } } }),
      prisma.creditTransaction.aggregate({ _sum: { amount: true }, where: { amount: { lt: 0 } } }),
    ]);

  // Jobs per day for the last 14 days — simple bucket count, good enough at this scale.
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const recentJobs = await prisma.image.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, model: true, cost: true },
  });

  const byDay: Record<string, number> = {};
  for (const job of recentJobs) {
    const day = job.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  }

  res.json({
    totalUsers,
    totalJobs,
    completedJobs,
    flaggedJobs,
    byModel: byModel.map((m: { model: string; _count: { model: number } }) => ({ model: m.model, count: m._count.model })),
    creditsIssued: creditsIssued._sum.amount || 0,
    creditsSpent: Math.abs(creditsSpent._sum.amount || 0),
    jobsByDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
  });
});

router.get("/moderation-queue", async (_req, res) => {
  const flagged = await prisma.image.findMany({
    where: { status: "FLAGGED" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });
  res.json({ flagged });
});

router.post("/moderation-queue/:id/resolve", validate(moderationResolveSchema), async (req, res) => {
  const { action } = req.body; // "approve" | "reject"
  const image = await prisma.image.update({
    where: { id: req.params.id },
    data: { status: action === "approve" ? "COMPLETED" : "FAILED", moderationFlag: null },
  });
  res.json({ image });
});

router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      credits: true,
      createdAt: true,
      _count: { select: { images: true } },
    },
  });
  res.json({ users });
});

router.patch("/users/:id/role", validate(roleUpdateSchema), async (req: AuthedRequest, res) => {
  const { role } = req.body;
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
  res.json({ user });
});

export default router;
