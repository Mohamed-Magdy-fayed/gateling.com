import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import type { ApiKeyActor } from "@/features/system/api-keys/server/auth";
import {
  callerContext,
  type Translate,
  text,
  toolRegistrar,
} from "@/features/system/api-keys/server/mcp-tools";
import { createCallerFactory } from "@/integrations/trpc/init";
import { appRouter } from "@/integrations/trpc/routers/_app";

import {
  addEvidenceSchema,
  addHandleSchema,
  addHypothesisSchema,
  createStudySchema,
  logCommitmentSchema,
  logTouchpointSchema,
  markRepliedSchema,
  newContactSchema,
  setCommitmentStatusSchema,
  setVerdictSchema,
  templateInputSchema,
  updateContactSchema,
  updateStudySchema,
  updateTemplateSchema,
} from "./schemas";

const SERVER_INFO = { name: "gateling-discovery", version: "1.0.0" };
const GUIDE_URI = "docs://discovery-mcp";
const LOG_TAG = "[api/mcp/discovery]";

const createCaller = createCallerFactory(appRouter);

const studyIdInput = z.object({ studyId: z.uuid() });

/**
 * The Discovery MCP face: log touchpoints, evidence and money signals from
 * what the operator shares (screenshots, pasted chats), and read a study's
 * readout. Same tRPC procedures as the UI, as the admin who owns the key.
 * It never sends messages, and it never touches the sales pipeline.
 */
