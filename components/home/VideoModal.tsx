"use client";
import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useTransform,
  MotionValue,
  motionValue,
  useSpring,
  useMotionValue, // Added useSpring
} from "framer-motion";
import Image from "next/image";
import { useLocalizedAsset } from "@/lib/assets-utils";

const DashboardVideoDisplay = ({
  heroScrollProgress,
}: {
  heroScrollProgress?: MotionValue<number>;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const getAssetPath = useLocalizedAsset();

  const safeScrollProgress = heroScrollProgress || motionValue(0);

  const mobileVideoOpacity = useTransform(
    safeScrollProgress,
    [0.1, 0.2],
    [1, 0]
  );
  const mobileVideoScale = useTransform(
    safeScrollProgress,
    [0.1, 0.2],
    [1, 0.5]
  );

  const portalRotateY_scroll = useTransform(
    safeScrollProgress,
    [0, 0.2],
    [0, -2.0]
  );
  const portalRotateX_scroll = useTransform(
    safeScrollProgress,
    [0, 0.2],
    [0, 1.0]
  );

  // --- Mouse Interaction for Tilt ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 100, damping: 15, mass: 1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (typeof window !== "undefined") {
      mouseX.set(window.innerWidth / 2);
      mouseY.set(window.innerHeight / 2);
    }
    const handleMouseMove = (event: MouseEvent) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };
    if (containerRef.current) {
      // Only track mouse when component is roughly in view
      window.addEventListener("mousemove", handleMouseMove);
    }
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]); // Add mouseX, mouseY

  // Transform mouse position to rotation values for the portal
  const portalRotateY_mouse = useTransform(
    smoothMouseX,
    [0, typeof window !== "undefined" ? window.innerWidth : 0],
    [-4, 4] // Max rotation in degrees
  );
  const portalRotateX_mouse = useTransform(
    smoothMouseY,
    [0, typeof window !== "undefined" ? window.innerHeight : 0],
    [4, -4] // Max rotation in degrees
  );
  // --- End Mouse Interaction ---

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch((error) => {
        console.log("Video autoplay prevented:", error);
      });
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);
      video.addEventListener("play", handlePlay);
      video.addEventListener("playing", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handleEnded);
      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("playing", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handleEnded);
      };
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    // ... (other fullscreen listeners)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      // ... (other fullscreen listeners)
    };
  }, []);

  const toggleFullScreen = () => {
    // ... (fullscreen logic remains the same)
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      if (video.requestFullscreen) video.requestFullscreen();
      else if ((video as any).webkitRequestFullscreen)
        (video as any).webkitRequestFullscreen();
      else if ((video as any).msRequestFullscreen)
        (video as any).msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const dashboardVideoPath = getAssetPath("/mockups/dashboard.mp4");
  const posterImagePath = getAssetPath("/images/dashboard-poster.jpg");
  const mobileImagePath = getAssetPath("/images/mobile.png");

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full max-w-6xl xl:max-w-7xl mx-auto group"
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.3 }}
      // Perspective for 3D transforms on children moved to parent in HeroSection.tsx
    >
      <motion.div // This is the main "portal" frame
        className="relative rounded-xl sm:rounded-2xl md:rounded-[20px] overflow-hidden
                   border-2 border-primary/10 dark:border-primary/20 group-hover:border-primary/30
                   bg-slate-900/70 dark:bg-black/60 
                   cursor-pointer transition-all duration-300"
        onClick={toggleFullScreen}
        style={{
          // Combines scroll-based and mouse-based rotation
          // Framer Motion style prop will apply these if they are MotionValues
          rotateX: useTransform(
            () => portalRotateX_scroll.get() + portalRotateX_mouse.get()
          ),
          rotateY: useTransform(
            () => portalRotateY_scroll.get() + portalRotateY_mouse.get()
          ),
          boxShadow: `
            0 0 0 1px hsl(var(--primary) / 0.05), 
            inset 0 0 12px 1px hsl(var(--primary) / 0.1), 
            0px 30px 60px -20px hsla(var(--primary) / 0.15), 
            0px 15px 30px -15px hsla(var(--foreground) / 0.1)
          `,
          transformStyle: "preserve-3d", // Crucial for nested 3D transforms
        }}
        whileHover={{
          // scale: 1.01, // Scale effect is now on the parent container in HeroSection for scroll
          boxShadow: `
            0 0 0 1.5px hsl(var(--primary) / 0.15), 
            inset 0 0 18px 2px hsl(var(--primary) / 0.2), 
            0px 35px 70px -20px hsla(var(--primary) / 0.25),
            0px 20px 40px -15px hsla(var(--foreground) / 0.15)
          `,
          transition: { type: "spring", stiffness: 200, damping: 15 },
        }}
      >
        {/* Inner content that respects the parent's 3D transform */}
        <div style={{ transform: "translateZ(0)" }}>
          {" "}
          {/* Prevents content flattening if needed */}
          <div className="relative aspect-[16/9] w-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-slate-800 dark:bg-slate-900"
              autoPlay
              muted
              loop
              playsInline
              poster={posterImagePath}
            >
              <source src={dashboardVideoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: isPlaying && !isFullScreen ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  "linear-gradient(to top, hsl(var(--primary) / 0.15), transparent 60%)", // Slightly stronger glow
              }}
            />

            {!isFullScreen && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: isPlaying ? 0 : 1,
                    scale: isPlaying ? 0.5 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-3 sm:p-4 shadow-xl"
                >
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700 dark:text-slate-200"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              </div>
            )}
          </div>
          {/* Mobile Mockup - ensure it's part of the 3D transformed content */}
          <motion.div
            style={{
              opacity: mobileVideoOpacity,
              scale: mobileVideoScale,
              transformOrigin: "bottom left", // Important for its own scale animation
            }}
            initial={{ opacity: 0, x: -50, y: 20, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: -8 }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 15,
              delay: 0.9,
            }}
            className="absolute z-20 
                        w-[85px] xs:w-[95px] sm:w-[100px] md:w-[110px] lg:w-[120px]
                        bottom-[2%] sm:bottom-[3%] 
                        left-[2%] xs:left-[3%] 
                        shadow-2xl rounded-lg sm:rounded-xl overflow-hidden
                        border-2 border-slate-400/10 dark:border-slate-700/20" // Softer border
          >
            <div className="aspect-[9/19.5] relative w-full bg-slate-700 dark:bg-slate-800">
              <Image
                src={mobileImagePath}
                width={398}
                height={899}
                alt="mobile view"
                className="object-cover"
                priority
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardVideoDisplay;
