import { createHttpClientTransport, type UIMessage } from "@anvia/client";
import { initialMessagesFromMemory, useChat } from "@anvia/react";
import { ChatProvider } from "@anvia/react-ui";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { AppShell } from "../components/app-shell";
import { ChatThread } from "../components/chat-thread";
import {
  clearPendingMessage,
  DEFAULT_USER_ID,
  fetchSessionMessages,
  fetchSessions,
  peekPendingMessage,
  type SessionSummary,
} from "../lib/session";

type SessionSearch = {
  q?: string;
};

export const Route = createFileRoute("/s/$id")({
  validateSearch: (search: Record<string, unknown>): SessionSearch => ({
    q: typeof search.q === "string" && search.q.trim() ? search.q : undefined,
  }),
  // Always refetch when switching sessions so the message list is correct.
  staleTime: 0,
  loader: async ({ params }) => {
    const [sessions, session] = await Promise.all([
      fetchSessions(),
      fetchSessionMessages(params.id).catch(() => ({
        sessionId: params.id,
        messages: [] as Parameters<typeof initialMessagesFromMemory>[0],
      })),
    ]);

    return {
      sessionId: params.id,
      sessions,
      initialMessages: initialMessagesFromMemory(session.messages ?? []),
    };
  },
  component: SessionPage,
});

function SessionPage() {
  const { sessionId, sessions, initialMessages } = Route.useLoaderData();
  const { q } = Route.useSearch();

  const title =
    sessions.find((session) => session.id === sessionId)?.title ??
    "Onboarding chat";

  return (
    <AppShell sessions={sessions} activeSessionId={sessionId} title={title}>
      {/* key forces a fresh useChat when switching sessions in the sidebar */}
      <SessionChat
        key={sessionId}
        sessionId={sessionId}
        sessions={sessions}
        initialMessages={initialMessages}
        bootPrompt={q ?? peekPendingMessage(sessionId) ?? undefined}
      />
    </AppShell>
  );
}

type SessionChatProps = {
  sessionId: string;
  sessions: readonly SessionSummary[];
  initialMessages: readonly UIMessage[];
  /** First user message coming from `/` (preset or composer). */
  bootPrompt?: string;
};

function SessionChat({
  sessionId,
  initialMessages,
  bootPrompt,
}: SessionChatProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const chatRef = useRef<ReturnType<typeof useChat> | null>(null);
  const bootingRef = useRef(false);

  const transport = useMemo(
    () =>
      createHttpClientTransport({
        endpoint: "/api/chat",
        format: "jsonl",
        headers: {
          "x-session-id": sessionId,
          "x-user-id": DEFAULT_USER_ID,
        },
      }),
    [sessionId],
  );

  const chat = useChat({
    transport,
    initialMessages,
  });
  chatRef.current = chat;

  // Boot the first message from `/`. Delayed so React Strict Mode's
  // remount+abort cycle does not kill the in-flight agent stream.
  useEffect(() => {
    const prompt = bootPrompt?.trim();
    if (!prompt) return;
    // Session already has history — just clean up boot state.
    if (initialMessages.length > 0) {
      clearPendingMessage(sessionId);
      void navigate({
        to: "/s/$id",
        params: { id: sessionId },
        search: {},
        replace: true,
      });
      return;
    }
    if (bootingRef.current) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || bootingRef.current) return;
      bootingRef.current = true;

      void (async () => {
        try {
          // If a previous (aborted) attempt already finished on the server, just load it.
          const existing = await fetchSessionMessages(sessionId).catch(() => null);
          if (cancelled) return;
          if (existing && (existing.messages?.length ?? 0) > 0) {
            chatRef.current?.setMessages(
              initialMessagesFromMemory(existing.messages ?? []),
            );
          } else {
            await chatRef.current?.sendMessage({ text: prompt });
          }
        } catch (error) {
          console.error("[chat] boot send failed:", error);
        } finally {
          // Aborted by Strict Mode remount — leave pending so the next mount retries.
          if (cancelled) {
            bootingRef.current = false;
            return;
          }

          // Re-sync canonical history (covers dropped client stream frames).
          try {
            const latest = await fetchSessionMessages(sessionId);
            const next = initialMessagesFromMemory(latest.messages ?? []);
            if (next.length > 0) {
              chatRef.current?.setMessages(next);
            }
          } catch (error) {
            console.error("[chat] boot resync failed:", error);
          }

          clearPendingMessage(sessionId);
          void navigate({
            to: "/s/$id",
            params: { id: sessionId },
            search: {},
            replace: true,
          });
          void router.invalidate();
          bootingRef.current = false;
        }
      })();
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Only boot once per session mount — not on every chat identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <ChatProvider controller={chat}>
      <ChatThread />
    </ChatProvider>
  );
}
