# Self-serve leads endpoint

`POST /api/leads/self-serve` receives signup questionnaires from the Atelier
system's `/try` page and stores each as a sales prospect (`leads.kind =
prospect`, `source = self-serve`, pipeline `new`). They show up in `/sales`.

- Auth: `Authorization: Bearer <SELF_SERVE_LEAD_KEY>` (constant-time compare). Key unset → 503.
- Env (this project): `SELF_SERVE_LEAD_KEY` (≥24 chars). The Atelier project holds the same value as `GATELING_LEAD_KEY` and the endpoint URL as `GATELING_LEAD_URL`.
- Body (JSON, max 8 KB): `ownerName`, `phone`, `atelierName` required; `city`, `branches`, `dressVolume`, `currentTool`, `biggestPain`, `priceReaction` (`fair`|`expensive`|`think`), `contactPreference` (`whatsapp`|`call`), `socialLink` (http(s) URL), `demoStepsCompleted` (string array) optional; `locale` (`ar`|`en`); `consent: true` required; `website` is the honeypot — non-empty is accepted (200) and dropped.
- Responses: 201 `{ok,id}`, 200 duplicate (same phone within 24h) or dropped honeypot, 400 invalid, 401, 413, 429, 503.
- Limits (Redis): 120 calls / 10 min overall, 5 per phone / hour, 20 bad keys / min per IP. Fails open if Redis is down.
- Server to server only: no CORS headers, so browsers cannot call it.
