// src/app/[locale]/features/school-admin/components/PageIntro.tsx
"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles } from "lucide-react"; // Or a more relevant icon for "Features"
import React from "react";

interface PageIntroProps {
  title: string;
  subtitle: string;
  heroImageSrc?: string; // Optional specific hero image for this page
  pageIcon?: React.ReactElement; // Optional custom icon for the page title
}

export default function PageIntro({
  title,
  subtitle,
  heroImageSrc,
  pageIcon = <Sparkles />, // Default icon
}: PageIntroProps) {
  return (
    <section
      className="relative py-20 md:py-32 lg:py-36 // Adjusted padding
                       bg-gradient-to-br from-primary/5 via-background to-primary/10 
                       dark:from-primary/10 dark:via-slate-950 dark:to-primary/15 
                       overflow-hidden text-center"
    >
      {/* Subtle background pattern/elements */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsla(var(--foreground)/0.1) 0.5px, transparent 0.5px), linear-gradient(to right, hsla(var(--foreground)/0.1) 0.5px, transparent 0.5px)",
          backgroundSize: "30px 30px",
        }}
      />
      <motion.div
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl opacity-30 z-0 pointer-events-none"
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 0.95, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-1/3 h-1/3 bg-secondary/10 dark:bg-secondary/15 rounded-full blur-3xl opacity-20 z-0 pointer-events-none"
        animate={{ rotate: [0, -5, 5, 0], scale: [1, 0.95, 1.05, 1] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
          delay: 2,
        }}
      />

      <div className="container mx-auto  pt-8 md:pt-20 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground dark:text-slate-100 mb-5 leading-tight"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
          className="text-lg md:text-xl text-muted-foreground dark:text-slate-300/80 max-w-3xl mx-auto mb-12 md:mb-16"
        >
          {subtitle}
        </motion.p>

        {heroImageSrc && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.5,
              type: "spring",
              stiffness: 80,
              damping: 20,
            }}
            className="max-w-5xl xl:max-w-6xl mx-auto rounded-xl md:rounded-2xl overflow-hidden 
                       shadow-2xl dark:shadow-primary/20
                       border border-border/50 dark:border-slate-700/40
                       bg-slate-800 dark:bg-slate-900" // Background for the image frame
          >
            <div className="relative aspect-[16/9] w-full">
              {" "}
              {/* Enforce 16:9 aspect ratio */}
              <Image
                src={heroImageSrc}
                alt={title + " overview"}
                fill // Use fill to cover the container
                className="object-cover object-top" // object-cover will fill and crop
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1000px"
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
