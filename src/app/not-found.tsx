import { HomeIcon, SearchXIcon } from "lucide-react";

import { PublicFooter } from "@/app/(landing-pages)/_layout/footer";
import { PublicHeader } from "@/app/(landing-pages)/_layout/header";
import { Badge } from "@/components/ui/badge";
import { PageHeading, ProseText } from "@/components/ui/containers";
import { LinkButton } from "@/components/general/link-button";
import { getT } from "@/features/core/i18n/server";

export default async function NotFound() {
  const { t } = await getT();

  return (
    <>
      <PublicHeader />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
        <Badge variant="destructive">{t("publicPages.notFound.badge")}</Badge>
        <SearchXIcon className="my-4" size={120} />
        <PageHeading>{t("publicPages.notFound.heading")}</PageHeading>
        <ProseText>{t("publicPages.notFound.description")}</ProseText>
        <LinkButton href="/" className="mt-4">
          <HomeIcon />
          {t("publicPages.notFound.backToHome")}
        </LinkButton>
      </div>
      <PublicFooter />
    </>
  );
}
