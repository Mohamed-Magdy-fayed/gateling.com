import { HomeIcon, ShieldBanIcon } from "lucide-react";

import { LinkButton } from "@/components/general/link-button";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/features/core/i18n/server";

export default async function UnauthorizedPage() {
  const { t } = await getT();

  return (
    <div className="grid justify-center gap-4 p-4">
      <Badge className="mx-auto" variant="destructive">
        {t("authTranslations.accessDenied")}
      </Badge>
      <ShieldBanIcon className="m-4" size={200} />
      <LinkButton href="/">
        <HomeIcon />
        {t("authTranslations.backToHome")}
      </LinkButton>
    </div>
  );
}
