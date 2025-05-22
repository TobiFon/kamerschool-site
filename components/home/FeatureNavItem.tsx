"use client";
import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Video } from "lucide-react";
import { ShowcaseFeature } from "./fetaturesShowcase"; // Ensure this path is correct

interface FeatureNavItemProps {
  feature: ShowcaseFeature; // This feature object now contains translated text
  isActive: boolean;
  onSelect: () => void;
}

export default function FeatureNavItem({
  feature,
  isActive,
  onSelect,
}: FeatureNavItemProps) {
  return (
    <motion.div
      onClick={onSelect}
      className={`p-4 md:p-5 rounded-xl cursor-pointer transition-all duration-300 ease-out relative overflow-hidden
                  border group
                  ${
                    isActive
                      ? "bg-card shadow-xl dark:shadow-primary/10 border-primary/60 ring-2 ring-primary/70"
                      : "bg-muted/40 dark:bg-slate-800/60 border-border/70 hover:bg-muted/60 dark:hover:bg-slate-800/90 hover:shadow-lg hover:border-border"
                  }`}
      whileHover={{ scale: isActive ? 1 : 1.025, y: isActive ? 0 : -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 15 }}
      layout
    >
      {isActive && (
        <motion.div
          layoutId="activeFeatureHighlight"
          className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-primary/70 rounded-l-lg shadow-inner shadow-primary/30"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <div
        className={`pl-3 md:pl-4 relative z-10 flex justify-between items-start`}
      >
        <div className="flex-grow">
          <div className="flex items-center mb-1">
            {feature.mockupType === "video" && (
              <Video
                className={`w-4 h-4 mr-2 flex-shrink-0 transition-colors duration-300
                          ${
                            isActive
                              ? "text-primary/90"
                              : "text-muted-foreground/70 group-hover:text-primary/80"
                          }`}
              />
            )}
            <h3
              className={`text-base md:text-lg font-semibold transition-colors duration-300
                        ${
                          isActive
                            ? "text-primary"
                            : "text-foreground/80 group-hover:text-primary"
                        }`}
            >
              {feature.title} {/* Already translated */}
            </h3>
          </div>
          <motion.div
            initial={false}
            animate={{
              height: isActive ? "auto" : 0,
              opacity: isActive ? 1 : 0,
              marginTop: isActive ? "0.35rem" : "0rem",
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground dark:text-slate-400/90 leading-relaxed pr-2">
              {feature.description} {/* Already translated */}
            </p>
          </motion.div>
        </div>
        <ChevronRight
          className={`w-5 h-5 mt-1 ml-2 flex-shrink-0 transition-all duration-300 ease-out
            ${
              isActive
                ? "transform rotate-0 text-primary"
                : "transform -rotate-90 text-muted-foreground/60 group-hover:text-primary/90 group-hover:rotate-0"
            }`}
        />
      </div>

      {isActive && (
        <motion.div
          className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100"
          animate={{ opacity: isActive ? 0.3 : 0 }}
          style={{
            background: `radial-gradient(circle at 10% 20%, hsl(var(--primary)/0.2) 0%, transparent 50%), radial-gradient(circle at 80% 90%, hsl(var(--primary)/0.1) 0%, transparent 40%)`,
          }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.div>
  );
}
