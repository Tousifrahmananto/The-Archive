# Demo Video (60 seconds)

Loom link: Add your Loom milestone demo URL here before submission.

Recommended script for recording:
- 0-10s: Landing and login flow
- 10-25s: Upload a PDF
- 25-40s: Search/filter, recent/shared views
- 40-55s: Open viewer, share link, delete document
- 55-60s: Show tests and coverage command output

# The Archive - Secure PDF Hosting Platform

The Archive is a full-stack PDF hosting application built with Next.js App Router, Supabase Auth, and pluggable storage backends.

It supports authenticated uploads, user-scoped file collections, in-app PDF preview, and shareable links.

## Software Requirements Specification (SRS)

### 1. Purpose

The system provides a secure, authenticated PDF vault where users can upload, browse, preview, share, and delete their own documents. The product targets users who need quick private hosting and retrieval of PDF assets from a modern web UI.

### 2. Scope

In scope:
- Authentication with Supabase (email/password and OAuth)
- Upload PDF files (size/type validation)
- List only the authenticated user’s files
- View PDFs in browser with fallback open action
- Copy/share file links
- Delete user-owned files
- Search and filter library views

Out of scope (for this milestone):
- Team collaboration roles/ACL model
- OCR/text extraction indexing
- Version history per file
- Native mobile apps

### 3. Functional Requirements

FR-1 Authentication
- The system shall authenticate users using Supabase.
- The system shall reject API access when bearer tokens are missing/invalid.

FR-2 Upload
- The system shall accept only PDF uploads up to 20 MB.
- The system shall allow optional document label input.
- The system shall store uploaded files under user-scoped paths.

FR-3 Library
- The system shall list files owned by the current authenticated user.
- The UI shall support grid/list layouts.
- The UI shall support search by title/path/tags.

FR-4 Viewer and Share
- The system shall display PDF previews in-app when supported.
- The UI shall provide copy-link sharing action.

FR-5 Deletion
- The system shall allow users to delete only their own files.
- The UI shall require confirmation before deletion.

FR-6 Security Controls
- The backend shall enforce authorization for file APIs.
- The backend shall apply rate limiting to upload/list/delete endpoints.
- The app shall return secure headers through framework config.

### 4. Non-Functional Requirements

NFR-1 Security
- API access requires bearer token validation.
- User file operations are namespace-scoped.
- Security headers are applied globally.

NFR-2 Performance
- Standard list response should complete quickly for normal user datasets.
- UI interactions should remain responsive during upload and filtering.

NFR-3 Reliability
- Upload, list, and delete flows should return deterministic JSON errors.
- UI should show user-facing status/error messages for failed operations.

NFR-4 Maintainability
- Core utility modules should have unit tests.
- Coverage threshold must be enforced at 80% minimum for tracked unit-test files.

### 5. User Acceptance Criteria (UAC)

UAC-1 Auth Guard
- Given no token, when calling file APIs, then response is 401 with error JSON.

UAC-2 Upload Validation
- Given non-PDF file or file larger than 20 MB, when uploading, then request is rejected with 400.

UAC-3 User Isolation
- Given user A and user B, when user A lists files, then only user A files are returned.

UAC-4 Search UX
- Given multiple files, when user enters a search query, then displayed files match title/path/tag filter.

UAC-5 Delete Flow
- Given a file in library/viewer, when user confirms delete, then file is removed from UI and API returns ok true.

UAC-6 Security Rate Limit
- Given repeated rapid calls to protected routes, when threshold is exceeded, then API returns 429 and Retry-After.

UAC-7 Coverage Gate
- Given CI/local test run, when running coverage command, then thresholds fail below 80 and pass at or above 80.

## How AI Was Used to Accelerate Development

This project used AI-assisted development workflow to speed milestone delivery:
- Requirements shaping: Converted feature ideas into concrete API/UI tasks and acceptance criteria.
- Implementation acceleration: Generated first-pass code for auth handling, storage adapter, and UI behaviors.
- Security hardening: Used AI-guided review to identify and implement rate limiting, safer validation, and stricter delete checks.
- Refactoring support: Rapidly iterated component contracts and state flow for search/filter/shared/delete features.
- Test authoring: Generated unit test scaffolds and edge-case scenarios, then validated and adjusted assertions.
- Documentation: Produced structured SRS, UAC, and operational runbook updates quickly.

If you are required to use Cursor or Claude Code explicitly, this repository is compatible with both. The same tasks can be executed by prompting either tool with the acceptance criteria listed above.

## Highlights

- Secure authentication with Supabase (email/password, Google OAuth, GitHub OAuth, password reset)
- User-scoped PDF storage and management
- In-browser PDF preview with fallback open action
- Shareable public links with one-click copy
- Search/filter with functional Recent and Shared views
- Functional delete from library and viewer
- Storage backend abstraction:
  - Vercel Blob (default if token exists)
  - Supabase Storage fallback (when Blob token is not configured)
- API routes protected by Supabase bearer token verification
- Backend rate limiting and security headers

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Supabase Auth + SSR helpers
- Storage: Vercel Blob or Supabase Storage
- Tailwind CSS 4
- Lucide icons + Motion animations
- Vitest + V8 coverage

## Project Structure

```text
src/
  app/
    api/
      upload/route.ts
      files/route.ts
      delete/route.ts
  components/
    Auth.tsx
    Upload.tsx
    Library.tsx
    Viewer.tsx
  lib/
    require-user.ts
    storage.ts
    rate-limit.ts
tests/
  rate-limit.test.ts
  utils.test.ts
```

## Environment Variables

Copy template first:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS/Linux
cp .env.example .env.local
```

Required auth env:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Storage options:
- Option A: BLOB_READ_WRITE_TOKEN
- Option B: SUPABASE_SERVICE_ROLE_KEY (+ optional SUPABASE_STORAGE_BUCKET)

## Local Development

```bash
npm install
npm run dev
```

## Testing and Coverage

Run unit tests:

```bash
npm test
```

Run coverage with threshold enforcement:

```bash
npm run test:coverage
```

Coverage gate:
- Minimum 80% for lines, functions, branches, and statements
- Configured in vitest.config.ts

## Available Scripts

- npm run dev
- npm run build
- npm run start
- npm run lint
- npm test
- npm run test:coverage

## API Reference

All API routes require:
- Authorization: Bearer <supabase_access_token>

### POST /api/upload
- multipart/form-data
- file required
- label optional

### GET /api/files
- Returns authenticated user files

### DELETE /api/delete
- Body: url or pathname
- Deletes only user-owned files

## Security Notes

- API routes derive identity from validated bearer token (never from client user id)
- File operations are user-scoped
- Rate limits applied to upload/list/delete
- Security headers configured in Next.js headers()
- SUPABASE_SERVICE_ROLE_KEY must stay server-side

## Troubleshooting

### Upload fails with storage configuration error
Set one storage backend correctly:
- Blob token, or
- Supabase service role + bucket

### API returns 401
- Ensure Authorization bearer token is present
- Verify Supabase URL and publishable key
- Confirm session is active

## License

MIT
