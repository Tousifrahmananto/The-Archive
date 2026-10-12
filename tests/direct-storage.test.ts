import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ head: vi.fn(), copy: vi.fn(), del: vi.fn(), token: vi.fn(), bucket: {
    info: vi.fn(), createSignedUrl: vi.fn(), createSignedUploadUrl: vi.fn(), move: vi.fn(), remove: vi.fn(), getPublicUrl: vi.fn(),
} }));
vi.mock("@vercel/blob", () => ({ head: mocks.head, copy: mocks.copy, del: mocks.del, list: vi.fn(), put: vi.fn() }));
vi.mock("@vercel/blob/client", () => ({ generateClientTokenFromReadWriteToken: mocks.token }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ storage: { from: () => mocks.bucket } }) }));

const path = "user/report-1234567890.pdf.pending";
beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-store-token");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    mocks.head.mockResolvedValue({ size: 6 * 1024 * 1024, url: "https://store.public.blob.vercel-storage.com/" + path });
    mocks.copy.mockResolvedValue({ url: "https://store.public.blob.vercel-storage.com/user/report.pdf" });
    mocks.del.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("%PDF-", { status: 206 })));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetAllMocks(); });

describe("direct storage validation", () => {
    it("issues a restricted, expiring Blob token for a user-scoped staging path", async () => {
        mocks.token.mockResolvedValue("upload-token");
        const { preparePdfUpload } = await import("../src/lib/storage");
        const prepared = await preparePdfUpload("user", "report.pdf");
        expect(prepared.pathname).toMatch(/^user\/report-[a-f0-9]{32}\.pdf\.pending$/);
        expect(mocks.token).toHaveBeenCalledWith(expect.objectContaining({
            pathname: prepared.pathname, maximumSizeInBytes: 20 * 1024 * 1024,
            allowedContentTypes: ["application/pdf"], allowOverwrite: false, addRandomSuffix: false,
        }));
        expect(mocks.token.mock.calls[0][0].validUntil).toBeGreaterThan(Date.now());
    });

    it("rejects another user's path and traversal before contacting storage", async () => {
        const { completePdfUpload } = await import("../src/lib/storage");
        for (const invalid of ["other/report.pdf.pending", "user/../other.pdf.pending", "user/report.pdf", "user/https://evil.test/a.pdf.pending"]) {
            await expect(completePdfUpload("user", invalid)).rejects.toThrow("Invalid upload path");
        }
        expect(mocks.head).not.toHaveBeenCalled();
    });

    it("validates stored bytes before making the file visible in the library", async () => {
        const { completePdfUpload } = await import("../src/lib/storage");
        const result = await completePdfUpload("user", path);
        expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { Range: "bytes=0-4" } }));
        expect(mocks.copy).toHaveBeenCalledWith(expect.any(String), "user/report-1234567890.pdf", expect.objectContaining({ addRandomSuffix: false }));
        expect(mocks.del).toHaveBeenCalled();
        expect(result.pathname).toBe("user/report-1234567890.pdf");
    });

    it("deletes invalid or oversized stored files without publishing them", async () => {
        const { completePdfUpload } = await import("../src/lib/storage");
        vi.mocked(fetch).mockResolvedValueOnce(new Response("wrong", { status: 206 }));
        await expect(completePdfUpload("user", path)).rejects.toThrow("signature");
        mocks.head.mockResolvedValueOnce({ size: 21 * 1024 * 1024, url: "https://store.public.blob.vercel-storage.com/" + path });
        await expect(completePdfUpload("user", path)).rejects.toThrow("20MB");
        expect(mocks.del).toHaveBeenCalledTimes(2);
        expect(mocks.copy).not.toHaveBeenCalled();
    });

    it("uses signed Supabase uploads and validates before moving to the final path", async () => {
        vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
        mocks.bucket.createSignedUploadUrl.mockResolvedValue({ data: { signedUrl: "https://test.supabase.co/signed" }, error: null });
        mocks.bucket.info.mockResolvedValue({ data: { size: 6 * 1024 * 1024 }, error: null });
        mocks.bucket.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://test.supabase.co/read" }, error: null });
        mocks.bucket.move.mockResolvedValue({ error: null });
        mocks.bucket.getPublicUrl.mockReturnValue({ data: { publicUrl: "https://test.supabase.co/report.pdf" } });
        const { preparePdfUpload, completePdfUpload } = await import("../src/lib/storage");
        expect((await preparePdfUpload("user", "report.pdf")).mode).toBe("supabase");
        expect(mocks.token).not.toHaveBeenCalled();
        await completePdfUpload("user", path);
        expect(mocks.bucket.move).toHaveBeenCalledWith(path, "user/report-1234567890.pdf");
        expect(mocks.copy).not.toHaveBeenCalled();
    });
});
