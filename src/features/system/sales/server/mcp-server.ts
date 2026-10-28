import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { socialPlatformValues } from "@/drizzle/schema";
import type { ApiKeyActor } from "@/features/system/api-keys/server/auth";
import {
  callerContext,
  type Translate,
  text,
  toolRegistrar,
} from "@/features/system/api-keys/server/mcp-tools";
import { agentToday } from "@/features/system/sales/lib/agent-view";
import {
  ALL_OUTCOMES,
  type OutcomeId,
  outcomeById,
  outcomeToLogInput,
} from "@/features/system/sales/lib/outcomes";
import { createCallerFactory } from "@/integrations/trpc/init";
import { appRouter } from "@/integrations/trpc/routers/_app";

import {
  createLeadSchema,
  type ListPipelineInput,
  leadTierSchema,
  pipelineStatusSchema,
  updateLeadSchema,
  whatsappStatusSchema,
} from "./schemas";

const SERVER_INFO = { name: "gateling-sales", version: "1.0.0" };
const GUIDE_URI = "docs://sales-mcp";
const LOG_TAG = "[api/mcp/sales]";

const OUTCOME_IDS = ALL_OUTCOMES.map((o) => o.id) as [
  OutcomeId,
  ...OutcomeId[],
];

const leadIdInput = z.object({ leadId: z.string().uuid() });

const logOutcomeInput = z.object({
  leadId: z.string().uuid(),
  outcome: z.enum(OUTCOME_IDS),
  /** Required for bookDemo and callBack: the demo or call-back time. */
  at: z.iso.datetime({ offset: true }).optional(),
  note: z.string().trim().min(1).max(4000).optional(),
});

const addNoteInput = z.object({
  leadId: z.string().uuid(),
  note: z.string().trim().min(1).max(4000),
});

/**
 * `list_leads` keeps a flat, self-describing input for agents; `toGridInput`
 * translates it into the column-filter shape the pipeline grid uses.
 */
const listLeadsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  pipelineStatus: z.array(pipelineStatusSchema).max(20).optional(),
  tier: z.array(leadTierSchema).max(10).optional(),
  whatsappStatus: z.array(whatsappStatusSchema).max(10).optional(),
  city: z.string().trim().max(128).optional(),
  businessType: z.string().trim().max(255).optional(),
});

function toGridInput(input: z.infer<typeof listLeadsInput>): ListPipelineInput {
  const filters = [
    ["pipelineStatus", input.pipelineStatus],
    ["tier", input.tier],
    ["whatsappStatus", input.whatsappStatus],
    ["city", input.city],
    ["businessType", input.businessType],
  ] as const;
  return {
    page: input.page,
    perPage: input.perPage,
    sorting: [],
    globalFilter: input.search,
    columnFilters: filters
      .filter(([, value]) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value),
      )
      .map(([id, value]) => ({ id, value })),
  };
}

/** Lead data partly comes from scraped sources, so an agent may only link out to http(s). */
const agentSourceUrl = z
  .url({ protocol: /^https?$/ })
  .max(4000)
  .optional()
  .nullable();

/**
 * Status moves only through outcomes (so the timeline records them), and
 * do-not-contact and ownership are a person's call — an agent never edits
 * them. Notes are appended through `add_note`, never overwritten.
 */
const agentLeadCreate = createLeadSchema
  .omit({ pipelineStatus: true, doNotContact: true, ownerId: true })
  .extend({ sourceUrl: agentSourceUrl });
const agentLeadUpdate = updateLeadSchema
  .omit({
    pipelineStatus: true,
    doNotContact: true,
    ownerId: true,
    notes: true,
  })
  .extend({ sourceUrl: agentSourceUrl });

/**
 * Flat for agents; the router's schema enforces the per-status shape (a
 * `found` needs a link on that platform's own domain).
 */
