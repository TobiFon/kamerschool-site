"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  HelpCircle,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import RequestDemoModal from "@/components/RequestDemoModal";
import React from "react";
const BOGUS_EMAIL = "kamerschoolapp@gmail.com";
const BOGUS_PHONE = "+237696602209";
const BOGUS_ADDRESS = "Yaounde, Cameroon";

type FormState = "idle" | "submitting" | "success" | "error";
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const t = useTranslations("ContactPage");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formState, setFormState] = useState<FormState>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  // State for the demo modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState("submitting");
    setFormError(null);

    try {
      const response = await fetch("/api/send-contact-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setFormError(
          errorData.details || errorData.error || t("form.errorGeneric")
        );
        setFormState("error");
        return;
      }
      setFormState("success");
    } catch (error) {
      console.error("Contact form submission error:", error);
      setFormError(t("form.errorNetwork"));
      setFormState("error");
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const formItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
    }),
  };

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isDemoModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDemoModalOpen]);

  return (
    <>
      <main className="flex-grow bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/90 min-h-screen py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "circOut" }}
            className="text-center mb-10 md:mb-12 pt-8 md:pt-12"
          >
            <MessageSquare className="mx-auto h-12 w-12 md:h-16 md:w-16 text-primary mb-4" />
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="mt-3 text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-card text-card-foreground p-5 sm:p-6 md:p-8 rounded-xl shadow-lg border border-border w-full"
            >
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-5 flex items-center">
                <Send className="mr-3 h-6 w-6 text-primary" />
                {t("form.title")}
              </h2>

              <AnimatePresence mode="wait">
                {formState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-green-500 mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                      {t("form.successTitle")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("form.successMessage")}
                    </p>
                    <Button
                      onClick={() => {
                        setFormState("idle");
                        setFormData({
                          name: "",
                          email: "",
                          subject: "",
                          message: "",
                        });
                      }}
                      className="mt-5"
                    >
                      {t("form.sendAnother")}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {(["name", "email", "subject"] as const).map((field, i) => (
                      <motion.div
                        key={field}
                        custom={i}
                        variants={formItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Label
                          htmlFor={field}
                          className="text-sm font-medium text-muted-foreground"
                        >
                          {t(`form.${field}`)}
                        </Label>
                        <Input
                          type={field === "email" ? "email" : "text"}
                          id={field}
                          name={field}
                          value={formData[field]}
                          onChange={handleChange}
                          required
                          className="mt-1 bg-background/50 dark:bg-slate-800/50"
                          disabled={formState === "submitting"}
                        />
                      </motion.div>
                    ))}

                    <motion.div
                      custom={3}
                      variants={formItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Label
                        htmlFor="message"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        {t("form.message")}
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="mt-1 bg-background/50 dark:bg-slate-800/50"
                        disabled={formState === "submitting"}
                      />
                    </motion.div>

                    {formState === "error" && formError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/30"
                      >
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </motion.div>
                    )}

                    <motion.div
                      custom={4}
                      variants={formItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full group font-semibold"
                        disabled={formState === "submitting"}
                      >
                        {formState === "submitting" ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t("form.submitting")}
                          </>
                        ) : (
                          <>
                            {t("form.submitButton")}
                            <Send className="ml-2 h-5 w-5 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="space-y-6 md:space-y-8 w-full"
            >
              <div className="bg-card text-card-foreground p-5 sm:p-6 rounded-xl shadow-lg border border-border">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-5 flex items-center">
                  {t("details.directTitle")}
                </h3>
                <div className="space-y-4">
                  <a
                    href={`mailto:${BOGUS_EMAIL}`}
                    className="flex items-center group"
                  >
                    <Mail className="h-5 w-5 md:h-6 md:w-6 text-primary mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("details.email")}
                      </p>
                      <p className="text-sm md:text-base font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {BOGUS_EMAIL}
                      </p>
                    </div>
                  </a>
                  <a
                    href={`tel:${BOGUS_PHONE.replace(/\s/g, "")}`}
                    className="flex items-center group"
                  >
                    <Phone className="h-5 w-5 md:h-6 md:w-6 text-primary mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("details.phone")}
                      </p>
                      <p className="text-sm md:text-base font-medium text-foreground group-hover:text-primary transition-colors">
                        {BOGUS_PHONE}
                      </p>
                    </div>
                  </a>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("details.address")}
                      </p>
                      <p className="text-sm md:text-base font-medium text-foreground">
                        {BOGUS_ADDRESS}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card text-card-foreground p-5 sm:p-6 rounded-xl shadow-lg border border-border">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center">
                  {t("details.otherOptionsTitle")}
                </h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => setIsDemoModalOpen(true)}
                    className="group w-full flex items-center justify-between p-2 sm:p-3 hover:bg-muted/50 dark:hover:bg-slate-800/50 rounded-md transition-colors text-left h-auto"
                  >
                    <div className="flex items-center min-w-0">
                      <CalendarCheck className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-sm md:text-base font-medium text-foreground truncate">
                        {t("details.requestDemo")}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 flex-shrink-0 ml-2" />
                  </Button>

                  <Link
                    href="/faq"
                    className="group w-full flex items-center justify-between p-2 sm:p-3 hover:bg-muted/50 dark:hover:bg-slate-800/50 rounded-md transition-colors"
                  >
                    <div className="flex items-center min-w-0">
                      <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-primary mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-sm md:text-base font-medium text-foreground truncate">
                        {t("details.faq")}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 flex-shrink-0 ml-2" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
}
