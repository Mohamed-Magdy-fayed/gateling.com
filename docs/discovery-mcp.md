# Discovery MCP guide

Endpoint: `/api/mcp/discovery`. It needs an API key with the **discovery** scope, created on /settings. Served to agents through `get_discovery_guide`.

Discovery is **not sales**. It records whether a problem is real and whether people pay, **before** anything is built or sold. It never sends messages and never changes a sales lead. A contact may only *point* at a lead (`update_contact` with `leadId`).

## The method (6 steps, in order)

1. **Problem**: a recurring, shared pain that costs time or money, where today's fixes are bad, and you can name 10 reachable people who have it. Ask about the last time it happened and what it cost. Never ask for opinions ("would you use an app…?").
2. **Prototype**: a clickable mockup shown to people who have the pain.
3. **Payment**: a real price, plus a deposit or pre-order. Compliments count for nothing.
4. **MVP**: the smallest core loop, only for the people who paid.
5. **Measure**: usage analytics, and chase negative feedback.
6. **Distribution**: a domain partner, and content from the trenches.

A study's `step` moves only by the operator's decision. The readout suggests a step but never moves it.

## What counts

- **Conversation**: a contact with a two-way exchange. That means an outbound message with a reply, an inbound message, a call, or a meeting. **Every `call` or `meeting` touchpoint counts**, so log one only after a real two-way talk with the person the study targets (the owner or decision-maker). A no-answer, a voicemail, or a call where only staff or a gatekeeper answered is **not** a call to log: note it on the contact (`update_contact` → `notes`) instead.
- **Removed** touchpoints (see `remove_touchpoint`) count for nothing: not as a conversation, not in reply rates, not in lists.
- **Story**: a contact with at least one `incident` evidence (a specific, recent event).
- **Commitment**: a contact with a **paid** deposit or pre-order, or who accepted the price. A promised deposit does not count until it is paid.

## Verdict (after `targetConversations`, default 10)

- **collecting**: fewer conversations than the target.
- **go**: the first or second hypothesis passed (the core pain), and commitments are at least `goMinCommitments` (default 3). Sell to those people. Build nothing new.
- **fix_pitch**: stories are at least `killMinStories` (default 3), but there are too few commitments. Test another price or model.
- **kill**: fewer than `killMinStories` stories. Move to the next niche.

## Evidence kinds

| kind | Use when they… |
|---|---|
| `incident` | describe a specific recent event ("last week two brides booked the same dress") |
| `workaround_tool` | name what they use today (notebook, Excel, WhatsApp, a desktop program) |
| `cost_loss` | mention money or time lost (set `amountEgp` if they say a number) |
| `money_commitment` | commit money in words; log the commitment itself with `log_commitment` |
| `compliment` | praise the idea. This is noise: recorded only so it is ignored |
| `other_pain` | mention a different pain (often where the real problem is) |

The quote is **their exact words**, usually Egyptian Arabic. Never translate, summarise or invent a quote. Link a quote to a hypothesis only when the quote actually shows it.

## Logging from a screenshot

1. `list_studies` to pick the study (ask if there is more than one active).
2. `find_contact` with the profile URL or the name in the chat header. Create the contact only if nothing matches. Use `newContact` inside `log_touchpoint` or `create_contact`.
3. `log_touchpoint` (for a phone call, only if the target person actually talked with you; see **What counts**):
   - `channel`: where the chat is (facebook, instagram, whatsapp, phone, in_person, group_forum, linkedin).
   - `persona`: `personal` if sent from Mohamed's own profile, `gateling` if sent from the brand Page or account.
   - `message`: what was sent.
   - `templateId`: the template used, if it matches one from `list_templates`.
   - `occurredAt`: the send time, if visible.
   - If they replied in the same screenshot, also set `replied: true`, `replyText` and `repliedAt`.
   - `source: "mcp"`.
4. `add_evidence` for each meaningful thing they said, with `touchpointId`.
5. `log_commitment` for any deposit, pre-order or price reaction the operator confirms.
6. Tell the operator what you logged, and the study's readout from `get_readout`.

## Persona experiment

Every outbound touchpoint records who it was sent as. `get_readout` → `replyStats.byPersona` shows the reply rate and the median reply time per persona. That is how we test "pitching as Gateling gets no replies". Use the right `persona` every time.

## Safety

- Never send a message. Draft it for the operator and log only what they report.
- `update_study` (step or status), `set_hypothesis_verdict`, `set_commitment_status` and `remove_touchpoint` are the operator's decisions. Confirm before calling them.
- `remove_touchpoint` is for a row logged by mistake (a no-answer, a staff-only call, the wrong contact or study). Show the operator the row first (contact, format, date, message) and pass a short `reason`; the row is hidden, not erased, and the reason is kept. Afterwards:
  - Removing an inbound row also clears the "replied" mark it put on the earlier outbound message (`unmarkedReplyIds`). If a later inbound message from the same contact exists, that one becomes the reply instead (`rematchedReplyIds`). Removing an outbound row does not move its reply onto an older message; use `mark_replied` if needed.
  - Evidence tagged from that touchpoint is **kept** and listed in `linkedEvidence`; ask the operator whether it came from the same mistake (evidence is deleted in the app).
  - If `contactStillInStudy` is false, the contact has no live touchpoint left in the study, but their evidence and commitments still count: tell the operator.
  - Report the new readout from `get_readout`.
- Nothing is hard-deleted through this server. Evidence and studies are deleted in the app.
