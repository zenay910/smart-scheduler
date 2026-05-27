# Messenger Auto-Reply - Tasks

## Legend

- **[S]** = Sequential (must wait for dependency)
- **[P]** = Parallelizable (no shared dependencies)
- **Status:** TODO | IN PROGRESS | DONE | BLOCKED

---

## Task 1: Scaffold Next.js project [P]

**What:** Initialize Next.js 15 project with TypeScript, install core dependencies.

**Where:** Project root (all files)

**Depends on:** Nothing

**Reuses:** Nothing

**Steps:**
1. Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias`
2. Install dependencies: `ai @ai-sdk/groq @vercel/kv`
3. Remove boilerplate (default page content, globals.css extras)
4. Create placeholder `.env.local` with required variable names

**Done when:**
- `npm run build` passes
- `.env.local` exists with placeholder vars
- `package.json` includes ai, @ai-sdk/groq, @vercel/kv

**Tests:** Build passes (`npm run build`)

**Gate:** `npm run build` exits 0

**Traces:** Foundation for all requirements

**Status:** TODO

---

## Task 2: Implement webhook verification endpoint [S after Task 1]

**What:** GET handler at `/api/webhook` that responds to Meta's verification challenge.

**Where:** `src/app/api/webhook/route.ts`

**Depends on:** Task 1 (project exists)

**Reuses:** Nothing

**Steps:**
1. Create `src/app/api/webhook/route.ts`
2. Implement GET handler that reads `hub.mode`, `hub.verify_token`, `hub.challenge` from searchParams
3. Compare verify_token against `META_VERIFY_TOKEN` env var
4. Return challenge as plain text (200) on match, 403 on mismatch

**Done when:**
- GET `/api/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=CHALLENGE_123` returns "CHALLENGE_123" with status 200
- GET with wrong token returns 403

**Tests:** Manual curl test or unit test

**Gate:** `curl` to local dev server returns expected responses

**Traces:** MSG-01

**Status:** TODO

---

## Task 3: Implement Meta Send API client [P after Task 1]

**What:** Utility functions to send text messages and typing indicators via Meta Graph API.

**Where:** `src/lib/meta/send.ts`

**Depends on:** Task 1 (project exists)

**Reuses:** Nothing

**Steps:**
1. Create `src/lib/meta/send.ts`
2. Implement `sendTextMessage(recipientId: string, text: string): Promise<void>`
   - POST to `https://graph.facebook.com/v21.0/me/messages`
   - Body: `{ recipient: { id }, messaging_type: "RESPONSE", message: { text } }`
   - Auth: `?access_token=META_PAGE_ACCESS_TOKEN`
   - On 5xx: retry once after 2s
   - On 4xx: log and throw
3. Implement `sendTypingIndicator(recipientId: string, on: boolean): Promise<void>`
   - POST to same endpoint with `sender_action: "typing_on" | "typing_off"`

**Done when:**
- Functions compile without errors
- Error handling covers 4xx, 5xx, and network failures
- Single retry logic on 5xx

**Tests:** Build passes, types are correct

**Gate:** `npm run build` exits 0

**Traces:** MSG-03, MSG-14, MSG-19

**Status:** TODO

---

## Task 4: Implement KV conversation storage [P after Task 1]

**What:** Functions to load, save, and manage conversation history in Vercel KV.

**Where:** `src/lib/kv/conversations.ts`

**Depends on:** Task 1 (project exists)

**Reuses:** Nothing

**Steps:**
1. Create `src/lib/kv/conversations.ts`
2. Define `ConversationState` interface (messages array, lastMessageAt, needsFollowup, messageCount)
3. Implement `getConversation(senderId: string): Promise<ConversationState | null>`
   - Key pattern: `conv:{senderId}`
4. Implement `saveConversation(senderId: string, state: ConversationState): Promise<void>`
   - TTL: 7 days (604800 seconds)
   - Truncate messages to max 40 (20 pairs)
5. Implement `isMessageProcessed(senderId: string, messageId: string): Promise<boolean>`
   - Key pattern: `dedup:{senderId}`
   - Stores array of last 50 message IDs
   - TTL: 1 hour
6. Implement `markMessageProcessed(senderId: string, messageId: string): Promise<void>`

