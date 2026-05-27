const META_API_URL = "https://graph.facebook.com/v21.0/me/messages";

function getAccessToken(): string {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN is not set");
  return token;
}

async function callSendAPI(body: Record<string, unknown>): Promise<void> {
  const url = `${META_API_URL}?access_token=${getAccessToken()}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.ok) return;

  if (response.status >= 500) {
    await new Promise((r) => setTimeout(r, 2000));
    const retry = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!retry.ok) {
      console.error(
        `Meta Send API retry failed: ${retry.status}`,
        await retry.text()
      );
    }
    return;
  }

  console.error(
    `Meta Send API error: ${response.status}`,
    await response.text()
  );
}

export async function sendTextMessage(
  recipientId: string,
  text: string
): Promise<void> {
  await callSendAPI({
    recipient: { id: recipientId },
    messaging_type: "RESPONSE",
    message: { text },
  });
}

export async function sendTypingIndicator(
  recipientId: string,
  on: boolean
): Promise<void> {
  await callSendAPI({
    recipient: { id: recipientId },
    sender_action: on ? "typing_on" : "typing_off",
  });
}
