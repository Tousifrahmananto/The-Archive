import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadPdfDirect } from "../src/lib/upload-pdf-client";
import { MAX_PDF_SIZE_BYTES } from "../src/lib/pdf-upload";

vi.mock("@vercel/blob/client", () => ({ put: vi.fn().mockResolvedValue({}) }));
import { put } from "@vercel/blob/client";

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

function pdf(size = 6 * 1024 * 1024) {
    return new File(["%PDF-", new Uint8Array(size - 5)], "large.pdf", { type: "application/pdf" });
}

function mockStorageUpload(status = 200) {
    const xhr = {
        open: vi.fn(), setRequestHeader: vi.fn(), send: vi.fn(), abort: vi.fn(),
        status, timeout: 0,
        upload: { onprogress: null as ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null },
        onload: null as (() => void) | null, onerror: null as (() => void) | null,
        ontimeout: null as (() => void) | null, onabort: null as (() => void) | null,
    };
    xhr.send.mockImplementation(() => {
        xhr.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 2 });
        xhr.onload?.();
    });
    xhr.abort.mockImplementation(() => xhr.onabort?.());
    vi.stubGlobal("XMLHttpRequest", class { constructor() { return xhr; } });
    return xhr;
}

describe("direct PDF uploads", () => {
    it("sends a PDF larger than Vercel's limit to Blob, with only metadata going through the API", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(Response.json({ mode: "blob", pathname: "user/test.pdf.pending", token: "scoped-token" }))
            .mockResolvedValueOnce(Response.json({ ok: true }));
        vi.stubGlobal("fetch", fetchMock);
        const signal = new AbortController().signal;
        await uploadPdfDirect(pdf(), "Report", "session", signal);
        expect(put).toHaveBeenCalledWith("user/test.pdf.pending", expect.any(Blob), expect.objectContaining({ token: "scoped-token", abortSignal: signal }));
        expect(fetchMock).toHaveBeenCalledTimes(2);
        for (const [url, options] of fetchMock.mock.calls) {
            expect(url).toBe("/api/upload");
            expect(options.body.length).toBeLessThan(1024);
            expect(options.headers.Authorization).toBe("Bearer session");
        }
        expect(JSON.parse(fetchMock.mock.calls[1][1].body).action).toBe("complete");
    });

    it("sends Supabase bytes to its signed URL and then completes the upload", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(Response.json({ mode: "supabase", pathname: "user/test.pdf.pending", signedUrl: "https://storage.example/signed" }))
            .mockResolvedValueOnce(Response.json({ ok: true }));
        vi.stubGlobal("fetch", fetchMock);
        const xhr = mockStorageUpload();
        const progress = vi.fn();
        const file = pdf();
        await uploadPdfDirect(file, "", "session", new AbortController().signal, progress);
        expect(xhr.open).toHaveBeenCalledWith("PUT", "https://storage.example/signed");
        expect(xhr.send).toHaveBeenCalledWith(file);
        expect(progress.mock.calls.map(([percentage]) => percentage)).toEqual([10, 50, 95]);
        expect(JSON.parse(fetchMock.mock.calls[1][1].body).action).toBe("complete");
        expect(put).not.toHaveBeenCalled();
    });

    it.each(["error", "timeout", "abort", "HTTP"])("reports storage %s without finalizing an unfinished upload", async (failure) => {
        const fetchMock = vi.fn().mockResolvedValue(Response.json({ mode: "supabase", pathname: "user/test.pdf.pending", signedUrl: "https://storage.example/signed" }));
        vi.stubGlobal("fetch", fetchMock);
        const xhr = mockStorageUpload(500);
        const controller = new AbortController();
        xhr.send.mockImplementation(() => {
            if (failure === "error") xhr.onerror?.();
            else if (failure === "timeout") xhr.ontimeout?.();
            else if (failure === "abort") controller.abort();
            else xhr.onload?.();
        });
        await expect(uploadPdfDirect(pdf(10), "", "session", controller.signal)).rejects.toThrow();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(xhr.timeout).toBe(180_000);
    });

    it("rejects oversized and fake PDFs before requesting credentials", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const signal = new AbortController().signal;
        await expect(uploadPdfDirect(pdf(MAX_PDF_SIZE_BYTES + 1), "", "session", signal)).rejects.toThrow("20MB");
        await expect(uploadPdfDirect(new File(["fake PDF"], "fake.pdf"), "", "session", signal)).rejects.toThrow("signature");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("stops when authentication fails or the server returns a non-JSON error", async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ error: "Unauthorized" }, { status: 401 }))
            .mockResolvedValueOnce(new Response("Request Entity Too Large", { status: 413 }));
        vi.stubGlobal("fetch", fetchMock);
        await expect(uploadPdfDirect(pdf(10), "", "expired", new AbortController().signal)).rejects.toThrow("Unauthorized");
        await expect(uploadPdfDirect(pdf(10), "", "session", new AbortController().signal)).rejects.toThrow("Upload failed");
        expect(put).not.toHaveBeenCalled();
    });
});
