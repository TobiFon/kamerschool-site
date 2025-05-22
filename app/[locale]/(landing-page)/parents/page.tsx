import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl"; // For client component part
import React from "react";
import {
  Home,
  GraduationCap,
  BarChart3,
  CalendarCheck2,
  DollarSign,
  Bell,
  MessageCircle,
  Megaphone,
  CalendarDays,
} from "lucide-react";
import ParentPageIntro from "@/components/parents/ParentsPageIntro";
import ParentFeatureSection from "@/components/parents/ParentsFeatureSection";
import CreativeCtaSection from "@/components/home/GeneralCTASection";
import { useLocalizedAsset } from "@/lib/assets-utils";

// --- METADATA GENERATION (SERVER-SIDE) ---
export async function generateMetadata({
  params, // 1. Receive the whole params object
}: {
  params: { locale: string };
}) {
  const awaitedParams = await params; // 2. Await params
  const { locale } = awaitedParams; // 3. Destructure locale from the awaited params

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
        `Missing translation for ${key} in namespace ${translator.namespace}, locale ${locale}`
      );
      return fallback;
    }
  };

  return {
    // Consider adding metadataBase here or in a root layout if you haven't already
    // metadataBase: new URL('https://www.kamerschools.com'),
    title: tMeta("title"),
    description: tMeta("description"),
    openGraph: {
      title: tMeta("ogTitle"),
      description: tMeta("ogDescription"),
      type: safeGet(tRoot, "openGraph.type", "website"),
      siteName: safeGet(tRoot, "openGraph.siteName", "Kamerschools"),
      locale: locale,
      // url: `https://www.kamerschools.com/${locale}/features/parents-students`, // Your canonical URL
      // images: [ // Add a specific OG image for this page
      //   {
      //     url: "/og-images/features-parents.png", // Example, ensure path is correct and localized if needed
      //     width: 1200,
      //     height: 630,
      //     alt: tMeta("ogImageAlt"), // Ensure you have this translation
      //   },
      // ],
    },
    // If you have keywords and tMeta("keywords") can return a non-string (e.g. if missing), ensure safe handling:
    // keywords: (safeGet(tMeta, "keywords") || "").split(',').map(k => k.trim()).filter(k => k),
  };
}

interface ParentFeatureItem {
  id: string;
  icon: React.ReactElement;
  titleKey: string;
  benefitKey: string;
  functionalitiesKey: string[];
  mockupImgSrc: string;
  mockupAltKey: string;
  imageOnLeft?: boolean;
}

