import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Ignore TypeScript errors and missing modules during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Add experimental features for better static generation
  experimental: {
    // This can help with context issues during static generation
    staticWorkerRequestDeduping: true,
  },

  // Configure output for better compatibility
  output: "standalone",

  // Your existing configuration
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**`, // Use your cloud name env var
      },
    ],
  },

  // Add configuration for static asset handling
  async rewrites() {
    return [
      // Rewrite requests to localized asset paths
      {
        source: "/:locale/mockups/:file",
        destination: "/mockups/:file",
      },
      {
        source: "/:locale/tablet-phone/:file",
        destination: "/tablet-phone/:file",
      },
      {
        source: "/:locale/images/:file",
        destination: "/images/:file",
      },
      // Add a new rewrite for metadata assets to ensure they work in both contexts
      {
        source: "/:locale/opengraph-image-:locale.png",
        destination: "/opengraph-image-:locale.png",
      },
      {
        source: "/:locale/favicon.png",
        destination: "/favicon.png",
      },
      {
        source: "/:locale/site.webmanifest",
        destination: "/site.webmanifest",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
