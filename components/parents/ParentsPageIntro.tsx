"use client";
import { motion } from "framer-motion";
import Image from "next/image";

interface ParentPageIntroProps {
  title: string;
  subtitle: string;
}

export default function ParentPageIntro({
  title,
  subtitle,
}: ParentPageIntroProps) {
  return (
    <section className="pt-20 pb-12 md:pt-28 md:pb-20 bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 dark:from-sky-900/30 dark:via-slate-900 dark:to-purple-900/30">
      <div className="container mx-auto px-4 pt-12 nd:pt-20">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground dark:text-sky-400 mb-5 !leading-tight mx-auto"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-xl mx-auto"
          >
            {subtitle}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
