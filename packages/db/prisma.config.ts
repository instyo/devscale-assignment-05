import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: resolve(root, ".env") });

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma",
    db: {
      connection: process.env["DATABASE_URL"]!,
    },
  }),
  skills: {
    check: false,
  },
});
