# State

**Last Updated:** 2026-05-26T19:30:00-06:00
**Current Work:** messenger-autoreply - Task 9 (Deploy & Test) — awaiting credentials

---

## Recent Decisions (Last 60 days)

### AD-001: Use Groq free tier for LLM inference (2026-05-26)

**Decision:** Use Groq's free API tier with Llama 3.3 70B instead of OpenAI
**Reason:** Zero budget constraint — Groq free tier offers 30 req/min, 14.4k req/day
**Trade-off:** Less capable than GPT-4o for nuanced conversation, but sufficient for v1
**Impact:** No API costs, slightly different prompt engineering needed for Llama models

### AD-002: Use Vercel KV instead of Postgres (2026-05-26)

**Decision:** Store conversation history in Vercel KV (Redis) rather than a relational database
**Reason:** Simpler setup, no schema migrations, free tier sufficient for low volume (30k req/month)
**Trade-off:** No relational queries, harder to analyze conversations later
**Impact:** Key-value storage pattern for conversations, TTL-based expiry for stale conversations

### AD-003: Hardcode business context instead of settings UI (2026-05-26)

**Decision:** Put fabricator's business info directly in a system prompt file, not a database
**Reason:** v1 has no dashboard — Daniel edits the code directly to update business info
**Trade-off:** Requires redeployment for content changes
**Impact:** Simpler architecture, one less component to build

### AD-004: No dashboard in v1 (2026-05-26)

**Decision:** Skip the admin dashboard entirely for the first version
**Reason:** Tight timeline + fabricator is not tech-savvy anyway — he wouldn't use it
**Trade-off:** No visibility into conversations unless checking Messenger directly
**Impact:** Fewer components to build, faster delivery

### AD-005: Use Upstash Redis instead of Vercel KV (2026-05-26)

**Decision:** Switched from deprecated @vercel/kv to @upstash/redis
**Reason:** Vercel KV is deprecated; Upstash is the recommended replacement with a free tier
**Trade-off:** Slightly different env var names (UPSTASH_REDIS_REST_URL/TOKEN)
**Impact:** Lazy-init Redis client to avoid build failures with placeholder env vars

---

## Active Blockers

### B-001: External credentials required for end-to-end test

**Discovered:** 2026-05-26
**Impact:** Cannot deploy or test live Messenger flow without Meta + Groq + Upstash credentials
**Workaround:** Code builds locally; webhook GET verification can be tested with curl
**Resolution:** Daniel configures env vars and Meta App, then deploys to Vercel

---

## Lessons Learned

None yet.

---

## Quick Tasks Completed

| #   | Description | Date | Commit | Status |
| --- | ----------- | ---- | ------ | ------ |

---

## Deferred Ideas

- [ ] Let fabricator send a "keyword" message to take over a conversation manually — Captured during: project init
- [ ] Auto-send portfolio photos when clients ask about past work — Captured during: project init
- [ ] Weekly summary email of all conversations to the fabricator — Captured during: project init

---

## Todos

- [ ] Gather fabricator's business details (services, pricing ranges, tone) for system prompt
- [ ] Confirm fabricator has a Facebook Business Page set up
- [ ] Get Meta App approved for Messenger API access

---

## Preferences

**Model Guidance Shown:** never
