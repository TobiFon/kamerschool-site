// src/components/home/FeatureCard.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LucideProps } from "lucide-react"; // For icon type

interface FeatureCardProps {
  icon: React.ReactElement<LucideProps>; // Expect a Lucide icon component
  title: string;
  description: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
      className={`h-full ${className}`}
    >
      <Card className="h-full flex flex-col p-6 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
        <CardHeader className="p-0 mb-4">
          <div className="mb-3 text-primary dark:text-sky-400">
            {React.cloneElement(icon, { size: 32, strokeWidth: 1.5 })}
          </div>
          <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </CardTitle>
        </CardHeader>
        <CardDescription className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </Card>
    </motion.div>
  );
};

export default FeatureCard;
