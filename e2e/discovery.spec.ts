import { randomUUID } from "node:crypto";

import { type APIRequestContext, expect, test } from "@playwright/test";
import postgres from "postgres";

import { generateApiKey } from "../src/features/system/api-keys/server/keys";

/**
 * Discovery: route guards, the share-target manifest, and the Discovery MCP
 * end to end (create a study, log a touchpoint with a reply, tag evidence,
 * read the readout) against the local E2E database.
 */

test.describe.configure({ mode: "serial" });

const sql = postgres(process.env.E2E_DATABASE_URL ?? "", {
  max: 1,
  onnotice: () => {},
});

const adminId = randomUUID();
const salesKey = generateApiKey();
const discoveryKey = generateApiKey();
let studyId = "";

// biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructured first argument
test.beforeAll(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "API-only: runs once, on desktop",
  );
  await sql`insert into users (id, email, role, name, "createdBy")
    values (${adminId}, ${`discovery-${adminId}@e2e.test`}, 'admin', 'Discovery E2E', 'e2e')`;
  for (const [name, key, scopes] of [
    ["e2e sales", salesKey, ["sales"]],
    ["e2e discovery", discoveryKey, ["discovery"]],
  ] as const) {
    await sql`insert into api_keys (name, "keyPrefix", "keyHash", "userId", "createdBy", scopes)
      values (${name}, ${key.prefix}, ${key.hash}, ${adminId}, 'e2e', ${sql.array([...scopes])})`;
  }
});

// biome-ignore lint/correctness/noEmptyPattern: Playwright requires a destructured first argument
test.afterAll(async ({}, testInfo) => {
  if (testInfo.project.name !== "desktop") return void (await sql.end());
  if (studyId) await sql`delete from discovery_studies where id = ${studyId}`;
  await sql`delete from discovery_contacts where "createdBy" = ${adminId}`;
  await sql`delete from users where id = ${adminId}`;
  await sql.end();
});

let rpcId = 0;

async function rpc(
  request: APIRequestContext,
  key: string,
  method: string,
  params: Record<string, unknown> = {},
) {
  const response = await request.post("/api/mcp/discovery", {
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
    : (body
        .split("\n")
        .find((line) => line.startsWith("data:"))
        ?.slice(5) ?? "{}");
  return { status: response.status(), json: JSON.parse(payload) };
}

async function callTool(
  request: APIRequestContext,
  name: string,
  args: Record<string, unknown> = {},
) {
  const { json } = await rpc(request, discoveryKey.key, "tools/call", {
    name,
    arguments: args,
  });
  const text: string = json.result?.content?.[0]?.text ?? "{}";
  let value: ReturnType<typeof JSON.parse> = text;
  try {
    value = JSON.parse(text);
  } catch {
    // plain-text error from the SDK's input validation
  }
  return { isError: Boolean(json.result?.isError), value };
}

for (const route of [
  "/discovery",
  "/discovery/log",
  "/discovery/templates",
  "/discovery/studies/00000000-0000-0000-0000-000000000000",
]) {
  test(`signed out, ${route} redirects to /sign-in`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
  });
}

test("signed out, discovery.logTouchpoint is refused", async ({ request }) => {
  const response = await request.post("/api/trpc/discovery.logTouchpoint", {
    data: { json: {} },
  });
  expect(response.status()).toBe(401);
});

test("the manifest declares the Android share target", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.share_target).toMatchObject({
    action: "/discovery/log",
    method: "GET",
    params: { url: "url", text: "text", title: "title" },
  });
});

test("a sales-only key is refused by the discovery endpoint", async ({
  request,
}) => {
  const { status } = await rpc(request, salesKey.key, "tools/list");
  expect(status).toBe(403);
});

test("the discovery endpoint lists its tools and no delete or send tool", async ({
  request,
}) => {
  const { status, json } = await rpc(request, discoveryKey.key, "tools/list");
  expect(status).toBe(200);
  const names: string[] = json.result.tools.map(
    (tool: { name: string }) => tool.name,
  );
  expect(names).toEqual(
    expect.arrayContaining([
      "get_discovery_guide",
      "log_touchpoint",
      "add_evidence",
      "get_readout",
    ]),
  );
  expect(names.filter((n) => /delete|send/.test(n))).toEqual([]);
});

test("a study, a replied DM and a tagged incident show in the readout", async ({
  request,
}) => {
  const created = await callTool(request, "create_study", {
    title: "E2E dress rental",
    niche: "Dress rental shops",
    problemStatement: "Double bookings cost money",
    hypotheses: [
      {
        code: "H1",
        statement: "Double-booking happens and hurts",
        passRule: "5/10 tell a recent incident",
        passThreshold: 5,
      },
    ],
  });
  expect(created.isError).toBe(false);
  studyId = created.value.id;

  const readoutBefore = await callTool(request, "get_readout", { studyId });
  const h1 = readoutBefore.value.hypotheses[0];

  const tp = await callTool(request, "log_touchpoint", {
    studyId,
    newContact: { displayName: "E2E Atelier" },
    channel: "facebook",
    persona: "personal",
    url: "https://www.facebook.com/e2e.atelier?mibextid=x",
    message: "إيه أكتر حاجة بتتعبكم في الحجوزات؟",
    replied: true,
    replyText: "الأسبوع اللي فات فستان اتحجز لعروستين",
    source: "mcp",
  });
  expect(tp.isError).toBe(false);
  expect(tp.value.repliedAt).toBeTruthy();

  const found = await callTool(request, "find_contact", {
    query: "https://www.facebook.com/e2e.atelier",
  });
  expect(found.value).toHaveLength(1);

  const evidence = await callTool(request, "add_evidence", {
    studyId,
    contactId: tp.value.contactId,
    touchpointId: tp.value.id,
    kind: "incident",
    quote: "الأسبوع اللي فات فستان اتحجز لعروستين",
    hypotheses: [{ hypothesisId: h1.id, stance: "supports" }],
  });
  expect(evidence.isError).toBe(false);

  const readout = await callTool(request, "get_readout", { studyId });
  expect(readout.value.readout).toMatchObject({
    conversations: 1,
    stories: 1,
    verdict: "collecting",
  });
  expect(readout.value.readout.hypotheses[0]).toMatchObject({
    supporting: 1,
    passed: false,
  });
  expect(readout.value.replyStats.byPersona[0]).toMatchObject({
    key: "personal",
    sent: 1,
    replied: 1,
  });
});
