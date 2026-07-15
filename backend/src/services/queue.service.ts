import { Queue } from "bullmq";
import { bullConnection } from "../lib/redis";

// ─────────────────────────────────────────────────────────────────────────────
// Real job queue now — persistent in Redis, survives a server restart, with
// automatic retries and a dead-letter queue for jobs that fail repeatedly.
// The actual work happens in worker.ts, run as its own process:
//
//   npm run dev      → API server (enqueues jobs, never runs them)
//   npm run worker    → picks jobs off the queue and processes them
//
// This split is what stops a burst of generation traffic from blocking the
// API's event loop — the thing an in-memory queue could never give you.
// ─────────────────────────────────────────────────────────────────────────────

export interface JobPayload {
  imageId: string;
  userId: string;
  model: string;
  prompt: string;
}

export const generationQueue = new Queue<JobPayload, void, "generate">("generation", {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500 },
    // Failed jobs (after all retries) stay in Redis instead of vanishing —
    // this *is* the dead-letter queue; inspect it with queue.getFailed().
    removeOnFail: false,
  },
});

export async function enqueueJob(payload: JobPayload) {
  await generationQueue.add("generate", payload);
}
