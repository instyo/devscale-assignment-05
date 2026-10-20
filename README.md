# PT Medioker Onboarding Buddy

Conversational onboarding assistant for new employees at **PT Medioker**. New joiners can ask about first-week checklists, culture, who to contact, tools, and what “good” looks like in month one — with durable multi-session chat backed by Postgres.

Built as a **pnpm monorepo** with Anvia agents, a Hono API, a React chat UI, and Prisma ORM 8 memory.

## What it does

- **Chat UI** (`apps/web`) — ChatGPT-style interface with sidebar session list
- **Streaming agent API** (`apps/api`) — Hono + Anvia client stream protocol
- **Onboarding agent** (`packages/agents`) — system prompt, static company context, optional Tavily web search
- **Session memory** (`packages/db`) — Prisma 8 + `@anvia/memory-prisma` stores conversations in PostgreSQL

### User flow

| Route | Behavior |
|-------|----------|
| `/` | New chat — composer + preset prompts only |
| `/s/:id` | Active session — full thread, loads history from memory |

Sending a message (or tapping a preset) creates a session id, navigates to `/s/:id`, and streams the agent reply. Sessions are scoped to `userId: "default"`.

## Stack

| Layer | Tech |
|-------|------|
| Web | React 19, Vite, Tailwind CSS 4, TanStack Router, `@anvia/react` / `@anvia/react-ui` |
| API | Hono, `@anvia/server`, `@anvia/client` |
| Agent | `@anvia/core`, `@anvia/openai`, Tavily |
| Data | PostgreSQL 16, Prisma ORM 8 (`@prisma/orm-postgres`), `@anvia/memory-prisma` |
| Workspace | pnpm monorepo |

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`corepack enable` recommended)
- **Docker** (for local Postgres)

## Project structure

```
apps/
  api/          # Hono API — /api/chat, session load/list
  web/          # React chat app (Vite)
packages/
  agents/       # Onboarding Buddy agent + evals
  db/           # Prisma 8 contract, client, memory store
docker-compose.dev.yml   # Postgres 16 on host port 5433
```

### `packages/agents`

| Path | Purpose |
|------|---------|
| `src/agents.ts` | `runAgent()` — model, tools, memory, stream |
| `src/models.ts` | OpenAI / DevScale gateway client |
| `src/instructions.ts` | System prompt (Onboarding Buddy) |
| `src/tools/web-search.ts` | Tavily `search-web` / `read-webpage` |
| `src/context/document.ts` | Static company context documents |
| `src/evals/` | Agent evaluation scenarios |

### `packages/db`

| Path | Purpose |
|------|---------|
| `prisma/contract.prisma` | Prisma 8 data contract (User + Anvia memory models) |
| `src/index.ts` | `db` client + `memory` (`PrismaMemoryStore`) |
| `prisma.config.ts` | Prisma CLI config (loads root `.env`) |

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Required — LLM (DevScale gateway or OpenAI-compatible)
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://gateway.devscale.id/v1
OPENAI_MODEL=gpt-6-luna
OPENAI_API=chat

# Optional — enables web search tools on the agent
TAVILY_API_KEY=your_tavily_key

# Postgres (matches docker-compose.dev.yml)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/app
```

### 3. Start PostgreSQL

```bash
pnpm db:up
```

This starts **Postgres 16** on **localhost:5433** (port `5433` avoids clashes with a local `5432` instance).

### 4. Initialize the database schema

First time (empty database):

```bash
pnpm db:emit    # emit Prisma contract artifacts
pnpm db:init    # create tables + sign database
```

After contract changes (e.g. new models):

```bash
pnpm db:emit
pnpm db:update
```

## Run

### Development (API + web)

```bash
pnpm dev
```

| App | URL |
|-----|-----|
| Web | http://localhost:5173 |
| API | http://localhost:3000 |
| Health | http://localhost:3000/health |

The Vite dev server proxies `/api/*` → `http://localhost:3000`.

### Individually

```bash
pnpm dev:api    # API only
pnpm dev:web    # Web only
```

### Production-style build

```bash
pnpm build
pnpm --filter @repo/api start
pnpm --filter @repo/web preview
```

## Scripts reference

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run all workspace `dev` scripts in parallel |
| `pnpm dev:api` / `pnpm dev:web` | API or web only |
| `pnpm build` | Build all packages |
| `pnpm db:up` / `pnpm db:down` | Start / stop Postgres (Docker Compose) |
| `pnpm db:emit` | `prisma contract emit` in `@repo/db` |
| `pnpm db:init` | Initialize empty DB from contract |
| `pnpm db:update` | Apply contract changes to existing DB |
| `pnpm evals` | Run all agent evals |
| `pnpm evals:1` … `evals:4` | Individual eval scenarios |

## API overview

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `POST` | `/api/chat` | Streaming chat (Anvia client protocol, JSONL) |
| `GET` | `/api/chat/session` | Load messages for a session (`x-session-id`, `userId`) |
| `GET` | `/api/chat/sessions` | List recent sessions for the sidebar |

Chat requests should send:

- Header `x-session-id` — conversation id  
- Header `x-user-id` — defaults to `default` if omitted  

## Agent usage (library)

```ts
import { runAgent } from "@repo/agents";
import { memory } from "@repo/db";

const stream = runAgent({
  prompt: "What should I do in my first week?",
  memory: { store: memory, savePolicy: "turn" },
  session: { sessionId: "thread-1", userId: "default" },
});

for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
```

Without memory, pass a full `messages` history instead of `prompt` + `session`.

## Evals

Agent quality checks live under `packages/agents/src/evals/`:

```bash
pnpm evals        # all
pnpm evals:1      # first week
pnpm evals:2      # first month
pnpm evals:3      # culture and norms
pnpm evals:4      # contacts and safety
```

Requires `OPENAI_API_KEY` (and optionally `TAVILY_API_KEY`) in `.env`.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `DRIVER.CONNECTION_FAILED` | Run `pnpm db:up`; confirm `DATABASE_URL` uses port **5433** |
| Port 5433 in use | Change the host port in `docker-compose.dev.yml` and `.env` |
| Agent never replies | Check API logs; confirm `OPENAI_API_KEY` / gateway URL; first token can take ~10–15s |
| Empty session after reload | Ensure `pnpm db:init` (or `db:update`) ran; check `/api/chat/session` |
| Web search tools missing | Set `TAVILY_API_KEY` — tools are only registered when it is present |

## License

Private assignment project (DevScale).
