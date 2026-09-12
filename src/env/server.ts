import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1).optional(),
    DB_PASSWORD: z.string().min(1).optional(),
    DB_USER: z.string().min(1).optional(),
    DB_NAME: z.string().min(1).optional(),
    DB_HOST: z.string().min(1).optional(),
    DB_PORT: z.string().min(1).optional(),

    BASE_URL: z.url(),
    REDIS_URL: z.string().min(1),
    REDIS_TOKEN: z.string().min(1),

    OAUTH_REDIRECT_URL_BASE: z.url(),
    JWT_SECRET_KEY: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    INNGEST_SIGNING_KEY: z.string().min(1).optional(),
    INNGEST_EVENT_KEY: z.string().min(1).optional(),

    // Gateling Meetings (meetings.gateling.com/settings/integrations). Optional
    // so local/preview run without a room provider; required together in prod.
    MEETINGS_API_URL: z.url().optional(),
    MEETINGS_API_KEY: z.string().min(1).optional(),
    MEETINGS_WEBHOOK_SECRET: z.string().min(1).optional(),

    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_CLIENT_EMAIL: z.string().min(1),
    FIREBASE_PRIVATE_KEY: z.string().min(1),
    FIREBASE_STORAGE_BUCKET: z.string().min(1),

    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    SMTP_SECURE: z.enum(["true", "false"]).optional(),
    SMTP_FROM_EMAIL: z.email().optional(),
    SMTP_FROM_NAME: z.string().min(1).optional(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  createFinalSchema: (env) => {
    return z
      .object(env)
      .superRefine((val, ctx) => {
        const hasDatabaseUrl = Boolean(val.DATABASE_URL);
        const hasSplitDatabaseConfig = Boolean(
          val.DB_HOST &&
            val.DB_NAME &&
            val.DB_PASSWORD &&
            val.DB_PORT &&
            val.DB_USER,
        );

        // The Inngest serve endpoint accepts unsigned invocations without a
        // signing key — on the production deployment that would let anyone
        // run any job (including the Meetings webhook handler) with an
        // arbitrary payload. Keyed on VERCEL_ENV, not NODE_ENV: a local
        // `next build` is production mode without production secrets.
        if (
          process.env.VERCEL_ENV === "production" &&
          !(val.INNGEST_SIGNING_KEY && val.INNGEST_EVENT_KEY)
        ) {
          ctx.addIssue({
            code: "custom",
            message:
              "INNGEST_SIGNING_KEY and INNGEST_EVENT_KEY are required in production.",
            path: ["INNGEST_SIGNING_KEY"],
          });
        }

        // The URL alone is a harmless default; a key means the integration is
        // live and must be complete, or webhooks would be dropped unverified.
        if (
          val.MEETINGS_API_KEY &&
          !(val.MEETINGS_API_URL && val.MEETINGS_WEBHOOK_SECRET)
        ) {
          ctx.addIssue({
            code: "custom",
            message:
              "MEETINGS_API_KEY requires MEETINGS_API_URL and MEETINGS_WEBHOOK_SECRET.",
            path: ["MEETINGS_API_KEY"],
          });
        }

        if (!hasDatabaseUrl && !hasSplitDatabaseConfig) {
          console.log(hasDatabaseUrl, hasSplitDatabaseConfig);
          ctx.addIssue({
            code: "custom",
            message:
              "Provide either DATABASE_URL or the full DB_HOST/DB_NAME/DB_PASSWORD/DB_PORT/DB_USER configuration.",
            path: ["DATABASE_URL"],
          });
        }
      })
      .transform((val) => {
        const {
          DATABASE_URL,
          DB_HOST,
          DB_NAME,
          DB_PASSWORD,
          DB_PORT,
          DB_USER,
          ...rest
        } = val;

        return {
          ...rest,
          DATABASE_URL:
            DATABASE_URL ??
            `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}${DB_PORT}/${DB_NAME}`,
        };
      });
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
