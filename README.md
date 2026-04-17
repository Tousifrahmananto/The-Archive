# The Archive - Secure PDF Hosting Platform

The Archive is a full-stack PDF hosting application built with Next.js App Router, Supabase Auth, and pluggable storage backends.

It supports authenticated uploads, private user-scoped file collections, in-app PDF preview, and shareable public links for stored documents.

## Highlights

- Secure authentication with Supabase (email/password, Google OAuth, GitHub OAuth, password reset)
- User-scoped PDF storage and management
- In-browser PDF preview with fallback open action
- Shareable public links with one-click copy
- Friendly document titles derived from upload label or filename
- Storage backend abstraction:
	- Vercel Blob (default if token exists)
	- Supabase Storage fallback (when Blob token is not configured)
- API routes protected by Supabase bearer token verification
- Modern responsive UI (Next.js + Tailwind CSS + Motion)

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Supabase Auth + SSR helpers
- Storage: Vercel Blob or Supabase Storage
- Tailwind CSS 4
- Lucide icons + Motion animations

## How It Works

1. User signs in through Supabase.
2. Client fetches a Supabase access token.
3. API routes validate bearer token and resolve user ID.
4. Storage layer selects backend:
	 - If `BLOB_READ_WRITE_TOKEN` exists -> Vercel Blob
	 - Otherwise if Supabase service role credentials exist -> Supabase Storage
5. Files are namespaced by user ID for isolation.
6. Client renders document library, preview, and share actions from returned file metadata.

## Project Structure

```text
src/
	app/
		api/
			upload/route.ts     # Upload PDF
			files/route.ts      # List user PDFs
			delete/route.ts     # Delete PDF by URL/pathname
		login/                # Login/signup/reset entry
		reset-password/       # Password reset completion page
		page.tsx              # Main authenticated app shell
	components/
		Auth.tsx              # Auth UI and Supabase auth actions
		Upload.tsx            # Upload flow and metadata label input
		Library.tsx           # File listing UI
		Viewer.tsx            # PDF preview + share link UI
	lib/
		require-user.ts       # Bearer token -> authenticated user check
		storage.ts            # Backend-agnostic storage adapter
utils/supabase/
	client.ts               # Browser Supabase client
	server.ts               # Server Supabase client
	middleware.ts           # Session middleware integration
```

## Environment Variables

Copy the template first:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

Required for authentication:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Choose one storage backend:

### Option A: Vercel Blob (preferred default)

- `BLOB_READ_WRITE_TOKEN`

### Option B: Supabase Storage fallback

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (optional, defaults to `pdfs`)

Notes:

- If both Blob and Supabase storage credentials exist, Blob is used first.
- For direct public preview/share links in Supabase Storage, use a public bucket.

## Supabase Configuration Checklist

In Supabase Dashboard:

1. Authentication -> Providers
	 - Enable Email provider
	 - Enable Google and/or GitHub if needed
2. Authentication -> URL Configuration
	 - Add Site URL for local and production
	 - Add redirect URLs (for OAuth and reset-password flow)
3. Project Settings -> API
	 - Copy URL and publishable key to env vars
4. (If using Supabase Storage backend)
	 - Create bucket (for example `pdfs`)
	 - Set bucket visibility according to your link-sharing strategy

## Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Create production build
- `npm run start` - Run production server locally
- `npm run lint` - Lint codebase with ESLint

## API Reference

All API routes require:

- Header: `Authorization: Bearer <supabase_access_token>`

### POST /api/upload

Upload a single PDF (max 20MB).

Request:

- `multipart/form-data`
	- `file` (required)
	- `label` (optional display label)

Response `200`:

```json
{
	"ok": true,
	"file": {
		"url": "https://...",
		"pathname": "userId/file.pdf",
		"size": 12345,
		"uploadedAt": "2026-04-17T12:00:00.000Z",
		"displayName": "My Document"
	}
}
```

### GET /api/files

List authenticated user PDFs.

Response `200`:

```json
{
	"files": [
		{
			"url": "https://...",
			"pathname": "userId/file.pdf",
			"size": 12345,
			"uploadedAt": "2026-04-17T12:00:00.000Z",
			"displayName": "My Document"
		}
	]
}
```

### DELETE /api/delete

Delete a user-owned file by URL or pathname.

Request body:

```json
{
	"url": "https://...",
	"pathname": "userId/file.pdf"
}
```

Either `url` or `pathname` must be provided.

Response `200`:

```json
{
	"ok": true
}
```

## Storage Backend Behavior

The storage adapter in `src/lib/storage.ts` handles:

- Upload
- List
- Delete
- Human-readable display name derivation from stored paths

Selection priority:

1. Vercel Blob if `BLOB_READ_WRITE_TOKEN` is configured
2. Supabase Storage if `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are configured
3. Otherwise API routes return configuration error

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project into Vercel.
3. Add auth env vars:
	 - `NEXT_PUBLIC_SUPABASE_URL`
	 - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Add storage env vars for one backend:
	 - Blob: `BLOB_READ_WRITE_TOKEN`
	 - Supabase: `SUPABASE_SERVICE_ROLE_KEY` (+ optional `SUPABASE_STORAGE_BUCKET`)
5. Configure Supabase Auth redirect URLs with your Vercel domain.
6. Deploy.

## Security Notes

- API routes never trust client user ID; user identity is derived from validated bearer token.
- File operations are scoped to authenticated user namespace.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed client-side.
- `.env.local` should never be committed.

## Troubleshooting

### Upload fails with storage configuration error

Set one storage backend correctly:

- Blob token, or
- Supabase service role + bucket

### Auth works but file APIs return 401

- Ensure client sends `Authorization: Bearer <token>`
- Confirm Supabase URL and publishable key are correct
- Verify session is active in browser

### Supabase Storage links do not preview publicly

- Use a public bucket, or
- Implement signed URL flow (private bucket strategy)

### OAuth login fails

- Enable provider in Supabase dashboard
- Configure provider client credentials
- Add correct redirect URLs for local and production

## License

MIT
