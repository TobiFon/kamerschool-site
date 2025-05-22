// src/components/home/DeviceFrame.tsx
"use client";
import React from "react";
import Image from "next/image";
import { motion, useTransform, MotionValue, motionValue } from "framer-motion";

interface DeviceFrameProps {
  type: "desktop" | "mobile" | "tablet";
  src: string;
  alt: string;
  src2?: string; // For dual mobile screens
  alt2?: string; // For dual mobile screens
  priority?: boolean;
  containerScrollProgress?: MotionValue<number>;
  initialRotation?: { x?: number; y?: number; z?: number };
  scrollRotationRange?: {
    x?: [number, number];
    y?: [number, number];
    z?: [number, number];
  };
  initialOffset?: { x?: string | number; y?: string | number };
  scrollParallaxDepth?: number;
}

export default function DeviceFrame({
  type,
  src,
  alt,
  src2,
  alt2,
  priority = false,
  containerScrollProgress,
  initialRotation = { x: 0, y: 0, z: 0 },
  scrollRotationRange,
  initialOffset = { x: 0, y: 0 },
  scrollParallaxDepth = 1,
}: DeviceFrameProps) {
  const safeScrollProgress = containerScrollProgress || motionValue(0);

  const parallaxY = useTransform(
    safeScrollProgress,
    [0, 1],
    [`${-5 * scrollParallaxDepth}%`, `${5 * scrollParallaxDepth}%`]
  );
  const parallaxX = useTransform(
    safeScrollProgress,
    [0, 1],
    [`${-2.5 * scrollParallaxDepth}%`, `${2.5 * scrollParallaxDepth}%`]
  );

  const dynRotateX = scrollRotationRange?.x
    ? useTransform(safeScrollProgress, [0, 1], scrollRotationRange.x)
    : undefined;
  const dynRotateY = scrollRotationRange?.y
    ? useTransform(safeScrollProgress, [0, 1], scrollRotationRange.y)
    : undefined;
  const dynRotateZ = scrollRotationRange?.z
    ? useTransform(safeScrollProgress, [0, 1], scrollRotationRange.z)
    : undefined;

  if (type === "desktop" || type === "tablet") {
    const isDesktop = type === "desktop";

    const framePadding = isDesktop ? "p-2 md:p-[10px]" : "p-1.5 sm:p-2";
    const frameRounding = isDesktop
      ? "rounded-xl md:rounded-2xl"
      : "rounded-[24px] sm:rounded-[28px]";
    const screenRounding = isDesktop
      ? "rounded-md md:rounded-lg"
      : "rounded-[18px] sm:rounded-[22px]";

    return (
      <motion.div // Outermost container for positioning, parallax, and entry animation
        className="relative"
        style={{
          perspective: "2000px",
          x: parallaxX,
          y: parallaxY,
          rotateX: dynRotateX,
          rotateY: dynRotateY,
          rotateZ: dynRotateZ,
        }}
        initial={{
          opacity: 0,
          scale: 0.9,
          x: initialOffset.x,
          y: initialOffset.y,
          rotateX: initialRotation.x,
          rotateY: initialRotation.y,
          rotateZ: initialRotation.z,
        }}
        whileInView={{
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          rotateX: !dynRotateX ? initialRotation.x : undefined,
          rotateY: !dynRotateY ? initialRotation.y : undefined,
          rotateZ: !dynRotateZ ? initialRotation.z : undefined,
        }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.15 }}
      >
        {/* Inner container for hover effects */}
        <motion.div
          className="relative"
          style={{ transformStyle: "preserve-3d" }}
          whileHover={{
            scale: 1.03,
            y: -5, // Consistent lift effect on hover for desktop/tablet
            transition: { type: "spring", stiffness: 300, damping: 15 },
          }}
        >
          {/* Device Casing/Bezel */}
          <div
            className={`
              relative
              ${isDesktop ? "aspect-[16/10]" : "aspect-[4/3]"}
              bg-gradient-to-br from-neutral-800 via-neutral-850 to-neutral-900
              dark:from-slate-800 dark:via-slate-850 dark:to-slate-900
              ${framePadding} ${frameRounding}
              shadow-xl dark:shadow-black/60
              border border-neutral-700/30 dark:border-slate-700/40
            `}
          >
            {/* Screen Area - inset within the bezel */}
            <div
              className={`
                relative w-full h-full ${screenRounding}
                overflow-hidden bg-black
                shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),_inset_0_0_0_1px_rgba(0,0,0,0.4)]
              `}
            >
              <Image
                src={src}
                alt={alt}
                fill
                style={{ objectFit: "cover", objectPosition: "top center" }}
                priority={priority}
                sizes={
                  type === "tablet"
                    ? "(max-width: 768px) 100vw, 500px"
                    : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                }
              />
              {/* Gloss Effect */}
              <div
                className={`absolute inset-0 ${screenRounding} overflow-hidden pointer-events-none`}
              >
                <motion.div
                  className="w-full h-full"
                  style={{
                    background: `
                      radial-gradient(circle at 50% -10%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.0) 35%),
                      linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.0) 15%)
                    `,
                    opacity: useTransform(
                      safeScrollProgress,
                      [0.15, 0.65],
                      [0.1, 0.5]
                    ),
                  }}
                />
              </div>
            </div>
          </div>
          {/* Desktop Stand REMOVED */}
        </motion.div>
      </motion.div>
    );
  }

  if (type === "mobile") {
    const hasTwoScreens = src2 && alt2;
    const mobileScreens = [
      { s: src, a: alt },
      ...(hasTwoScreens ? [{ s: src2!, a: alt2! }] : []),
    ];

    const framePadding = "p-1.5 sm:p-[7px]";
    const frameRounding = "rounded-[24px] sm:rounded-[28px]";
    const screenRounding = "rounded-[18px] sm:rounded-[22px]";

    const getMobileRotateY = (index: number) => {
      const baseRotation =
        (dynRotateY as MotionValue<number>) ?? initialRotation.y ?? 0;
      if (hasTwoScreens) {
        return index === 0 ? baseRotation - 8 : baseRotation + 8;
      }
      return baseRotation;
    };
    const getMobileInitialRotateY = (index: number) => {
      const baseInitial = initialRotation.y ?? 0;
      if (hasTwoScreens) {
        return index === 0 ? baseInitial - 15 : baseInitial + 15;
      }
      return baseInitial;
    };

    return (
      <motion.div
        className={`relative flex justify-center items-center ${
          hasTwoScreens ? "gap-3 sm:gap-4" : ""
        }`}
        style={{
          perspective: "1200px",
          x: parallaxX,
          y: parallaxY,
        }}
        initial={{
          opacity: 0,
          y: (initialOffset.y as number | undefined) ?? 30,
        }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
      >
        {mobileScreens.map((img, index) => (
          <motion.div
            key={index}
            className={`
              relative 
              bg-gradient-to-br from-neutral-800 via-neutral-850 to-neutral-900
              dark:from-slate-800 dark:via-slate-850 dark:to-slate-900
              ${framePadding} ${frameRounding}
              shadow-xl dark:shadow-black/60
              w-[140px] xs:w-[160px] sm:w-[190px] aspect-[9/19.5]
              border border-neutral-700/30 dark:border-slate-700/40
            `}
            style={{
              rotateX: dynRotateX,
            }}
            initial={{
              opacity: 0,
              scale: 0.8,
              rotateY: getMobileInitialRotateY(index),
              rotateX: initialRotation.x ?? 5,
              x:
                (initialOffset.x as number | undefined) ??
                (index === 0 && hasTwoScreens ? -15 : hasTwoScreens ? 15 : 0),
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
              x: 0,
              rotateY: getMobileRotateY(index),
              rotateX: !dynRotateX ? initialRotation.x ?? 0 : undefined,
            }}
            viewport={{ once: true }}
            transition={{
              delay: 0.25 + index * 0.1,
              type: "spring",
              stiffness: 90,
              damping: 18,
            }}
            whileHover={{
              y: -8,
              scale: 1.05,
              rotateY:
                getMobileRotateY(index) +
                (index === 0 && hasTwoScreens ? 3 : hasTwoScreens ? -3 : 0),
              transition: { type: "spring", stiffness: 250, damping: 10 },
            }}
          >
            <div
              className={`
                relative w-full h-full ${screenRounding} 
                overflow-hidden bg-black
                shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),_inset_0_0_0_1px_rgba(0,0,0,0.4)]
              `}
            >
              <Image
                src={img.s}
                alt={img.a}
                fill
                style={{ objectFit: "cover" }}
                priority={priority && index === 0}
                sizes="(max-width: 640px) 40vw, 200px"
              />
              <div
                className={`absolute inset-0 ${screenRounding} overflow-hidden pointer-events-none`}
              >
                <motion.div
                  className="w-full h-full"
                  style={{
                    background: `
                      radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.0) 35%)
                    `,
                    opacity: useTransform(
                      safeScrollProgress,
                      [0.2, 0.7],
                      [0.1, 0.35]
                    ),
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return null;
}
