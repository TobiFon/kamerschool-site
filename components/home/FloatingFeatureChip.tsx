// src/components/home/FloatingFeatureChip.tsx (New Component)
"use client";
import React from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

export const FloatingFeatureChip = ({
  icon,
  text,
  delay,
  positionClasses,
  rotation = 0,
  size = "sm",
  heroScrollProgress, // Expects the main hero's scroll progress
}: {
  icon: React.ReactNode;
  text: string;
  delay: number;
  positionClasses: string;
  rotation?: number;
  size?: "sm" | "md";
  heroScrollProgress: MotionValue<number>;
}) => {
  const padding = size === "sm" ? "p-2 sm:p-2.5" : "p-2.5 sm:p-3";
  const iconSize =
    size === "sm" ? "h-4 w-4 sm:h-5 sm:w-5" : "h-5 w-5 sm:h-6 sm:w-6";
  const textSize =
    size === "sm" ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"; // Slightly larger base

  // Chips fade out as text content scrolls away (between 10% and 28% of hero scroll)
  const chipOpacity = useTransform(heroScrollProgress, [0.1, 0.28], [1, 0]);
  const chipScale = useTransform(heroScrollProgress, [0.1, 0.28], [1, 0.5]); // Scale down more
  const chipY = useTransform(heroScrollProgress, [0.1, 0.28], ["0%", "-50%"]); // Move up as they fade

  return (
    <motion.div
      className={`bg-card/80 dark:bg-slate-800/70 backdrop-blur-lg ${padding} rounded-lg sm:rounded-xl shadow-xl flex items-center space-x-1.5 sm:space-x-2 ${positionClasses} border border-border/50 dark:border-slate-700/50`}
      initial={{ opacity: 0, y: 40, scale: 0.6, rotate: rotation - 20 }} // More dynamic entry
      animate={{ opacity: 1, y: 0, scale: 1, rotate: rotation }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay }} // Softer spring
      whileHover={{
        y: -8,
        scale: 1.1,
        boxShadow: "0px 15px 25px -10px hsl(var(--primary) / 0.25)", // Themed, softer hover shadow
        transition: { type: "spring", stiffness: 200, damping: 10 },
      }}
      style={{
        // Apply scroll-based animations
        opacity: chipOpacity,
        scale: chipScale,
        y: chipY,
        // transformOrigin: "center", // default
      }}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: `${iconSize} flex-shrink-0 text-primary`, // Icon uses primary color
      })}
      <span
        className={`${textSize} font-semibold text-foreground/80 dark:text-slate-200/90 whitespace-nowrap`}
      >
        {text}
      </span>
    </motion.div>
  );
};
