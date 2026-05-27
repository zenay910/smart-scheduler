# Messenger Auto-Reply - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel (Next.js App)                         │
│                                                                  │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │  GET /api/webhook     │     │  POST /api/webhook            │  │
│  │  (verification only)  │     │  (message handler)            │  │
│  └──────────────────────┘     └──────────┬───────────────────┘  │
│                                           │                      │
│                                    ┌──────▼──────┐               │
│                                    │  Dispatcher  │               │
│                                    │  (parse,     │               │
│                                    │   dedup,     │               │
│                                    │   filter)    │               │
│                                    └──────┬──────┘               │
│                                           │                      │
│                          ┌────────────────┼────────────────┐     │
│                          │                │                │     │
│                   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼───┐ │
│                   │  KV Store    │  │  AI Engine   │  │  Meta   │ │
│                   │  (history)   │  │  (Groq)      │  │  Send   │ │
│                   └─────────────┘  └─────────────┘  └─────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Webhook Route (`app/api/webhook/route.ts`)

**Responsibility:** HTTP entry point for Meta platform events.

**GET handler (verification):**
- Reads `hub.mode`, `hub.verify_token`, `hub.challenge` from query params
- Compares `hub.verify_token` against `META_VERIFY_TOKEN` env var
- Returns `hub.challenge` as plain text on success, 403 on failure

**POST handler (message events):**
- Parses the webhook payload
- Extracts message entries from `body.entry[].messaging[]`
- For each messaging event:
  - If it's a text message → dispatch to conversation handler
  - If it's an attachment → dispatch with attachment flag
  - If it's a read receipt, delivery confirmation, or echo → ignore
- Returns 200 immediately (Meta requires fast response)
- Processing happens after the response via `waitUntil` or inline (Vercel functions are fast enough)

**Meta Webhook Payload Structure:**
```typescript
interface WebhookBody {
  object: 'page';
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{ type: string; payload: { url: string } }>;
      };
      read?: { watermark: number };
      delivery?: { watermark: number };
    }>;
  }>;
}
```

### 2. Conversation Handler (`lib/conversation.ts`)

**Responsibility:** Orchestrates the full message-to-reply flow.

**Flow:**
1. Receive sender ID + message content
2. Load conversation history from KV
3. Check if conversation is stale (> 24h since last message)
   - If stale → clear history, start fresh
4. Add new user message to history
5. Send typing indicator (fire and forget)
6. Generate AI reply using history + system prompt
7. Save updated history (with AI reply) to KV
8. Send reply via Meta Send API
9. If AI flags "needs_followup" → mark in KV

**Deduplication:**
- Before processing, check if `message.mid` was already processed (store last 50 mids in KV)
- If duplicate → skip silently

### 3. AI Engine (`lib/ai/generate-reply.ts`)

**Responsibility:** Generate a reply given conversation history.

**Implementation:**
```typescript
import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function generateReply(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  isAttachment?: boolean
): Promise<{ text: string; needsFollowup: boolean }> {
  const { text } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: SYSTEM_PROMPT,
    messages: history,
    maxTokens: 300,
  });

  const needsFollowup = text.includes('[FOLLOWUP]');
  const cleanText = text.replace('[FOLLOWUP]', '').trim();

  return { text: cleanText, needsFollowup };
}
```