const setSocialProfileInput = z.object({
  leadId: z.string().uuid(),
  platform: z.enum(socialPlatformValues),
  status: z.enum(["found", "notFound", "clear"]),
  url: z
    .url({ protocol: /^https?$/ })
    .max(512)
    .optional(),
  handle: z.string().trim().min(1).max(255).optional(),
  followers: z.number().int().min(0).max(2_147_483_647).optional(),
  posts: z.number().int().min(0).max(2_147_483_647).optional(),
  bio: z.string().trim().max(1000).optional(),
  displayName: z.string().trim().min(1).max(255).optional(),
  /** A `publicUrl` from the content server's `create_upload_url`, after the PUT. */
  avatarUrl: z
    .url({ protocol: /^https$/ })
    .max(1024)
    .optional(),
});

/**
 * The lead's one Google Maps listing; only the fields sent change. `embed` is
 * the listing's Share › Embed a map HTML (or its src); the server keeps only
 * the checked Google embed URL.
 */
const setMapsListingInput = z.object({
  leadId: z.string().uuid(),
  address: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(128).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).max(2_147_483_647).optional(),
  embed: z.string().trim().max(4000).optional(),
});

const createCaller = createCallerFactory(appRouter);

/**
 * The sales MCP face of the admin: today's queue, lead lookup, and logging
 * outcomes through the same tRPC procedures the Today page calls, as the
 * admin who owns the key. It never sends a message — the operator does,
 * and the agent logs what happened. No delete tools.
 */
