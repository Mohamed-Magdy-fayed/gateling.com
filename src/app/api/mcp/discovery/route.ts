import { mcpRoute } from "@/features/system/api-keys/server/mcp-route";
import { buildDiscoveryMcpServer } from "@/features/system/discovery/server/mcp-server";

/**
 * `/api/mcp/discovery` — the Discovery Model Context Protocol endpoint. Needs
 * a key with the `discovery` scope (interview quotes and contacts), granted
 * explicitly on /settings. See docs/discovery-mcp.md.
 */
const serve = mcpRoute(
  "discovery",
  buildDiscoveryMcpServer,
  "[api/mcp/discovery]",
);

export { serve as GET, serve as POST, serve as DELETE };
