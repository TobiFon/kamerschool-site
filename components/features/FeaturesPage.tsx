"use client";

import { getTranslations } from "next-intl/server"; // For metadata
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
import PageIntro from "@/components/features/PageInto";
import CreativeCtaSection from "@/components/home/GeneralCTASection";
import {
  useLocalizedAsset,
  CloudinaryAssetOptions,
  AssetType,
} from "@/lib/assets-utils"; // Import hook and types
import FeatureSection from "@/components/features/FeatureSection";

interface FeatureItemData {
  // Renamed to avoid conflict if FeatureItem is used elsewhere
  id: string;
  icon: React.ReactElement;
  titleKey: string;
  benefitKey: string;
  functionalitiesKey: string[];
  mockupImgSrcBase: string; // Changed to base path
  mockupAltKey: string;
  mockupType?: "desktop" | "tablet" | "mobile";
  initialRotation?: { x?: number; y?: number; z?: number };
}

export default function SchoolAdminFeaturesPage() {
  const t = useTranslations("FeaturesPage.Admin");
  const getAssetPath = useLocalizedAsset();

  // Define common image options for these feature mockups
  const featureImageOptions: CloudinaryAssetOptions = {
    width: 1024, // Adjust based on typical display size in FeatureSection
    quality: "auto:good",
    format: "auto", // Let Cloudinary optimize format (webp, avif, etc.)
  };

  const featuresData: FeatureItemData[] = [
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
      mockupImgSrcBase: "mockups/admin/dashboard", // Base path, no extension, no leading slash
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
      mockupImgSrcBase: "mockups/admin/class-detail",
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
      mockupImgSrcBase: "mockups/admin/results-entry",
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
      mockupImgSrcBase: "mockups/admin/analytics-charts",
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
      mockupImgSrcBase: "mockups/admin/enrollment-form",
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
      mockupImgSrcBase: "mockups/admin/fees-management",
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
      mockupImgSrcBase: "mockups/admin/timetable-view",
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
      mockupImgSrcBase: "mockups/admin/social-feed",
      mockupAltKey: "communication.mockupAlt",
      mockupType: "desktop",
      initialRotation: { y: 6, z: -1.5 },
    },
  ];

  return (
    <main className="flex-grow bg-slate-50 dark:bg-slate-900">
      <PageIntro title={t("intro.title")} subtitle={t("intro.subtitle")} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 space-y-20 md:space-y-28 lg:space-y-32">
        {featuresData.map((feature, index) => (
          <FeatureSection
            key={feature.id}
            id={feature.id}
            icon={feature.icon}
            title={t(feature.titleKey)}
            benefit={t(feature.benefitKey)}
            functionalities={feature.functionalitiesKey.map((fk) => t(fk))}
            mockupImgSrc={getAssetPath(
              feature.mockupImgSrcBase,
              "image",
              featureImageOptions
            )}
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
