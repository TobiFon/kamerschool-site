// src/app/[locale]/features/school-admin/components/FeatureSection.tsx
"use client";
import { motion } from "framer-motion";
// Remove direct Image import if DeviceFrame handles it
// import Image from "next/image";
import { Check } from "lucide-react";
import React from "react";
import DeviceFrame from "@/components/home/DeviceFrame"; // Assuming DeviceFrame is now in a shared location

interface FeatureSectionProps {
  id: string;
  icon: React.ReactElement;
  title: string;
  benefit: string;
  functionalities: string[];
  mockupImgSrc: string;
  mockupAlt: string;
  imageOnLeft?: boolean;
  // Props for DeviceFrame
  mockupType?: "desktop" | "tablet" | "mobile"; // Default to "desktop" or "tablet" for features
  initialRotation?: { x?: number; y?: number; z?: number };
  scrollRotationRange?: {
    x?: [number, number];
    y?: [number, number];
    z?: [number, number];
  };
  scrollParallaxDepth?: number;
}

export default function FeatureSection({
  id,
  icon,
  title,
  benefit,
  functionalities,
  mockupImgSrc,
  mockupAlt,
  imageOnLeft = false,
  mockupType = "desktop", // Default to desktop for features, can be overridden
  initialRotation,
  scrollRotationRange,
  scrollParallaxDepth = 0.8, // Slightly less parallax by default for these sections
}: FeatureSectionProps) {
  // Text content animation variants
  const textContentVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.07 },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  // Use a generic container variant for the DeviceFrame container for entry
  const deviceContainerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.1 },
    },
  };

  return (
    <section id={id} className="scroll-mt-24 py-12 md:py-16">
      {" "}
      {/* Added padding and more scroll-mt */}
      <div
        className={`grid md:grid-cols-2 gap-12 md:gap-20 lg:gap-28 items-center`}
      >
        {/* Mockup/DeviceFrame Column */}
        <motion.div
          className={`relative ${imageOnLeft ? "md:order-1" : "md:order-2"}`}
          variants={deviceContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }} // Trigger when 20% is visible
        >
          <DeviceFrame
            type={mockupType}
            src={mockupImgSrc}
            alt={mockupAlt}
            priority={false} // Usually not LCP for these individual sections
            // Pass scroll-based animation props if you want them to react to the *entire page scroll*
            // For section-specific scroll, DeviceFrame would need its own useScroll hook targeting its parent
            // For now, let's keep it simpler with entry animations and fixed initial rotations.
            initialRotation={
              initialRotation ??
              (imageOnLeft ? { y: 8, z: -2 } : { y: -8, z: 2 })
            } // Default subtle tilt based on position
            scrollParallaxDepth={scrollParallaxDepth} // If you want page-scroll parallax
            scrollRotationRange={scrollRotationRange} // If you want page-scroll rotation
          />
        </motion.div>

        {/* Text Content Column */}
        <motion.div
          className={`${imageOnLeft ? "md:order-2" : "md:order-1"} 
                      text-center md:text-left`} // Center text on mobile, left on desktop
          variants={textContentVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <motion.div
            className="flex justify-center md:justify-start mb-5" // Center icon on mobile
            variants={{
              hidden: { scale: 0 },
              visible: { scale: 1, transition: { type: "spring", delay: 0.2 } },
            }}
          >
            <div className="inline-flex items-center justify-center p-3.5 rounded-xl bg-primary/10 shadow-sm">
              {React.cloneElement(icon, { className: "h-7 w-7 text-primary" })}
            </div>
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl font-bold text-foreground dark:text-slate-100 mb-5 leading-tight"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { delay: 0.25 } },
            }}
          >
            {title}
          </motion.h2>

          <motion.p
            className="text-lg text-muted-foreground dark:text-slate-300/90 mb-8 leading-relaxed"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { delay: 0.3 } },
            }}
          >
            {benefit}
          </motion.p>

          <ul className="space-y-3.5 text-left">
            {" "}
            {/* List items remain left-aligned */}
            {functionalities.map((func, index) => (
              <motion.li
                key={index}
                className="flex items-start"
                custom={index}
                variants={listItemVariants} // Staggered via parent
              >
                <Check className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span className="text-foreground/80 dark:text-slate-300">
                  {func}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
