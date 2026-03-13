# Resume Editor

Single-resume Next.js app for viewing, editing, and exporting a resume as PDF. The app now assumes a self-hosted Node deployment with MongoDB and owner-only authenticated editing.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Start MongoDB locally or with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.

The app runs on `http://localhost:3007/myresume`.

## Required Environment Variables

- `MONGODB_URI`: MongoDB connection string.
- `AUTH_SECRET`: secret used to sign the owner session cookie.
- `ADMIN_USERNAME`: owner login username.
- `ADMIN_PASSWORD`: owner login password.

## Scripts

- `npm run dev`: start the dev server on port `3007`.
- `npm run lint`: run ESLint with the Next.js ruleset.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run test`: run the Node test suite.
- `npm run build`: create a production build.

## Auth and Editing

- The main resume page is public and read-only by default.
- Owner editing requires logging in at `/myresume/login`.
- Resume writes are validated and require an authenticated session.
- Failed autosaves keep a local browser draft so work can be recovered.

## Deployment Notes

- The app expects a long-lived Node server, not a serverless runtime.
- The PDF route launches Puppeteer on the server and renders the internal print page.
- Ensure the VPS has Chromium dependencies available for Puppeteer.
