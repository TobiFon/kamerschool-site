"use client";
import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Users,
  BookOpen,
  Zap,
} from "lucide-react";

import { FloatingFeatureChip } from "./FloatingFeatureChip";
import DashboardVideoDisplay from "./VideoModal";
import RequestDemoModal from "../RequestDemoModal";

const NoiseTexture = () => (
  <svg
    className="absolute inset-0 w-full h-full -z-[5]"
    aria-hidden="true"
    style={{ pointerEvents: "none" }}
  >
    <filter id="noiseFilterHero">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.65" // Adjust for grain size
        numOctaves="3"
        stitchTiles="stitch"
      />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 .12 0"
      />
    </filter>
    <rect
      width="100%"
      height="100%"
      filter="url(#noiseFilterHero)"
      opacity="0.5"
    />
  </svg>
);

export default function HeroSection() {
  const t = useTranslations("HomePage.Hero");
  // Get translations specifically for feature chips
  const featureT = useTranslations("HomePage.Hero.Features");
  const sectionRef = useRef<HTMLElement>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const { scrollYProgress: sectionScrollProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end center"],
  });

  // Parallax for the background layers
  const backgroundY = useTransform(
    sectionScrollProgress,
    [0, 1],
    ["0%", "30%"]
  ); // Increased parallax effect
  const backgroundYFast = useTransform(
    sectionScrollProgress,
    [0, 1],
    ["0%", "50%"]
  );

  const textAnimationEnd = 0.28;

  const headlineOpacity = useTransform(
    sectionScrollProgress,
    [0, textAnimationEnd * 0.85],
    [1, 0]
  );
  const headlineY = useTransform(
    sectionScrollProgress,
    [0, textAnimationEnd * 0.85],
    ["0%", "-40%"]
  );
  const headlineScale = useTransform(
    sectionScrollProgress,
    [0, textAnimationEnd * 0.85],
    [1, 0.75]
  );

  const subContentOpacity = useTransform(
    sectionScrollProgress,
    [0.05, textAnimationEnd],
    [1, 0]
  );
  const subContentY = useTransform(
    sectionScrollProgress,
    [0.05, textAnimationEnd],
    ["0%", "-25%"]
  );
  const subContentScale = useTransform(
    sectionScrollProgress,
    [0.05, textAnimationEnd],
    [1, 0.85]
  );

  const videoContainerAnimationStart = 0;
  const videoContainerAnimationEnd = 0.35;

  const videoContainerScale = useTransform(
    sectionScrollProgress,
    [videoContainerAnimationStart, videoContainerAnimationEnd, 0.6, 1],
    [0.92, 1.02, 1.0, 0.98]
  );
  const videoContainerY = useTransform(
    sectionScrollProgress,
    [videoContainerAnimationStart, videoContainerAnimationEnd, 0.6, 1],
    ["5%", "-2%", "-10%", "-15%"]
  );

  const headlineWords = t("headline").split(" ");
  const headlineVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.2 },
    },
  };
  const wordVariants = {
    hidden: { opacity: 0, y: 25, rotateX: -45, transformOrigin: "bottom" },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: "spring", stiffness: 120, damping: 12 },
    },
  };

  const renderHeadlineWithGradient = () => {
    return headlineWords.map((word, index) => {
      const startGradientAt = Math.max(0, headlineWords.length - 3);
      const opacityForGradientVisual =
        index >= startGradientAt
          ? 1 -
            ((index - startGradientAt) /
              (Math.min(headlineWords.length, 3) || 1)) *
              0.4
          : 1;
      return (
        <motion.span
          key={index}
          variants={wordVariants}
          className="inline-block mr-[0.2em]"
          style={{
            opacity: opacityForGradientVisual,
            ...(index >= startGradientAt && {
              background:
                "linear-gradient(90deg, currentColor, hsla(var(--foreground) / 0.6))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }),
          }}
        >
          {word}
        </motion.span>
      );
    });
  };

  const itemFadeInUp = (delay = 0, duration = 0.6) => ({
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: [0.25, 0.1, 0.25, 1], delay },
    },
  });

  return (
    <>
      <section
        ref={sectionRef}
        className="relative
        min-h-screen md:min-h-[120vh] 
        flex flex-col items-center justify-start
        pt-32 md:pt-40 pb-20 md:pb-24 overflow-x-clip overflow-y-visible" // Increased md:min-h for more scroll room
      >
        {/* --- Enhanced Background --- */}
        <div className="absolute inset-0 -z-30 bg-background dark:bg-slate-950" />
        <motion.div // Layer 1: Main large, soft primary color bloom
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-20 dark:opacity-30"
          style={{
            y: backgroundY,
            backgroundImage:
              "radial-gradient(ellipse 80% 70% at 30% 30%, hsl(var(--primary)/0.4) 0%, transparent 60%)",
          }}
          animate={{
            transform: [
              "translateX(0%) translateY(0%) rotate(0deg) scale(1)",
              "translateX(-5%) translateY(5%) rotate(8deg) scale(1.1)",
              "translateX(0%) translateY(0%) rotate(0deg) scale(1)",
            ],
          }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "mirror",
          }}
        />
        <motion.div // Layer 2: Secondary color accent, faster movement
          className="absolute -bottom-1/3 -right-1/3 w-[120%] h-[120%] opacity-15 dark:opacity-20"
          style={{
            y: backgroundYFast, // Moves a bit faster for more depth
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 70% 80%, hsl(var(--secondary, var(--primary))/0.3) 0%, transparent 55%)", // Fallback to primary if secondary not set
          }}
          animate={{
            transform: [
              "translateX(0%) translateY(0%) rotate(0deg) scale(1)",
              "translateX(10%) translateY(-8%) rotate(-12deg) scale(1.05)",
              "translateX(0%) translateY(0%) rotate(0deg) scale(1)",
            ],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "mirror",
            delay: 3,
          }}
        />
        <motion.div // Layer 3: Central subtle pulse/glow
          className="absolute inset-0 w-full h-full opacity-50 dark:opacity-60"
          style={{
            y: backgroundY,
            backgroundImage:
              "radial-gradient(ellipse 100% 90% at 50% 60%, hsl(var(--primary)/0.08) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            repeatType: "mirror",
            delay: 1.5,
          }}
        />
        {/* Grid pattern (more subtle) */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] -z-10"
          style={{
            backgroundImage:
              "linear-gradient(hsla(var(--foreground)/0.15) 0.5px, transparent 0.5px), linear-gradient(to right, hsla(var(--foreground)/0.15) 0.5px, transparent 0.5px)",
            backgroundSize: "32px 32px", // Slightly larger, softer grid
            maskImage:
              "radial-gradient(ellipse 120% 70% at 50% 100%, black 30%, transparent 75%)", // Fade out grid towards top more gently
          }}
        />
        <NoiseTexture />
        {/* --- End Enhanced Background --- */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col justify-center">
          <div className="flex flex-col items-center text-center relative">
            <div className="w-full max-w-3xl xl:max-w-4xl mb-32 md:mb-44 relative z-20">
              <motion.h1
                className="text-3xl sm:text-4xl lg:text-[3rem] xl:text-[4rem] font-extrabold text-foreground dark:text-slate-50 mb-4 !leading-tight tracking-tighter"
                variants={headlineVariants}
                initial="hidden"
                animate="visible"
                style={{
                  opacity: headlineOpacity,
                  y: headlineY,
                  scale: headlineScale,
                  transformOrigin: "center 70%",
                }}
              >
                {renderHeadlineWithGradient()}
              </motion.h1>
              <motion.div
                style={{
                  opacity: subContentOpacity,
                  y: subContentY,
                  scale: subContentScale,
                  transformOrigin: "center top",
                }}
              >
                <motion.p
                  variants={itemFadeInUp(
                    headlineWords.length * 0.04 + 0.5,
                    0.7
                  )}
                  initial="hidden"
                  animate="visible"
                  className="text-lg sm:text-xl text-muted-foreground dark:text-slate-300/80 mb-6 md:mb-8 max-w-xl md:max-2xl mx-auto"
                >
                  {t("subheadline")}
                </motion.p>
                <motion.div
                  variants={itemFadeInUp(
                    headlineWords.length * 0.04 + 0.7,
                    0.7
                  )}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
                >
                  <Button
                    size="lg"
                    onClick={() => setIsDemoModalOpen(true)}
                    className="hero-cta-primary w-full sm:w-auto px-8 py-3 text-base"
                  >
                    {t("ctaPrimary")}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="hero-cta-secondary w-full sm:w-auto px-8 py-3 text-base border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5"
                  >
                    <Link href="/parents">
                      {t("ctaSecondary")}{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              className="w-full mt-[-40px] md:mt-[-60px] lg:mt-[-70px] relative z-10"
              style={{
                y: videoContainerY,
                scale: videoContainerScale,
                transformOrigin: "center 35%",
                perspective: "1500px", // Add perspective here for children 3D transforms
              }}
            >
              <DashboardVideoDisplay
                heroScrollProgress={sectionScrollProgress}
              />
              {/* FloatingFeatureChip setup with localized text */}
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <FloatingFeatureChip
                  icon={<TrendingUp />}
                  text={featureT("realTimeAnalytics")}
                  delay={1.6}
                  positionClasses="absolute top-[-5%] sm:top-[-2%] right-[1%] sm:right-[4%] md:right-[8%]"
                  rotation={8}
                  size="md"
                  heroScrollProgress={sectionScrollProgress}
                />
                <FloatingFeatureChip
                  icon={<ShieldCheck />}
                  text={featureT("dataSecurity")}
                  delay={1.8}
                  positionClasses="absolute bottom-[0%] sm:bottom-[3%] right-[10%] sm:right-[13%] md:right-[20%]"
                  rotation={-6}
                  size="sm"
                  heroScrollProgress={sectionScrollProgress}
                />
                <FloatingFeatureChip
                  icon={<Users />}
                  text={featureT("parentPortal")}
                  delay={2.0}
                  positionClasses="absolute top-[28%] sm:top-[32%] left-[-1%] sm:left-[3%] md:left-[7%]"
                  rotation={-12}
                  size="sm"
                  heroScrollProgress={sectionScrollProgress}
                />
                <FloatingFeatureChip
                  icon={<BookOpen />}
                  text={featureT("academicRecords")}
                  delay={2.2}
                  positionClasses="absolute bottom-[12%] sm:bottom-[16%] left-[3%] sm:left-[9%] md:left-[14%]"
                  rotation={10}
                  size="md"
                  heroScrollProgress={sectionScrollProgress}
                />
                <FloatingFeatureChip
                  icon={<Zap />}
                  text={featureT("instantNotifications")}
                  delay={2.4}
                  positionClasses="absolute top-[55%] translate-y-[-50%] right-[1%] sm:right-[2%] md:right-[5%]"
                  rotation={-9}
                  size="sm"
                  heroScrollProgress={sectionScrollProgress}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
}
