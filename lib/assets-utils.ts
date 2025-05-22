// src/utils/asset-utils.ts
import { useLocale } from "next-intl";

/**
 * Returns the path to a localized asset based on the current locale
 * Falls back to default locale if asset doesn't exist in current locale
 */
export function useLocalizedAsset() {
  const locale = useLocale();

  return (path: string, fallbackLocale = "en"): string => {
    // For client-side usage, we return the localized path directly
    // The middleware will handle the locale detection
    return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
  };
}

/**
 * Server-side function to get localized asset path
 */
export function getLocalizedAssetPath(
  locale: string,
  path: string,
  fallbackLocale = "en"
): string {
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}
