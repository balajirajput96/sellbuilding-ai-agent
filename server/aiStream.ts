import type { Express, Request, Response as ExpressResponse } from "express";
import { z } from "zod";
import * as db from "./db";
import { invokeLLMStream } from "./_core/llm";
import { sdk } from "./_core/sdk";

const bodySchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
  conversationId: z.number().int().positive().optional(),
});

function pickDelta(payload: unknown): string {
  const content = (payload as { choices?: Array<{ delta?: { content?: unknown } }> }).choices?.[0]?.delta?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(part => typeof part === "object" && part && "text" in part ? String((part as { text?: unknown }).text ?? "") : "").join("");
  }
  return "";
}

async function forwardStream(upstream: globalThis.Response, res: ExpressResponse) {
  const reader = upstream.body?.getReader();
  if (!reader) throw new Error("The AI response stream is unavailable");
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";
  let finished = false;
  res.on("close", () => {
    if (!finished) void reader.cancel();
  });

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split(/\r?\n/)) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const delta = pickDelta(JSON.parse(data));
          if (delta) {
            result += delta;
            res.write(`data: ${JSON.stringify({ type: "delta", delta })}\n\n`);
          }
        } catch {
          // Ignore malformed upstream keep-alive events.
        }
      }
    }
  }
  finished = true;
  return result;
}

export function registerAIStreamRoutes(app: Express) {
  app.post("/api/ai/chat/stream", async (req: Request, res: ExpressResponse) => {
    let taskRunId: number | undefined;
    try {
      const user = await sdk.authenticateRequest(req);
      if (user.isCron) return res.status(403).json({ error: "Interactive chat only" });
      const input = bodySchema.parse(req.body);
      const existingConversationId = input.conversationId;
      const conversation = existingConversationId
        ? await db.getConversation(user.id, existingConversationId)
        : await db.createConversation(user.id, input.prompt.slice(0, 80));
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });

      const history = await db.getConversationMessages(user.id, conversation.id);
      await db.addChatMessage({ userId: user.id, conversationId: conversation.id, role: "user", content: input.prompt });
      taskRunId = await db.createTaskRun({
        userId: user.id,
        conversationId: conversation.id,
        type: "chat",
        title: conversation.title,
        input: input.prompt,
      });
      const upstream = await invokeLLMStream({
        messages: [
          { role: "system", content: "You are a precise, helpful personal AI agent. Write clear answers, use Markdown when helpful, and keep code runnable." },
          ...history.filter(message => message.role !== "system").map(message => ({ role: message.role, content: message.content })),
          { role: "user", content: input.prompt },
        ],
        maxTokens: 2600,
      });

      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      const output = await forwardStream(upstream, res);
      await db.addChatMessage({ userId: user.id, conversationId: conversation.id, role: "assistant", content: output || "No response was returned." });
      await db.completeTaskRun(taskRunId, output || "No response was returned.");
      res.write(`data: ${JSON.stringify({ type: "done", conversationId: conversation.id })}\n\n`);
      res.end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI Chat Agent failed";
      if (taskRunId) await db.failTaskRun(taskRunId, message).catch(() => undefined);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: message });
      }
    }
  });
}
