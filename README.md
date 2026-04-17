# PDF Hosting App

A Vercel-ready PDF hosting app built with Next.js App Router and Vercel Blob.

## Features

- Upload PDF files (max 20MB)
- List uploaded PDFs
- Open PDFs in a new tab
- Delete PDFs
- OAuth login (Google/GitHub)
- Email login, signup, and forgot password
- Serverless backend via Next.js route handlers

## Tech Stack

- Next.js (App Router + TypeScript)
- Vercel Blob for file storage
- Supabase Auth for authentication
- Tailwind CSS 4

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template and add required values:

```bash
copy .env.example .env.local
```

Set `BLOB_READ_WRITE_TOKEN` in `.env.local`.
Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project API settings.

3. In Supabase Auth settings:

- Enable Email provider.
- Enable OAuth providers you want (Google/GitHub).
- Add Site URL and redirect URL for local/dev and production (for example `http://localhost:3000` and your Vercel domain).

4. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deployment

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add environment variable `BLOB_READ_WRITE_TOKEN` in Vercel project settings.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel project settings.
5. Create a Blob store in Vercel Storage if you have not already.
6. Deploy.

## API Endpoints

- `POST /api/upload` : Upload a PDF file (requires `Authorization: Bearer <access_token>`)
- `GET /api/files` : List signed-in user's PDFs (requires bearer token)
- `DELETE /api/delete` : Delete a signed-in user's PDF by URL (requires bearer token)
