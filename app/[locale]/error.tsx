// app/[locale]/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { HardDrive, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorLayout } from "@/components/error-layout";

// A thematic illustration for a server/system error
function SystemGlitchIllustration() {
  return (
    <div className="relative mx-auto h-48 w-48 flex items-center justify-center">
      <HardDrive className="h-32 w-32 text-slate-300 dark:text-slate-600" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 animate-ping rounded-full bg-red-500/50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500" />
    </div>
  );
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPages.serverError");

  useEffect(() => {
    // This is a great place to log the error to a service like Sentry, Logtail, etc.
    console.error(error);
  }, [error]);

  return (
    <ErrorLayout
      illustration={<SystemGlitchIllustration />}
      title={t("title")}
      description={t("description")}
    >
      <Button onClick={() => reset()}>
        <RefreshCcw className="mr-2 h-4 w-4" />
        {t("tryAgainBtn")}
      </Button>
      <Button variant="outline" asChild>
        <Link href="/">{t("goHomeBtn")}</Link>
      </Button>
    </ErrorLayout>
  );
}
