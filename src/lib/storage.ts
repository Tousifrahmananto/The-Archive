import { list, put, del, head, copy } from "@vercel/blob";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { looksLikePdf, MAX_PDF_SIZE_BYTES } from "./pdf-upload";

type StoredFile = {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: string;
    displayName: string;
};

type UploadParams = {
    userId: string;
    safeName: string;
    file: File;
};

type DeleteParams = {
    userId: string;
    url?: string;
    pathname?: string;
};

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseStorageBucket = process.env.SUPABASE_STORAGE_BUCKET ?? "pdfs";

function normalizeObjectPath(path: string): string {
    return decodeURIComponent(path)
        .replace(/\\/g, "/")
        .replace(/^\/+/, "")
        .trim();
}

function isUserScopedPath(path: string, userId: string): boolean {
    return path.startsWith(`${userId}/`) && !path.includes("../") && !path.includes("..\\");
}

function isTrustedBlobHost(hostname: string): boolean {
    return (
        hostname === "blob.vercel-storage.com" ||
        hostname.endsWith(".blob.vercel-storage.com") ||
        hostname.endsWith(".public.blob.vercel-storage.com")
    );
}

function toDisplayNameFromPath(pathname: string): string {
    const rawFileName = decodeURIComponent(pathname.split("/").pop() ?? pathname);
    const withoutExt = rawFileName.replace(/\.pdf$/i, "");
    const withoutTimestamp = withoutExt.replace(/^\d{10,}-/, "");
    const withoutRandomSuffix = withoutTimestamp.replace(/[-_][a-zA-Z0-9]{10,}$/, "");
    const readable = withoutRandomSuffix.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

    return readable || "Untitled document";
}

function getStorageMode(): "blob" | "supabase" | null {
    if (supabaseUrl && supabaseServiceRoleKey) {
        return "supabase";
    }

    if (blobToken) {
        return "blob";
    }

    return null;
}

function getSupabaseAdminClient() {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        global: {
            fetch: (input, init) => fetch(input, {
                ...init,
                signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(15_000)]),
            }),
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

function getPublicSupabaseObjectPath(url: string): string | null {
    try {
        const pathname = new URL(url).pathname;
        const marker = `/storage/v1/object/public/${supabaseStorageBucket}/`;
        const index = pathname.indexOf(marker);

        if (index === -1) {
            return null;
        }

        return decodeURIComponent(pathname.slice(index + marker.length));
    } catch {
        return null;
    }
}

export function getStorageSetupError(): string | null {
    const mode = getStorageMode();

    if (mode) {
        return null;
    }

    return "No storage backend configured. Set BLOB_READ_WRITE_TOKEN or configure NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (+ optional SUPABASE_STORAGE_BUCKET).";
}

