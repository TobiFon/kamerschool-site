"use client";
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { PlayCircle, ZoomIn } from "lucide-react";
import { useLocalizedAsset, CloudinaryAssetOptions } from "@/lib/assets-utils";
import { ShowcaseFeature } from "./fetaturesShowcase";

interface FeatureDisplayProps {
  feature: ShowcaseFeature;
  onMediaClick: () => void;
}

export default function FeatureDisplay({
  feature,
  onMediaClick,
}: FeatureDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const getAssetPath = useLocalizedAsset();

  // Define default options for the display area (can be overridden by modal for larger versions)
  const displayAssetOptions: CloudinaryAssetOptions = {
    width: 1280,
    quality: "auto",
  };
  const displayPosterOptions: CloudinaryAssetOptions = {
    ...displayAssetOptions,
    format: "jpg",
    quality: "good",
  };

  const localizedMockupSrc = feature.mockupSrc
    ? getAssetPath(feature.mockupSrc, feature.mockupType, displayAssetOptions)
    : "";
  const localizedPosterSrc = feature.posterSrc
    ? getAssetPath(feature.posterSrc, "image", displayPosterOptions)
    : undefined;

  useEffect(() => {
    const videoElement = videoRef.current;
    if (feature.mockupType === "video" && videoElement && localizedMockupSrc) {
      videoElement.load();
      videoElement
        .play()
        .catch((error) =>
          console.log("Autoplay prevented for feature display:", error)
        );
    }
  }, [feature.id, localizedMockupSrc, feature.mockupType]);

  const displayVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 25,
        duration: 0.6,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -20,
      transition: { type: "tween", ease: "anticipate", duration: 0.4 },
    },
  };

  if (!feature || !feature.mockupSrc) {
    // Handle case where feature or mockupSrc might be missing
    return (
      <div className="aspect-[16/10] md:aspect-[16/9] lg:aspect-[16/9] bg-slate-200 dark:bg-slate-800/70 rounded-xl md:rounded-2xl shadow-2xl dark:shadow-primary/15 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">
          Media not available
        </p>
      </div>
    );
  }

  return (
    <div
      className="aspect-[16/10] md:aspect-[16/9] lg:aspect-[16/9] 
                 bg-slate-200 dark:bg-slate-800/70 
                 rounded-xl md:rounded-2xl 
                 shadow-2xl dark:shadow-primary/15
                 overflow-hidden relative group/display"
      onClick={
        (feature.mockupType === "video" || feature.mockupType === "image") &&
        localizedMockupSrc
          ? onMediaClick
          : undefined
      }
      style={{
        cursor:
          (feature.mockupType === "video" || feature.mockupType === "image") &&
          localizedMockupSrc
            ? "pointer"
            : "default",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={feature.id + localizedMockupSrc} // Key by feature.id AND src to ensure re-animation on feature change
          variants={displayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          {feature.mockupType === "image" ? (
            <>
              {localizedMockupSrc && (
                <Image
                  src={localizedMockupSrc}
                  alt={feature.altText}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 50vw"
                  style={{ objectFit: "cover" }}
                  priority={true} // Consider if all features should be priority
                />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/display:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 pointer-events-none">
                <ZoomIn className="w-10 h-10 md:w-12 md:h-12 text-white/90 drop-shadow-lg" />
              </div>
            </>
          ) : (
            <>
              {localizedMockupSrc && (
                <video
                  ref={videoRef}
                  key={localizedMockupSrc} // Key by localized src for re-mount on src change
                  className="w-full h-full object-cover"
                  src={localizedMockupSrc}
                  poster={localizedPosterSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label={feature.altText}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover/display:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 pointer-events-none">
                <PlayCircle className="w-12 h-12 md:w-16 md:h-16 text-white/90 drop-shadow-lg transform transition-transform group-hover/display:scale-110" />
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <div
        className="absolute -inset-px rounded-xl md:rounded-2xl border border-primary/0 group-hover/display:border-primary/30 transition-all duration-300 pointer-events-none animate-pulse-slow opacity-0 group-hover/display:opacity-100"
        style={{ animationDuration: "4s" }}
      />
    </div>
  );
}
