import "dotenv/config";
import { Worker } from "bullmq";
import { redis, bullConnection } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { JobPayload } from "./services/queue.service";

// Runs as its own process (`npm run worker`), separate from the API server.
// Status updates go out over Redis pub/sub — the API server (in index.ts)
// subscribes to "job-updates" and re-broadcasts to the right client over
// Socket.IO. This is what lets you run multiple API server instances behind
// a load balancer and still have real-time updates reach the right browser.
async function publish(update: { imageId: string; userId: string; status: string; resultUrl?: string }) {
  await redis.publish("job-updates", JSON.stringify(update));
}

// Self-hosted models (object store, face-swap, video) live behind the backend
// per the architecture diagram — this mocks that call with a delay scaled to
// model type. Swap this function body for a real inference-server HTTP call.
async function callSelfHostedModel(model: string): Promise<{ url: string }> {
  const delay = model === "video" ? 6000 : model === "face-swap" ? 3500 : 2000;
  await new Promise((r) => setTimeout(r, delay));

  const seed = Math.floor(Math.random() * 1000);
  const url =
    model === "video"
      ? `https://picsum.photos/seed/${seed}/640/360`
      : `https://picsum.photos/seed/${seed}/512/512`;
  return { url };
}

const worker = new Worker<JobPayload, void, "generate">(
  "generation",
  async (job) => {
    const { imageId, userId, model } = job.data;

    await prisma.image.update({ where: { id: imageId }, data: { status: "PROCESSING" } });
    await publish({ imageId, userId, status: "PROCESSING" });

    const result = await callSelfHostedModel(model);

    const updated = await prisma.image.update({
      where: { id: imageId },
      data: { status: "COMPLETED", resultUrl: result.url },
    });
    await publish({ imageId, userId, status: "COMPLETED", resultUrl: updated.resultUrl ?? undefined });
  },
  { connection: bullConnection, concurrency: 5 }
);

worker.on("failed", async (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
  if (!job) return;
  if (job.attemptsMade === job.opts.attempts) {
    // Exhausted all retries — mark FAILED and let the frontend know. The job
    // itself stays in Redis (removeOnFail: false) for later inspection.
    await prisma.image.update({ where: { id: job.data.imageId }, data: { status: "FAILED" } });
    await publish({ imageId: job.data.imageId, userId: job.data.userId, status: "FAILED" });
  }
});

console.log("GLYPH worker listening for generation jobs…");
