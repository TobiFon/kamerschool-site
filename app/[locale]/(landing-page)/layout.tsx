// app/[locale]/(landing-page)/layout.tsx

import Footer from "@/components/Footer";
import Navbar from "@/components/NavBar";
import { getTranslations } from "next-intl/server";
import React from "react";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const awaitedParams = await params;
  const { locale } = awaitedParams;

  const tRoot = await getTranslations({ locale, namespace: "Metadata.Root" });
  const tHome = await getTranslations({
    locale,
    namespace: "Metadata.HomePage",
  });

  const safeGet = (translator: any, key: string) => {
    try {
      return translator(key);
    } catch (error) {
      console.warn(`Missing translation for ${key} in locale ${locale}`);
      return "";
    }
  };

  return {
    // Consider adding metadataBase here if this layout defines OG images
    // metadataBase: new URL('https://yourdomain.com'),
    title: tHome("title"),
    description: tHome("description"),
    openGraph: {
      title: tHome("ogTitle"),
      description: tHome("ogDescription"),
      type: safeGet(tRoot, "openGraph.type"),
      siteName: safeGet(tRoot, "openGraph.siteName"),
      locale: locale,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
