type Bucket = {
    count: number;
    resetAt: number;
};

type RateLimitInput = {
    key: string;
    limit: number;
    windowMs: number;
};

type RateLimitResult = {
    ok: boolean;
    remaining: number;
    retryAfterSeconds: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit({ key, limit, windowMs }: RateLimitInput): RateLimitResult {
    const now = Date.now();
    const active = buckets.get(key);

    if (!active || active.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return {
            ok: true,
            remaining: Math.max(limit - 1, 0),
            retryAfterSeconds: Math.ceil(windowMs / 1000),
        };
    }

    if (active.count >= limit) {
        return {
            ok: false,
            remaining: 0,
            retryAfterSeconds: Math.max(Math.ceil((active.resetAt - now) / 1000), 1),
        };
    }

    active.count += 1;

    return {
        ok: true,
        remaining: Math.max(limit - active.count, 0),
        retryAfterSeconds: Math.max(Math.ceil((active.resetAt - now) / 1000), 1),
    };
}