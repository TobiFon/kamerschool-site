export interface ShowcaseFeature {
  id: string;
  title: string;
  description: string;
  mockupType: "image" | "video";
  mockupSrc: string; // Base path for Cloudinary, e.g., "mockups/results"
  posterSrc?: string; // Base path for Cloudinary, e.g., "images/posters/results-poster"
  altText: string;
}

export interface RawShowcaseFeatureData {
  id: string;
  mockupType: "image" | "video";
  mockupSrc: string; // Base path for Cloudinary
  posterSrc?: string; // Base path for Cloudinary
}

export const showcaseFeaturesRawData: RawShowcaseFeatureData[] = [
  {
    id: "results",
    mockupType: "video",
    mockupSrc: "mockups/results", // WAS: "/mockups/results.mp4"
    posterSrc: "images/posters/results-poster", // WAS: "/images/posters/results-poster.jpg"
  },
  {
    id: "analytics",
    mockupType: "video",
    mockupSrc: "mockups/analytics", // WAS: "/mockups/analytics.mp4"
  },
  {
    id: "communication",
    mockupType: "video",
    mockupSrc: "mockups/records", // WAS: "/mockups/records.mp4"
  },
  {
    id: "finance",
    mockupType: "video",
    mockupSrc: "mockups/fees", // WAS: "/mockups/fees.mp4"
  },
  {
    id: "attendance",
    mockupType: "video",
    mockupSrc: "mockups/attendance", // WAS: "/mockups/attendance.mp4"
    posterSrc: "images/posters/attendance-poster", // WAS: "/images/posters/attendance-poster.jpg"
  },
];
