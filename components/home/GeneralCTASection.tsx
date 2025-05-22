// src/components/home/CreativeCtaSection.tsx
"use client";
import React, { useRef, useState } from "react"; // Added useState
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link"; // Keep for fallback or alternative CTA if needed
import { CalendarCheck, PlayCircle, KeyRound } from "lucide-react";
import RequestDemoModal from "../RequestDemoModal";

export default function CreativeCtaSection() {
  const t = useTranslations("HomePage.CreativeCta");
  const sectionRef = useRef(null);

  // State for the demo modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false); // <--- ADD MODAL STATE

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end 0.6"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 40,
    restDelta: 0.001,
  });

  const scale = useTransform(smoothProgress, [0, 1], [0.85, 1]);
  const opacity = useTransform(smoothProgress, [0, 0.7], [0.3, 1]);
  const yKey = useTransform(smoothProgress, [0, 1], ["-50%", "10%"]);
  const yText = useTransform(smoothProgress, [0, 1], ["10%", "-5%"]);

  const headline = t("headline");
  const subtext = t("subtext");
  const ctaText = t("cta");
  // const ctaLink = t("ctaLink"); // We might not use this directly if modal is primary

  return (
    <>
      {" "}
      {/* Use Fragment to wrap section and modal */}
      <section
        ref={sectionRef}
        className="relative py-24 md:py-36 lg:py-40 bg-background dark:bg-slate-950 overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          style={{ opacity: useTransform(smoothProgress, [0, 1], [0.1, 0.3]) }}
        >
          <motion.div
            style={{
              y: yKey,
              scale: useTransform(smoothProgress, [0, 1], [0.5, 1.5]),
              rotate: useTransform(smoothProgress, [0, 1], [-30, 15]),
            }}
          >
            <KeyRound className="w-[300px] h-[300px] md:w-[450px] md:h-[450px] lg:w-[600px] lg:h-[600px] text-primary/10 dark:text-primary/15 opacity-60" />
          </motion.div>
        </motion.div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div style={{ y: yText, scale, opacity }}>
            <motion.div
              className="inline-block mb-6 p-3 bg-primary/10 rounded-full shadow-lg"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 15,
                delay: 0.3,
              }}
            >
              <PlayCircle size={32} className="text-primary" />
            </motion.div>

            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            >
              {headline.split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }} // Changed to animate for consistency with whileInView
                  transition={{
                    delay: 0.2 + i * 0.07,
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                  }}
                  className="inline-block mr-3 last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </motion.h2>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12 md:mb-14 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
            >
              {subtext}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: 0.6,
            }}
            className="flex justify-center"
          >
            {/* MODIFIED CTA BUTTON */}
            <Button
              onClick={() => setIsDemoModalOpen(true)} // <--- OPEN MODAL
              className="group relative overflow-hidden
                         bg-gradient-to-r from-primary via-primary/80 to-primary text-primary-foreground
                         font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50
                         transition-all duration-400 ease-out
                         transform hover:-translate-y-1.5 hover:scale-105
                         px-8 py-8 text-lg rounded-md
                         w-full max-w-xs xs:max-w-sm sm:w-auto sm:max-w-md mx-auto block flex items-center justify-center"
              // Added flex items-center justify-center for icon alignment
            >
              <CalendarCheck
                size={22}
                className="mr-2 sm:mr-3 transition-transform duration-300 group-hover:rotate-6"
              />
              {ctaText}
              <span
                className="absolute top-0 left-[-100%] w-full h-full bg-white/20 dark:bg-white/10 skew-x-[-25deg]
                                 transition-all duration-700 ease-in-out group-hover:left-[100%] opacity-50 group-hover:opacity-100"
              ></span>
            </Button>
          </motion.div>
        </div>
      </section>
      {/* RENDER THE MODAL COMPONENT */}
      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
}