export function buildSalesMcpServer(
  actor: ApiKeyActor,
  t: Translate,
): McpServer {
  const caller = createCaller(callerContext(actor, t));
  const server = new McpServer(SERVER_INFO, {
    instructions:
      "Gateling sales pipeline (Egyptian ateliers; WhatsApp and phone). Read `get_sales_guide` first. Start each day with `get_today`: it is the prioritised queue with each lead's primary action and the outcome ids `log_outcome` accepts. This server never sends messages — draft them for the operator, and log only what the operator reports. Never suggest a third unanswered WhatsApp message (Auto-park bucket): it risks a ban on the business number.",
  });
  const { readTool, writeTool } = toolRegistrar(server, t, LOG_TAG);

  server.registerResource(
    "sales-guide",
    GUIDE_URI,
    { title: "Sales guide", mimeType: "text/markdown" },
    async (uri) => ({ contents: [{ uri: uri.href, text: await readGuide() }] }),
  );

  server.registerTool(
    "get_sales_guide",
    {
      title: "Read the sales guide",
      description:
        "How the pipeline works: buckets, outcomes, the follow-up safety limit, the daily routine and how to write messages for Egyptian ateliers. Read this first.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    },
    async () => text(await readGuide()),
  );

  readTool(
    "get_today",
    "Get today's work",
    "Today's prioritised queue (rescue → overdue → follow-up → new → auto-park) with each lead's contact details, why it is due, its primary action, the outcome ids you may log, and the day's progress. New leads past the daily goal are flagged `beyondDailyGoal`.",
    z.object({}),
    async () => agentToday(await caller.sales.today({})),
  );

  readTool(
    "list_leads",
    "List leads",
    "The whole pipeline, newest first, paged. Filters (each optional, combined with AND): statuses, tiers and WhatsApp statuses (any of the listed values), city and business type (partial match), and a search over name, phone, city, area and WhatsApp profile name.",
    listLeadsInput,
    (input) => caller.sales.list(toGridInput(input)),
  );

  readTool(
    "get_lead",
    "Get a lead",
    "One lead with its full activity timeline (oldest first is not guaranteed; read `occurredAt`); the Google Maps listing is in its `maps*` fields and `address`.",
    leadIdInput,
    ({ leadId }) => caller.sales.byId({ id: leadId }),
  );

  writeTool(
    "log_outcome",
    "Log an outcome",
    "Record what happened with a lead, using an id from that lead's `outcomes` in `get_today`. `bookDemo` and `callBack` need `at` (ISO 8601 with offset, in the future). `notInterested`, `wrongNumber` and `park` close the lead — log them only when the operator says so. Optional `note` is saved on the activity.",
    logOutcomeInput,
    async ({ leadId, outcome: id, at, note }) => {
      const outcome = outcomeById(id);
      if (outcome.kind === "park") {
        await caller.sales.park({ leadId, reason: note });
        return {
          logged: true,
          outcome: id,
          pipelineStatus: outcome.pipelineStatus,
        };
      }
      const result = outcomeToLogInput(
        outcome,
        leadId,
        at ? new Date(at) : null,
        new Date(),
      );
      if (!result.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      const { activityId } = await caller.sales.logActivity({
        ...result.input,
        ...(note ? { notes: note } : {}),
      });
      return {
        logged: true,
        outcome: id,
        activityId,
        pipelineStatus: outcome.pipelineStatus,
      };
    },
    // Some outcomes close the lead: clients should confirm with the operator.
    { destructive: true },
  );

  writeTool(
    "add_note",
    "Add a note",
    "Append a note to a lead's timeline (no status change, not a contact).",
    addNoteInput,
    async ({ leadId, note }) =>
      caller.sales.logActivity({ leadId, type: "note", notes: note }),
  );

  writeTool(
    "create_lead",
    "Create a lead",
    "Add a prospect (status `new`). Check `list_leads` with a search first so you do not create a duplicate.",
    agentLeadCreate,
    (input) => caller.sales.create(input),
  );

  writeTool(
    "set_social_profile",
    "Record a social profile",
    "Save what research found for a lead on one platform (instagram, facebook, tiktok). Research all three: first follow the links on profiles already found (a Facebook Page lists its Instagram and TikTok under Contact info), then search for the rest. `found` needs `url` (the profile link on that platform) and should carry the public `handle`, `displayName` (the name shown on the profile), `followers`, `posts` and a short `bio` as they appear today. Facebook only: `avatarUrl` is the page's profile picture, uploaded first with the content server's `create_upload_url` (pass its `publicUrl`); a Facebook image link is refused because it expires. Omitting `displayName` or `avatarUrl` keeps the stored one. `notFound` records that a search found no account; `clear` removes a wrong entry. Replaces that platform's previous entry; the server stamps the check time. Only public business-profile facts — never personal details of individuals.",
    setSocialProfileInput,
    async ({ leadId, ...profile }) =>
      caller.sales.setSocialProfile(
        profile.status === "found"
          ? { ...profile, id: leadId, status: "found", url: profile.url ?? "" }
          : { id: leadId, platform: profile.platform, status: profile.status },
      ),
  );

  writeTool(
    "set_maps_listing",
    "Record the Google Maps listing",
    'Save a lead\'s Google Maps listing (one per lead). Copy `address`, `category` (as Maps shows it, e.g. "Bridal shop"), `rating` (0–5) and `reviewCount` from the listing, and `embed` from Share › Embed a map (the HTML or its `https://www.google.com/maps/embed?pb=…` src). Send only what you found: omitted fields keep their stored value. Rating, reviews and category are dated when saved. `get_lead` shows the current values (`maps*` fields and `address`).',
    setMapsListingInput,
    async ({ leadId, ...fields }) =>
      caller.sales.setMapsListing({ id: leadId, ...fields }),
    // Overwrites the stored listing (no history): confirm with the operator.
    { destructive: true },
  );

  writeTool(
    "update_lead",
    "Update a lead's details",
    "Change contact or profile fields; send only the fields to change. Includes `whatsappProfileName` (the name WhatsApp shows), `whatsappPhone` (only when WhatsApp is on a different number than `phone`) and `whatsappIsBusiness` (a WhatsApp Business account). Overwrites the old value (no history), so confirm with the operator. Status goes through `log_outcome`, notes through `add_note`, Maps data through `set_maps_listing`, social profiles through `set_social_profile`; do-not-contact and owner are not editable here.",
    agentLeadUpdate,
    async (input) => {
      await caller.sales.update(input);
      return { updated: true };
    },
    { destructive: true },
  );

  return server;
}

async function readGuide(): Promise<string> {
  return readFile(path.join(process.cwd(), "docs", "sales-mcp.md"), "utf8");
}
