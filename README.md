# PDF Hosting App

A Vercel-ready PDF hosting app built with Next.js App Router and Vercel Blob.

## Features

- Upload PDF files (max 20MB)
- List uploaded PDFs
- Open PDFs in a new tab
- Delete PDFs
- Serverless backend via Next.js route handlers

## Tech Stack

- Next.js (App Router + TypeScript)
- Vercel Blob for file storage
- Tailwind CSS 4

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template and add your Blob token:

```bash
copy .env.example .env.local
```

Set `BLOB_READ_WRITE_TOKEN` in `.env.local`.

3. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deployment

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Add environment variable `BLOB_READ_WRITE_TOKEN` in Vercel project settings.
4. Create a Blob store in Vercel Storage if you have not already.
5. Deploy.

## API Endpoints

- `POST /api/upload` : Upload a PDF file
- `GET /api/files` : List uploaded PDFs
- `DELETE /api/delete` : Delete a PDF by URL
