"use client";
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { PlayCircle, ZoomIn } from "lucide-react";
import { ShowcaseFeature } from "./fetaturesShowcase"; // Ensure this path is correct
import { useLocalizedAsset } from "@/lib/assets-utils"; // Import the hook

interface FeatureDisplayProps {
  feature: ShowcaseFeature;
  onMediaClick: () => void;
}

export default function FeatureDisplay({
  feature,
  onMediaClick,
}: FeatureDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const getAssetPath = useLocalizedAsset(); // Initialize the hook

  const localizedMockupSrc = getAssetPath(feature.mockupSrc);
  const localizedPosterSrc = feature.posterSrc
    ? getAssetPath(feature.posterSrc)
    : undefined;

  useEffect(() => {
    const videoElement = videoRef.current;
    if (feature.mockupType === "video" && videoElement) {
      videoElement.load(); // Ensure new source is loaded
      videoElement
        .play()
        .catch((error) =>
          console.log("Autoplay prevented for feature display:", error)
        );
    }
  }, [feature.id, localizedMockupSrc, feature.mockupType]); // Depend on localizedMockupSrc and feature.mockupType

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

  return (
    <div
      className="aspect-[16/10] md:aspect-[16/9] lg:aspect-[16/9] 
                 bg-slate-200 dark:bg-slate-800/70 
                 rounded-xl md:rounded-2xl 
                 shadow-2xl dark:shadow-primary/15
                 overflow-hidden relative group/display"
      onClick={
        feature.mockupType === "video" || feature.mockupType === "image"
          ? onMediaClick
          : undefined
      }
      style={{
        cursor:
          feature.mockupType === "video" || feature.mockupType === "image"
            ? "pointer"
            : "default",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={feature.id} // Key by feature.id for distinct feature animation
          variants={displayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          {feature.mockupType === "image" ? (
            <>
              <Image
                src={localizedMockupSrc} // Use localized path
                alt={feature.altText}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 50vw"
                style={{ objectFit: "cover" }}
                priority={true}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/display:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6 pointer-events-none">
                <ZoomIn className="w-10 h-10 md:w-12 md:h-12 text-white/90 drop-shadow-lg" />
              </div>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                key={localizedMockupSrc} // Key by localized src for re-mount on src change
                className="w-full h-full object-cover"
                src={localizedMockupSrc} // Use localized path
                poster={localizedPosterSrc} // Use localized path
                autoPlay
                muted
                loop
                playsInline
              />
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
