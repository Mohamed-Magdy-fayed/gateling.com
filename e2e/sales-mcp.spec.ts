import { randomUUID } from "node:crypto";

import { type APIRequestContext, expect, test } from "@playwright/test";
import postgres from "postgres";

import { generateApiKey } from "../src/features/system/api-keys/server/keys";

/**
 * The sales MCP endpoint end to end, against the local E2E database
 * (playwright.config.ts refuses anything non-local). Seeds an admin, a
 * content-only key, a sales key and one prospect.
 */

// API-only, with shared seed data: run in one worker, once.
test.describe.configure({ mode: "serial" });

const sql = postgres(process.env.E2E_DATABASE_URL ?? "", { max: 1, onnotice: () => {} });

const adminId = randomUUID();
const leadId = randomUUID();
const contentKey = generateApiKey();
const salesKey = generateApiKey();

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "API-only: runs once, on desktop");
  await sql`insert into users (id, email, role, name, "createdBy")
    values (${adminId}, ${`mcp-${adminId}@e2e.test`}, 'admin', 'MCP E2E', 'e2e')`;
  for (const [name, key, scopes] of [
    ["e2e content", contentKey, ["content"]],
    ["e2e sales", salesKey, ["sales"]],
  ] as const) {
    await sql`insert into api_keys (name, "keyPrefix", "keyHash", "userId", "createdBy", scopes)
      values (${name}, ${key.prefix}, ${key.hash}, ${adminId}, 'e2e', ${sql.array([...scopes])})`;
  }
  await sql`insert into leads (id, kind, name, phone, "pipelineStatus")
    values (${leadId}, 'prospect', 'MCP E2E Atelier', '01001234567', 'new')`;
});

test.afterAll(async ({}, testInfo) => {
  if (testInfo.project.name !== "desktop") return void (await sql.end());
  await sql`delete from leads where id = ${leadId}`;
  await sql`delete from users where id = ${adminId}`;
  await sql.end();
});

let rpcId = 0;

/** One JSON-RPC call over Streamable HTTP; the reply may arrive as SSE. */
async function rpc(
  request: APIRequestContext,
  path: string,
  key: string,
  method: string,
  params: Record<string, unknown> = {},
) {
  const response = await request.post(path, {
    headers: {
      authorization: `Bearer ${key}`,
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": "2025-06-18",
    },
    data: { jsonrpc: "2.0", id: ++rpcId, method, params },
  });
  const body = await response.text();
  const payload = body.startsWith("{")
    ? body
    : (body.split("\n").find((line) => line.startsWith("data:"))?.slice(5) ?? "{}");
  return { status: response.status(), json: JSON.parse(payload) };
}

async function callTool(
  request: APIRequestContext,
  name: string,
  args: Record<string, unknown> = {},
) {
  const { json } = await rpc(request, "/api/mcp/sales", salesKey.key, "tools/call", {
    name,
    arguments: args,
  });
  const text: string = json.result?.content?.[0]?.text ?? "{}";
  // Tool results are JSON; the SDK's own input-validation errors are plain text.
  let value: ReturnType<typeof JSON.parse> = text;
  try {
    value = JSON.parse(text);
  } catch {
    // keep the text
  }
  return { isError: Boolean(json.result?.isError), value };
}

test("a content-only key is refused by the sales endpoint", async ({ request }) => {
  const { status } = await rpc(request, "/api/mcp/sales", contentKey.key, "tools/list");
  expect(status).toBe(403);
});

// The content server moved onto the shared route factory and tool helpers.
test("a content key still reaches the content endpoint", async ({ request }) => {
  const { status, json } = await rpc(request, "/api/mcp", contentKey.key, "tools/list");
  expect(status).toBe(200);
  const names: string[] = json.result.tools.map((tool: { name: string }) => tool.name);
  expect(names).toEqual(expect.arrayContaining(["get_content_guide", "create_blog_post"]));
});

test("a sales-only key is refused by the content endpoint", async ({ request }) => {
  const { status } = await rpc(request, "/api/mcp", salesKey.key, "tools/list");
  expect(status).toBe(403);
});

test("an unknown key is refused", async ({ request }) => {
  const { status } = await rpc(request, "/api/mcp/sales", generateApiKey().key, "tools/list");
  expect(status).toBe(401);
});

test("the sales endpoint lists its tools and no delete or send tool", async ({ request }) => {
  const { status, json } = await rpc(request, "/api/mcp/sales", salesKey.key, "tools/list");
  expect(status).toBe(200);
  const names: string[] = json.result.tools.map((tool: { name: string }) => tool.name);
  expect(names).toEqual(
    expect.arrayContaining(["get_sales_guide", "get_today", "get_lead", "log_outcome"]),
  );
  expect(names.filter((n) => /delete|send/.test(n))).toEqual([]);
});

test("get_today shows the lead; log_outcome records the call", async ({ request }) => {
  const today = await callTool(request, "get_today");
  expect(today.isError).toBe(false);
  const item = today.value.work.find((w: { leadId: string }) => w.leadId === leadId);
  expect(item).toMatchObject({ bucket: "newQueue", primaryAction: "call" });
  expect(item.outcomes).toContain("noAnswer");

  const logged = await callTool(request, "log_outcome", {
    leadId,
    outcome: "noAnswer",
    note: "Rang twice",
  });
  expect(logged.value).toMatchObject({ logged: true, pipelineStatus: "awaiting_reply" });

  const lead = await callTool(request, "get_lead", { leadId });
  expect(lead.value.lead.pipelineStatus).toBe("awaiting_reply");
  expect(lead.value.activities.map((a: { type: string }) => a.type)).toContain("no_answer");
});

test("tools that close or overwrite are marked destructive", async ({ request }) => {
  const { json } = await rpc(request, "/api/mcp/sales", salesKey.key, "tools/list");
  const hint = (name: string) =>
    json.result.tools.find((tool: { name: string }) => tool.name === name)?.annotations
      ?.destructiveHint;
  expect(hint("log_outcome")).toBe(true);
  expect(hint("update_lead")).toBe(true);
  expect(hint("add_note")).toBe(false);
});

test("update_lead refuses a non-http source link", async ({ request }) => {
  const result = await callTool(request, "update_lead", {
    id: leadId,
    sourceUrl: "javascript:alert(1)",
  });
  expect(result.isError).toBe(true);
});

test("log_outcome refuses a call-back without a future time", async ({ request }) => {
  const missing = await callTool(request, "log_outcome", { leadId, outcome: "callBack" });
  expect(missing.isError).toBe(true);
  expect(missing.value.error.message).toBe("timeRequired");
});
