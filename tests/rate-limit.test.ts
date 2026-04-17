import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadLimiter() {
    vi.resetModules();
    return import("../src/lib/rate-limit");
}

describe("checkRateLimit", () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it("allows first request in a new window", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

        const { checkRateLimit } = await loadLimiter();
        const result = checkRateLimit({ key: "upload:user1", limit: 5, windowMs: 60_000 });

        expect(result.ok).toBe(true);
        expect(result.remaining).toBe(4);
        expect(result.retryAfterSeconds).toBe(60);
    });

    it("blocks requests after limit is reached within the same window", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

        const { checkRateLimit } = await loadLimiter();

        expect(checkRateLimit({ key: "files:user1", limit: 2, windowMs: 60_000 }).ok).toBe(true);
        expect(checkRateLimit({ key: "files:user1", limit: 2, windowMs: 60_000 }).ok).toBe(true);

        const blocked = checkRateLimit({ key: "files:user1", limit: 2, windowMs: 60_000 });
        expect(blocked.ok).toBe(false);
        expect(blocked.remaining).toBe(0);
        expect(blocked.retryAfterSeconds).toBe(60);
    });

    it("resets usage after the window expires", async () => {
        vi.useFakeTimers();
        const start = new Date("2026-01-01T00:00:00.000Z");
        vi.setSystemTime(start);

        const { checkRateLimit } = await loadLimiter();

        expect(checkRateLimit({ key: "delete:user1", limit: 1, windowMs: 10_000 }).ok).toBe(true);
        expect(checkRateLimit({ key: "delete:user1", limit: 1, windowMs: 10_000 }).ok).toBe(false);

        vi.setSystemTime(new Date(start.getTime() + 10_001));

        const afterReset = checkRateLimit({ key: "delete:user1", limit: 1, windowMs: 10_000 });
        expect(afterReset.ok).toBe(true);
        expect(afterReset.remaining).toBe(0);
        expect(afterReset.retryAfterSeconds).toBe(10);
    });
});
