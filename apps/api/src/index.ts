import { serve } from "@hono/node-server";
import { agentToClientStream, parseClientStreamRequest } from "@anvia/client";
import { createClientStreamResponse } from "@anvia/server";
import { runAgent } from "@repo/agents";
import { memory } from "@repo/db";
import { Hono } from "hono";
import { cors } from "hono/cors";

const DEFAULT_USER_ID = "default";

await memory.validate();

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    allowHeaders: ["Content-Type", "x-session-id", "x-user-id"],
    exposeHeaders: ["x-anvia-stream-protocol"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

function resolveUserId(
  metadata: Record<string, unknown> | undefined,
  headerUserId: string | undefined,
  queryUserId: string | undefined,
) {
  if (typeof metadata?.userId === "string" && metadata.userId) {
    return metadata.userId;
  }
  if (headerUserId) return headerUserId;
  if (queryUserId) return queryUserId;
  return DEFAULT_USER_ID;
}

function resolveSessionId(
  metadata: Record<string, unknown> | undefined,
  headerSessionId: string | undefined,
  querySessionId: string | undefined,
) {
  if (typeof metadata?.sessionId === "string" && metadata.sessionId) {
    return metadata.sessionId;
  }
  return headerSessionId ?? querySessionId;
}

function messagePreview(message: unknown): string {
  if (!message || typeof message !== "object") return "New chat";

  const role = (message as { role?: unknown }).role;
  const content = (message as { content?: unknown }).content;
  if (role !== "user") return "New chat";

  if (typeof content === "string") {
    const text = content.trim();
    return text ? truncate(text) : "New chat";
  }

  if (!Array.isArray(content)) return "New chat";

  const text = content
    .filter(
      (part): part is { type: "text"; text: string } =>
        typeof part === "object" &&
        part !== null &&
        "type" in part &&
        (part as { type: unknown }).type === "text" &&
        "text" in part &&
        typeof (part as { text: unknown }).text === "string",
    )
    .map((part) => part.text)
    .join(" ")
    .trim();

  return text ? truncate(text) : "New chat";
}

function truncate(text: string, max = 48) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// List sessions for the sidebar (user-scoped; default user)
app.get("/api/chat/sessions", async (c) => {
  try {
    const userId = resolveUserId(
      undefined,
      c.req.header("x-user-id") ?? undefined,
      c.req.query("userId") ?? undefined,
    );

    const conversations =
      (await memory.inspector?.listConversations({
        limit: 50,
        userId,
      })) ?? [];

    const sessions = await Promise.all(
      conversations.map(async (conversation) => {
        const full = await memory.inspector?.getConversation({
          ref: conversation.ref,
        });
        const firstUser = full?.messages.find(
          (entry) => entry.message.role === "user",
        );

        return {
          id: conversation.sessionId,
          title: messagePreview(firstUser?.message),
          updatedAt: conversation.updatedAt,
          messageCount: conversation.messageCount,
        };
      }),
    );

    return c.json({ sessions });
  } catch (error) {
    console.error("[chat] sessions list error:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list sessions",
      },
      500,
    );
  }
});

// Load persisted session messages for the web chat loader
app.get("/api/chat/session", async (c) => {
  try {
    const sessionId = resolveSessionId(
      undefined,
      c.req.header("x-session-id") ?? undefined,
      c.req.query("sessionId") ?? undefined,
    );

    if (!sessionId) {
      return c.json({ error: "Missing session id" }, 400);
    }

    const userId = resolveUserId(
      undefined,
      c.req.header("x-user-id") ?? undefined,
      c.req.query("userId") ?? undefined,
    );

    const messages = await memory.load({
      scope: { sessionId, userId },
    });

    return c.json({ sessionId, userId, messages });
  } catch (error) {
    console.error("[chat] session load error:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load session",
      },
      500,
    );
  }
});

// Same path the browser uses via Vite proxy: /api/chat
app.post("/api/chat", async (c) => {
  try {
    const body = parseClientStreamRequest(await c.req.json());

    if (body.type !== "messages") {
      return c.text("Interaction responses are not enabled", 400);
    }

    const metadata = body.metadata as Record<string, unknown> | undefined;
    const sessionId = resolveSessionId(
      metadata,
      c.req.header("x-session-id") ?? undefined,
      undefined,
    );

    if (!sessionId) {
      return c.json({ error: "Missing session id" }, 400);
    }

    const userId = resolveUserId(
      metadata,
      c.req.header("x-user-id") ?? undefined,
      undefined,
    );

    return createClientStreamResponse({
      events: agentToClientStream({
        events: runAgent({
          messages: body.messages,
          memory: { store: memory, savePolicy: "turn" },
          session: { sessionId, userId },
        }),
        mapError: (error) => {
          console.error("[chat] agent error:", error);
          return {
            message:
              error instanceof Error ? error.message : "The run failed",
            retryable: true,
          };
        },
      }),
      format: "jsonl",
    });
  } catch (error) {
    console.error("[chat] request error:", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start chat",
      },
      500,
    );
  }
});

const port = Number(process.env.PORT) || 3000;

console.log(`API listening on http://localhost:${port}`);
console.log(`Chat endpoint: http://localhost:${port}/api/chat`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
