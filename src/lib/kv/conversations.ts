import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token || url.includes("your_upstash")) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured"
      );
    }

    redis = new Redis({ url, token });
  }

  return redis;
}

export interface ConversationState {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  lastMessageAt: number;
  needsFollowup: boolean;
  messageCount: number;
}

const CONVERSATION_TTL = 7 * 24 * 60 * 60; // 7 days
const DEDUP_TTL = 60 * 60; // 1 hour
const MAX_MESSAGES = 40; // 20 pairs

export async function getConversation(
  senderId: string
): Promise<ConversationState | null> {
  return getRedis().get<ConversationState>(`conv:${senderId}`);
}

export async function saveConversation(
  senderId: string,
  state: ConversationState
): Promise<void> {
  const trimmed = {
    ...state,
    messages: state.messages.slice(-MAX_MESSAGES),
  };
  await getRedis().set(`conv:${senderId}`, trimmed, { ex: CONVERSATION_TTL });
}

export async function isMessageProcessed(
  senderId: string,
  messageId: string
): Promise<boolean> {
  const ids = await getRedis().get<string[]>(`dedup:${senderId}`);
  if (!ids) return false;
  return ids.includes(messageId);
}

export async function markMessageProcessed(
  senderId: string,
  messageId: string
): Promise<void> {
  const ids = (await getRedis().get<string[]>(`dedup:${senderId}`)) || [];
  const updated = [...ids, messageId].slice(-50);
  await getRedis().set(`dedup:${senderId}`, updated, { ex: DEDUP_TTL });
}
