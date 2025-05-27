// src/components/home/DashboardVideoDisplay.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useTransform,
  MotionValue,
  motionValue,
  useSpring,
  useMotionValue,
} from "framer-motion";
import Image from "next/image";

import { useLocale } from "next-intl";
import {
  getCloudinaryImageUrl,
  getCloudinaryVideoUrl,
} from "@/lib/claudinary-utils";

const DashboardVideoDisplay = ({
  heroScrollProgress,
}: {
  heroScrollProgress?: MotionValue<number>;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true); // Start as playing, as it's autoplay
  const locale = useLocale();

  const safeScrollProgress = heroScrollProgress || motionValue(0);

  // --- Scroll-based Parallax & Animations (from your original code) ---
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

  // --- Mouse Interaction for Tilt (from your original code) ---
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
      window.addEventListener("mousemove", handleMouseMove);
    }
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const portalRotateY_mouse = useTransform(
    smoothMouseX,
    [0, typeof window !== "undefined" ? window.innerWidth : 1920],
    [-4, 4]
  );
  const portalRotateX_mouse = useTransform(
    smoothMouseY,
    [0, typeof window !== "undefined" ? window.innerHeight : 1080],
    [4, -4]
  );

  // --- Cloudinary URL Construction ---
  // Assuming your original dashboard video was 'dashboard-clip.mp4'
  // and mobile image was 'mobile.png'
  const videoBasePublicId = `kamerschools/${locale}/mockups/dashboard`;
  const mobileImageBasePublicId = `kamerschools/${locale}/images/mobile`;

  const dashboardVideoUrl = getCloudinaryVideoUrl(videoBasePublicId, {
    width: 1280, // Or your desired max display width
    // Default transformations in helper: q_auto, f_auto, vc_auto
  });

  const posterImageUrl = getCloudinaryImageUrl(videoBasePublicId, {
    // Use video public ID for poster
    width: 1280, // Match video width
    format: "jpg",
    quality: "auto:good",
    // Cloudinary will extract a frame. Add `so_0` (seek to 0s) or other seek in helper if needed.
  });

  const mobileImagePath = getCloudinaryImageUrl(mobileImageBasePublicId, {
    width: 120, // Adjust based on display size in hero
    format: "png", // Or "auto"
    quality: "auto",
  });

  // --- Video Playback & Fullscreen Logic ---
  useEffect(() => {
    const video = videoRef.current;
    if (video && dashboardVideoUrl) {
      // Ensure URL is present
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false); // For loop, this might not be strictly needed

      video.addEventListener("play", handlePlay);
      video.addEventListener("playing", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handleEnded);

      video.load(); // Load new sources if URL changes
      video.play().catch((error) => {
        console.warn("Video autoplay prevented for hero:", error);
        setIsPlaying(false); // Update state if autoplay fails
      });

      return () => {
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("playing", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handleEnded);
      };
    }
  }, [dashboardVideoUrl]); // Re-run if the video URL changes

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange); // Safari
    document.addEventListener("mozfullscreenchange", handleFullscreenChange); // Firefox
    document.addEventListener("MSFullscreenChange", handleFullscreenChange); // IE/Edge
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullScreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      if (video.requestFullscreen) video.requestFullscreen();
      else if ((video as any).webkitRequestFullscreen)
        (video as any).webkitRequestFullscreen();
      else if ((video as any).msRequestFullscreen)
        (video as any).msRequestFullscreen();
      else if ((video as any).mozRequestFullScreen)
        (video as any).mozRequestFullScreen(); // Firefox
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen)
        (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen)
        (document as any).msExitFullscreen();
      else if ((document as any).mozCancelFullScreen)
        (document as any).mozCancelFullScreen(); // Firefox
    }
  };

  // Fixed: Create stable transform functions
  const combinedRotateX = useTransform(
    [portalRotateX_scroll, portalRotateX_mouse],
    ([scroll, mouse]) => scroll + mouse
  );

  const combinedRotateY = useTransform(
    [portalRotateY_scroll, portalRotateY_mouse],
    ([scroll, mouse]) => scroll + mouse
  );

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full max-w-6xl xl:max-w-7xl mx-auto group"
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.3 }}
    >
      <motion.div // This is the main "portal" frame
        className="relative rounded-xl sm:rounded-2xl md:rounded-[20px] overflow-hidden
                   border-2 border-primary/10 dark:border-primary/20 group-hover:border-primary/30
                   bg-slate-900/70 dark:bg-black/60
                   cursor-pointer transition-all duration-300"
        onClick={toggleFullScreen}
        style={{
          rotateX: combinedRotateX,
          rotateY: combinedRotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{
          boxShadow: `
            0 0 0 1.5px hsl(var(--primary) / 0.15),
            inset 0 0 18px 2px hsl(var(--primary) / 0.2),
            0px 35px 70px -20px hsla(var(--primary) / 0.25),
            0px 20px 40px -15px hsla(var(--foreground) / 0.15)
          `,
          transition: { type: "spring", stiffness: 200, damping: 15 },
        }}
      >
        <div style={{ transform: "translateZ(0)" }}>
          <div className="relative aspect-[16/9] w-full">
            {dashboardVideoUrl && ( // Render video only if URL is available
              <video
                ref={videoRef}
                className="w-full h-full object-cover bg-slate-800 dark:bg-slate-900"
                autoPlay
                muted
                loop
                playsInline
                poster={posterImageUrl || undefined}
                preload="metadata" // Good for hero video
              >
                {/* With Cloudinary's f_auto, one source is usually enough.
                    Type is a hint for the browser. */}
                <source src={dashboardVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: isPlaying && !isFullScreen ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  "linear-gradient(to top, hsl(var(--primary) / 0.15), transparent 60%)",
              }}
            />

            {!isFullScreen && ( // Play button overlay, shown if not playing or if autoplay failed and not fullscreen
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: isPlaying ? 0 : 1, // Show if not playing
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
          {/* Mobile Mockup */}
          <motion.div
            style={{
              opacity: mobileVideoOpacity,
              scale: mobileVideoScale,
              transformOrigin: "bottom left",
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
                        border-2 border-slate-400/10 dark:border-slate-700/20"
          >
            <div className="aspect-[9/19.5] relative w-full bg-slate-700 dark:bg-slate-800">
              {mobileImagePath && ( // Render image only if URL is available
                <Image
                  src={mobileImagePath}
                  width={120} // Should match the largest width from className or transformation
                  height={Math.round(120 * (19.5 / 9))} // Calculate height based on aspect ratio
                  alt="Mobile view of KamerSchools dashboard"
                  className="object-cover w-full h-full" // Ensure it fills the container
                  priority // As it's part of the hero section
                />
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardVideoDisplay;
