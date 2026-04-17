import { list, put, del } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";

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

function toDisplayNameFromPath(pathname: string): string {
    const rawFileName = decodeURIComponent(pathname.split("/").pop() ?? pathname);
    const withoutExt = rawFileName.replace(/\.pdf$/i, "");
    const withoutTimestamp = withoutExt.replace(/^\d{10,}-/, "");
    const withoutRandomSuffix = withoutTimestamp.replace(/[-_][a-zA-Z0-9]{10,}$/, "");
    const readable = withoutRandomSuffix.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

    return readable || "Untitled document";
}

function getStorageMode(): "blob" | "supabase" | null {
    if (blobToken) {
        return "blob";
    }

    if (supabaseUrl && supabaseServiceRoleKey) {
        return "supabase";
    }

    return null;
}

function getSupabaseAdminClient() {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
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

        const expectedPrefix = `/${userId}/`;

        if (!url.includes(expectedPrefix)) {
            throw new Error("Forbidden. Cannot delete this file.");
        }

        await del(url, { token: blobToken });
        return;
    }

    if (mode === "supabase") {
        const supabase = getSupabaseAdminClient();
        const resolvedPath = pathname || (url ? getPublicSupabaseObjectPath(url) : null);

        if (!resolvedPath) {
            throw new Error("Missing file path.");
        }

        if (!resolvedPath.startsWith(`${userId}/`)) {
            throw new Error("Forbidden. Cannot delete this file.");
        }

        const { error } = await supabase.storage.from(supabaseStorageBucket).remove([resolvedPath]);

        if (error) {
            throw new Error(error.message);
        }

        return;
    }

    throw new Error(getStorageSetupError() || "No storage backend configured.");
}