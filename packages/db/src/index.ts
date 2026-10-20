import { PrismaMemoryStore } from "@anvia/memory-prisma/v8";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../prisma/contract.d";
import contractJson from "../prisma/contract.json" with { type: "json" };

export const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});

/** Durable session memory backed by Prisma 8 PostgreSQL tables. */
export const memory = new PrismaMemoryStore({
  client: db,
  // Scope includes userId so all chats stay under the default user.
  scopeKey: { includeUserId: true },
});

export type { Contract };
export { PrismaMemoryStore };