**Done when:**
- All functions compile
- TTL values are correct
- Truncation logic caps at 40 messages

**Tests:** Build passes

**Gate:** `npm run build` exits 0

**Traces:** MSG-05, MSG-06, MSG-07, MSG-15, MSG-18

**Status:** TODO

---

## Task 5: Write system prompt [P after Task 1]

**What:** Create the system prompt that defines the AI's personality and knowledge.

**Where:** `src/lib/ai/system-prompt.ts`

**Depends on:** Task 1 (project exists)

**Reuses:** Nothing

**Steps:**
1. Create `src/lib/ai/system-prompt.ts`
2. Write system prompt covering:
   - Identity: Assistant for a metal fabrication shop
   - Services: General fabrication/welding, ornamental metalwork (gates, railings, art), repair work (trailers, equipment)
   - Service area: Regional (can travel a few hours)
   - Tone: Casual, friendly, like texting a buddy — use contractions, short sentences
   - Guardrails: NEVER quote specific prices, NEVER commit to timelines, NEVER pretend to be human if asked directly
   - Handoff: When client asks for specific pricing or complex custom work, append [FOLLOWUP] to response and let them know the fabricator will reach out personally
   - Attachments: When user sends an image/attachment, acknowledge it warmly
3. Export as `SYSTEM_PROMPT` constant

**Done when:**
- Prompt is < 800 tokens
- All guardrails are explicit
- Tone reads casual when reviewed

**Tests:** Build passes, manual review

**Gate:** `npm run build` exits 0

**Traces:** MSG-04, MSG-08, MSG-09, MSG-10, MSG-11, MSG-12

**Status:** TODO

---

## Task 6: Implement AI reply generation [S after Task 5]

**What:** Function that takes conversation history and returns an AI-generated reply using Groq.

**Where:** `src/lib/ai/generate-reply.ts`

**Depends on:** Task 5 (system prompt exists)

**Reuses:** System prompt from Task 5

**Steps:**
1. Create `src/lib/ai/generate-reply.ts`
2. Import `generateText` from `ai`, `createGroq` from `@ai-sdk/groq`
3. Initialize Groq provider with env var
4. Implement `generateReply(history, options?)` function:
   - Call `generateText` with model `llama-3.3-70b-versatile`, system prompt, messages, maxTokens: 300
   - Check if response contains `[FOLLOWUP]` marker
   - Strip marker from final text
   - Return `{ text, needsFollowup }`
5. Wrap in try/catch:
   - On any error → return fallback: "Hey! Got your message — I'll get back to you shortly."
   - Log the error for debugging

**Done when:**
- Function compiles
- Fallback works on error
- [FOLLOWUP] marker is properly detected and stripped

**Tests:** Build passes

**Gate:** `npm run build` exits 0

**Traces:** MSG-02, MSG-16

**Status:** TODO

---

## Task 7: Implement conversation handler [S after Tasks 3, 4, 6]

**What:** The orchestrator that ties everything together: receive message → load history → generate reply → save → send.

**Where:** `src/lib/conversation.ts`

**Depends on:** Tasks 3 (Meta Send), 4 (KV Storage), 6 (AI Engine)

**Reuses:** All three dependencies

