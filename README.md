# Email Agent

AI-powered email assistant built on Next.js App Router. It integrates with EmailEngine to fetch messages and send emails, generates replies using OpenAI, and can auto-reply to new incoming emails using a global toggle.

## Features

- **Inbox browsing**: Lists threads and loads message content on demand
- **AI drafting**: Generate and preview emails/replies using OpenAI
- **Reply sending**: Sends replies via EmailEngine with correct message reference
- **Auto-reply**: Optional global toggle to auto-generate and send replies on new message webhooks
- **Webhook handling**: Receives EmailEngine webhooks and triggers the auto-reply flow

## Requirements

- Node 18+
- EmailEngine instance and an account connected (IMAP/SMTP handled by EmailEngine)
- OpenAI API key

## Environment Variables

Create `.env.local` in the project root with the following keys:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# EmailEngine
EMAIL_ENGINE_BASE_URL=https://your-emailengine-host
EMAIL_ENGINE_API_KEY=ee_access_token
EMAIL_ENGINE_ACCOUNT=me@example.com

# Optional defaults
AUTO_REPLY_ENABLED=false
```

Notes:
- `EMAIL_ENGINE_ACCOUNT` must match the EmailEngine account identifier (usually your email address) used for sending/receiving.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The dev server runs on port 3000 (or next available). Open http://localhost:3000.

## Production Build

```bash
npm run build
npm run start
```

This project sets `turbopack.root` in `next.config.ts` to avoid multi-lockfile root warnings. If you still see warnings, remove the unused lockfile in your workspace.

## Webhook Configuration (EmailEngine)

Point EmailEngine webhooks to:

- `POST /api/webhook/emailengine`

On `messageNew` events, the server can auto-generate and send a reply when the global auto-reply toggle is enabled and the message is addressed to `EMAIL_ENGINE_ACCOUNT`.

### Auto-Reply Behavior

- Global toggle lives in the UI (top bar) and via API.
- Basic loop prevention: the webhook skips replying to messages sent from `EMAIL_ENGINE_ACCOUNT`.
- The reply references the incoming message (uses EmailEngine internal `data.id` when available) to keep the thread intact.

## API Endpoints

- `GET /api/account` — Returns configured account info.
- `GET /api/emails` — Lists inbox threads (via EmailEngine).
- `GET /api/emails/thread/[threadId]` — Lists messages in a thread.
- `GET /api/emails/content/[messageId]` — Loads message content (html/text) by text id.
- `POST /api/send` — Generates or sends email; supports `action: "preview" | "send"` and `reference` for replies.
- `POST /api/auto-reply` — Generates a reply for a thread (manual flow used by UI).
- `GET/POST /api/auto-reply/toggle` — Read/update global auto-reply flag.
- `POST /api/webhook/emailengine` — EmailEngine webhooks.

## Security & Hardening

- Add request authentication or secret header on the webhook to ensure it’s only called by EmailEngine.
- Consider idempotency on webhook events (dedupe by `data.id`).
- Add additional loop-prevention heuristics (skip `noreply@`, `Auto-Submitted`, etc.).
- Validate required env vars at runtime (see `src/lib/env.ts`).

## Known Limitations

- The global auto-reply toggle is stored in-memory by default. For production, back it with a persistent store (e.g., SQLite/Prisma, Redis/KV) or keep it env-driven.

## Development Tips

- If you see multiple lockfile warnings, keep a single lockfile and remove others.
- Use `npm run build` to verify types and lints before deploying.

## License

MIT
