# Roadmap

**Current Milestone:** v1 - Intelligent Auto-Reply
**Status:** In Progress

---

## v1 - Intelligent Auto-Reply

**Goal:** Every Messenger inquiry gets an immediate, intelligent AI response without the fabricator lifting a finger.
**Target:** 1-2 weeks

### Features

**Messenger Webhook Integration** - IN PROGRESS

- Receive incoming messages via Meta webhook
- Verify webhook subscription (GET challenge)
- Parse message events and extract text content

**AI Conversation Engine** - PLANNED

- Generate contextual replies using Groq (Llama 3.3 70B)
- Maintain multi-turn conversation history per sender
- System prompt with business context, tone, and guardrails

**Message Reply Delivery** - PLANNED

- Send AI-generated replies back via Meta Send API
- Handle API errors and retries gracefully

---

## v2 - Scheduling Integration

**Goal:** Clients can book a call or shop visit directly through the conversation.

### Features

**Google Calendar Integration** - PLANNED

- Check fabricator's availability
- Create appointment events
- Respect working hours

**AI Scheduling Tools** - PLANNED

- AI can offer available time slots
- AI can confirm bookings
- Confirmation messages to both parties

---

## v3 - Owner Dashboard

**Goal:** Fabricator can see conversations, manage settings, and handle escalations.

### Features

**Conversation Viewer** - PLANNED
**Settings Management** - PLANNED
**Escalation Queue** - PLANNED
**Email/SMS Notifications** - PLANNED

---

## Future Considerations

- Instagram DM support (same Meta API)
- WhatsApp Business integration
- Simple CRM / client history
- Photo/portfolio sharing in conversations
- Automated follow-ups for stale leads
