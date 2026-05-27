# Smart Scheduler

AI-powered Facebook Messenger auto-responder for a metal fabrication shop. Handles initial client conversations so the owner can keep working without ghosting potential clients.

## Stack

- Next.js 16 (App Router)
- Groq (Llama 3.3 70B) via Vercel AI SDK
- Upstash Redis (conversation history)
- Meta Messenger Platform API

## Setup

### 1. Environment variables

Copy `.env.local` and fill in values:

```bash
META_VERIFY_TOKEN=your_random_verify_string
META_PAGE_ACCESS_TOKEN=your_page_access_token
GROQ_API_KEY=your_groq_api_key
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### 2. Groq API key

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key (free tier)

### 3. Upstash Redis

1. Sign up at [console.upstash.com](https://console.upstash.com)
2. Create a Redis database (free tier)
3. Copy REST URL and token

### 4. Meta Messenger setup

1. Create a Meta App at [developers.facebook.com](https://developers.facebook.com)
2. Add the **Messenger** product
3. Connect your Facebook Business Page
4. Generate a **Page Access Token** (long-lived)
5. Set webhook URL to `https://<your-domain>/api/webhook`
6. Set verify token to match `META_VERIFY_TOKEN`
7. Subscribe to `messages` webhook events

### 5. Run locally

```bash
npm install
npm run dev
```

Use [ngrok](https://ngrok.com) or similar to expose `localhost:3000` for Meta webhook testing.

### 6. Deploy to Vercel

1. Push to GitHub and import in Vercel
2. Add all environment variables in project settings
3. Deploy
4. Update Meta webhook URL to your Vercel domain

## How it works

1. Client messages the Facebook Business Page
2. Meta sends a webhook POST to `/api/webhook`
3. App loads conversation history from Redis
4. Groq generates a contextual reply using the system prompt
5. Reply is sent back via Meta Send API
6. Conversation history is saved for multi-turn context

## Specs

Project specs live in `.specs/`:

- `.specs/project/PROJECT.md` — vision and scope
- `.specs/features/messenger-autoreply/spec.md` — requirements
- `.specs/features/messenger-autoreply/design.md` — architecture
- `.specs/features/messenger-autoreply/tasks.md` — implementation tasks
