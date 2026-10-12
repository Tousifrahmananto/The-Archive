export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

export function looksLikePdf(bytes: Uint8Array): boolean {
    return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}
