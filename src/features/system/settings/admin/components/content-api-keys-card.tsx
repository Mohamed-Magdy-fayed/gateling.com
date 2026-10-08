"use client";

import { useQuery } from "@tanstack/react-query";
import { BanIcon, KeyRoundIcon, PlusIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InlineCode, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { ApiKeyCreateDialog } from "./api-key-create-dialog";
import { ApiKeyRevokeDialog } from "./api-key-revoke-dialog";

const SKELETON_ROW_KEYS = ["skeleton-1", "skeleton-2"];

function subscribeToNothing() {
  return () => {};
}

/**
 * Keys an AI agent uses to write site content through `/api/mcp`
 * (docs/content-mcp.md). The endpoint is read from the page, like the
 * Meetings card, so it shows this deployment's URL.
 */
export function ContentApiKeysCard() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<{ id: string; name: string } | null>(
    null,
  );
  const origin = useSyncExternalStore(
    subscribeToNothing,
    () => window.location.origin,
    () => "",
  );
  const {
    data: keys,
    isLoading,
    isError,
  } = useQuery(trpc.apiKeys.list.queryOptions());

  const formatDate = (value: Date | null) =>
    value
      ? new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(value)
      : t("systemPages.apiKeysNever");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRoundIcon className="size-4" aria-hidden />
          {t("systemPages.apiKeysTitle")}
        </CardTitle>
        <CardDescription>{t("systemPages.apiKeysLead")}</CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <PlusIcon className="size-3.5" aria-hidden />
            {t("systemPages.apiKeysNew")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-[auto_1fr] sm:items-center">
          <dt className="text-muted-foreground">
            {t("systemPages.apiKeysEndpoint")}
          </dt>
          <dd dir="ltr" className="text-start">
            <InlineCode>{`${origin}/api/mcp`}</InlineCode>
          </dd>
        </dl>

        {isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {t("systemPages.apiKeysLoadFailed")}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("systemPages.apiKeysName")}</TableHead>
                  <TableHead>{t("systemPages.apiKeysPrefix")}</TableHead>
                  <TableHead>{t("systemPages.apiKeysOwner")}</TableHead>
                  <TableHead>{t("systemPages.apiKeysLastUsed")}</TableHead>
                  <TableHead>{t("systemPages.apiKeysStatus")}</TableHead>
                  <TableHead>
                    <span className="sr-only">
                      {t("systemPages.apiKeysRevoke")}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? SKELETON_ROW_KEYS.map((rowKey) => (
                      <TableRow key={rowKey}>
                        <TableCell colSpan={6}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
                {!isLoading && keys?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Muted>{t("systemPages.apiKeysEmpty")}</Muted>
                    </TableCell>
                  </TableRow>
                ) : null}
                {keys?.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <span dir="ltr">
                        <InlineCode>{`gl_live_${key.keyPrefix}…`}</InlineCode>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span dir="ltr">{key.ownerEmail}</span>
                    </TableCell>
                    <TableCell>{formatDate(key.lastUsedAt)}</TableCell>
                    <TableCell>
                      {key.revokedAt ? (
                        <Badge variant="destructive">
                          {t("systemPages.apiKeysRevoked")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t("systemPages.apiKeysActive")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      {key.revokedAt ? null : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setRevoking({ id: key.id, name: key.name })
                          }
                        >
                          <BanIcon className="size-3.5" aria-hidden />
                          {t("systemPages.apiKeysRevoke")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ApiKeyCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <ApiKeyRevokeDialog
        apiKey={revoking}
        onOpenChange={(open) => {
          if (!open) setRevoking(null);
        }}
      />
    </Card>
  );
}
