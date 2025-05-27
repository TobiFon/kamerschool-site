// This directive makes the default export (ParentsStudentsFeaturesPage) a Client Component
"use client";

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
import ParentPageIntro from "@/components/parents/ParentsPageIntro"; // Adjust path if needed
import CreativeCtaSection from "@/components/home/GeneralCTASection"; // Adjust path if needed
import {
  useLocalizedAsset,
  CloudinaryAssetOptions,
  AssetType,
} from "@/lib/assets-utils"; // Import hook and types
import ParentFeatureSection from "@/components/parents/ParentsFeatureSection";

interface ParentFeatureItemData {
  // Renamed to avoid potential conflicts
  id: string;
  icon: React.ReactElement;
  titleKey: string;
  benefitKey: string;
  functionalitiesKey: string[];
  mockupImgSrcBase: string; // Changed to base path
  mockupAltKey: string;
  imageOnLeft?: boolean;
}

export default function ParentsStudentsFeaturesPage() {
  const t = useTranslations("FeaturesPage.ParentsStudents");
  const getAssetPath = useLocalizedAsset();

  // Define common image options for these parent feature mockups
  const parentFeatureImageOptions: CloudinaryAssetOptions = {
    width: 600, // Adjust based on the typical display size in ParentFeatureSection (phone mockups are smaller)
    quality: "auto:good",
    format: "auto", // Let Cloudinary optimize format
  };

  const parentFeaturesData: ParentFeatureItemData[] = [
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
      mockupImgSrcBase: "mockups/parent/home", // Base path, no extension, no leading slash
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
      mockupImgSrcBase: "mockups/parent/results",
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
      mockupImgSrcBase: "mockups/parent/analysis",
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
      mockupImgSrcBase: "mockups/parent/attendance",
      mockupAltKey: "attendanceTab.mockupAlt",
      imageOnLeft: true,
    },
    {
      id: "fees-tracking",
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      titleKey: "feesTab.title",
      benefitKey: "feesTab.benefit",
      functionalitiesKey: ["feesTab.func1", "feesTab.func2", "feesTab.func3"],
      mockupImgSrcBase: "mockups/parent/fees",
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
      mockupImgSrcBase: "mockups/parent/instant-notifications",
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
      mockupImgSrcBase: "mockups/parent/social-feed",
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
      mockupImgSrcBase: "mockups/parent/announcements",
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
      mockupImgSrcBase: "mockups/parent/calendar",
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
        {parentFeaturesData.map((feature) => (
          <ParentFeatureSection
            key={feature.id}
            id={feature.id}
            icon={feature.icon}
            title={t(feature.titleKey)}
            benefit={t(feature.benefitKey)}
            functionalities={feature.functionalitiesKey.map((fk) => t(fk))}
            mockupImgSrc={getAssetPath(
              feature.mockupImgSrcBase,
              "image",
              parentFeatureImageOptions
            )}
            mockupAlt={t(feature.mockupAltKey)}
            imageOnLeft={feature.imageOnLeft}
          />
        ))}
      </div>
      <CreativeCtaSection />
    </main>
  );
}
