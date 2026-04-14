type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export const withTtlCache = async <T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
): Promise<T> => {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const value = await producer();
  cache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });

  return value;
};

export const clearCache = (): void => {
  cache.clear();
};