export async function uploadPdf({ userId, safeName, file }: UploadParams): Promise<StoredFile> {
    const mode = getStorageMode();

    if (mode === "blob") {
        const blobPath = `${userId}/${safeName}`;
        const blob = await put(blobPath, file, {
            access: "public",
            addRandomSuffix: true,
            token: blobToken,
        });

        return {
            url: blob.url,
            pathname: blob.pathname,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            displayName: toDisplayNameFromPath(blob.pathname),
        };
    }

    if (mode === "supabase") {
        const supabase = getSupabaseAdminClient();
        const pathname = `${userId}/${Date.now()}-${safeName}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
            .from(supabaseStorageBucket)
            .upload(pathname, buffer, {
                contentType: file.type || "application/pdf",
                upsert: false,
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        const { data } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(pathname);

        return {
            url: data.publicUrl,
            pathname,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            displayName: toDisplayNameFromPath(pathname),
        };
    }

    throw new Error(getStorageSetupError() || "No storage backend configured.");
}

export async function preparePdfUpload(userId: string, safeName: string) {
    // shortcut: abandoned .pending uploads remain in storage; add expiry cleanup if they accumulate.
    const pathname = `${userId}/${safeName.replace(/\.pdf$/i, "")}-${randomUUID().replace(/-/g, "")}.pdf.pending`;
    if (getStorageMode() === "blob") {
        const token = await generateClientTokenFromReadWriteToken({
            token: blobToken,
            pathname,
            allowedContentTypes: ["application/pdf"],
            maximumSizeInBytes: MAX_PDF_SIZE_BYTES,
            validUntil: Date.now() + 10 * 60_000,
            addRandomSuffix: false,
            allowOverwrite: false,
        });
        return { mode: "blob" as const, pathname, token };
    }
    const { data, error } = await getSupabaseAdminClient().storage
        .from(supabaseStorageBucket).createSignedUploadUrl(pathname, { upsert: false });
    if (error) throw new Error(error.message);
    return { mode: "supabase" as const, pathname, signedUrl: data.signedUrl };
}

export async function completePdfUpload(userId: string, pathname: string): Promise<StoredFile> {
    if (!pathname.startsWith(`${userId}/`) ||
        !/^[a-zA-Z0-9._-]+\.pdf\.pending$/.test(pathname.slice(userId.length + 1))) {
        throw new Error("Invalid upload path.");
    }
    const mode = getStorageMode();
    const bucket = mode === "supabase" ? getSupabaseAdminClient().storage.from(supabaseStorageBucket) : null;
    let url: string;
    let size: number;
    if (bucket) {
        const { data, error } = await bucket.info(pathname);
        if (error) throw new Error(error.message);
        size = data.size ?? 0;
        const signed = await bucket.createSignedUrl(pathname, 60);
        if (signed.error) throw new Error(signed.error.message);
        url = signed.data.signedUrl;
    } else {
        const blob = await head(pathname, { token: blobToken });
        url = blob.url;
        size = blob.size;
    }
    async function removePending() {
        if (bucket) {
            const { error } = await bucket.remove([pathname]);
            if (error) throw new Error(error.message);
        } else {
            await del(url, { token: blobToken });
        }
    }
    if (size <= 0 || size > MAX_PDF_SIZE_BYTES) {
        await removePending();
        throw new Error("PDF must be non-empty and 20MB or smaller.");
    }
    const verificationController = new AbortController();
    const response = await fetch(url, {
        headers: { Range: "bytes=0-4" }, cache: "no-store", redirect: "error",
        signal: AbortSignal.any([verificationController.signal, AbortSignal.timeout(15_000)]),
    });
    if (!response.ok || !response.body) throw new Error("Could not verify uploaded PDF.");
    const reader = response.body.getReader();
    const signature = new Uint8Array(5);
    let count = 0;
    try {
        while (count < 5) {
            const { done, value } = await reader.read();
            if (done) break;
            const part = value.subarray(0, 5 - count);
            signature.set(part, count);
            count += part.length;
        }
    } finally {
        // Next.js tees fetch responses; awaiting cancellation can wait forever for its other branch.
        verificationController.abort();
        void reader.cancel().catch(() => {});
    }
    if (!looksLikePdf(signature)) {
        await removePending();
        throw new Error("Invalid PDF signature.");
    }
    // Pending files stay out of the library until server-side validation passes.
    const finalPath = pathname.slice(0, -".pending".length);
    if (bucket) {
        const { error } = await bucket.move(pathname, finalPath);
        if (error) throw new Error(error.message);
        url = bucket.getPublicUrl(finalPath).data.publicUrl;
    } else {
        const blob = await copy(url, finalPath, { access: "public", contentType: "application/pdf", addRandomSuffix: false, token: blobToken });
        await removePending();
        url = blob.url;
    }
    return { url, pathname: finalPath, size, uploadedAt: new Date().toISOString(), displayName: toDisplayNameFromPath(finalPath) };
}

export async function listPdfs(userId: string): Promise<StoredFile[]> {
    const mode = getStorageMode();

    if (mode === "blob") {
        const { blobs } = await list({ token: blobToken, prefix: `${userId}/` });

        return blobs
            .filter((blob) => blob.pathname.toLowerCase().endsWith(".pdf"))
            .map((blob) => ({
                url: blob.url,
                pathname: blob.pathname,
                size: blob.size,
                uploadedAt: new Date(blob.uploadedAt).toISOString(),
                displayName: toDisplayNameFromPath(blob.pathname),
            }))
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    }

    if (mode === "supabase") {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase.storage.from(supabaseStorageBucket).list(userId, {
            limit: 100,
            sortBy: { column: "created_at", order: "desc" },
        });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? [])
            .filter((item) => item.name.toLowerCase().endsWith(".pdf"))
            .map((item) => {
                const pathname = `${userId}/${item.name}`;
                const { data: publicData } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(pathname);

                return {
                    url: publicData.publicUrl,
                    pathname,
                    size: Number(item.metadata?.size ?? 0),
                    uploadedAt: item.created_at ?? item.updated_at ?? new Date().toISOString(),
                    displayName: toDisplayNameFromPath(pathname),
                };
            });
    }

    throw new Error(getStorageSetupError() || "No storage backend configured.");
}

export async function deletePdf({ userId, url, pathname }: DeleteParams): Promise<void> {
    const mode = getStorageMode();

    if (mode === "blob") {
        if (!url) {
            throw new Error("Missing file URL.");
        }

        let parsed: URL;

        try {
            parsed = new URL(url);
        } catch {
            throw new Error("Invalid file URL.");
        }

        if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || !isTrustedBlobHost(parsed.hostname)) {
            throw new Error("Forbidden. Cannot delete this file.");
        }

        const urlPath = normalizeObjectPath(parsed.pathname);

        if (!isUserScopedPath(urlPath, userId)) {
            throw new Error("Forbidden. Cannot delete this file.");
        }

        if (pathname) {
            const providedPath = normalizeObjectPath(pathname);

            if (providedPath !== urlPath || !isUserScopedPath(providedPath, userId)) {
                throw new Error("Forbidden. Cannot delete this file.");
            }
        }

        await del(parsed.toString(), { token: blobToken });
        return;
    }

    if (mode === "supabase") {
        const supabase = getSupabaseAdminClient();
        const resolvedPath = pathname || (url ? getPublicSupabaseObjectPath(url) : null);

        if (!resolvedPath) {
            throw new Error("Missing file path.");
        }

        const normalizedPath = normalizeObjectPath(resolvedPath);

        if (!isUserScopedPath(normalizedPath, userId)) {
            throw new Error("Forbidden. Cannot delete this file.");
        }

        const { error } = await supabase.storage.from(supabaseStorageBucket).remove([normalizedPath]);

        if (error) {
            throw new Error(error.message);
        }

        return;
    }

    throw new Error(getStorageSetupError() || "No storage backend configured.");
}
