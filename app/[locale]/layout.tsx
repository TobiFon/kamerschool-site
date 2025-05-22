import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";

// i18n imports
import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";

// UI imports
import { Toaster } from "sonner";
import "../globals.css";
import localFont from "next/font/local";

const inter = localFont({
  src: [
    {
      path: "./fonts/Inter_18pt-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Inter_18pt-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Inter_18pt-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
});
// In your layout.tsx file, update the metadata section:

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  // Initialize t function for the current locale

  const awaitedParams = await params;
  const locale = awaitedParams.locale;
  const t = await getTranslations({ locale, namespace: "Metadata.Root" });
  // Use absolute paths for OpenGraph images to avoid localization issues
  const currentOgImage =
    locale === "fr" ? `/opengraph-image-fr.png` : `/opengraph-image-en.png`;

  return {
    // --- GENERAL METADATA ---
    title: {
      default: t("title"),
      template: `%s | ${t("titleTemplateSuffix")}`,
    },
    description: t("description"),
    keywords: t("keywords")
      .split(",")
      .map((k) => k.trim()),
    authors: [{ name: t("author") }],

    // --- FAVICONS (Using absolute paths) ---
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon.png", type: "image/png" }],
    },
    manifest: "/site.webmanifest",

    // --- OPEN GRAPH (for social sharing) ---
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: t("ogUrl"),
      siteName: t("ogSiteName"),
      images: [
        {
          url: currentOgImage,
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
      locale: locale,
      type: "website",
    },

    // --- TWITTER CARD ---
    twitter: {
      card: "summary_large_image",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      images: [currentOgImage],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(var(--background))" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(var(--background))" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster richColors position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
