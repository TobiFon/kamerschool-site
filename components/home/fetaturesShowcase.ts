// src/data/showcaseFeatures.ts (or similar)

// The interface now defines the expected structure *after* translation.
// The raw data below will only contain the non-translatable parts.
export interface ShowcaseFeature {
  id: string;
  title: string; // This will be populated by translations
  description: string; // This will be populated by translations
  mockupType: "image" | "video";
  mockupSrc: string;
  posterSrc?: string;
  altText: string; // This will be populated by translations
}

// This interface is for the raw data before translations are applied.
export interface RawShowcaseFeatureData {
  id: string;
  mockupType: "image" | "video";
  mockupSrc: string;
  posterSrc?: string;
  // title, description, altText are removed here, they come from i18n
}

export const showcaseFeaturesRawData: RawShowcaseFeatureData[] = [
  {
    id: "results",
    mockupType: "video",
    mockupSrc: "/mockups/results.mp4",
    posterSrc: "/images/posters/results-poster.jpg",
  },
  {
    id: "analytics",
    mockupType: "video",
    mockupSrc: "/mockups/analytics.mp4",
  },
  {
    id: "communication",
    mockupType: "video",
    mockupSrc: "/mockups/records.mp4",
  },
  {
    id: "finance",
    mockupType: "video",
    mockupSrc: "/mockups/fees.mp4",
  },
  {
    id: "attendance",
    mockupType: "video",
    mockupSrc: "/mockups/attendance.mp4",
    posterSrc: "/images/posters/attendance-poster.jpg",
  },
];
