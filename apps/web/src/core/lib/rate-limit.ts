type RateLimitOptions = {
    uniqueTokenPerInterval?: number
    interval?: number
}

export function rateLimit(options?: RateLimitOptions) {
    const maxEntries = options?.uniqueTokenPerInterval || 500
    const interval = options?.interval || 60000
    const tokenCache = new Map<string, { count: number; expiresAt: number }>()

    return {
        check: (limit: number, token: string) => {
            const now = Date.now()

            // Cheap expired-entry cleanup.
            for (const [key, value] of tokenCache) {
                if (value.expiresAt <= now) {
                    tokenCache.delete(key)
                }
            }

            let entry = tokenCache.get(token)
            if (!entry || entry.expiresAt <= now) {
                entry = { count: 0, expiresAt: now + interval }
            }

            entry.count += 1
            tokenCache.set(token, entry)

            // Bound memory with oldest-entry eviction.
            if (tokenCache.size > maxEntries) {
                const oldestKey = tokenCache.keys().next().value
                if (oldestKey) tokenCache.delete(oldestKey)
            }

            const currentUsage = entry.count
            const isRateLimited = currentUsage > limit

            return {
                isRateLimited,
                limit,
                remaining: isRateLimited ? 0 : limit - currentUsage,
            }
        },
    }
}
