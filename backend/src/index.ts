import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import IORedis from "ioredis";
import { verifyToken } from "./lib/jwt";
import { redis } from "./lib/redis";

import authRoutes from "./routes/auth.routes";
import generateRoutes from "./routes/generate.routes";
import galleryRoutes from "./routes/gallery.routes";
import creditsRoutes from "./routes/credits.routes";
import apiKeyRoutes from "./routes/apikeys.routes";
import adminRoutes from "./routes/admin.routes";
import webhookRoutes from "./routes/webhook.routes";
import devApiRoutes from "./routes/devApi.routes";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
});

// Clients join a room keyed by their own userId right after connecting, so job
// updates only ever reach the user who owns that job.
io.on("connection", (socket) => {
  socket.on("auth", (token: string) => {
    try {
      const { userId } = verifyToken(token);
      socket.join(userId);
    } catch {
      socket.disconnect();
    }
  });
});

// The worker process (worker.ts) runs separately and publishes job status to
// Redis instead of holding a socket connection itself — this subscriber is
// what bridges "job finished in the worker" back to "push to the right browser".
// A dedicated subscriber connection is required — ioredis can't pub and sub
// on the same connection used for normal commands.
const subscriber = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");
subscriber.subscribe("job-updates");
subscriber.on("message", (_channel, message) => {
  try {
    const update = JSON.parse(message);
    io.to(update.userId).emit("job:update", update);
  } catch (err) {
    console.error("[pubsub] bad message", err);
  }
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

// Mounted before express.json() on purpose: Stripe webhook signature
// verification needs the raw, unparsed request body (see webhook.routes.ts).
app.use("/webhooks", webhookRoutes);

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/credits", creditsRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/v1", devApiRoutes); // public developer API, authenticated via x-api-key

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`GLYPH backend running at http://localhost:${PORT}`);
});
