-- Custom SQL migration file, put your code below! --
--
-- DATA MIGRATION (no schema change): backfill the owner's yeses
-- (src/features/system/sales/lib/yeses.ts) from each lead's existing status
-- and history, so the checklist, the yes bars and the dashboard funnel match
-- the pipeline as it stands.
--
-- A tick is a `note` activity with outcome `YES:<step>:<yes|no>`. Ticks are
-- dated at the lead's last contact (else its last update, else creation), so
-- backfilled yeses don't count as "+N this week" on the dashboard.
--
-- Evidence per step (prospects only):
--   callTime       yes: an answered call, a WhatsApp reply or any demo step was
--                  logged, or the status is contacted / callback_scheduled or
--                  further along
--   shareProblems  yes: status demo_agreed or further (she agreed to see her
--                  own problem solved)
--   watchVideo     yes: the VIDEO message was sent and she talked to us after it
--   demo           yes: a demo was ever booked, or status demo_scheduled+
--   trial          yes: a demo was ever held, or status demo_done / won
--   subscribe      yes: status won
--   referrals      never backfilled
--   lost leads     no on the step right after their furthest yes
--
-- Idempotent: a step that already has any tick is left alone, so running it
-- again adds nothing and real ticks always win.

WITH steps(step, n) AS (
  VALUES
    ('callTime', 1),
    ('shareProblems', 2),
    ('watchVideo', 3),
    ('demo', 4),
    ('trial', 5),
    ('subscribe', 6),
    ('referrals', 7)
),
facts AS (
  SELECT
    l."id",
    l."pipelineStatus"::text AS status,
    COALESCE(l."lastContactedAt", l."updatedAt", l."createdAt") AS at,
    EXISTS (
      SELECT 1 FROM "lead_activities" a
      WHERE a."leadId" = l."id"
        AND a."type" IN ('call', 'whatsapp_reply', 'demo_agreed', 'demo_scheduled', 'demo_done')
    ) AS talked,
    EXISTS (
      SELECT 1 FROM "lead_activities" v
      WHERE v."leadId" = l."id"
        AND v."type" = 'whatsapp_sent'
        AND upper(btrim(COALESCE(v."outcome", ''))) LIKE 'VIDEO%'
        AND EXISTS (
          SELECT 1 FROM "lead_activities" r
          WHERE r."leadId" = l."id"
            AND r."type" IN ('call', 'whatsapp_reply', 'demo_agreed', 'demo_scheduled', 'demo_done')
            AND r."occurredAt" > v."occurredAt"
        )
    ) AS watched_video,
    EXISTS (
      SELECT 1 FROM "lead_activities" a
      WHERE a."leadId" = l."id" AND a."type" = 'demo_scheduled'
    ) AS demo_booked,
    EXISTS (
      SELECT 1 FROM "lead_activities" a
      WHERE a."leadId" = l."id" AND a."type" = 'demo_done'
    ) AS demo_held
  FROM "leads" l
  WHERE l."kind" = 'prospect'
),
yeses AS (
  SELECT f."id", f.at, v.step
  FROM facts f
  CROSS JOIN LATERAL (
    VALUES
      ('callTime', f.talked OR f.status IN ('contacted', 'callback_scheduled', 'demo_agreed', 'demo_scheduled', 'demo_done', 'won')),
      ('shareProblems', f.status IN ('demo_agreed', 'demo_scheduled', 'demo_done', 'won')),
      ('watchVideo', f.watched_video),
      ('demo', f.demo_booked OR f.status IN ('demo_scheduled', 'demo_done', 'won')),
      ('trial', f.demo_held OR f.status IN ('demo_done', 'won')),
      ('subscribe', f.status = 'won')
  ) AS v(step, ok)
  WHERE v.ok
),
furthest AS (
  SELECT f."id", f.at, COALESCE(max(s.n), 0) AS top
  FROM facts f
  LEFT JOIN yeses y ON y."id" = f."id"
  LEFT JOIN steps s ON s.step = y.step
  WHERE f.status = 'lost'
  GROUP BY f."id", f.at
),
ticks AS (
  SELECT "id", at, step, 'yes' AS answer FROM yeses
  UNION ALL
  SELECT fu."id", fu.at, s.step, 'no' AS answer
  FROM furthest fu
  JOIN steps s ON s.n = fu.top + 1
)
INSERT INTO "lead_activities" ("leadId", "type", "occurredAt", "outcome", "notes", "createdBy", "createdAt")
SELECT
  t."id",
  'note',
  t.at,
  'YES:' || t.step || ':' || t.answer,
  'Backfilled from the lead''s status and history',
  'system:yes-backfill',
  t.at
FROM ticks t
WHERE NOT EXISTS (
  SELECT 1 FROM "lead_activities" a
  WHERE a."leadId" = t."id"
    AND a."type" = 'note'
    AND a."outcome" LIKE 'YES:' || t.step || ':%'
);
