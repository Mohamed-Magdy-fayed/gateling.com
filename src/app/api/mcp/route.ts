import { createMcpHandler } from "@modelcontextprotocol/server";

import { getT } from "@/features/core/i18n/server";
import {
  type ApiKeyActor,
  ApiKeyAuthError,
  resolveApiKeyRequest,
} from "@/features/system/api-keys/server/auth";
import { buildContentMcpServer } from "@/features/system/api-keys/server/mcp-server";

/**
 * `/api/mcp` — the content Model Context Protocol endpoint (Streamable
 * HTTP, stateless). `Authorization: Bearer gl_live_…`, a key an admin
 * created on /settings; the request then acts as that admin. The proven
 * actor rides into the per-request server factory on `authInfo`; the SDK
 * never derives auth from headers itself. See docs/content-mcp.md.
 */
const actors = new WeakMap<object, ApiKeyActor>();

async function serve(request: Request): Promise<Response> {
  let actor: ApiKeyActor;
  try {
    actor = await resolveApiKeyRequest(request);
  } catch (error) {
    if (error instanceof ApiKeyAuthError) {
      return Response.json(
        { error: { code: "unauthorized", message: error.message } },
        { status: error.status },
      );
    }
    console.error("[api/mcp]", error);
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
      return buildContentMcpServer(resolved, t);
    },
    { onerror: (error) => console.error("[api/mcp]", error) },
  );

  // `extra` is the SDK's bag for caller data; keep the actor out of the
  // serialisable surface and hand over an opaque key instead.
  const extra = {};
  actors.set(extra, actor);
  return handler.fetch(request, {
    authInfo: {
      token: "",
      clientId: `api-key:${actor.keyId}`,
      scopes: ["content"],
      extra,
    },
  });
}

export { serve as GET, serve as POST, serve as DELETE };
