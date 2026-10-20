import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { AppShell } from "../components/app-shell";
import { fetchSessions, setPendingMessage } from "../lib/session";

const SUGGESTIONS = [
  "What should I do in my first week?",
  "Who do I ask about benefits and leave?",
  "What does good look like by day 30?",
  "Tell me about Medioker culture",
];

export const Route = createFileRoute("/")({
  loader: async () => {
    const sessions = await fetchSessions();
    return { sessions };
  },
  component: HomePage,
});

function HomePage() {
  const { sessions } = Route.useLoaderData();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function startChat(message: string) {
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const id = crypto.randomUUID();
    // Survives navigation + Strict Mode remounts until the session page finishes.
    setPendingMessage(id, trimmed);
    await navigate({
      to: "/s/$id",
      params: { id },
      // Also pass via search so the session page can boot even if storage is flaky.
      search: { q: trimmed },
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void startChat(text);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void startChat(text);
    }
  }

  return (
    <AppShell sessions={sessions}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white">
            M
          </div>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">
            How can I help you today?
          </h2>
          <p className="mb-8 max-w-md text-center text-sm text-zinc-500">
            Your PT Medioker onboarding guide for the first days and months.
          </p>

          <div className="mb-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={submitting}
                onClick={() => void startChat(suggestion)}
                className="rounded-2xl border border-zinc-200 px-4 py-3 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-100 bg-white px-3 pb-4 pt-3 md:px-4">
          <form
            onSubmit={onSubmit}
            className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl border border-zinc-200 bg-white px-3 py-2 shadow-sm focus-within:border-zinc-300 focus-within:shadow-md"
          >
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message Onboarding Buddy…"
              rows={1}
              disabled={submitting}
              className="composer-input max-h-48 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Onboarding Buddy can make mistakes. Verify important company
            policies with People / HR.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
