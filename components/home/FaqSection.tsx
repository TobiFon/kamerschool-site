// src/components/home/FaqSection.tsx
"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Rocket, // Getting Started
  Clock, // Setup Time
  Users, // Training
  LifeBuoy, // Support
  Globe, // Educational Systems
  Lock, // Security
  Smartphone, // Parent App
  Lightbulb, // Ease of Use
} from "lucide-react";
import { Button } from "@/components/ui/button"; // If you want a "View All FAQs" button
import Link from "next/link";

interface FaqItemProps {
  question: string;
  answer: string;
  icon: React.ReactElement;
  isOpen: boolean;
  onClick: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({
  question,
  answer,
  icon,
  isOpen,
  onClick,
}) => {
  return (
    <motion.div
      className="border-b border-border last:border-b-0"
      initial={false} // Prevents initial animation on load for all items
    >
      <button
        onClick={onClick}
        className="flex justify-between items-center w-full py-5 sm:py-6 px-1 sm:px-2 text-left hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <div className="mr-3 sm:mr-4 text-primary flex-shrink-0">
            {React.cloneElement(icon, { size: 22, className: "opacity-80" })}
          </div>
          <span className="text-base sm:text-lg font-medium text-foreground">
            {question}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "" : ""
            }`}
          />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto", y: 0 },
              collapsed: { opacity: 0, height: 0, y: -10 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <p className="pt-1 pb-5 sm:pb-6 pl-10 sm:pl-12 pr-1 sm:pr-2 text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function FaqSection() {
  const t = useTranslations("HomePage.FaqSection");
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Open the first FAQ by default

  const faqData = [
    {
      id: "getting-started",
      icon: <Rocket />,
      questionKey: "q1_getting_started.question",
      answerKey: "q1_getting_started.answer",
    },
    {
      id: "setup-time",
      icon: <Clock />,
      questionKey: "q2_setup_time.question",
      answerKey: "q2_setup_time.answer",
    },
    {
      id: "ease-of-use",
      icon: <Lightbulb />,
      questionKey: "q3_ease_of_use.question",
      answerKey: "q3_ease_of_use.answer",
    },
    {
      id: "training",
      icon: <Users />,
      questionKey: "q4_training.question",
      answerKey: "q4_training.answer",
    },
    {
      id: "support",
      icon: <LifeBuoy />,
      questionKey: "q5_support.question",
      answerKey: "q5_support.answer",
    },
    {
      id: "educational-systems",
      icon: <Globe />,
      questionKey: "q6_educational_systems.question",
      answerKey: "q6_educational_systems.answer",
    },
    {
      id: "data-security",
      icon: <Lock />,
      questionKey: "q7_data_security.question",
      answerKey: "q7_data_security.answer",
    },
    {
      id: "parent-app",
      icon: <Smartphone />,
      questionKey: "q8_parent_app.question",
      answerKey: "q8_parent_app.answer",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", delay: 0.2 },
    },
  };

  return (
    <motion.section
      className="py-16 md:py-24 bg-background" // Use main background or a very subtle tint
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-10 md:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-3">
              {t("title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          </motion.div>

          <div className="bg-card text-card-foreground rounded-xl shadow-xl border border-border divide-y divide-border">
            {faqData.map((item, index) => (
              <FaqItem
                key={item.id}
                icon={item.icon}
                question={t(item.questionKey)}
                answer={t(item.answerKey)}
                isOpen={openIndex === index}
                onClick={() => handleToggle(index)}
              />
            ))}
          </div>

          {/* Optional: Button to view all FAQs if you have a dedicated page */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="text-center mt-12 md:mt-16"
          >
            <p className="text-muted-foreground mb-4">
              {t("moreQuestionsPrompt")}
            </p>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">
                {" "}
                {/* Or /faq if you create a dedicated page */}
                {t("contactUsButton")}
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
