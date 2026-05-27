# Messenger Auto-Reply Specification

## Problem Statement

A self-employed metal fabricator loses productivity every time he stops to reply to Facebook Messenger inquiries. If he ignores them, he loses potential clients. He needs an AI that responds immediately and naturally, handling the initial conversation until a real human is needed.

## Goals

- [ ] Every incoming Messenger message gets a reply within 5 seconds
- [ ] Conversations feel natural and reflect the fabricator's casual, friendly tone
- [ ] Potential clients get their basic questions answered (services, area, process) without human involvement
- [ ] Complex or high-value inquiries get flagged so the fabricator can follow up later

## Out of Scope

| Feature | Reason |
| --- | --- |
| Scheduling calls/visits | Deferred to v2 |
| Sending images or media | Meta Send API text-only for v1 |
| Price quoting | Too risky for AI to commit to numbers |
| Multi-platform (Instagram, WhatsApp) | One platform first, expand later |
| Admin dashboard | No UI needed for v1 |
| Payment collection | Out of project scope entirely |

---

## User Stories

### P1: Receive and respond to messages ⭐ MVP

**User Story**: As a potential client, I want to message the fabricator's page and get an immediate, helpful response so that I know my inquiry was received and I can get basic info without waiting.

**Why P1**: This is the entire point of the app — no response means no value.

**Acceptance Criteria**:

1. WHEN a client sends a text message to the Facebook Business Page THEN the system SHALL receive the message via webhook within 2 seconds
2. WHEN a message is received THEN the system SHALL generate an AI reply and send it back within 5 seconds
3. WHEN the AI replies THEN the reply SHALL be relevant to the client's message content
4. WHEN the client asks about services THEN the AI SHALL answer based on the configured business context (general fabrication, ornamental work, repairs)
5. WHEN the client asks about service area THEN the AI SHALL indicate regional availability (travel within a few hours)

**Independent Test**: Send a test message to the page asking "Do you do custom gates?" and verify a relevant reply arrives within seconds.

---

### P1: Maintain conversation context ⭐ MVP

**User Story**: As a potential client, I want the bot to remember what I said earlier in the conversation so that I don't have to repeat myself.

**Why P1**: Without context, the AI gives disjointed responses and frustrates clients.

**Acceptance Criteria**:

1. WHEN a client sends multiple messages THEN the system SHALL include the full conversation history when generating each reply
2. WHEN a returning client messages after a gap (< 24 hours) THEN the system SHALL continue the existing conversation context
3. WHEN a conversation is older than 24 hours and the client messages again THEN the system SHALL start a fresh conversation with a friendly re-greeting

**Independent Test**: Send "I need a railing" then follow up with "How much would that cost?" and verify the AI knows "that" refers to a railing.

---

### P1: Natural casual tone ⭐ MVP

**User Story**: As the fabricator, I want the AI to sound like me — casual and friendly — so that clients don't realize they're talking to a bot.

**Why P1**: A robotic tone defeats the purpose — clients would feel ghosted by a machine instead of a person.

**Acceptance Criteria**:

1. WHEN the AI generates a reply THEN it SHALL use casual language (contractions, short sentences, no corporate jargon)
2. WHEN a client greets casually (e.g., "hey", "what's up") THEN the AI SHALL respond in kind with a matching casual energy
3. WHEN the AI doesn't know something specific THEN it SHALL say something like "I'd have to take a look at that to give you a real number — mind if I call you back on that?" rather than a generic "I cannot provide that information"

**Independent Test**: Send a casual greeting and verify the reply feels like a friend texting back, not a customer service script.

---

### P2: Graceful handoff acknowledgment

**User Story**: As a potential client, I want to be told that the fabricator will personally follow up on complex questions so that I don't feel ghosted or stuck in a bot loop.

**Why P2**: Not all questions can be answered by AI — clients need to know a human will circle back.

**Acceptance Criteria**:

1. WHEN the client asks for a specific price quote THEN the AI SHALL not invent a number and SHALL instead say the fabricator will reach out with details
2. WHEN the client seems frustrated or confused THEN the AI SHALL acknowledge and promise human follow-up
3. WHEN a handoff is triggered THEN the conversation SHALL be marked with a "needs_followup" flag in storage

