// src/components/home/ProblemSolution.tsx
"use client";
import React, { useState } from "react"; // Added useState
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  BarChart3,
  Layers,
  MessageCircleOff,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  CalendarCheck,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestDemoModal from "../RequestDemoModal";

export default function ProblemSolution() {
  const t = useTranslations("HomePage.ProblemSolution");

  // State for the demo modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false); // <--- ADD MODAL STATE

  // --- HEADERS ---
  const problemHeadline = t("problemHeadline");
  const problemSubheadline = t("problemSubheadline");
  const solutionHeadline = t("solutionHeadline");
  const solutionDescription = t("solutionDescription");

  // --- PAIN POINTS DATA ---
  const painPointsData = [
    {
      id: "dataInsights",
      title: t("painPoints.dataInsights.title"),
      description: t("painPoints.dataInsights.description"),
      icon: <BarChart3 size={26} />,
    },
    {
      id: "manualPaperwork",
      title: t("painPoints.manualPaperwork.title"),
      description: t("painPoints.manualPaperwork.description"),
      icon: <Layers size={26} />,
    },
    {
      id: "communicationBarriers",
      title: t("painPoints.communicationBarriers.title"),
      description: t("painPoints.communicationBarriers.description"),
      icon: <MessageCircleOff size={26} />,
    },
  ];

  // --- SOLUTION BENEFITS ---
  const solutionBenefits = [
    t("solutionBenefits.benefit1"),
    t("solutionBenefits.benefit2"),
    t("solutionBenefits.benefit3"),
    t("solutionBenefits.benefit4"),
  ];

  const ctaText = t("ctaBookDemo");

  // --- ANIMATION VARIANTS ---
  const sectionIntroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const painPointCardVariants = {
    hidden: { opacity: 0, y: 25, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: i * 0.12,
      },
    }),
  };

  const solutionBlockVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 20,
        duration: 0.8,
        delay: 0.1,
      },
    },
  };

  const benefitItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1 + 0.3, duration: 0.4, ease: "circOut" },
    }),
  };

  return (
    <>
      {" "}
      {/* Use Fragment to wrap section and modal */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        {/* Background contrast: Darker for problem, lighter for solution */}
        <div className="absolute inset-0 z-[-2]">
          <div className="h-1/2 bg-gradient-to-b from-background to-slate-100 dark:from-slate-900 dark:to-slate-800/70"></div>
          <div className="h-1/2 bg-gradient-to-b from-slate-100 to-background dark:from-slate-800/70 dark:to-slate-950"></div>
        </div>
        <div
          className="absolute top-0 left-0 w-full h-1/2 opacity-[0.03] dark:opacity-[0.02] z-[-1]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, hsla(var(--foreground)/0.3) 0, hsla(var(--foreground)/0.3) 1px, transparent 1px, transparent 10px)",
          }}
        />

        <div className="container mx-auto px-4">
          {/* --- PROBLEM SECTION --- */}
          <div className="text-center mb-16 md:mb-24">
            <motion.div
              variants={sectionIntroVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="inline-block mb-4 p-3 bg-destructive/10 text-destructive rounded-full shadow-md"
            >
              <AlertTriangle size={28} />
            </motion.div>
            <motion.h2
              variants={sectionIntroVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3, delay: 0.1 }} // Corrected: delay should be a direct property of transition or viewport for whileInView
              className="text-3xl md:text-4xl lg:text-[2.8rem] font-extrabold text-foreground dark:text-slate-100 mb-4 leading-tight"
            >
              {problemHeadline}
            </motion.h2>
            <motion.p
              variants={sectionIntroVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3, delay: 0.2 }} // Corrected
              className="text-lg md:text-xl text-muted-foreground dark:text-slate-300/90 max-w-3xl mx-auto"
            >
              {problemSubheadline}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20 md:mb-32">
            {painPointsData.map((point, index) => (
              <motion.div
                key={point.id}
                custom={index}
                variants={painPointCardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                className="bg-card/80 dark:bg-slate-800/50 backdrop-blur-sm p-6 py-8 rounded-xl shadow-lg hover:shadow-xl
                           border border-border/60 dark:border-slate-700/60
                           transition-all duration-300 ease-out
                           hover:border-destructive/30 dark:hover:border-destructive/40
                           hover:scale-[1.02] hover:-translate-y-1 group"
              >
                <div
                  className="mb-5 p-3.5 bg-destructive/15 dark:bg-destructive/20 text-destructive rounded-lg inline-block
                                transition-colors duration-300 group-hover:bg-destructive/20 dark:group-hover:bg-destructive/25"
                >
                  {React.cloneElement(point.icon, {
                    className:
                      "transition-transform duration-300 group-hover:scale-110",
                  })}
                </div>
                <h3 className="text-xl font-semibold text-foreground dark:text-slate-100 mb-2.5">
                  {point.title}
                </h3>
                <p className="text-muted-foreground dark:text-slate-400 text-sm leading-relaxed">
                  {point.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* --- SOLUTION SECTION --- */}
          <motion.div
            variants={solutionBlockVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-slate-900 dark:to-primary/15
                       p-8 md:p-10 lg:p-12 rounded-2xl
                       shadow-2xl dark:shadow-primary/20
                       border border-primary/20 dark:border-primary/30
                       relative overflow-hidden"
          >
            <motion.div
              className="absolute -top-12 -right-12 w-40 h-40 text-primary/15 dark:text-primary/20 opacity-80 pointer-events-none"
              animate={{ rotate: [0, 20, -10, 0], scale: [1, 1.1, 0.9, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-full h-full" />
            </motion.div>
            <motion.div
              className="absolute -bottom-10 -left-10 w-32 h-32 text-primary/10 dark:text-primary/15 opacity-70 pointer-events-none"
              animate={{ rotate: [0, -15, 10, 0], scale: [1, 0.9, 1.1, 1] }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "linear",
                delay: 2,
              }}
            >
              <Sparkles className="w-full h-full" />
            </motion.div>

            <div className="text-center mb-10 md:mb-14">
              <motion.div
                initial={{ scale: 0.3, opacity: 0, rotate: -30 }}
                whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 12,
                  delay: 0.25,
                }}
                className="inline-block mb-5 p-4 bg-primary/15 dark:bg-primary/25 rounded-full shadow-lg"
              >
                <Lightbulb size={32} className="text-primary" />
              </motion.div>
              <motion.h2
                className="text-3xl md:text-4xl lg:text-[2.9rem] font-extrabold text-primary mb-3.5 leading-tight"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {solutionHeadline}
              </motion.h2>
              <motion.p
                className="text-lg md:text-xl text-muted-foreground dark:text-slate-300/80 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {solutionDescription}
              </motion.p>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl mx-auto mb-12 md:mb-16">
              {solutionBenefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-3.5"
                  custom={index}
                  variants={benefitItemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.9 }}
                >
                  <div className="p-1 bg-primary/15 rounded-full flex-shrink-0 mt-1">
                    <CheckCircle2 size={18} className="text-primary " />
                  </div>
                  <span className="text-foreground/90 dark:text-slate-200/90 text-base">
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="text-center" // This div is already text-center
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Button
                size="lg"
                onClick={() => setIsDemoModalOpen(true)}
                className="group relative overflow-hidden font-semibold
                           bg-primary hover:bg-primary/90 text-primary-foreground
                           rounded-lg shadow-xl hover:shadow-primary/40 dark:shadow-primary/30
                           transition-all duration-300 ease-out transform hover:-translate-y-1
                           px-8 py-3.5 text-base 
                           flex items-center justify-center gap-2.5 
                           mx-auto max-w-xs sm:max-w-sm md:max-w-md" // <--- ADDED mx-auto and adjusted max-w
              >
                <CalendarCheck
                  className="flex-shrink-0 transition-transform duration-300 group-hover:rotate-[10deg]"
                  size={20}
                />
                <span>{ctaText}</span>
                <ArrowRight
                  className="flex-shrink-0 transform transition-transform duration-300 group-hover:translate-x-1.5"
                  size={18}
                />
                <span
                  className="absolute top-0 left-[-150%] w-[100px] h-full bg-white/20 skew-x-[-20deg]
                                   transition-all duration-700 ease-in-out group-hover:left-[150%] opacity-50 group-hover:opacity-80 blur-[2px]"
                ></span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
}
