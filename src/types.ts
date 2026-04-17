export type ViewType =
    | "landing"
    | "login"
    | "signup"
    | "reset-password"
    | "library"
    | "upload"
    | "viewer"
    | "profile"
    | "recent"
    | "shared"
    | "settings";

export interface ArchiveDocument {
    id: string;
    title: string;
    pathname: string;
    url: string;
    date: string;
    size: string;
    bytes: number;
    uploadedAt: string;
    pages: number;
    author: string;
    tags: string[];
}

export interface UploadResult {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: string;
    displayName?: string;
}
