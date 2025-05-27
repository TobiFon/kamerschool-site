"use client";

import { useLocale } from "next-intl";
import {
  getCloudinaryImageUrl,
  getCloudinaryVideoUrl,
} from "@/lib/claudinary-utils";

export type AssetType = "image" | "video";

// Define an interface for transformations you might want to pass
// These can mirror the transformation options in your claudinary-utils
// You can expand this as needed to match the options in claudinary-utils.ts
export interface CloudinaryAssetOptions {
  width?: number;
  height?: number;
  format?: string;
  quality?: string | number;
  crop?: string; // Add crop if you need to specify it often
  // ... other common transformations
}

export function useLocalizedAsset() {
  const locale = useLocale();

  const getAssetPath = (
    baseAssetPath: string,
    type: AssetType,
    options: CloudinaryAssetOptions = {}
  ): string => {
    if (!baseAssetPath) {
      // console.warn("useLocalizedAsset: baseAssetPath is empty. This might be intentional if a feature has no media.");
      return "";
    }

    const cleanedBasePath = baseAssetPath.startsWith("/")
      ? baseAssetPath.substring(1)
      : baseAssetPath;

    const publicId = `kamerschools/${locale}/${cleanedBasePath}`;

    if (type === "video") {
      return getCloudinaryVideoUrl(publicId, {
        width: options.width,
        height: options.height,
        format: options.format || "auto",
        quality: options.quality || "auto",
        crop: options.crop || "limit", // Default crop from claudinary-utils
        // Pass other options directly if needed
        ...(options as any), // Cast to any to pass through other video-specific options if not explicitly defined
      });
    } else {
      // type === "image"
      return getCloudinaryImageUrl(publicId, {
        width: options.width,
        height: options.height,
        format: options.format || "auto",
        quality: options.quality || "auto",
        crop: options.crop || "limit", // Default crop from claudinary-utils
        // Pass other options directly if needed
        ...(options as any), // Cast to any to pass through other image-specific options if not explicitly defined
      });
    }
  };

  return getAssetPath;
}
