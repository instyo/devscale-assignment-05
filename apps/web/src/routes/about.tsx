import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>
      <p className="text-zinc-600">
        Basic monorepo workspace with pnpm, Hono API, and React web app.
      </p>
    </div>
  );
}
