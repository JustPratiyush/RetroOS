import { Redis } from "@upstash/redis";

function getRedisUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
}

function getWriteToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
}

function getReadOnlyToken() {
  return (
    process.env.UPSTASH_REDIS_REST_READ_ONLY_TOKEN ||
    process.env.KV_REST_API_READ_ONLY_TOKEN ||
    getWriteToken()
  );
}

const clients = new Map();

export function getRedis(options = {}) {
  const { readOnly = false } = options;
  const key = readOnly ? "read" : "write";

  if (clients.has(key)) {
    return clients.get(key);
  }

  const url = getRedisUrl();
  const token = readOnly ? getReadOnlyToken() : getWriteToken();

  if (!url || !token) {
    throw new Error("Redis REST credentials are not configured.");
  }

  const client = new Redis({ url, token });
  clients.set(key, client);
  return client;
}
