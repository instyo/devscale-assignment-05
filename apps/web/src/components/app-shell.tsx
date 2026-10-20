import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sidebar } from "./sidebar";
import type { SessionSummary } from "../lib/session";

type AppShellProps = {
  children: ReactNode;
  sessions?: readonly SessionSummary[];
  activeSessionId?: string;
  title?: string;
};

export function AppShell({
  children,
  sessions = [],
  activeSessionId,
  title = "PT Medioker Onboarding Buddy",
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 bg-white">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-100 px-3 md:px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
            aria-label="Open sidebar"
          >
            <MenuIcon />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-zinc-800">
              {title}
            </h1>
          </div>
          <Link
            to="/"
            className="hidden rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 sm:inline-flex"
          >
            New chat
          </Link>
        </header>

        {children}
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
