"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useInView } from "framer-motion";
import FeatureNavItem from "./FeatureNavItem";
import FeatureDisplay from "./FeatureDisplay";
import { X } from "lucide-react";

import {
  AssetType,
  CloudinaryAssetOptions,
  useLocalizedAsset,
} from "@/lib/assets-utils"; // Import AssetType and Options
import Image from "next/image";
import {
  RawShowcaseFeatureData,
  ShowcaseFeature,
  showcaseFeaturesRawData,
} from "./fetaturesShowcase";

export default function FeatureShowcaseSection() {
  const t = useTranslations("HomePage.FeatureShowcase");
  const getAssetPath = useLocalizedAsset();

  const translatedShowcaseFeatures = useMemo(() => {
    return showcaseFeaturesRawData.map(
      (feature: RawShowcaseFeatureData): ShowcaseFeature => ({
        ...feature,
        title: t(`features.${feature.id}.title`),
        description: t(`features.${feature.id}.description`),
        altText: t(`features.${feature.id}.altText`),
      })
    );
  }, [t]);

  const [activeFeatureId, setActiveFeatureId] = useState<string>(
    translatedShowcaseFeatures[0]?.id || ""
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ShowcaseFeature | null>(
    null
  );

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  const activeFeature =
    translatedShowcaseFeatures.find((f) => f.id === activeFeatureId) ||
    translatedShowcaseFeatures[0];

  const handleFeatureSelect = (id: string) => {
    setActiveFeatureId(id);
  };

  const openModal = (feature: ShowcaseFeature) => {
    if (feature.mockupType === "video" || feature.mockupType === "image") {
      setModalContent(feature);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalContent(null), 300);
  };

  useEffect(() => {
    // Optional: Preload assets
    translatedShowcaseFeatures.forEach((feature) => {
      if (feature.mockupSrc) {
        const type = feature.mockupType as AssetType; // Cast since mockupType matches AssetType
        const options: CloudinaryAssetOptions = { width: 640 }; // Example small preload size
        const src = getAssetPath(feature.mockupSrc, type, options);
        if (type === "video") {
          const video = document.createElement("video");
          video.src = src;
          video.preload = "metadata";
        } else {
          const img = new window.Image();
          img.src = src;
        }
      }
      if (feature.posterSrc) {
        const posterImg = new window.Image();
        posterImg.src = getAssetPath(feature.posterSrc, "image", {
          format: "jpg",
          quality: "good",
          width: 640,
        });
      }
    });
  }, [getAssetPath, translatedShowcaseFeatures]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const sectionTitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const sectionSubtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.15 },
    },
  };

  if (!activeFeature) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 bg-gradient-to-b from-background to-slate-50 dark:from-slate-950 dark:to-slate-900 overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-20">
          <motion.h2
            variants={sectionTitleVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-slate-100 mb-4 tracking-tight"
          >
            {t("headline")}
          </motion.h2>
          <motion.p
            variants={sectionSubtitleVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            {t("subheadline")}
          </motion.p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex flex-row gap-8 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
              delay: isInView ? 0.3 : 0,
            }}
            className="w-full md:w-[320px] lg:w-[380px] space-y-3.5 sticky top-28 self-start"
          >
            {translatedShowcaseFeatures.map((feature) => (
              <FeatureNavItem
                key={feature.id}
                feature={feature}
                isActive={activeFeatureId === feature.id}
                onSelect={() => handleFeatureSelect(feature.id)}
              />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
              delay: isInView ? 0.45 : 0,
            }}
            className="w-full md:flex-1"
          >
            <div className="sticky top-28">
              <FeatureDisplay
                feature={activeFeature}
                onMediaClick={() => openModal(activeFeature)}
              />
            </div>
          </motion.div>
        </div>

        {/* Mobile Layout */}
        <motion.div
          className="md:hidden space-y-10"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {translatedShowcaseFeatures.map((feature) => (
            <motion.div
              key={feature.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="space-y-4 rounded-xl bg-card dark:bg-slate-800/40 p-3 shadow-lg border border-border/50"
            >
              <FeatureNavItem
                feature={feature}
                isActive={activeFeatureId === feature.id}
                onSelect={() => handleFeatureSelect(feature.id)}
              />
              <AnimatePresence>
                {activeFeatureId === feature.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: "1rem" }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <FeatureDisplay
                      feature={feature}
                      onMediaClick={() => openModal(feature)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Video/Image Modal */}
      <AnimatePresence>
        {isModalOpen && modalContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[200] p-4"
            onClick={closeModal}
          >
            <motion.button
              onClick={closeModal}
              className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 bg-black/50 rounded-full p-2.5 hover:bg-white/20 hover:text-white transition-colors z-10"
              aria-label={t("closeMediaViewer")}
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{
                scale: 0.85,
                opacity: 0,
                y: 20,
                transition: { duration: 0.25, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="relative w-full max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl bg-slate-950 rounded-lg shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {modalContent.mockupType === "video" ? (
                <div className="aspect-video">
                  <video
                    src={getAssetPath(modalContent.mockupSrc, "video", {
                      width: 1920,
                      quality: "auto:good",
                    })}
                    poster={
                      modalContent.posterSrc
                        ? getAssetPath(modalContent.posterSrc, "image", {
                            format: "jpg",
                            quality: "good",
                            width: 1920,
                          })
                        : undefined
                    }
                    className="w-full h-full object-contain"
                    autoPlay
                    controls
                    playsInline
                    aria-label={modalContent.altText}
                  />
                </div>
              ) : (
                <Image
                  src={getAssetPath(modalContent.mockupSrc, "image", {
                    width: 1920,
                    quality: "auto:good",
                  })}
                  alt={modalContent.altText}
                  width={1920} // Provide layout width
                  height={1080} // Provide layout height
                  className="w-full h-auto max-h-[85vh] object-contain"
                  priority
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
