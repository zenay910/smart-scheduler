# Smart Scheduler

**Vision:** An AI-powered Facebook Messenger auto-responder that handles initial client conversations for a self-employed metal fabricator, so he can keep working without ghosting potential clients.

**For:** A self-employed metal fabricator who receives client inquiries via his Facebook Business Page.

**Solves:** Constant workflow interruptions from Messenger notifications. The fabricator either stops working to reply (loses productivity) or ignores messages (loses clients). The AI handles the initial conversation automatically.

## Goals

- Respond to every incoming Messenger inquiry within seconds, 24/7
- Maintain natural, professional conversations that reflect the fabricator's tone
- Collect basic project details from potential clients (what they need, timeline, budget range)
- Guide interested clients toward scheduling a call or visit (v2)
- Zero ongoing cost for the fabricator

## Tech Stack

**Core:**

- Framework: Next.js 16 (App Router)
- Language: TypeScript 5
- Storage: Postgres

**Key dependencies:**

- Vercel AI SDK (LLM orchestration)
- Groq API (free Llama 3.3 70B inference)
- Meta Graph API (Messenger Platform)
- Vercel (hosting, serverless functions)

## Scope

**v1 includes:**

- Receive messages from Facebook Messenger via webhook
- Generate intelligent, context-aware AI replies using conversation history
- Send replies back through Meta Send API
- Maintain conversation state per client (multi-turn)
- Hardcoded business context (services, tone, boundaries)

**Explicitly out of scope:**

- Scheduling / calendar integration (v2)
- Owner dashboard or admin UI (v3)
- Payment processing or deposits
- Multi-platform support (Instagram, WhatsApp, etc.)
- CRM or client database
- Automated price quoting
- Multiple employees / team management

## Constraints

- Timeline: Working prototype within 1-2 weeks
- Budget: $0/month — free tiers only (Vercel Hobby, Groq free, Vercel KV free)
- User skill: Owner is not tech-savvy — developer (Daniel) handles all setup and config
- Meta API: Requires Facebook Business Page + approved Meta App
