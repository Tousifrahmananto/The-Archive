import { put } from "@vercel/blob/client";
import { looksLikePdf, MAX_PDF_SIZE_BYTES } from "./pdf-upload";

export async function uploadPdfDirect(file: File, label: string, accessToken: string, signal: AbortSignal, onProgress: (percentage: number) => void = () => {}) {
    if (file.size <= 0 || file.size > MAX_PDF_SIZE_BYTES) {
        throw new Error("PDF must be non-empty and 20MB or smaller.");
    }
    if (!looksLikePdf(new Uint8Array(await file.slice(0, 5).arrayBuffer()))) {
        throw new Error("Invalid PDF signature.");
    }
    async function uploadRequest(body: object) {
        const response = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.any([signal, AbortSignal.timeout(120_000)]),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result) throw new Error(result?.error ?? "Upload failed. Please retry.");
        return result;
    }
    const prepared = await uploadRequest({ action: "prepare", name: file.name, type: file.type, size: file.size, label });
    onProgress(10);
    if (prepared.mode === "blob") {
        await put(prepared.pathname, file.slice(0, file.size, "application/pdf"), {
            access: "public",
            token: prepared.token,
            contentType: "application/pdf",
            abortSignal: signal,
            onUploadProgress: ({ percentage }) => onProgress(10 + Math.round(percentage * 0.8)),
        });
    } else {
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const abort = () => xhr.abort();
            const finish = (error?: Error) => {
                signal.removeEventListener("abort", abort);
                if (error) reject(error);
                else resolve();
            };
            xhr.open("PUT", prepared.signedUrl);
            xhr.timeout = 180_000;
            xhr.setRequestHeader("Content-Type", "application/pdf");
            xhr.setRequestHeader("x-upsert", "false");
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) onProgress(10 + Math.round(event.loaded / event.total * 80));
            };
            xhr.onload = () => finish(xhr.status >= 200 && xhr.status < 300 ? undefined : new Error("Storage upload failed. Please retry."));
            xhr.onerror = () => finish(new Error("Could not reach PDF storage. Check your connection and retry."));
            xhr.ontimeout = () => finish(new Error("Upload timed out after 3 minutes. Please retry."));
            xhr.onabort = () => finish(new DOMException("Upload canceled.", "AbortError"));
            if (signal.aborted) {
                finish(new DOMException("Upload canceled.", "AbortError"));
                return;
            }
            signal.addEventListener("abort", abort, { once: true });
            xhr.send(file);
        });
    }
    onProgress(95);
    await uploadRequest({ action: "complete", pathname: prepared.pathname });
}
