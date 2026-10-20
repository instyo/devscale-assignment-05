import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@anvia/react-ui";

export function ChatThread() {
  return (
    <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
        <ThreadPrimitive.Empty>
          <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-4 text-sm text-zinc-400">
            Send a message to start this chat.
          </div>
        </ThreadPrimitive.Empty>

        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          <ThreadPrimitive.Messages>
            <MessagePrimitive.Root className="group mb-6 flex w-full data-[role=user]:justify-end data-[role=assistant]:justify-start">
              <MessagePrimitive.Content className="max-w-[min(85%,36rem)] text-[15px] leading-7 text-zinc-800 group-data-[role=user]:rounded-3xl group-data-[role=user]:bg-zinc-100 group-data-[role=user]:px-4 group-data-[role=user]:py-2.5 group-data-[role=assistant]:max-w-none group-data-[role=assistant]:bg-transparent group-data-[role=assistant]:px-0">
                <MessagePrimitive.Parts>
                  {(part) =>
                    part.type === "text" ? (
                      <MessagePrimitive.Markdown className="prose prose-zinc prose-sm max-w-none prose-p:my-2 prose-p:leading-7 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:leading-7 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0 prose-strong:font-semibold prose-strong:text-zinc-900 prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-xl prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-a:text-zinc-900" />
                    ) : part.type === "tool" ? (
                      <MessagePrimitive.Tool className="my-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                        <span className="font-medium">
                          <MessagePrimitive.ToolName />
                        </span>{" "}
                        <MessagePrimitive.ToolStatus />
                      </MessagePrimitive.Tool>
                    ) : (
                      <MessagePrimitive.Part />
                    )
                  }
                </MessagePrimitive.Parts>
              </MessagePrimitive.Content>
            </MessagePrimitive.Root>
          </ThreadPrimitive.Messages>

          <ThreadPrimitive.Loading className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
            <span className="inline-flex gap-1">
              <Dot />
              <Dot className="animation-delay-150" />
              <Dot className="animation-delay-300" />
            </span>
            Thinking…
          </ThreadPrimitive.Loading>

          <ThreadPrimitive.Error className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(error) =>
              error instanceof Error ? error.message : "Something went wrong"
            }
          </ThreadPrimitive.Error>
        </div>
      </ThreadPrimitive.Viewport>

      <div className="shrink-0 border-t border-zinc-100 bg-white px-3 pb-4 pt-3 md:px-4">
        <div className="mx-auto w-full max-w-3xl">
          <ComposerPrimitive.Root className="flex items-end gap-2 rounded-3xl border border-zinc-200 bg-white px-3 py-2 shadow-sm focus-within:border-zinc-300 focus-within:shadow-md">
            <ComposerPrimitive.Input
              placeholder="Message Onboarding Buddy…"
              className="composer-input max-h-48 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <ComposerPrimitive.Stop className="mb-1 rounded-full px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40">
              Stop
            </ComposerPrimitive.Stop>
            <ComposerPrimitive.Submit className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400">
              <SendIcon />
            </ComposerPrimitive.Submit>
          </ComposerPrimitive.Root>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Onboarding Buddy can make mistakes. Verify important company
            policies with People / HR.
          </p>
        </div>
      </div>
    </ThreadPrimitive.Root>
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

function Dot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 ${className}`}
    />
  );
}
