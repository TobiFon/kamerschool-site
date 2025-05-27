"use client";
import React, { useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DeviceFrame from "./DeviceFrame"; // Assuming DeviceFrame.tsx is in the same directory or path is correct
import {
  ArrowRight,
  Users,
  ShieldCheck,
  BarChart2,
  MessageCircle,
  CalendarCheck,
  Settings,
  LayoutDashboard,
  Heart,
  Bell,
} from "lucide-react";
import {
  useLocalizedAsset,
  CloudinaryAssetOptions,
  AssetType,
} from "@/lib/assets-utils"; // Import the hook and types

// Base asset paths (will be localized by the hook)
// These paths should NOT have leading slashes and NO file extensions
// They represent the path *after* `kamerschools/{locale}/`
const baseAdminDashboardImagePath = "tablet-phone/tablet-1";
const baseParentAppOverviewImagePath = "tablet-phone/phone-2";
const baseParentAppResultsImagePath = "tablet-phone/phone-1";

interface AudienceHighlightProps {
  type: "admin" | "parent";
}

export default function AudienceHighlight({ type }: AudienceHighlightProps) {
  const tKey = type === "admin" ? "ForAdmins" : "ForParents";
  const t = useTranslations(`HomePage.AudienceHighlights.${tKey}`);
  const sectionRef = useRef(null);
  const getAssetPath = useLocalizedAsset();

  // Define common image options for these display areas
  // Adjust width/quality as needed for optimal display and performance
  const imageDisplayOptions: CloudinaryAssetOptions = {
    width: 800, // Example width, adjust based on DeviceFrame's typical display size
    quality: "auto:good",
    format: "auto", // Let Cloudinary choose the best format (e.g., avif, webp)
  };

  // Localize asset paths using the hook, specifying 'image' type and options
  const adminDashboardImage = getAssetPath(
    baseAdminDashboardImagePath,
    "image",
    imageDisplayOptions
  );
  const parentAppOverviewImage = getAssetPath(
    baseParentAppOverviewImagePath,
    "image",
    imageDisplayOptions
  );
  const parentAppResultsImage = getAssetPath(
    baseParentAppResultsImagePath,
    "image",
    imageDisplayOptions
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const isParentSection = type === "parent";
  const imageFirstOnDesktop = isParentSection;

  // Text animations
  const textOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.4, 0.7, 0.9],
    [0, 1, 1, 0]
  );
  const textY = useTransform(
    scrollYProgress,
    [0.1, 0.4, 0.7, 0.9],
    ["20px", "0px", "0px", "-20px"]
  );

  // Ensure t.raw returns the expected structure or provide a fallback
  const benefitsData = t.raw("benefits");
  const benefits: Array<{ icon: string; text: string }> = Array.isArray(
    benefitsData
  )
    ? benefitsData
    : [];

  const getIcon = (iconName: string) => {
    const iconProps = {
      className: "w-5 h-5 text-primary flex-shrink-0",
      strokeWidth: 2,
    };
    switch (iconName) {
      case "ShieldCheck":
        return <ShieldCheck {...iconProps} />;
      case "Users":
        return <Users {...iconProps} />;
      case "BarChart2":
        return <BarChart2 {...iconProps} />;
      case "MessageCircle":
        return <MessageCircle {...iconProps} />;
      case "CalendarCheck":
        return <CalendarCheck {...iconProps} />;
      case "Settings":
        return <Settings {...iconProps} />;
      case "LayoutDashboard":
        return <LayoutDashboard {...iconProps} />;
      case "Heart":
        return <Heart {...iconProps} />;
      case "Bell":
        return <Bell {...iconProps} />;
      default:
        return <ArrowRight {...iconProps} />; // Fallback icon
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
    },
  };

  const adminDeviceRotation = imageFirstOnDesktop
    ? { y: -8, z: 3 }
    : { y: 8, z: -3 };

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-32 lg:py-36 relative overflow-hidden 
                 ${
                   type === "admin"
                     ? "bg-slate-50 dark:bg-slate-900"
                     : "bg-background dark:bg-slate-950"
                 }`}
    >
      {/* Decorative Background Elements */}
      <motion.div
        className="absolute top-[10%] left-[5%] w-32 h-32 md:w-48 md:h-48 rounded-full opacity-20 dark:opacity-15 pointer-events-none -z-1"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary)/0.2) 0%, transparent 70%)",
          y: useTransform(scrollYProgress, [0, 1], ["-30%", "30%"]),
          x: useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]),
          filter: "blur(25px)",
        }}
      />
      <motion.div
        className="absolute bottom-[15%] right-[10%] w-24 h-24 md:w-36 md:h-36 rounded-full opacity-15 dark:opacity-10 pointer-events-none -z-1"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--secondary)/0.8) 0%, transparent 60%)",
          y: useTransform(scrollYProgress, [0, 1], ["40%", "-40%"]),
          x: useTransform(scrollYProgress, [0, 1], ["15%", "-15%"]),
          filter: "blur(20px)",
        }}
      />
      <div
        className={`absolute inset-0 opacity-[0.02] dark:opacity-[0.01] -z-1 pointer-events-none`}
        style={{
          backgroundImage:
            "linear-gradient(hsla(var(--foreground)/0.1) 0.5px, transparent 0.5px), linear-gradient(to right, hsla(var(--foreground)/0.1) 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Mobile: Image First, then Text */}
        <div className="md:hidden">
          <div className="mb-12">
            {type === "admin" ? (
              <DeviceFrame
                type="tablet"
                src={adminDashboardImage} // Use localized path
                alt={t("imageAlt")}
                priority // Consider if this is always above the fold on mobile
                initialRotation={{ y: 5, z: -2 }}
                scrollParallaxDepth={0.7}
                containerScrollProgress={scrollYProgress}
              />
            ) : (
              <DeviceFrame
                type="mobile"
                src={parentAppOverviewImage} // Use localized path
                alt={t("imageAlt")}
                src2={parentAppResultsImage} // Use localized path
                alt2={t("imageAlt2", { defaultValue: t("imageAlt") })}
                priority // Consider if this is always above the fold on mobile
                initialRotation={{ z: 0 }}
                scrollParallaxDepth={0.8}
                containerScrollProgress={scrollYProgress}
              />
            )}
          </div>
          {/* Text Content for Mobile */}
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={contentVariants}
          >
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20">
              {isParentSection
                ? t("tag", { defaultValue: "For Parents & Guardians" })
                : t("tag", { defaultValue: "For Administrators & Staff" })}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground dark:text-slate-100 mb-5 leading-tight">
              {t("headline")}
            </h2>
            <p className="text-lg text-muted-foreground dark:text-slate-300/80 mb-8 leading-relaxed">
              {t("subheadline")}
            </p>
            {benefits && benefits.length > 0 && (
              <ul className="space-y-4 mb-10">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center space-x-3.5"
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{
                      delay: 0.2 + index * 0.1,
                      duration: 0.5,
                      ease: "circOut",
                    }}
                  >
                    <div className="p-2.5 rounded-full bg-primary/10 dark:bg-primary/20">
                      {getIcon(benefit.icon)}
                    </div>
                    <span className="text-foreground/90 dark:text-slate-200/90 text-base sm:text-[1.05rem]">
                      {benefit.text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-semibold group px-7 py-3.5 text-base w-full sm:w-auto border-border hover:border-primary/60 text-foreground/80 hover:text-primary dark:border-slate-700 dark:hover:border-primary/50 dark:text-slate-300 dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 focus-visible:ring-primary/50"
            >
              <Link href={isParentSection ? "/parents" : "/features"}>
                {t("cta")}{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Desktop: Original Order */}
        <div className="hidden md:grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-24 items-center">
          {/* Text Content Column (Desktop) */}
          <motion.div
            className={`${imageFirstOnDesktop ? "md:order-2" : "md:order-1"}`}
            style={{ opacity: textOpacity, y: textY }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={contentVariants}
          >
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20">
              {isParentSection
                ? t("tag", { defaultValue: "For Parents & Guardians" })
                : t("tag", { defaultValue: "For Administrators & Staff" })}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.9rem] font-extrabold text-foreground dark:text-slate-100 mb-5 leading-tight">
              {t("headline")}
            </h2>
            <p className="text-lg text-muted-foreground dark:text-slate-300/80 mb-8 leading-relaxed">
              {t("subheadline")}
            </p>
            {benefits && benefits.length > 0 && (
              <ul className="space-y-4 mb-10">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center space-x-3.5"
                    initial={{ opacity: 0, x: imageFirstOnDesktop ? 15 : -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{
                      delay: 0.2 + index * 0.1,
                      duration: 0.5,
                      ease: "circOut",
                    }}
                  >
                    <div className="p-2.5 rounded-full bg-primary/10 dark:bg-primary/20">
                      {getIcon(benefit.icon)}
                    </div>
                    <span className="text-foreground/90 dark:text-slate-200/90 text-base sm:text-[1.05rem]">
                      {benefit.text}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-semibold group px-7 py-3.5 text-base w-full sm:w-auto border-border hover:border-primary/60 text-foreground/80 hover:text-primary dark:border-slate-700 dark:hover:border-primary/50 dark:text-slate-300 dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 focus-visible:ring-primary/50"
            >
              <Link href={isParentSection ? "/parents" : "/features"}>
                {t("cta")}{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>

          {/* Image/Device Frame Column (Desktop) */}
          <div
            className={`${
              imageFirstOnDesktop ? "md:order-1" : "md:order-2"
            } mt-10 md:mt-0 
                        ${
                          type === "admin"
                            ? "md:pl-8 lg:pl-12"
                            : "md:pr-8 lg:pr-12"
                        } `}
          >
            {type === "admin" ? (
              <DeviceFrame
                type="tablet"
                src={adminDashboardImage} // Use localized path
                alt={t("imageAlt")}
                priority
                initialRotation={adminDeviceRotation}
                scrollParallaxDepth={1}
                containerScrollProgress={scrollYProgress}
              />
            ) : (
              <DeviceFrame
                type="mobile"
                src={parentAppOverviewImage} // Use localized path
                alt={t("imageAlt")}
                src2={parentAppResultsImage} // Use localized path
                alt2={t("imageAlt2", { defaultValue: t("imageAlt") })}
                priority
                initialRotation={{ y: 0, z: 0 }}
                scrollParallaxDepth={1.2}
                containerScrollProgress={scrollYProgress}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
