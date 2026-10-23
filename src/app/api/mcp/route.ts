import { mcpRoute } from "@/features/system/api-keys/server/mcp-route";
import { buildContentMcpServer } from "@/features/system/api-keys/server/mcp-server";

/**
 * `/api/mcp` — the content Model Context Protocol endpoint (Streamable
 * HTTP, stateless). `Authorization: Bearer gl_live_…`, a key with the
 * `content` scope that an admin created on /settings; the request then acts
 * as that admin. See docs/content-mcp.md.
 */
const serve = mcpRoute("content", buildContentMcpServer, "[api/mcp]");

export { serve as GET, serve as POST, serve as DELETE };
