import "server-only";

import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import { TRPCError } from "@trpc/server";
import { ZodError, type z } from "zod";

import { db } from "@/drizzle";
import type { getT } from "@/features/core/i18n/server";
import type { TRPCContext } from "@/features/system/case-studies/server/shared";

import type { ApiKeyActor } from "./auth";

/**
 * Pieces every Gateling MCP server shares: the API-key actor as a tRPC
 * caller context, tool registration with read/write annotations, and errors
 * an agent can read and fix. Each server calls the same tRPC procedures the
 * admin screens call, so validation and side effects match the UI.
 */

export type Translate = Awaited<ReturnType<typeof getT>>["t"];

/** A tRPC session only needs to outlive one MCP request. */
const SESSION_TTL_SECONDS = 60;

/**
 * The context the admin's own requests get, minus the browser: the key's
 * owner as a short-lived session, English locale and no cookies — no
 * procedure an MCP tool calls reads them.
 */
export function callerContext(actor: ApiKeyActor, t: Translate): TRPCContext {
  const noCookies = {
    get: () => undefined,
    getAll: () => [],
    has: () => false,
    set: () => {
      throw new Error("Cookies are not available to API-key requests.");
    },
    delete: () => {
      throw new Error("Cookies are not available to API-key requests.");
    },
  } as unknown as TRPCContext["cookies"];

  return {
    session: {
      sessionId: `api-key:${actor.keyId}`,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      hasPassword: false,
      user: actor.user,
    },
    cookies: noCookies,
    t,
    db,
    locale: "en",
  };
}

type ToolError = {
  code: string;
  message: string;
  issues?: Array<{ path: string; message: string }>;
};

export function describeError(error: unknown, t: Translate, logTag: string): ToolError {
  const cause = error instanceof TRPCError ? error.cause : error;
  if (cause instanceof ZodError) {
    return {
      code: "validation_error",
      message: "Invalid input.",
      issues: cause.issues.map((issue) => ({
        path: issue.path.join("."),
        // Shared schemas carry translation keys; `t` passes plain text through.
        message: t(issue.message as never),
      })),
    };
  }
  if (error instanceof TRPCError) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(logTag, error);
      return { code: "internal_error", message: "Internal error." };
    }
    return { code: error.code.toLowerCase(), message: error.message };
  }
  console.error(logTag, error);
  return { code: "internal_error", message: "Internal error." };
}

export function text(value: string): CallToolResult {
  return { content: [{ type: "text", text: value }] };
}

export function json(value: unknown): CallToolResult {
  return text(JSON.stringify(value, null, 2));
}

/**
 * The SDK picks the callback's argument type with a conditional type, which
 * cannot resolve against a generic schema; widen to a concrete `ZodObject`
 * and narrow back at the call site, where the schema already parsed the input.
 */
function widen(schema: z.ZodObject): z.ZodObject {
  return schema;
}

type Annotations = { readOnlyHint: boolean; destructiveHint?: boolean };

/** Registers tools whose failures come back as tool errors, not transport errors. */
export function toolRegistrar(server: McpServer, t: Translate, logTag: string) {
  async function run(work: () => Promise<unknown>): Promise<CallToolResult> {
    try {
      return json(await work());
    } catch (error) {
      return { isError: true, ...json({ error: describeError(error, t, logTag) }) };
    }
  }

  function register<S extends z.ZodObject>(
    annotations: Annotations,
    name: string,
    title: string,
    description: string,
    inputSchema: S,
    work: (input: z.infer<S>) => Promise<unknown>,
  ): void {
    server.registerTool(
      name,
      { title, description, inputSchema: widen(inputSchema), annotations },
      (input) => run(() => work(input as z.infer<S>)),
    );
  }

  return {
    readTool: <S extends z.ZodObject>(
      name: string,
      title: string,
      description: string,
      inputSchema: S,
      work: (input: z.infer<S>) => Promise<unknown>,
    ) => register({ readOnlyHint: true }, name, title, description, inputSchema, work),
    writeTool: <S extends z.ZodObject>(
      name: string,
      title: string,
      description: string,
      inputSchema: S,
      work: (input: z.infer<S>) => Promise<unknown>,
      options: { destructive?: boolean } = {},
    ) =>
      register(
        { readOnlyHint: false, destructiveHint: options.destructive ?? false },
        name,
        title,
        description,
        inputSchema,
        work,
      ),
  };
}
