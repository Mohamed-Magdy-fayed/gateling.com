"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLinkIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LeadLocation } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { mapsSearchUrl } from "@/features/system/sales/lib/maps-embed";
import { useTRPC } from "@/integrations/trpc/client";

type Props = {
  locations: LeadLocation[];
  onAdd: () => void;
  onEdit: (location: LeadLocation) => void;
};

/** Every location the client runs; the count here is the lead's branch count. */
export function BranchesSection({ locations, onAdd, onEdit }: Props) {
  const { t } = useTranslation();
  const headingId = useId();
  const [removing, setRemoving] = useState<LeadLocation | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: trpc.sales.byId.pathKey() });

  const setPrimary = useMutation(
    trpc.sales.setPrimaryLocation.mutationOptions({
      onSuccess: refresh,
      onError: () => toast.error(t("sales.account.locationSaveFailed")),
    }),
  );
  const remove = useMutation(
    trpc.sales.removeLocation.mutationOptions({
      onSuccess: async () => {
        setRemoving(null);
        await refresh();
      },
      onError: () => toast.error(t("sales.account.locationRemoveFailed")),
    }),
  );

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4"
      data-testid="client-branches"
    >
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="font-semibold text-lg">
          {t("sales.account.branches")}{" "}
          <span className="font-normal text-muted-foreground">
            · {t("sales.account.locationsCount", { count: locations.length })}
          </span>
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("sales.account.branchesLead")}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {locations.map((location) => {
          // The main location can go only when it is the last one.
          const canRemove = !location.isPrimary || locations.length === 1;
          return (
            <li key={location.id}>
              <Card className="h-full" data-testid="branch-card">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={location.isPrimary ? "default" : "secondary"}
                    >
                      {location.isPrimary
                        ? t("sales.account.mainTag")
                        : t("sales.account.branchTag")}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={t("sales.account.locationActions", {
                              name: location.name,
                            })}
                          >
                            <MoreHorizontalIcon aria-hidden="true" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEdit(location)}>
                          <PencilIcon aria-hidden="true" />
                          {t("common.edit")}
                        </DropdownMenuItem>
                        {!location.isPrimary && (
                          <DropdownMenuItem
                            disabled={setPrimary.isPending}
                            onClick={() =>
                              setPrimary.mutate({ id: location.id })
                            }
                          >
                            <StarIcon aria-hidden="true" />
                            {t("sales.account.makeMain")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={!canRemove}
                          onClick={() => setRemoving(location)}
                        >
                          <Trash2Icon aria-hidden="true" />
                          {canRemove
                            ? t("sales.account.remove")
                            : t("sales.account.mainCannotRemove")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="font-medium text-sm">{location.name}</span>
                    <span className="flex items-start gap-1.5 text-muted-foreground text-xs">
                      <MapPinIcon
                        aria-hidden="true"
                        className="mt-0.5 size-3 shrink-0"
                      />
                      {location.address ?? t("sales.account.noAddress")}
                    </span>
                  </div>
                  <a
                    href={mapsSearchUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1 self-start font-medium text-primary text-xs hover:underline focus-visible:underline"
                  >
                    {t("sales.account.openInMaps")}
                    <ExternalLinkIcon aria-hidden="true" className="size-3" />
                  </a>
                </CardContent>
              </Card>
            </li>
          );
        })}

        <li>
          <Button
            variant="outline"
            onClick={onAdd}
            className="flex h-full min-h-32 w-full flex-col gap-2 border-dashed p-4 text-muted-foreground"
            data-testid="branch-add"
          >
            <PlusIcon aria-hidden="true" className="size-5" />
            <span className="font-medium text-foreground text-sm">
              {locations.length === 0
                ? t("sales.account.addMainLocation")
                : t("sales.account.addBranch")}
            </span>
            <span className="text-pretty text-xs">
              {t("sales.account.embedHint")}
            </span>
          </Button>
        </li>
      </ul>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("sales.account.removeLocationTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("sales.account.removeLocationBody", {
                name: removing?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={() => removing && remove.mutate({ id: removing.id })}
            >
              {t("sales.account.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
