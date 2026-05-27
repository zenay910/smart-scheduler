import { generateReply } from "./ai/generate-reply";
import {
  getConversation,
  isMessageProcessed,
  markMessageProcessed,
  saveConversation,
  type ConversationState,
} from "./kv/conversations";
import { sendTextMessage, sendTypingIndicator } from "./meta/send";

const STALE_CONVERSATION_MS = 24 * 60 * 60 * 1000;

function createEmptyConversation(): ConversationState {
  return {
    messages: [],
    lastMessageAt: Date.now(),
    needsFollowup: false,
    messageCount: 0,
  };
}

function isStale(lastMessageAt: number): boolean {
  return Date.now() - lastMessageAt > STALE_CONVERSATION_MS;
}

function toUserContent(text?: string, hasAttachments?: boolean): string {
  if (text?.trim()) return text.trim();
  if (hasAttachments) return "[Client sent an image/attachment]";
  return "[Client sent a message]";
}

export async function handleIncomingMessage(
  senderId: string,
  messageId: string,
  text?: string,
  hasAttachments?: boolean
): Promise<void> {
  if (await isMessageProcessed(senderId, messageId)) {
    return;
  }

  await markMessageProcessed(senderId, messageId);

  let conversation = await getConversation(senderId);
  if (!conversation || isStale(conversation.lastMessageAt)) {
    conversation = createEmptyConversation();
  }

  const userContent = toUserContent(text, hasAttachments);
  conversation.messages.push({ role: "user", content: userContent });

  void sendTypingIndicator(senderId, true);

  const { text: replyText, needsFollowup } = await generateReply(
    conversation.messages
  );

  conversation.messages.push({ role: "assistant", content: replyText });
  conversation.lastMessageAt = Date.now();
  conversation.messageCount += 1;
  conversation.needsFollowup = conversation.needsFollowup || needsFollowup;

  await saveConversation(senderId, conversation);

  try {
    await sendTextMessage(senderId, replyText);
  } finally {
    void sendTypingIndicator(senderId, false);
  }
}
