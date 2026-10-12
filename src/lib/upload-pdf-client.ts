import { put } from "@vercel/blob/client";
import { looksLikePdf, MAX_PDF_SIZE_BYTES } from "./pdf-upload";

export async function uploadPdfDirect(file: File, label: string, accessToken: string, signal: AbortSignal) {
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
            signal,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result) throw new Error(result?.error ?? "Upload failed. Please retry.");
        return result;
    }
    const prepared = await uploadRequest({ action: "prepare", name: file.name, type: file.type, size: file.size, label });
    if (prepared.mode === "blob") {
        await put(prepared.pathname, file.slice(0, file.size, "application/pdf"), {
            access: "public",
            token: prepared.token,
            contentType: "application/pdf",
            abortSignal: signal,
        });
    } else {
        const response = await fetch(prepared.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/pdf", "x-upsert": "false" },
            body: file,
            signal,
        });
        if (!response.ok) throw new Error("Storage upload failed. Please retry.");
    }
    await uploadRequest({ action: "complete", pathname: prepared.pathname });
}
