import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { SYSTEM_PROMPT } from "./system-prompt";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const FALLBACK_MESSAGE =
  "Hey! Got your message — I'll get back to you shortly.";

export interface ReplyResult {
  text: string;
  needsFollowup: boolean;
}

export async function generateReply(
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ReplyResult> {
  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: SYSTEM_PROMPT,
      messages: history,
      maxOutputTokens: 300,
    });

    const needsFollowup = text.includes("[FOLLOWUP]");
    const cleanText = text.replace("[FOLLOWUP]", "").trim();

    return { text: cleanText || FALLBACK_MESSAGE, needsFollowup };
  } catch (error) {
    console.error("AI generation failed:", error);
    return { text: FALLBACK_MESSAGE, needsFollowup: true };
  }
}
