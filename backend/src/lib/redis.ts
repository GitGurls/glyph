import IORedis from "ioredis";

// One connection, used directly for pub/sub and rate limiting.
export const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// BullMQ bundles its own ioredis internally and is picky about type identity
// when handed an existing client instance, so Queue/Worker get plain
// connection options instead — same Redis server, no version clash.
const url = new URL(process.env.REDIS_URL || "redis://localhost:6379");
export const bullConnection = {
  host: url.hostname,
  port: Number(url.port || 6379),
  password: url.password || undefined,
};
