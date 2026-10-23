-- Read-only baseline for the Today's work redesign
-- (docs/designs/sales-workspace-redesign.md, accepted requirement 213).
-- Run once before the redesign ships and again two weeks after; record both
-- results in docs/sales-pipeline.md. SELECT only — safe against production.
--
--   psql "$DATABASE_URL" -v sprint_start="'2026-10-24 00:00+03'" -f docs/queries/sales-baseline.sql
--
-- sprint_start is the sell-first sprint's SPRINT_START (day 1), recorded by
-- the founder. Days and weeks are Cairo-local.

with acts as (
  select a."leadId", a."occurredAt", a.type
  from lead_activities a
  join leads l on l.id = a."leadId" and l.kind = 'prospect'
  where a."occurredAt" >= :sprint_start::timestamptz
),
gaps as (
  select extract(epoch from "occurredAt" - lag("occurredAt") over (order by "occurredAt")) / 3600 as hours
  from acts
)
select 'leads_touched_per_day' as metric,
       (("occurredAt" at time zone 'Africa/Cairo')::date)::text as period,
       count(distinct "leadId")::text as value
from acts
group by 2
union all
select 'median_hours_between_logs', 'since sprint_start',
       coalesce(round((percentile_cont(0.5) within group (order by hours))::numeric, 1)::text, 'n/a')
from gaps
where hours is not null
union all
select 'demos_booked_per_week',
       (date_trunc('week', "occurredAt" at time zone 'Africa/Cairo')::date)::text,
       count(distinct "leadId")::text
from acts
where type = 'demo_scheduled'
group by 2
order by 1, 2;
