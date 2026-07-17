import path from "node:path";

import { config as loadEnv } from "dotenv";

loadEnv({
  path: process.env.DOTENV_CONFIG_PATH ?? path.resolve(process.cwd(), ".env"),
});

const commands = {
  settings: {
    description:
      "Upsert default settings rows only (does not clear the database).",
    action: async () => {
      const { runSeedProfile } = await import("@/drizzle/seed");
      await runSeedProfile("settings");
    },
  },
  all: {
    description: 'Legacy alias for the "settings" seed profile.',
    action: async () => {
      const { runSeedProfile } = await import("@/drizzle/seed");
      await runSeedProfile("baseline");
    },
  },
  baseline: {
    description:
      "Seed a minimal local bootstrap profile (idempotent — never clears, skips existing data).",
    action: async () => {
      const { runSeedProfile } = await import("@/drizzle/seed");
      await runSeedProfile("baseline");
    },
  },
  demo: {
    description:
      "Seed a curated demo profile (idempotent — never clears, skips existing data).",
    action: async () => {
      const { runSeedProfile } = await import("@/drizzle/seed");
      await runSeedProfile("demo");
    },
  },
  performance: {
    description:
      "Seed a large dataset for table and query stress tests (idempotent — never clears, skips existing data).",
    action: async () => {
      const { runSeedProfile } = await import("@/drizzle/seed");
      await runSeedProfile("performance");
    },
  },
  clear: {
    description: "Clear all data from the database tables.",
    action: async () => {
      const { clearDb } = await import("@/drizzle/seed/clear-db");
      await clearDb();
    },
  },
  "articles-delivery-vertical": {
    description:
      "Insert the delivery-vertical article pair (perfect-scenario + solution-we-built) as drafts (idempotent).",
    action: async () => {
      const { seedDeliveryVerticalArticles } = await import(
        "@/drizzle/seed/add-articles-delivery-vertical"
      );
      await seedDeliveryVerticalArticles();
    },
  },
  "migrate-content-to-blocks": {
    description:
      "One-time data migration: backfill blog_post_blocks/case_study_blocks from legacy content columns (idempotent).",
    action: async () => {
      const { migrateContentToBlocks } = await import(
        "@/drizzle/seed/migrate-content-to-blocks"
      );
      await migrateContentToBlocks();
    },
  },
  help: {
    description: "Show this help message.",
    action: async () => {
      printHelp();
    },
  },
} as const;

type CommandName = keyof typeof commands;

function printHelp() {
  const entries = Object.entries(commands).filter(([name]) => name !== "help");
  console.log("Usage: npm run seed -- <command>\n");
  console.log("Commands:");
  for (const [name, info] of entries) {
    console.log(`  ${name.padEnd(12)} ${info.description}`);
  }
  console.log("\nExamples:");
  console.log("  npm run seed");
  console.log("  npm run seed -- settings");
  console.log("  npm run seed -- demo");
  console.log("  npm run seed -- baseline");
  console.log("  npm run seed -- performance");
  console.log("  npm run seed:all");
  console.log("  npm run seed:clear");
  console.log("  npm run seed -- migrate-content-to-blocks");
}

async function run() {
  const rawArg = process.argv[2]?.toLowerCase() as CommandName | undefined;
  const commandName: CommandName =
    rawArg && rawArg in commands ? rawArg : "settings";

  if (commandName === "help") {
    printHelp();
    return;
  }

  const command = commands[commandName];
  console.log(`➡️  Running seed command: ${commandName}...`);

  let closeDbConnection: (() => Promise<void>) | undefined;
  try {
    ({ closeDbConnection } = await import("@/drizzle"));
    await command.action();
    console.log("✅ Seed completed successfully.");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  } finally {
    if (closeDbConnection) {
      await closeDbConnection().catch((err) => {
        console.error("⚠️  Failed to close database connection:", err);
      });
    }
  }
}

run().catch((error) => {
  console.error("❌ Unexpected error while running seed command:", error);
  process.exit(1);
});
