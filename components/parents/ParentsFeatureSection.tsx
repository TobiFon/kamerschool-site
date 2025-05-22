// src/app/[locale]/features/parents-students/components/ParentFeatureSection.tsx
"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Check } from "lucide-react";
import React from "react";

interface ParentFeatureSectionProps {
  id: string;
  icon: React.ReactElement;
  title: string;
  benefit: string;
  functionalities: string[];
  mockupImgSrc: string;
  mockupAlt: string;
  imageOnLeft?: boolean;
}

export default function ParentFeatureSection({
  id,
  icon,
  title,
  benefit,
  functionalities,
  mockupImgSrc,
  mockupAlt,
  imageOnLeft = false,
}: ParentFeatureSectionProps) {
  const textVariants = {
    hidden: { opacity: 0, x: imageOnLeft ? 50 : -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const imageContainerVariants = {
    hidden: { opacity: 0, scale: 0.8, y: imageOnLeft ? 0 : 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        delay: 0.2,
        type: "spring",
        stiffness: 80,
      },
    },
  };

  return (
    <section id={id} className="scroll-mt-20">
      <div
        className={`grid md:grid-cols-2 gap-10 md:gap-16 lg:gap-20 items-center`}
      >
        {/* Mobile Mockup Column */}
        <motion.div
          className={`relative mx-auto w-[270px] h-[550px] sm:w-[280px] sm:h-[570px] md:w-[300px] md:h-[610px] ${
            imageOnLeft ? "md:order-1" : "md:order-2"
          }`}
          variants={imageContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Phone Frame */}
          <div className="absolute inset-0 bg-slate-800 dark:bg-slate-950 rounded-[40px] sm:rounded-[50px] shadow-2xl p-2 sm:p-2.5 transform transition-all duration-500 hover:scale-[1.03] hover:shadow-3xl">
            {/* Notch */}
            <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800 rounded-[32px] sm:rounded-[40px] overflow-hidden">
              <Image
                src={mockupImgSrc}
                alt={mockupAlt}
                fill
                className="object-contain object-center p-0.5" // Use object-contain for app screens
                sizes="(max-width: 640px) 270px, (max-width: 768px) 280px, 300px"
              />
            </div>
          </div>
        </motion.div>

        {/* Text Content Column */}
        <motion.div
          className={`${imageOnLeft ? "md:order-2" : "md:order-1"}`}
          variants={textVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
            {React.cloneElement(icon, { className: "h-7 w-7 text-primary" })}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 !leading-snug">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            {benefit}
          </p>
          <ul className="space-y-3">
            {functionalities.map((func, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  {func}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