// This component uses `useTranslations`, so it's a Client Component.
// The `generateMetadata` function above is separate and runs on the server.
export default function ParentsStudentsFeaturesPage() {
  const t = useTranslations("FeaturesPage.ParentsStudents");
  const getAssetPath = useLocalizedAsset();

  const parentFeatures: ParentFeatureItem[] = [
    {
      id: "home-dashboard",
      icon: <Home className="h-8 w-8 text-primary" />,
      titleKey: "homeTab.title",
      benefitKey: "homeTab.benefit",
      functionalitiesKey: [
        "homeTab.func1",
        "homeTab.func2",
        "homeTab.func3",
        "homeTab.func4",
      ],
      mockupImgSrc: "/mockups/parent/home.png",
      mockupAltKey: "homeTab.mockupAlt",
      imageOnLeft: false,
    },
    {
      id: "academic-results",
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      titleKey: "resultsTab.title",
      benefitKey: "resultsTab.benefit",
      functionalitiesKey: [
        "resultsTab.func1",
        "resultsTab.func2",
        "resultsTab.func3",
      ],
      mockupImgSrc: "/mockups/parent/results.png",
      mockupAltKey: "resultsTab.mockupAlt",
      imageOnLeft: true,
    },
    {
      id: "performance-analytics",
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      titleKey: "analysisTab.title",
      benefitKey: "analysisTab.benefit",
      functionalitiesKey: [
        "analysisTab.func1",
        "analysisTab.func2",
        "analysisTab.func3",
        "analysisTab.func4",
      ],
      mockupImgSrc: "/mockups/parent/analysis.png",
      mockupAltKey: "analysisTab.mockupAlt",
      imageOnLeft: false,
    },
    {
      id: "attendance-records",
      icon: <CalendarCheck2 className="h-8 w-8 text-primary" />,
      titleKey: "attendanceTab.title",
      benefitKey: "attendanceTab.benefit",
      functionalitiesKey: [
        "attendanceTab.func1",
        "attendanceTab.func2",
        "attendanceTab.func3",
      ],
      mockupImgSrc: "/mockups/parent/attendance.png",
      mockupAltKey: "attendanceTab.mockupAlt",
      imageOnLeft: true,
    },
    {
      id: "fees-tracking",
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      titleKey: "feesTab.title",
      benefitKey: "feesTab.benefit",
      functionalitiesKey: ["feesTab.func1", "feesTab.func2", "feesTab.func3"],
      mockupImgSrc: "/mockups/parent/fees.png",
      mockupAltKey: "feesTab.mockupAlt",
      imageOnLeft: false,
    },
    {
      id: "instant-notifications",
      icon: <Bell className="h-8 w-8 text-primary" />,
      titleKey: "notifications.title",
      benefitKey: "notifications.benefit",
      functionalitiesKey: [
        "notifications.func1",
        "notifications.func2",
        "notifications.func3",
      ],
      mockupImgSrc: "/mockups/parent/instant-notifications.png",
      mockupAltKey: "notifications.mockupAlt",
      imageOnLeft: true,
    },
    {
      id: "school-feed",
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      titleKey: "socialFeed.title",
      benefitKey: "socialFeed.benefit",
      functionalitiesKey: [
        "socialFeed.func1",
        "socialFeed.func2",
        "socialFeed.func3",
      ],
      mockupImgSrc: "/mockups/parent/social-feed.png",
      mockupAltKey: "socialFeed.mockupAlt",
      imageOnLeft: false,
    },
    {
      id: "school-announcements",
      icon: <Megaphone className="h-8 w-8 text-primary" />,
      titleKey: "announcements.title",
      benefitKey: "announcements.benefit",
      functionalitiesKey: [
        "announcements.func1",
        "announcements.func2",
        "announcements.func3",
      ],
      mockupImgSrc: "/mockups/parent/announcements.png",
      mockupAltKey: "announcements.mockupAlt",
      imageOnLeft: true,
    },
    {
      id: "school-calendar",
      icon: <CalendarDays className="h-8 w-8 text-primary" />,
      titleKey: "calendar.title",
      benefitKey: "calendar.benefit",
      functionalitiesKey: [
        "calendar.func1",
        "calendar.func2",
        "calendar.func3",
      ],
      mockupImgSrc: "/mockups/parent/calendar.png",
      mockupAltKey: "calendar.mockupAlt",
      imageOnLeft: false,
    },
  ];

  return (
    <main className="flex-grow bg-slate-50 dark:bg-slate-900">
      <ParentPageIntro
        title={t("intro.title")}
        subtitle={t("intro.subtitle")}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-20 md:space-y-28">
        {parentFeatures.map((feature) => (
          <ParentFeatureSection
            key={feature.id}
            id={feature.id}
            icon={feature.icon}
            title={t(feature.titleKey)}
            benefit={t(feature.benefitKey)}
            functionalities={feature.functionalitiesKey.map((fk) => t(fk))}
            // Ensure getAssetPath is correctly handling localization if needed for mockups
            mockupImgSrc={getAssetPath(feature.mockupImgSrc)}
            mockupAlt={t(feature.mockupAltKey)}
            imageOnLeft={feature.imageOnLeft}
          />
        ))}
      </div>
      <CreativeCtaSection />
    </main>
  );
}
