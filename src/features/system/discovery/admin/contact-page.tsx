"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLinkIcon,
  LinkIcon,
  MessageSquarePlusIcon,
  UnlinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { H1, Muted } from "@/components/ui/typography";
import {
  type DiscoveryContactRole,
  discoveryContactRoleValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

import {
  CommitmentDialog,
  type CommitmentTarget,
} from "./components/commitment-dialog";
import {
  EvidenceSheet,
  type EvidenceTarget,
} from "./components/evidence-sheet";
import { TouchpointRow } from "./components/touchpoint-row";
import { CHANNEL_KEY, EVIDENCE_KIND_KEY, ROLE_KEY } from "./labels";

export function DiscoveryContactPage({ contactId }: { contactId: string }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [evidenceTarget, setEvidenceTarget] = useState<EvidenceTarget | null>(
    null,
  );
  const [commitmentTarget, setCommitmentTarget] =
    useState<CommitmentTarget | null>(null);
  const contact = useQuery(
    trpc.discovery.getContact.queryOptions({ id: contactId }),
  );
  const update = useMutation(
    trpc.discovery.updateContact.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: trpc.discovery.pathKey() }),
      onError: () => toast.error(t("discovery.saveFailed")),
    }),
  );

  if (contact.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (contact.isError || !contact.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("discovery.loadFailed")}</AlertDescription>
      </Alert>
    );
  }
  const c = contact.data;
  const lastStudyId = c.touchpoints[0]?.studyId;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <H1 className="truncate">{c.displayName}</H1>
          {c.businessName && <Muted>{c.businessName}</Muted>}
        </div>
        <Button
          className="min-h-11 sm:min-h-8"
          render={
            <Link
              href={`/discovery/log?contactId=${c.id}&contactName=${encodeURIComponent(c.displayName)}${lastStudyId ? `&studyId=${lastStudyId}` : ""}`}
            />
          }
        >
          <MessageSquarePlusIcon aria-hidden="true" />
          {t("discovery.logButton")}
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t("discovery.handles")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {c.handles.length === 0 && (
                <Muted>{t("discovery.noHandles")}</Muted>
              )}
              {c.handles.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{t(CHANNEL_KEY[h.channel])}</Badge>
                  <span dir="ltr" className="min-w-0 flex-1 truncate">
                    {h.handle ?? h.url}
                  </span>
                  {h.url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t("discovery.openProfile")}
                      render={
                        // biome-ignore lint/a11y/useAnchorContent: labelled via aria-label
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <ExternalLinkIcon aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))}
              <RoleSelect
                value={c.role}
                onChange={(role) => update.mutate({ id: c.id, role })}
              />
              {c.phone && (
                <p className="text-sm">
                  {t("discovery.fieldPhone")}: <span dir="ltr">{c.phone}</span>
                </p>
              )}
            </CardContent>
          </Card>

          <LeadLinkCard
            lead={c.lead}
            onLink={(leadId) => update.mutate({ id: c.id, leadId })}
          />

          {lastStudyId && (
            <Button
              variant="outline"
              onClick={() =>
                setCommitmentTarget({ studyId: lastStudyId, contactId: c.id })
              }
            >
              {t("discovery.logCommitment")}
            </Button>
          )}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("discovery.timeline")}</CardTitle>
          </CardHeader>
          <CardContent>
            {c.evidence.length > 0 && (
              <ul className="mb-4 flex flex-col gap-2">
                {c.evidence.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1">
                    <Badge variant="secondary">
                      {t(EVIDENCE_KIND_KEY[e.kind])}
                    </Badge>
                    <blockquote
                      className="border-primary border-s-2 ps-3 text-sm"
                      dir="auto"
                    >
                      {e.quote}
                    </blockquote>
                  </li>
                ))}
              </ul>
            )}
            {c.touchpoints.length === 0 ? (
              <Muted>{t("discovery.noTimeline")}</Muted>
            ) : (
              c.touchpoints.map((tp) => (
                <TouchpointRow
                  key={tp.id}
                  touchpoint={tp}
                  showContact={false}
                  onTagEvidence={(row) =>
                    setEvidenceTarget({
                      studyId: row.studyId,
                      contactId: row.contactId,
                      touchpointId: row.id,
                      quote:
                        row.replyText ??
                        (row.direction === "inbound" ? row.message : null),
                    })
                  }
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <EvidenceSheet
        target={evidenceTarget}
        onOpenChange={(open) => !open && setEvidenceTarget(null)}
      />
      <CommitmentDialog
        target={commitmentTarget}
        onOpenChange={(open) => !open && setCommitmentTarget(null)}
      />
    </div>
  );
}

function RoleSelect({
  value,
  onChange,
}: {
  value: DiscoveryContactRole;
  onChange: (role: DiscoveryContactRole) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-muted-foreground text-xs">
        {t("discovery.fieldRole")}
      </span>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as DiscoveryContactRole)}
      >
        <SelectTrigger size="sm" aria-label={t("discovery.fieldRole")}>
          <SelectValue>
            {(v: DiscoveryContactRole) => t(ROLE_KEY[v])}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {discoveryContactRoleValues.map((role) => (
            <SelectItem key={role} value={role}>
              {t(ROLE_KEY[role])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Points at a sales lead; never writes to it. */
function LeadLinkCard({
  lead,
  onLink,
}: {
  lead: { id: string; name: string | null } | null;
  onLink: (leadId: string | null) => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const ids = useId();
  const [query, setQuery] = useState("");
  const leads = useQuery({
    ...trpc.discovery.searchLeads.queryOptions({ query: query.trim() || "-" }),
    enabled: !lead && query.trim().length >= 2,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("discovery.linkedLead")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {lead ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/sales/leads/${lead.id}`}
              className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
            >
              {lead.name}
            </Link>
            <Button size="sm" variant="ghost" onClick={() => onLink(null)}>
              <UnlinkIcon aria-hidden="true" />
              {t("discovery.unlinkLead")}
            </Button>
          </div>
        ) : (
          <Field>
            <FieldLabel htmlFor={`${ids}-lead`}>
              {t("discovery.linkLead")}
            </FieldLabel>
            <Input
              id={`${ids}-lead`}
              dir="auto"
              placeholder={t("discovery.searchLeads")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {leads.data && leads.data.length === 0 && (
              <Muted className="text-xs">{t("discovery.noLeadMatch")}</Muted>
            )}
            {leads.data?.map((l) => (
              <Button
                key={l.id}
                variant="outline"
                className="justify-start"
                onClick={() => onLink(l.id)}
              >
                <LinkIcon aria-hidden="true" />
                <span className="truncate">{l.nameAr || l.name}</span>
                {l.city && (
                  <span className="text-muted-foreground">{l.city}</span>
                )}
              </Button>
            ))}
          </Field>
        )}
        <Muted className="text-xs">{t("discovery.linkLeadHint")}</Muted>
      </CardContent>
    </Card>
  );
}
