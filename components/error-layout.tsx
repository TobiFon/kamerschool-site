// app/[locale]/components/error-layout.tsx
import React from "react";
import { motion } from "framer-motion";

interface ErrorLayoutProps {
  illustration: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode; // For action buttons
}

export function ErrorLayout({
  illustration,
  title,
  description,
  children,
}: ErrorLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-16 sm:py-24">
      <div className="relative w-full max-w-lg text-center">
        {/* Decorative Background Blobs */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.8,
            type: "spring",
            stiffness: 100,
          }}
          className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.8,
            type: "spring",
            stiffness: 100,
          }}
          className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"
        />

        <div className="relative">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {illustration}
          </motion.div>

          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-4 text-slate-600 dark:text-slate-400"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5, type: "spring" }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