**Model choice:** `llama-3.3-70b-versatile` on Groq free tier
- 30 requests/min, 14,400/day on free plan
- Fast inference (Groq's LPU hardware)
- Good conversational quality for casual chat

**Fallback:** If Groq returns an error (rate limit, outage), return a hardcoded fallback:
"Hey! Got your message — I'll get back to you shortly."

### 4. System Prompt (`lib/ai/system-prompt.ts`)

**Responsibility:** Define the AI's personality and knowledge.

**Key sections:**
- Identity (who you are, what you do)
- Services offered (general fab, ornamental, repairs)
- Service area (regional, few hours travel)
- Tone guidelines (casual, friendly, like texting a buddy)
- Guardrails (never quote prices, never commit to timelines, never pretend to be human if directly asked)
- Handoff trigger (when to flag for human follow-up, append [FOLLOWUP] marker)

**Size target:** < 800 tokens (leaves room for conversation history within Groq's 128k context)

### 5. KV Storage (`lib/kv/conversations.ts`)

**Responsibility:** Persist conversation state per sender.

**Data model:**
```typescript
// Key: `conv:{senderId}`
interface ConversationState {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  lastMessageAt: number; // Unix timestamp
  needsFollowup: boolean;
  messageCount: number;
}

// Key: `dedup:{senderId}`
// Value: Array of last 50 message IDs (for deduplication)
```

**TTL Strategy:**
- Conversations expire after 7 days of inactivity (auto-cleanup)
- Dedup keys expire after 1 hour

**Context window management:**
- Keep max 20 message pairs (40 messages total)
- When exceeded, drop oldest messages
- This keeps context well within Groq's 128k limit

### 6. Meta Send API Client (`lib/meta/send.ts`)

**Responsibility:** Send messages and actions back to the client.

**Functions:**
- `sendTextMessage(recipientId, text)` — Send a text reply
- `sendTypingIndicator(recipientId, on: boolean)` — Show/hide typing bubble

**API endpoint:** `https://graph.facebook.com/v21.0/me/messages`

**Authentication:** Page Access Token passed as query param or header.

**Error handling:**
- On 4xx → log error, don't retry (bad request)
- On 5xx or network error → retry once after 2 seconds
- On rate limit (error code 4) → log, skip reply, fallback message sent later

## Data Flow (Happy Path)

```
Client sends "Do you make custom gates?"
        │
        ▼
Meta delivers webhook POST to /api/webhook
        │
        ▼
Parse payload → extract sender_id="123", text="Do you make custom gates?", mid="abc"
        │
        ▼
Check dedup: "abc" not in recent mids → proceed
        │
        ▼
Load conv:123 from KV → found, last message 2h ago → continue session
        │
        ▼
Append user message to history
        │
        ▼
Send typing_on indicator (fire & forget)
        │
        ▼
generateReply(history) → Groq Llama 3.3 → "Yeah man, we do all kinds of custom gates..."
        │
        ▼
Save updated history + new assistant message to KV
        │
        ▼
sendTextMessage("123", "Yeah man, we do all kinds of custom gates...")
        │
        ▼
Return 200 to Meta
```

## Environment Variables

| Variable | Purpose | Source |
| --- | --- | --- |
| `META_VERIFY_TOKEN` | Webhook verification handshake | You choose (any random string) |
| `META_PAGE_ACCESS_TOKEN` | Authenticate Send API calls | Meta App Dashboard |
| `GROQ_API_KEY` | AI inference | Groq Console (free) |
| `KV_REST_API_URL` | Vercel KV connection | Auto-set by Vercel KV binding |
| `KV_REST_API_TOKEN` | Vercel KV auth | Auto-set by Vercel KV binding |

## Dependencies

```json
{
  "ai": "^5.0.0",
  "@ai-sdk/groq": "^1.0.0",
  "@vercel/kv": "^2.0.0",
  "next": "^15.0.0"
}
```

## Deployment

- **Platform:** Vercel Hobby (free)
- **Region:** Auto (closest to user — US for most traffic)
- **Function runtime:** Node.js 20
- **Webhook URL:** `https://<project>.vercel.app/api/webhook`

## Requirement Mapping

| Requirement | Component | Notes |
| --- | --- | --- |
| MSG-01 (webhook receipt) | Webhook Route | GET + POST handlers |
| MSG-02 (AI reply generation) | AI Engine + System Prompt | generateText with Groq |
| MSG-03 (send reply) | Meta Send Client | sendTextMessage |
| MSG-04 (business context) | System Prompt | Services, area, tone |
| MSG-05 (history tracking) | KV Storage | conv:{senderId} key |
| MSG-06 (24h continuity) | Conversation Handler | Check lastMessageAt |
| MSG-07 (fresh start) | Conversation Handler | Clear on > 24h gap |
| MSG-08 (casual tone) | System Prompt | Tone guidelines |
| MSG-09 (graceful uncertainty) | System Prompt | Handoff patterns |
| MSG-10 (no price invention) | System Prompt | Explicit guardrail |
| MSG-11 (needs_followup flag) | Conversation Handler + KV | [FOLLOWUP] marker |
| MSG-12 (image acknowledgment) | Conversation Handler | Attachment detection |
| MSG-13 (reaction ignore) | Webhook Route | Filter non-message events |
| MSG-14 (typing indicator) | Meta Send Client | sendTypingIndicator |
| MSG-15 (dedup) | Conversation Handler | dedup:{senderId} key |
| MSG-16 (AI fallback) | AI Engine | try/catch with hardcoded reply |
| MSG-17 (event filtering) | Webhook Route | Check for message field |
| MSG-18 (context truncation) | KV Storage | Max 20 message pairs |
| MSG-19 (send retry) | Meta Send Client | Single retry on 5xx |
