export interface WebhookBody {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<MessagingEvent>;
  }>;
}

export interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{ type: string; payload?: { url?: string } }>;
  };
  reaction?: {
    action: string;
    reaction: string;
    emoji?: string;
    mid: string;
  };
  read?: { watermark: number };
  delivery?: { watermark: number };
}