**Steps:**
1. Create `src/lib/conversation.ts`
2. Implement `handleIncomingMessage(senderId, message, messageId)`:
   a. Dedup check → if already processed, return early
   b. Mark message as processed
   c. Load conversation from KV
   d. Check staleness (> 24h since lastMessageAt) → if stale, reset to empty
   e. Determine message content:
      - If text → use as-is
      - If attachment → use placeholder: "[Client sent an image/attachment]"
   f. Append user message to history
   g. Send typing indicator (don't await)
   h. Generate AI reply
   i. Append assistant message to history
   j. Save conversation (with needsFollowup flag if triggered)
   k. Send text message to client
   l. Send typing_off (don't await)

**Done when:**
- Full flow compiles
- Dedup prevents double processing
- Staleness check resets after 24h
- Attachments don't crash the flow

**Tests:** Build passes

**Gate:** `npm run build` exits 0

**Traces:** MSG-01 through MSG-19 (integrates everything)

**Status:** TODO

---

## Task 8: Implement webhook POST handler [S after Task 7]

**What:** The POST endpoint that receives Meta webhook events and dispatches to the conversation handler.

**Where:** `src/app/api/webhook/route.ts` (add to existing file from Task 2)

**Depends on:** Task 7 (conversation handler), Task 2 (file exists)

**Reuses:** Conversation handler

**Steps:**
1. Add POST handler to `src/app/api/webhook/route.ts`
2. Parse request body as JSON
3. Verify `body.object === 'page'` (ignore non-page events)
4. Iterate through `body.entry[].messaging[]`
5. For each event:
   - Skip if no `message` field (read receipts, deliveries, echoes)
   - Skip if `message.is_echo` is true (our own messages)
   - Extract sender.id, message.mid, message.text, message.attachments
   - Call `handleIncomingMessage(senderId, messageContent, mid)`
6. Return 200 immediately (don't block on processing)
   - Use `waitUntil` from `next/server` if available, otherwise process inline

**Done when:**
- POST handler parses webhook payload correctly
- Non-message events are silently skipped
- Echo messages are filtered out
- Returns 200 regardless of processing result

**Tests:** Build passes

**Gate:** `npm run build` exits 0, manual test with sample payload

**Traces:** MSG-01, MSG-13, MSG-15, MSG-17

**Status:** TODO

---

## Task 9: Deploy and test end-to-end [S after Task 8]

**What:** Deploy to Vercel, configure Meta App, and verify the full flow works.

**Where:** Vercel dashboard + Meta Developer Console

**Depends on:** All previous tasks

**Reuses:** Everything

**Steps:**
1. Create Vercel project, link repo
2. Add Vercel KV store (free tier)
3. Set environment variables:
   - `META_VERIFY_TOKEN` (choose a random string)
   - `META_PAGE_ACCESS_TOKEN` (from Meta App)
   - `GROQ_API_KEY` (from console.groq.com)
4. Deploy to Vercel
5. In Meta Developer Console:
   - Set webhook URL to `https://<project>.vercel.app/api/webhook`
   - Set verify token to match env var
   - Subscribe to `messages` events
   - Connect Business Page
6. Test: Send message to Business Page from a test account
7. Verify reply arrives within 5 seconds

**Done when:**
- Webhook verification passes in Meta console
- Test message → AI reply works end-to-end
- Conversation context persists across messages

**Tests:** Manual end-to-end test

**Gate:** Full conversation round-trip works

**Traces:** All requirements validated

**Status:** TODO

---

## Dependency Graph

```
Task 1 (Scaffold)
  ├── Task 2 (Webhook GET) ─────────────────────────┐
  ├── Task 3 (Meta Send) ──────────────┐            │
  ├── Task 4 (KV Storage) ─────────────┤            │
  └── Task 5 (System Prompt)           │            │
       └── Task 6 (AI Engine) ─────────┤            │
                                       │            │
                                       ▼            │
                              Task 7 (Handler) ─────┤
                                       │            │
                                       ▼            │
                              Task 8 (POST) ◄───────┘
                                       │
                                       ▼
                              Task 9 (Deploy & Test)
```

**Parallelizable after Task 1:** Tasks 2, 3, 4, 5
**Sequential chain:** 5 → 6 → 7 → 8 → 9

---

## Summary

| Task | Effort | Parallelizable | Requirements Covered |
| --- | --- | --- | --- |
| 1. Scaffold | 10 min | - | Foundation |
| 2. Webhook GET | 15 min | Yes | MSG-01 |
| 3. Meta Send | 30 min | Yes | MSG-03, MSG-14, MSG-19 |
| 4. KV Storage | 30 min | Yes | MSG-05-07, MSG-15, MSG-18 |
| 5. System Prompt | 20 min | Yes | MSG-04, MSG-08-12 |
| 6. AI Engine | 20 min | After 5 | MSG-02, MSG-16 |
| 7. Handler | 30 min | After 3,4,6 | All (integration) |
| 8. POST Endpoint | 20 min | After 7 | MSG-01, MSG-13, MSG-17 |
| 9. Deploy & Test | 30 min | After 8 | All (validation) |

**Total estimated time:** ~3.5 hours of focused work
