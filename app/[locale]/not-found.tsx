// app/[locale]/not-found.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorLayout } from "@/components/error-layout";

// A simple, thematic illustration for a missing page
function MissingPageIllustration() {
  return (
    <div className="relative mx-auto h-48 w-48">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl font-black text-slate-200 dark:text-slate-700">
        404
      </div>
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0 h-full w-full animate-[spin_20s_linear_infinite]"
      >
        <path
          fill="hsla(var(--primary) / 0.2)"
          d="M48.2,-61.7C62.5,-52,74.2,-37.2,77,-21C79.8,-4.8,73.7,12.8,65.3,27.5C56.9,42.2,46.2,54.1,32.7,62.8C19.1,71.5,2.7,77.1,-13.7,75.4C-30.1,73.7,-46.5,64.7,-58,52C-69.5,39.3,-76.1,22.9,-75.7,6.8C-75.3,-9.3,-67.9,-25.2,-57.2,-37.5C-46.5,-49.8,-32.5,-58.5,-17.9,-64C2.7,-69.5,23.9,-71.4,48.2,-61.7Z"
          transform="translate(100 100)"
        />
      </svg>
    </div>
  );
}

export default async function NotFoundPage() {
  const t = await getTranslations("ErrorPages.notFound");

  return (
    <ErrorLayout
      illustration={<MissingPageIllustration />}
      title={t("title")}
      description={t("description")}
    >
      <Button asChild>
        <Link href="/">{t("goHomeBtn")}</Link>
      </Button>
      <div className="relative w-full max-w-xs">
        <Input
          type="search"
          placeholder={t("searchPlaceholder")}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </ErrorLayout>
  );
}