export function buildDiscoveryMcpServer(
  actor: ApiKeyActor,
  t: Translate,
): McpServer {
  const caller = createCaller(callerContext(actor, t));
  const server = new McpServer(SERVER_INFO, {
    instructions:
      "Gateling Discovery: problem-first validation (not sales). Read `get_discovery_guide` first. Log only what the operator shows or tells you: quote people's exact words (usually Egyptian Arabic) and never invent or translate a quote. Compliments are noise. This server never sends messages and never changes sales leads.",
  });
  const { readTool, writeTool } = toolRegistrar(server, t, LOG_TAG);

  server.registerResource(
    "discovery-guide",
    GUIDE_URI,
    { title: "Discovery guide", mimeType: "text/markdown" },
    async (uri) => ({ contents: [{ uri: uri.href, text: await readGuide() }] }),
  );

  server.registerTool(
    "get_discovery_guide",
    {
      title: "Read the discovery guide",
      description:
        "The method (6 steps, pain not opinions), what counts as a conversation, a story and a commitment, the go / fix-pitch / kill rule, evidence kinds, and how to log from a screenshot. Read this first.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => text(await readGuide()),
  );

  // ─── Read ────────────────────────────────────────────────────────────────

  readTool(
    "list_studies",
    "List studies",
    "Every active study with its step, status, decision thresholds and readout (conversations, stories, commitments, verdict).",
    z.object({ includeArchived: z.boolean().default(false) }),
    (input) => caller.discovery.listStudies(input),
  );

  readTool(
    "get_readout",
    "Get a study readout",
    "One study: its hypotheses (ids for `add_evidence`), the readout with per-hypothesis progress, the verdict and suggested next step, and reply rates by template, persona and channel.",
    studyIdInput,
    ({ studyId }) => caller.discovery.getStudy({ id: studyId }),
  );

  readTool(
    "list_touchpoints",
    "List touchpoints",
    "A study's touchpoints, newest first. `waitingOnly` lists outbound messages with no reply yet (ids for `mark_replied`).",
    studyIdInput.extend({ waitingOnly: z.boolean().default(false) }),
    (input) => caller.discovery.listTouchpoints(input),
  );

  readTool(
    "list_evidence",
    "List evidence",
    "A study's tagged quotes with their kind and hypothesis links, newest first.",
    studyIdInput,
    (input) => caller.discovery.listEvidence(input),
  );

  readTool(
    "find_contact",
    "Find a contact",
    "Search contacts by name, business name, handle or phone, or by a pasted profile URL (tracking parameters are ignored). Always search before creating a contact.",
    z.object({
      query: z.string().trim().min(1).max(2048),
      limit: z.number().int().min(1).max(50).default(8),
    }),
    (input) => caller.discovery.searchContacts(input),
  );

  readTool(
    "get_contact",
    "Get a contact",
    "One contact with profiles (handles), linked sales lead, every touchpoint, evidence and commitment.",
    z.object({ contactId: z.uuid() }),
    ({ contactId }) => caller.discovery.getContact({ id: contactId }),
  );

  readTool(
    "list_templates",
    "List outreach templates",
    "Outreach templates (question-first, Egyptian Arabic). With `studyId`: that study's plus the reusable ones. Pass a template's id to `log_touchpoint` so reply rates are tracked.",
    z.object({
      studyId: z.uuid().optional(),
      includeInactive: z.boolean().default(false),
    }),
    (input) => caller.discovery.listTemplates(input),
  );

  // ─── Write ───────────────────────────────────────────────────────────────

  writeTool(
    "create_study",
    "Create a study",
    "A niche plus a problem statement, with hypotheses (code, statement, passRule, passThreshold, measure: `supporting_contacts` | `commitments` | `manual`). Optional price to test and decision thresholds (defaults: 10 conversations, 3 commitments for Go, fewer than 3 stories = Kill). Check `list_studies` first to avoid a duplicate.",
    createStudySchema,
    (input) => caller.discovery.createStudy(input),
  );

  writeTool(
    "update_study",
    "Update a study",
    "Change a study's fields; send only what changes. Moving `step` or setting `status` (go / fix_pitch / killed / archived) is the operator's decision: confirm first.",
    updateStudySchema,
    (input) => caller.discovery.updateStudy(input),
    { destructive: true },
  );

  writeTool(
    "add_hypothesis",
    "Add a hypothesis",
    "Add one hypothesis to a study.",
    addHypothesisSchema,
    (input) => caller.discovery.addHypothesis(input),
  );

  writeTool(
    "set_hypothesis_verdict",
    "Override a hypothesis verdict",
    "`open` lets the evidence decide; `true` / `false` override it. The operator's call: confirm first.",
    setVerdictSchema,
    (input) => caller.discovery.setHypothesisVerdict(input),
    { destructive: true },
  );

  writeTool(
    "create_contact",
    "Create a contact",
    "A person or business you talked to, optionally with a first profile handle (channel + url). Run `find_contact` first.",
    newContactSchema,
    (input) => caller.discovery.createContact(input),
  );

  writeTool(
    "update_contact",
    "Update a contact",
    "Change a contact's details; send only what changes. `leadId` links the contact to a sales prospect (a pointer only, the lead is never changed); `null` unlinks.",
    updateContactSchema,
    (input) => caller.discovery.updateContact(input),
  );

  writeTool(
    "add_handle",
    "Add a profile to a contact",
    "Another identity for the same contact on a channel (e.g. their Instagram after you logged Facebook).",
    addHandleSchema,
    (input) => caller.discovery.addHandle(input),
  );

  writeTool(
    "log_touchpoint",
    "Log a touchpoint",
    'One message, comment, call or meeting. Give `contactId` (from `find_contact`) or `newContact`. `persona` is who it was sent as: `personal` (Mohamed\'s own profile) or `gateling` (the brand). Put what was sent in `message`; if they answered in the same screenshot set `replied: true`, `replyText` (exact words) and `repliedAt` when the timestamp is visible. An `inbound` touchpoint marks the latest unanswered outbound one as replied. Use `source: "mcp"`.',
    logTouchpointSchema,
    (input) => caller.discovery.logTouchpoint(input),
  );

  writeTool(
    "mark_replied",
    "Mark a message as replied",
    "Record that an outbound touchpoint got a reply, with the reply time when known and optionally their words.",
    markRepliedSchema,
    (input) => caller.discovery.markReplied(input),
  );

  writeTool(
    "add_evidence",
    "Tag evidence",
    "A quote in their exact words with a kind: `incident` (a specific recent event), `workaround_tool` (a named tool or method), `cost_loss` (money or time lost; set `amountEgp` if said), `money_commitment`, `compliment` (noise), `other_pain`. Link it to hypotheses with `supports` / `contradicts`; only link what the quote actually shows.",
    addEvidenceSchema,
    (input) => caller.discovery.addEvidence(input),
  );

  writeTool(
    "log_commitment",
    "Log a money signal",
    "`deposit` / `pre_order` (status `promised` until the money arrives, then `paid`), `price_accepted`, `argued_price` (interested, haggling) or `argued_need` (not interested). Log only what the operator confirms.",
    logCommitmentSchema,
    (input) => caller.discovery.logCommitment(input),
  );

  writeTool(
    "set_commitment_status",
    "Update a money signal",
    "Move a deposit or pre-order to paid, refunded or withdrawn. Confirm with the operator.",
    setCommitmentStatusSchema,
    (input) => caller.discovery.setCommitmentStatus(input),
    { destructive: true },
  );

  writeTool(
    "create_template",
    "Create an outreach template",
    "A question-first message (never a pitch), usually Egyptian Arabic, for a step. `studyId` null makes it reusable.",
    templateInputSchema,
    (input) => caller.discovery.createTemplate(input),
  );

  writeTool(
    "update_template",
    "Update an outreach template",
    "Change a template; send only what changes. Editing the body of a template that has been sent makes its reply rate mix two versions: prefer a new template.",
    updateTemplateSchema,
    (input) => caller.discovery.updateTemplate(input),
  );

  return server;
}

async function readGuide(): Promise<string> {
  return readFile(path.join(process.cwd(), "docs", "discovery-mcp.md"), "utf8");
}
