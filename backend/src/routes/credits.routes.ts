import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { checkoutSchema } from "../lib/schemas";
import { adjustCredits } from "../services/credits.service";

const router = Router();

const CREDIT_PACKS: Record<string, { credits: number; priceUsd: number }> = {
  starter: { credits: 100, priceUsd: 5 },
  pro: { credits: 500, priceUsd: 20 },
  studio: { credits: 1500, priceUsd: 50 },
};

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

router.get("/balance", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  res.json({ credits: user?.credits ?? 0 });
});

router.get("/history", requireAuth, async (req: AuthedRequest, res) => {
  const transactions = await prisma.creditTransaction.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ transactions });
});

router.get("/packs", (_req, res) => res.json({ packs: CREDIT_PACKS }));

// With STRIPE_SECRET_KEY set (free to get — Stripe test mode requires no real
// business or card), this creates a real Checkout Session and credits are only
// ever granted after the webhook confirms payment (see webhook.routes.ts).
// Without a key, credits are granted immediately so the demo works standalone.
router.post("/checkout", requireAuth, validate(checkoutSchema), async (req: AuthedRequest, res) => {
  const { pack } = req.body;
  const selected = CREDIT_PACKS[pack];

  if (!stripe) {
    const balance = await adjustCredits(req.user!.userId, selected.credits, "purchase");
    return res.json({ mode: "mock", creditsGranted: selected.credits, creditsRemaining: balance });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${pack} credit pack (${selected.credits} credits)` },
          unit_amount: selected.priceUsd * 100,
        },
        quantity: 1,
      },
    ],
    metadata: { userId: req.user!.userId, creditsGranted: String(selected.credits) },
    success_url: `${process.env.CLIENT_URL}/pricing?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
  });

  res.json({ mode: "stripe", url: session.url });
});

export default router;
