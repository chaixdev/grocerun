import { LRUCache } from "lru-cache"

type RateLimitOptions = {
    uniqueTokenPerInterval?: number
    interval?: number
}

export function rateLimit(options?: RateLimitOptions) {
    const tokenCache = new LRUCache<string, number[]>({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    })

    return {
        check: (limit: number, token: string) => {
            const tokenCount = tokenCache.get(token) || [0]
            if (tokenCount[0] === 0) {
                tokenCache.set(token, tokenCount)
            }
            tokenCount[0] += 1

            const currentUsage = tokenCount[0]
            const isRateLimited = currentUsage > limit

            return {
                isRateLimited,
                limit,
                remaining: isRateLimited ? 0 : limit - currentUsage,
            }
        },
    }
}
