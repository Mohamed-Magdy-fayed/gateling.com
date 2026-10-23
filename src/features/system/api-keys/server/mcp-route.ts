import "server-only";

import { createMcpHandler, type McpServer } from "@modelcontextprotocol/server";

import type { ApiKeyScope } from "@/drizzle/schemas/system/api-keys-table";
import { getT } from "@/features/core/i18n/server";

import { type ApiKeyActor, ApiKeyAuthError, resolveApiKeyRequest } from "./auth";
import type { Translate } from "./mcp-tools";

/**
 * One MCP endpoint (Streamable HTTP, stateless) behind an API key that must
 * carry `scope`. The proven actor rides into the per-request server factory
 * on `authInfo`; the SDK never derives auth from headers itself.
 */
export function mcpRoute(
  scope: ApiKeyScope,
  build: (actor: ApiKeyActor, t: Translate) => McpServer,
  logTag: string,
): (request: Request) => Promise<Response> {
  const actors = new WeakMap<object, ApiKeyActor>();

  return async function serve(request: Request): Promise<Response> {
    let actor: ApiKeyActor;
    try {
      actor = await resolveApiKeyRequest(request, scope);
    } catch (error) {
      if (error instanceof ApiKeyAuthError) {
        return Response.json(
          { error: { code: "unauthorized", message: error.message } },
          { status: error.status },
        );
      }
      console.error(logTag, error);
      return Response.json(
        { error: { code: "internal_error", message: "Internal error." } },
        { status: 500 },
      );
    }

    const { t } = await getT();
    const handler = createMcpHandler(
      ({ authInfo }) => {
        const resolved = authInfo?.extra ? actors.get(authInfo.extra) : undefined;
        if (!resolved) throw new Error("MCP request without a resolved API key.");
        return build(resolved, t);
      },
      { onerror: (error) => console.error(logTag, error) },
    );

    // `extra` is the SDK's bag for caller data; keep the actor out of the
    // serialisable surface and hand over an opaque key instead.
    const extra = {};
    actors.set(extra, actor);
    return handler.fetch(request, {
      authInfo: {
        token: "",
        clientId: `api-key:${actor.keyId}`,
        scopes: [scope],
        extra,
      },
    });
  };
}