**Independent Test**: Ask "How much would a 20-foot wrought iron fence with custom scroll design cost?" and verify the AI defers to the fabricator rather than making up a price.

---

### P2: Handle non-text messages gracefully

**User Story**: As a potential client, I want to send photos of my project and not get an error so that the conversation doesn't break.

**Why P2**: Clients frequently send reference photos — the bot shouldn't crash or go silent.

**Acceptance Criteria**:

1. WHEN a client sends an image, sticker, or attachment THEN the system SHALL acknowledge receipt (e.g., "Got it! I'll make sure he sees that")
2. WHEN a client sends only a thumbs-up reaction THEN the system SHALL not reply (avoid unnecessary messages)
3. WHEN a client sends a voice message THEN the system SHALL say something like "I can't listen to that right now but I'll pass it along"

**Independent Test**: Send an image to the page and verify the bot acknowledges it without crashing.

---

### P3: Typing indicator

**User Story**: As a potential client, I want to see a typing indicator while the bot is generating a reply so that I know a response is coming.

**Why P3**: Nice UX touch but not critical for functionality.

**Acceptance Criteria**:

1. WHEN a message is received and processing starts THEN the system SHALL send a typing_on sender action before generating the reply
2. WHEN the reply is sent THEN the system SHALL send typing_off

**Independent Test**: Send a message and observe the typing bubble appearing before the reply arrives.

---

## Edge Cases

- WHEN Meta sends a duplicate webhook event (same message ID) THEN the system SHALL ignore the duplicate and not send a second reply
- WHEN the AI provider (Groq) is unavailable or rate-limited THEN the system SHALL send a fallback reply: "Hey! Got your message — I'll get back to you shortly"
- WHEN the webhook receives a non-message event (e.g., message_read, delivery) THEN the system SHALL ignore it silently
- WHEN a message contains only emojis THEN the AI SHALL respond naturally (not ignore it)
- WHEN the conversation history exceeds the LLM context window THEN the system SHALL truncate older messages, keeping the most recent 20 exchanges
- WHEN Meta's Send API fails THEN the system SHALL retry once after 2 seconds, then log the failure

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MSG-01 | P1: Receive and respond - webhook receipt | Design | Pending |
| MSG-02 | P1: Receive and respond - AI reply generation | Design | Pending |
| MSG-03 | P1: Receive and respond - send reply back | Design | Pending |
| MSG-04 | P1: Receive and respond - business context answers | Design | Pending |
| MSG-05 | P1: Conversation context - history tracking | Design | Pending |
| MSG-06 | P1: Conversation context - 24h session continuity | Design | Pending |
| MSG-07 | P1: Conversation context - fresh start after 24h | Design | Pending |
| MSG-08 | P1: Casual tone - language style | Design | Pending |
| MSG-09 | P1: Casual tone - graceful uncertainty | Design | Pending |
| MSG-10 | P2: Handoff - no price invention | Design | Pending |
| MSG-11 | P2: Handoff - needs_followup flag | Design | Pending |
| MSG-12 | P2: Non-text - image acknowledgment | Design | Pending |
| MSG-13 | P2: Non-text - reaction ignore | Design | Pending |
| MSG-14 | P3: Typing indicator | Design | Pending |
| MSG-15 | Edge: Duplicate message dedup | Design | Pending |
| MSG-16 | Edge: AI provider fallback | Design | Pending |
| MSG-17 | Edge: Non-message event filtering | Design | Pending |
| MSG-18 | Edge: Context window truncation | Design | Pending |
| MSG-19 | Edge: Send API retry | Design | Pending |

**Coverage:** 19 total, 0 mapped to tasks, 19 unmapped

---

## Success Criteria

- [ ] A message sent to the Facebook page receives an AI reply within 5 seconds
- [ ] The AI maintains conversational context across multiple messages
- [ ] The AI never invents pricing or makes commitments the fabricator hasn't authorized
- [ ] The AI sounds casual and natural — indistinguishable from a quick text reply by a real person
- [ ] Zero crashes from unexpected message types (images, stickers, reactions)
