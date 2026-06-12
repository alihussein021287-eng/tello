import Redis from "ioredis"

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

// Cache AI responses to save API cost
export async function cachedAI<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key).catch(() => null)
  if (cached) return JSON.parse(cached) as T

  const result = await fn()
  await redis.setex(key, ttlSeconds, JSON.stringify(result)).catch(() => {})
  return result
}

// Invalidate cache by pattern
export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern).catch(() => [])
  if (keys.length) await redis.del(...keys).catch(() => {})
}
