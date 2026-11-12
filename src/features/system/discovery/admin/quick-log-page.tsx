"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { H1, Muted } from "@/components/ui/typography";
import {
  type DiscoveryChannel,
  type DiscoveryDirection,
  type DiscoveryPersona,
  type DiscoveryTouchpointFormat,
  discoveryChannelValues,
  discoveryPersonaValues,
  discoveryTouchpointFormatValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { parseShare } from "@/features/system/discovery/lib/links";
import { useTRPC } from "@/integrations/trpc/client";

import { ChoiceChips } from "./components/choice-chips";
import {
  EvidenceSheet,
  type EvidenceTarget,
} from "./components/evidence-sheet";
import { CHANNEL_KEY, FORMAT_KEY, PERSONA_KEY } from "./labels";

/**
 * Quick capture: the load-bearing screen. Target is a Facebook DM logged in
 * under 15 seconds on a phone. Study, persona and channel are remembered from
 * the last log, the contact is one field (type or paste a link), templates
 * fill the message, and evidence is tagged right after from the toast.
 *
 * Also the Web Share Target landing page: `?url=&text=&title=` from the
 * Android share sheet pre-fill the link, channel and contact search.
 */

const MEMORY_KEY = "discovery.quickLog.v1";

type Memory = {
  studyId?: string;
  persona?: DiscoveryPersona;
  channel?: DiscoveryChannel;
};

function readMemory(): Memory {
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    return raw ? (JSON.parse(raw) as Memory) : {};
  } catch {
    return {};
  }
}

function writeMemory(memory: Memory) {
  try {
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Private mode or blocked storage: remembering is a convenience only.
  }
}

type PickedContact = { id: string | null; name: string };

type Props = {
  shared: { url?: string; text?: string; title?: string };
  initialStudyId?: string;
  initialContact?: { id: string; name: string };
};

