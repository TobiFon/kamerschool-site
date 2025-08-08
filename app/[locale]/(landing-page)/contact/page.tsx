import ContactPage from "@/components/contact/ContactPage";
import React from "react";
import { getTranslations } from "next-intl/server"; // For server-side metadata

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const tMeta = await getTranslations({
    locale,
    namespace: "Metadata.ContactPage",
  });
  const tRoot = await getTranslations({ locale, namespace: "Metadata.Root" });

  const safeGet = (translator: any, key: string, fallback = "") => {
    try {
      const value = translator(key);
      return typeof value === "string" ? value : fallback;
    } catch (error) {
      console.warn(
        `Missing translation for ${key} in namespace ${translator.namespace}, locale ${locale}`
      );
      return fallback;
    }
  };

  return {
    title: tMeta("title"), // e.g., "Contact KamerSchool | Get in Touch"
    description: tMeta("description"), // e.g., "Have questions about KamerSchool? Contact us for support, inquiries, or to request a demo of our school management software for Cameroon."
    openGraph: {
      title: tMeta("ogTitle"),
      description: tMeta("ogDescription"),
      type: safeGet(tRoot, "openGraph.type", "website"),
      siteName: safeGet(tRoot, "openGraph.siteName", "KamerSchool"),
      locale: locale,
      // url: `https://www.KamerSchool.com/${locale}/contact`, // Your canonical URL
      // images: [ // Consider a specific OG image for the contact page if desired
      //   {
      //     url: "/og-images/contact-us.png",
      //     width: 1200,
      //     height: 630,
      //     alt: tMeta("ogImageAlt"),
      //   },
      // ],
    },
    // keywords: tMeta("keywords").split(',').map(k => k.trim()),
  };
}

export default function Contact() {
  return <ContactPage />;
}
