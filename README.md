# Resume Editor

Single-resume Next.js app for viewing, editing, and exporting a resume as PDF. The app now assumes a self-hosted Node deployment with MongoDB and owner-only authenticated editing.

## Setup

1. Copy `.env.example` to `.env.local` and set `MONGODB_URI` to the Mongo username, password, host, port, and database you want to use.
2. Start MongoDB locally or with `docker compose up -d mongodb`.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.

The app runs on `http://localhost:3007/myresume` in production (PM2). Dev may use another port via `next dev`.

## Required Environment Variables

- `MONGODB_URI`: MongoDB connection string, for example `mongodb://username:password@localhost:27017/resume?authSource=admin`.
- `AUTH_SECRET`: secret used to sign the owner session cookie.
- `ADMIN_USERNAME`: owner login username.
- `ADMIN_PASSWORD`: owner login password.
- `OPENAI_API_KEY`: OpenAI API key used by the AI Tailor workspace (required when using AI routes).
- `OPENAI_MODEL`: OpenAI chat model id, for example `gpt-4.1-mini`.

When you use the provided `docker-compose.yml`, the Mongo container reads `.env.local`, derives its init username, password, and database from `MONGODB_URI`, and stores data in the persistent `resume_mongo_data` Docker volume.

## Scripts

- `npm run dev`: start the dev server on port `3008`.
- `npm run lint`: run ESLint with the Next.js ruleset.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run test`: run the Node test suite.
- `npm run build`: create a production build.

## Editing Model

- Structured sections (experience, projects, certificates, etc.) with Word-like typing inside text fields and bullets (Enter adds a line or bullet).
- Continuous document flow with A4 page boundary guides — no JS page packer clipping.
- Multiple resume variants under the Resumes workspace; each can pick a layout: Classic, Split, or Compact.
- PDF download uses the active resume variant.
- **AI** workspace: paste a job description to generate a tailored draft from the library, review Content Added / library proposals / gaps, refine via chat, then optionally Save as a new Resumes variant (unchecked by default = generate and forget).

## Deployment Notes

- The app expects a long-lived Node server, not a serverless runtime.
- The PDF route launches Puppeteer on the server and renders the internal print page.
- Ensure the VPS has Chromium dependencies available for Puppeteer.
- Production is served behind nginx at `https://devgadbadr.me/myresume`.
- The recommended runtime is PM2 using `ecosystem.config.cjs`.
- CI validates every push and pull request, and deploys automatically on pushes to `master`.
- Required GitHub secrets for deployment:
  - `RESUME_DEPLOY_HOST`
  - `RESUME_DEPLOY_USER`
  - `RESUME_DEPLOY_SSH_KEY`
  - `RESUME_DEPLOY_PORT` (optional if SSH uses `22`)
- The VPS must keep a non-committed `.env.production.local` or `.env.local` with:
  - `MONGODB_URI`
  - `AUTH_SECRET`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
