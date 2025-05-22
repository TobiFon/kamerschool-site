// src/components/home/FinalCTA.tsx
"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FinalCTA() {
  const t = useTranslations("HomePage.FinalCTA");

  return (
    <section className="py-20 md:py-32 bg-primary dark:bg-sky-600 text-white">
      <div className="container mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
        >
          {t("headline")}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-slate-100 dark:bg-slate-100 dark:text-sky-700 dark:hover:bg-slate-200 px-10 py-3 text-lg"
          >
            <Link href="/contact">{t("cta")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
