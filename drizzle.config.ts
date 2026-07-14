import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { Config } from "drizzle-kit";

loadEnv({ path: path.resolve(import.meta.dirname, ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (check .env)");
}

export default {
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  out: "./src/drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
