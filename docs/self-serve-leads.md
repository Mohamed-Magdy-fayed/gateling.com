# Self-serve leads endpoint

`POST /api/leads/self-serve` receives signup questionnaires from the Atelier
system's `/try` page and stores each as a sales prospect (`leads.kind =
prospect`, `source = self-serve`, pipeline `new`). They show up in `/sales`.

- Auth: `Authorization: Bearer <gl_live_… key>`. Create the key on /settings (API keys) with only the **Self-serve leads** scope; it can add leads and read nothing. Paste it into the Atelier system's Settings. No environment variables.
- Body (JSON, max 8 KB): `ownerName`, `phone`, `atelierName` required; `city`, `branches`, `dressVolume`, `currentTool`, `biggestPain`, `priceReaction` (`fair`|`expensive`|`think`), `contactPreference` (`whatsapp`|`call`), `socialLink` (http(s) URL), `demoStepsCompleted` (string array) optional; `locale` (`ar`|`en`); `consent: true` required; `website` is the honeypot — non-empty is accepted (200) and dropped.
- Responses: 201 `{ok,id}`, 200 duplicate (same phone within 24h) or dropped honeypot, 400 invalid, 401, 413, 429.
- Limits (Redis): 120 calls / 10 min overall, 5 per phone / hour, failed-key and per-key limits come from the API-key layer. Fails open if Redis is down.
- Server to server only: no CORS headers, so browsers cannot call it.
