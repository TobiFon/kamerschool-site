import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl"; // For client component part
import React from "react";
import {
  LayoutDashboard,
  Users,
  BookCheck,
  BarChart3,
  UserPlus,
  DollarSign,
  CalendarClock,
  MessageSquare,
} from "lucide-react";
import PageIntro from "@/components/features/PageInto"; // Ensure this path is correct for your project
import CreativeCtaSection from "@/components/home/GeneralCTASection";
import { useLocalizedAsset } from "@/lib/assets-utils";
import FeatureSection from "@/components/features/FeatureSection"; // Ensure this path is correct

// --- METADATA GENERATION (SERVER-SIDE) ---
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const awaitedParams = await params;
  const { locale } = awaitedParams;
  const tMeta = await getTranslations({
    locale,
    namespace: "Metadata.FeaturesAdminPage",
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
    title: tMeta("title"),
    description: tMeta("description"),
    openGraph: {
      title: tMeta("ogTitle"),
      description: tMeta("ogDescription"),
      type: safeGet(tRoot, "openGraph.type", "website"),
      siteName: safeGet(tRoot, "openGraph.siteName", "Kamerschools"),
      locale: locale,
      // url: `https://www.kamerschools.com/${locale}/features/school-admin`, // Add your canonical URL
      // images: [ // Add a specific OG image for this page
      //   {
      //     url: getAssetPath("/og-images/features-admin.png"), // You'd need getAssetPath on server or hardcode
      //     width: 1200,
      //     height: 630,
      //     alt: tMeta("ogImageAlt"),
      //   },
      // ],
    },
    // keywords: tMeta("keywords").split(',').map(k => k.trim()), // If you have keywords
  };
}

interface FeatureItem {
  id: string;
  icon: React.ReactElement;
  titleKey: string;
  benefitKey: string;
  functionalitiesKey: string[];
  mockupImgSrc: string;
  mockupAltKey: string;
  mockupType?: "desktop" | "tablet" | "mobile";
  initialRotation?: { x?: number; y?: number; z?: number };
}

// Make sure SchoolAdminFeaturesPage is the default export for the page component
export default function SchoolAdminFeaturesPage() {
  const t = useTranslations("FeaturesPage.Admin");
  const getAssetPath = useLocalizedAsset();

  const features: FeatureItem[] = [
    {
      id: "central-dashboard",
      icon: <LayoutDashboard />,
      titleKey: "dashboard.title",
      benefitKey: "dashboard.benefit",
      functionalitiesKey: [
        "dashboard.func1",
        "dashboard.func2",
        "dashboard.func3",
        "dashboard.func4",
      ],
      mockupImgSrc: "/mockups/admin/dashboard.png",
      mockupAltKey: "dashboard.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: -5, z: 1 },
    },
    {
      id: "class-student-org",
      icon: <Users />,
      titleKey: "classStudent.title",
      benefitKey: "classStudent.benefit",
      functionalitiesKey: [
        "classStudent.func1",
        "classStudent.func2",
        "classStudent.func3",
      ],
      mockupImgSrc: "/mockups/admin/class-detail.png",
      mockupAltKey: "classStudent.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: 5, z: -1 },
    },
    {
      id: "results-performance",
      icon: <BookCheck />,
      titleKey: "results.title",
      benefitKey: "results.benefit",
      functionalitiesKey: [
        "results.func1",
        "results.func2",
        "results.func3",
        "results.func4",
      ],
      mockupImgSrc: "/mockups/admin/results-entry.png",
      mockupAltKey: "results.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: -6, z: 1.5 },
    },
    {
      id: "school-analytics",
      icon: <BarChart3 />,
      titleKey: "analytics.title",
      benefitKey: "analytics.benefit",
      functionalitiesKey: [
        "analytics.func1",
        "analytics.func2",
        "analytics.func3",
        "analytics.func4",
      ],
      mockupImgSrc: "/mockups/admin/analytics-charts.png",
      mockupAltKey: "analytics.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: 6, z: -1.5 },
    },
    {
      id: "enrollments-transitions",
      icon: <UserPlus />,
      titleKey: "enrollments.title",
      benefitKey: "enrollments.benefit",
      functionalitiesKey: [
        "enrollments.func1",
        "enrollments.func2",
        "enrollments.func3",
        "enrollments.func4",
      ],
      mockupImgSrc: "/mockups/admin/enrollment-form.png",
      mockupAltKey: "enrollments.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: -5, z: 1 },
    },
    {
      id: "financial-management",
      icon: <DollarSign />,
      titleKey: "finance.title",
      benefitKey: "finance.benefit",
      functionalitiesKey: [
        "finance.func1",
        "finance.func2",
        "finance.func3",
        "finance.func4",
        "finance.func5",
      ],
      mockupImgSrc: "/mockups/admin/fees-management.png",
      mockupAltKey: "finance.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: 5, z: -1 },
    },
    {
      id: "scheduling-staff",
      icon: <CalendarClock />,
      titleKey: "scheduling.title",
      benefitKey: "scheduling.benefit",
      functionalitiesKey: [
        "scheduling.func1",
        "scheduling.func2",
        "scheduling.func3",
      ],
      mockupImgSrc: "/mockups/admin/timetable-view.png",
      mockupAltKey: "scheduling.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: -6, z: 1.5 },
    },
    {
      id: "school-communication",
      icon: <MessageSquare />,
      titleKey: "communication.title",
      benefitKey: "communication.benefit",
      functionalitiesKey: [
        "communication.func1",
        "communication.func2",
        "communication.func3",
        "communication.func4",
      ],
      mockupImgSrc: "/mockups/admin/social-feed.png",
      mockupAltKey: "communication.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: 6, z: -1.5 },
    },
  ];

  return (
    // The "use client" directive at the top of the file will apply to this default export.
    // The generateMetadata function is treated separately by Next.js and runs on the server.
    <main className="flex-grow bg-slate-50 dark:bg-slate-900">
      <PageIntro title={t("intro.title")} subtitle={t("intro.subtitle")} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 space-y-20 md:space-y-28 lg:space-y-32">
        {features.map((feature, index) => (
          <FeatureSection
            key={feature.id}
            id={feature.id}
            icon={feature.icon}
            title={t(feature.titleKey)}
            benefit={t(feature.benefitKey)}
            functionalities={feature.functionalitiesKey.map((fk) => t(fk))}
            mockupImgSrc={getAssetPath(feature.mockupImgSrc)}
            mockupAlt={t(feature.mockupAltKey)}
            imageOnLeft={index % 2 === 1}
            mockupType={feature.mockupType || "desktop"}
            initialRotation={feature.initialRotation}
          />
        ))}
      </div>
      <CreativeCtaSection />
    </main>
  );
}
