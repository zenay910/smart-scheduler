import { handleIncomingMessage } from "@/lib/conversation";
import type { MessagingEvent, WebhookBody } from "@/lib/meta/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

function shouldProcessEvent(event: MessagingEvent): boolean {
  if (event.reaction) return false;
  if (event.read || event.delivery) return false;
  if (!event.message) return false;
  if (event.message.is_echo) return false;
  return true;
}

async function processWebhookEvent(event: MessagingEvent): Promise<void> {
  if (!shouldProcessEvent(event) || !event.message) return;

  const senderId = event.sender.id;
  const { mid: messageId, text, attachments } = event.message;
  const hasAttachments = Boolean(attachments?.length);

  await handleIncomingMessage(senderId, messageId, text, hasAttachments);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookBody;

    if (body.object !== "page") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const events = body.entry?.flatMap((entry) => entry.messaging ?? []) ?? [];

    await Promise.allSettled(events.map(processWebhookEvent));
  } catch (error) {
    console.error("Webhook processing error:", error);
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
