import { Link } from "@tanstack/react-router";
import type { SessionSummary } from "../lib/session";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  sessions: readonly SessionSummary[];
  activeSessionId?: string;
};

export function Sidebar({
  open,
  onClose,
  sessions,
  activeSessionId,
}: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 transition md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-zinc-900 text-zinc-100 transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 p-3">
          <Link
            to="/"
            onClick={onClose}
            className="flex flex-1 items-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm font-medium hover:bg-white/10"
          >
            <span className="text-lg leading-none">+</span>
            New chat
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Recent
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {sessions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-500">No chats yet</p>
          ) : (
            sessions.map((session) => {
              const active = session.id === activeSessionId;
              return (
                <Link
                  key={session.id}
                  to="/s/$id"
                  params={{ id: session.id }}
                  onClick={onClose}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/10 ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-zinc-300"
                  }`}
                  title={session.title}
                >
                  <span className="truncate">{session.title}</span>
                </Link>
              );
            })
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold">
              M
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">Medioker Buddy</div>
              <div className="truncate text-xs text-zinc-500">
                Onboarding guide
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