export function DiscoveryQuickLogPage({
  shared,
  initialStudyId,
  initialContact,
}: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const ids = useId();

  const parsedShare = parseShare(shared);
  const hasShare = Boolean(parsedShare.url || parsedShare.text);

  const [studyId, setStudyId] = useState<string>(initialStudyId ?? "");
  const [persona, setPersona] = useState<DiscoveryPersona>("personal");
  const [channel, setChannel] = useState<DiscoveryChannel>(
    parsedShare.channel ?? "facebook",
  );
  const [format, setFormat] = useState<DiscoveryTouchpointFormat>("dm");
  const [direction, setDirection] = useState<DiscoveryDirection>("outbound");
  const [contactQuery, setContactQuery] = useState(parsedShare.url ?? "");
  const [contact, setContact] = useState<PickedContact | null>(
    initialContact
      ? { id: initialContact.id, name: initialContact.name }
      : null,
  );
  const [url, setUrl] = useState(parsedShare.url ?? "");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [message, setMessage] = useState(parsedShare.text);
  const [replied, setReplied] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState<EvidenceTarget | null>(
    null,
  );

  // Restore remembered choices after mount (localStorage is client-only).
  useEffect(() => {
    const memory = readMemory();
    if (!initialStudyId && memory.studyId) setStudyId(memory.studyId);
    if (memory.persona) setPersona(memory.persona);
    if (memory.channel && !parsedShare.channel) setChannel(memory.channel);
  }, [initialStudyId, parsedShare.channel]);

  const studies = useQuery(trpc.discovery.listStudies.queryOptions());
  const activeStudies = (studies.data ?? []).filter(
    (s) => s.status === "active" || s.status === "fix_pitch",
  );
  // Fall back to the newest study when nothing is remembered (or it's gone).
  const effectiveStudyId =
    activeStudies.find((s) => s.id === studyId)?.id ??
    activeStudies[0]?.id ??
    "";

  const templates = useQuery({
    ...trpc.discovery.listTemplates.queryOptions({
      studyId: effectiveStudyId || undefined,
      includeInactive: false,
    }),
    enabled: Boolean(effectiveStudyId),
  });

  const trimmedQuery = contactQuery.trim();
  const matches = useQuery({
    ...trpc.discovery.searchContacts.queryOptions({
      query: trimmedQuery,
      limit: 6,
    }),
    enabled: !contact && trimmedQuery.length >= 2,
  });

  const log = useMutation(
    trpc.discovery.logTouchpoint.mutationOptions({
      onError: () => toast.error(t("discovery.saveFailed")),
    }),
  );

  function pickTemplate(id: string) {
    setTemplateId(id);
    const template = templates.data?.find((tpl) => tpl.id === id);
    if (template) setMessage(template.body);
  }

  function reset() {
    setContact(null);
    setContactQuery("");
    setUrl("");
    setTemplateId(null);
    setMessage("");
    setReplied(false);
    setReplyText("");
    setDirection("outbound");
    setFormat("dm");
    setShowErrors(false);
  }

  function newContactName(): string {
    if (/^https?:\/\//i.test(trimmedQuery)) {
      return parseShare({ url: trimmedQuery }).handle ?? trimmedQuery;
    }
    return trimmedQuery;
  }

  async function submit() {
    if (!effectiveStudyId || !contact) {
      setShowErrors(true);
      return;
    }
    writeMemory({ studyId: effectiveStudyId, persona, channel });
    const linkUrl = url.trim() || undefined;
    const row = await log
      .mutateAsync({
        studyId: effectiveStudyId,
        contactId: contact.id ?? undefined,
        newContact: contact.id ? undefined : { displayName: contact.name },
        channel,
        format,
        direction,
        persona,
        templateId: templateId ?? undefined,
        url: linkUrl && /^https?:\/\//i.test(linkUrl) ? linkUrl : undefined,
        message: message.trim() || undefined,
        replied,
        replyText: replied ? replyText.trim() || undefined : undefined,
        source: hasShare ? "share" : "manual",
      })
      .catch(() => null);
    if (!row) return;
    await queryClient.invalidateQueries({ queryKey: trpc.discovery.pathKey() });
    const target: EvidenceTarget = {
      studyId: row.studyId,
      contactId: row.contactId,
      touchpointId: row.id,
      quote: row.replyText ?? (direction === "inbound" ? row.message : null),
    };
    toast.success(t("discovery.logged"), {
      action: {
        label: t("discovery.tagEvidence"),
        onClick: () => setEvidenceTarget(target),
      },
    });
    reset();
  }

  const urlLooksValid = !url.trim() || /^https?:\/\//i.test(url.trim());

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <H1>{t("discovery.logTitle")}</H1>
        <Muted>{t("discovery.logLead")}</Muted>
      </header>

      {hasShare && (
        <Alert>
          <AlertDescription>{t("discovery.sharedFrom")}</AlertDescription>
        </Alert>
      )}

      {studies.isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("discovery.loadFailed")}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <FieldGroup>
            {/* Study */}
            <Field data-invalid={showErrors && !effectiveStudyId}>
              <FieldLabel htmlFor={`${ids}-study`}>
                {t("discovery.fieldStudy")}
              </FieldLabel>
              {studies.isPending ? (
                <Skeleton className="h-11 w-full sm:h-8" />
              ) : activeStudies.length === 0 ? (
                <Muted>
                  <Link href="/discovery" className="text-primary underline">
                    {t("discovery.noActiveStudy")}
                  </Link>
                </Muted>
              ) : (
                <Select
                  value={effectiveStudyId}
                  onValueChange={(value) => setStudyId(String(value))}
                >
                  <SelectTrigger
                    id={`${ids}-study`}
                    className="min-h-11 w-full sm:min-h-8"
                  >
                    <SelectValue>
                      {(value: string) =>
                        activeStudies.find((s) => s.id === value)?.title ??
                        t("discovery.pickStudy")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {activeStudies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>

            {/* Contact */}
            <Field data-invalid={showErrors && !contact}>
              <FieldLabel htmlFor={`${ids}-contact`}>
                {t("discovery.fieldContact")}
              </FieldLabel>
              {contact ? (
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {contact.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 sm:min-h-8"
                    onClick={() => setContact(null)}
                  >
                    <XIcon aria-hidden="true" />
                    {t("discovery.changeContact")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    id={`${ids}-contact`}
                    dir="auto"
                    autoComplete="off"
                    className="min-h-11 sm:min-h-8"
                    placeholder={t("discovery.contactPlaceholder")}
                    value={contactQuery}
                    aria-invalid={showErrors && !contact}
                    onChange={(e) => {
                      const value = e.target.value;
                      setContactQuery(value);
                      // A pasted profile link is also the touchpoint's link.
                      const share = parseShare({ text: value });
                      if (share.url) {
                        setUrl(share.url);
                        if (share.channel) setChannel(share.channel);
                      }
                    }}
                  />
                  {trimmedQuery.length >= 2 && (
                    <ul className="flex flex-col gap-1">
                      {matches.data?.map((m) => (
                        <li key={m.id}>
                          <Button
                            type="button"
                            variant="outline"
                            className="min-h-11 w-full justify-start sm:min-h-8"
                            onClick={() =>
                              setContact({ id: m.id, name: m.displayName })
                            }
                          >
                            <span className="truncate">{m.displayName}</span>
                            {m.businessName && (
                              <span className="text-muted-foreground truncate">
                                {m.businessName}
                              </span>
                            )}
                          </Button>
                        </li>
                      ))}
                      <li>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-11 w-full justify-start sm:min-h-8"
                          onClick={() =>
                            setContact({ id: null, name: newContactName() })
                          }
                        >
                          <span className="truncate">
                            {t("discovery.createContact", {
                              name: newContactName(),
                            })}
                          </span>
                        </Button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
              {showErrors && !contact && (
                <p role="alert" className="text-destructive text-xs">
                  {t("discovery.required")}
                </p>
              )}
            </Field>

            {/* Channel */}
            <Field>
              <FieldLabel>{t("discovery.fieldChannel")}</FieldLabel>
              <ChoiceChips
                label={t("discovery.fieldChannel")}
                value={channel}
                onChange={setChannel}
                options={discoveryChannelValues.map((value) => ({
                  value,
                  label: t(CHANNEL_KEY[value]),
                }))}
              />
            </Field>

            {/* Persona */}
            <Field>
              <FieldLabel>{t("discovery.fieldPersona")}</FieldLabel>
              <ChoiceChips
                label={t("discovery.fieldPersona")}
                value={persona}
                onChange={setPersona}
                options={discoveryPersonaValues.map((value) => ({
                  value,
                  label: t(PERSONA_KEY[value]),
                }))}
              />
            </Field>

            {/* Direction + format */}
            <Field>
              <FieldLabel>{t("discovery.fieldDirection")}</FieldLabel>
              <ChoiceChips
                label={t("discovery.fieldDirection")}
                value={direction}
                onChange={setDirection}
                options={[
                  {
                    value: "outbound" as const,
                    label: t("discovery.directionOutbound"),
                  },
                  {
                    value: "inbound" as const,
                    label: t("discovery.directionInbound"),
                  },
                ]}
              />
            </Field>
            <Field>
              <FieldLabel>{t("discovery.fieldFormat")}</FieldLabel>
              <ChoiceChips
                label={t("discovery.fieldFormat")}
                value={format}
                onChange={setFormat}
                options={discoveryTouchpointFormatValues.map((value) => ({
                  value,
                  label: t(FORMAT_KEY[value]),
                }))}
              />
            </Field>

            {/* Template */}
            {direction === "outbound" && (
              <Field>
                <FieldLabel>{t("discovery.fieldTemplate")}</FieldLabel>
                {templates.data && templates.data.length > 0 ? (
                  <ChoiceChips
                    label={t("discovery.fieldTemplate")}
                    value={templateId}
                    onChange={pickTemplate}
                    options={templates.data.map((tpl) => ({
                      value: tpl.id,
                      label: tpl.title,
                    }))}
                  />
                ) : (
                  <Muted>{t("discovery.noTemplates")}</Muted>
                )}
              </Field>
            )}

            {/* Message */}
            <Field>
              <FieldLabel htmlFor={`${ids}-message`}>
                {t("discovery.fieldMessage")}
              </FieldLabel>
              <Textarea
                id={`${ids}-message`}
                dir="auto"
                rows={4}
                placeholder={t("discovery.messagePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>

            {/* Replied */}
            {direction === "outbound" && (
              <Field orientation="horizontal">
                <Switch
                  id={`${ids}-replied`}
                  checked={replied}
                  onCheckedChange={(checked) => setReplied(checked === true)}
                />
                <FieldLabel htmlFor={`${ids}-replied`}>
                  {t("discovery.fieldReplied")}
                </FieldLabel>
              </Field>
            )}
            {direction === "outbound" && replied && (
              <Field>
                <FieldLabel htmlFor={`${ids}-reply`}>
                  {t("discovery.fieldReplyText")}
                </FieldLabel>
                <Textarea
                  id={`${ids}-reply`}
                  dir="auto"
                  rows={3}
                  placeholder={t("discovery.replyPlaceholder")}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </Field>
            )}

            {/* Link */}
            <Field data-invalid={!urlLooksValid}>
              <FieldLabel htmlFor={`${ids}-url`}>
                {t("discovery.fieldLink")}
              </FieldLabel>
              <Input
                id={`${ids}-url`}
                type="url"
                inputMode="url"
                dir="ltr"
                className="min-h-11 text-start sm:min-h-8"
                value={url}
                aria-invalid={!urlLooksValid}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Sticky save: reachable with a thumb while the keyboard is closed. */}
      {/* Sticky, not fixed: a fixed bar would cover the in-flow mobile tab bar. */}
      <div className="bg-background/95 sticky bottom-0 z-20 border-t py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:py-0">
        <div className="mx-auto w-full max-w-xl">
          <Button
            type="button"
            className="min-h-12 w-full text-base md:min-h-9 md:text-sm"
            disabled={log.isPending || !urlLooksValid}
            onClick={submit}
          >
            <LoadingSwap isLoading={log.isPending}>
              {t("discovery.save")}
            </LoadingSwap>
          </Button>
        </div>
      </div>

      <EvidenceSheet
        target={evidenceTarget}
        onOpenChange={(open) => !open && setEvidenceTarget(null)}
      />
    </div>
  );
}
