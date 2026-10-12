import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { list } from "@vercel/blob";
import { createClient } from "@supabase/supabase-js";

const maxSize = 20 * 1024 * 1024;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function validate(pathname, bytes) {
    assert.match(pathname, /^[a-f0-9-]{36}\/[a-zA-Z0-9._-]+\.pdf$/i, "Unexpected user-scoped PDF path");
    assert(bytes.length > 0 && bytes.length <= maxSize, "PDF exceeds upload size limit");
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-", "Invalid PDF signature");
}

if (process.argv.includes("--self-test")) {
    const path = "12345678-1234-1234-1234-123456789abc/report.pdf";
    validate(path, Buffer.from("%PDF-test"));
    assert.throws(() => validate("../report.pdf", Buffer.from("%PDF-test")));
    assert.throws(() => validate(path, Buffer.from("not a PDF")));
    assert.notEqual(hash(Buffer.from("one")), hash(Buffer.from("two")));
    console.log("Migration validation self-check passed.");
} else {
    try {
        const env = { ...parseEnv(readFileSync(new URL("../.env.local", import.meta.url), "utf8")), ...process.env };
        assert(env.BLOB_READ_WRITE_TOKEN && env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY, "Missing storage configuration");
        const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
        const bucketName = env.SUPABASE_STORAGE_BUCKET || "pdfs";
        const bucket = supabase.storage.from(bucketName);
        const files = [];
        let cursor;
        do {
            const result = await list({ token: env.BLOB_READ_WRITE_TOKEN, cursor, limit: 1000 });
            files.push(...result.blobs);
            cursor = result.hasMore ? result.cursor : undefined;
        } while (cursor);
        const pdfs = files.filter((file) => /\.pdf(?:\.pending)?$/i.test(file.pathname))
            .sort((a, b) => Number(a.pathname.endsWith(".pending")) - Number(b.pathname.endsWith(".pending")));
        const apply = process.argv.includes("--apply");
        console.log(JSON.stringify({ mode: apply ? "copy-and-verify" : "dry-run", destinationBucket: bucketName, sourcePdfs: pdfs.length, pendingToValidate: pdfs.filter((file) => file.pathname.endsWith(".pending")).length, bytes: pdfs.reduce((n, file) => n + file.size, 0) }));
        const existingBucket = await supabase.storage.getBucket(bucketName);
        if (existingBucket.error && existingBucket.error.message !== "Bucket not found") throw existingBucket.error;
        if (existingBucket.data) {
            assert(existingBucket.data.public, "Destination bucket must support the app's public share links");
            assert(!existingBucket.data.file_size_limit || existingBucket.data.file_size_limit >= maxSize, "Destination bucket file limit is too small");
        } else if (apply) {
            const created = await supabase.storage.createBucket(bucketName, { public: true, fileSizeLimit: maxSize, allowedMimeTypes: ["application/pdf"] });
            if (created.error) throw created.error;
        }
        let copied = 0;
        let alreadyVerified = 0;
        let duplicatePendingSkipped = 0;
        let recoveredPending = 0;
        const verifiedHashes = new Set();
        for (const file of pdfs) {
            const source = await fetch(file.url, { redirect: "error", signal: AbortSignal.timeout(120_000) });
            assert(source.ok, "Could not download Blob source");
            const bytes = Buffer.from(await source.arrayBuffer());
            assert.equal(bytes.length, file.size, "Blob source size mismatch");
            const pending = file.pathname.endsWith(".pending");
            const pathname = pending ? file.pathname.slice(0, -".pending".length) : file.pathname;
            validate(pathname, bytes);
            const userHash = `${pathname.split("/")[0]}:${hash(bytes)}`;
            if (pending && verifiedHashes.has(userHash)) {
                duplicatePendingSkipped++;
                continue;
            }
            verifiedHashes.add(userHash);
            if (!apply) continue;
            const info = await bucket.info(pathname);
            if (info.error) {
                assert(["404", "400"].includes(String(info.error.statusCode)) && /not found|does not exist/i.test(info.error.message), "Cannot inspect destination object");
                const uploaded = await bucket.upload(pathname, bytes, { contentType: "application/pdf", upsert: false });
                if (uploaded.error) throw uploaded.error;
                copied++;
            } else {
                assert.equal(info.data.size, bytes.length, "Existing destination size differs; refusing to overwrite");
                alreadyVerified++;
            }
            const destination = await bucket.download(pathname);
            if (destination.error) throw destination.error;
            assert.equal(hash(Buffer.from(await destination.data.arrayBuffer())), hash(bytes), "Destination checksum differs; keep Blob originals");
            if (pending) recoveredPending++;
        }
        console.log(JSON.stringify({ validated: pdfs.length, copied, alreadyVerified, recoveredPending, duplicatePendingSkipped, blobOriginalsDeleted: 0, complete: true }));
    } catch (error) {
        console.error("Migration stopped:", error.message);
        process.exitCode = 1;
    }
}
