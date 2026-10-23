import { mcpRoute } from "@/features/system/api-keys/server/mcp-route";
import { buildSalesMcpServer } from "@/features/system/sales/server/mcp-server";

/**
 * `/api/mcp/sales` — the sales Model Context Protocol endpoint. Needs a key
 * with the `sales` scope (prospect names and phone numbers), granted
 * explicitly on /settings. See docs/sales-mcp.md.
 */
const serve = mcpRoute("sales", buildSalesMcpServer, "[api/mcp/sales]");

export { serve as GET, serve as POST, serve as DELETE };
