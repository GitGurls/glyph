import { Router } from "express";
import express from "express";
import Stripe from "stripe";
import { adjustCredits } from "../services/credits.service";

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Stripe webhooks must receive the raw request body (not JSON-parsed) to
// verify the signature — this is why this route uses express.raw() instead
// of the global express.json() applied in index.ts.
router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: "Stripe webhook not configured in this environment" });
  }

  const signature = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    // This is the security-critical step: without verifying the signature,
    // anyone could POST a fake "payment succeeded" event and grant themselves
    // free credits. Never trust webhook payloads that aren't verified like this.
    event = stripe.webhooks.constructEvent(req.body, signature as string, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[stripe webhook] signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, creditsGranted } = session.metadata || {};
    if (userId && creditsGranted) {
      await adjustCredits(userId, Number(creditsGranted), "purchase");
    }
  }

  res.json({ received: true });
});

export default router;
