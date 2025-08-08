import ParentsStudentsFeaturesPage from "@/components/parents/ParentsPage";
import { getTranslations } from "next-intl/server";
import React from "react";
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const awaitedParams = await params;

  const locale = awaitedParams.locale;

  const tMeta = await getTranslations({
    locale,
    namespace: "Metadata.FeaturesParentsPage",
  });
  const tRoot = await getTranslations({ locale, namespace: "Metadata.Root" });

  const safeGet = (translator: any, key: string, fallback = "") => {
    try {
      const value = translator(key);
      return typeof value === "string" ? value : fallback;
    } catch (error) {
      console.warn(
        `Missing translation for ${key} in namespace ${translator.namespace || "unknown"}, locale ${locale}`
      );
      return fallback;
    }
  };

  return {
    title: safeGet(tMeta, "title"),
    description: safeGet(tMeta, "description"),
    openGraph: {
      title: safeGet(tMeta, "ogTitle"),
      description: safeGet(tMeta, "ogDescription"),
      type: safeGet(tRoot, "openGraph.type", "website"),
      siteName: safeGet(tRoot, "openGraph.siteName", "KamerSchool"),
      locale: locale,
    },
    // keywords: (safeGet(tMeta, "keywords") || "").split(',').map((k: string) => k.trim()).filter((k: string) => k),
  };
}
export default function ParentsPage() {
  return <ParentsStudentsFeaturesPage />;
}
