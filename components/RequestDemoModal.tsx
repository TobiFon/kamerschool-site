"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  UserCircle,
  Building2,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

// --- Interfaces ---
interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  schoolName: string;
  schoolLocation: string;
  role: string;
  studentCount: string;
  goals: string[];
  otherGoal: string;
}

interface RequestDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Constants ---
const TOTAL_STEPS = 3;
const GOAL_OPTIONS = [
  { id: "results", labelKey: "goals.results" },
  { id: "parentComms", labelKey: "goals.parentComms" },
  { id: "finance", labelKey: "goals.finance" },
  { id: "studentData", labelKey: "goals.studentData" },
  { id: "analytics", labelKey: "goals.analytics" },
  { id: "enrollment", labelKey: "goals.enrollment" },
  { id: "modernize", labelKey: "goals.modernize" },
];

// --- Main Component ---
export default function RequestDemoModal({
  isOpen,
  onClose,
}: RequestDemoModalProps) {
  const t = useTranslations("RequestDemoModal");
  const [currentStep, setCurrentStep] = useState(1);
  const [previousStep, setPreviousStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    schoolName: "",
    schoolLocation: "",
    role: "",
    studentCount: "",
    goals: [],
    otherGoal: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  const [showOtherGoalInput, setShowOtherGoalInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setCurrentStep(1);
      setPreviousStep(0);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        schoolName: "",
        schoolLocation: "",
        role: "",
        studentCount: "",
        goals: [],
        otherGoal: "",
      });
      setErrors({});
      setIsSubmitting(false);
      setSubmitStatus("idle"); // This ensures form starts fresh or returns to form view
      setApiError(null);
      setShowOtherGoalInput(false);
    }
    // Note: No 'else' block here for form reset on close, as the main
    // visibility is controlled by `!isOpen && submitStatus === "idle"`.
    // Specific close actions from success/error states will handle resetting submitStatus.
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleGoalChange = (goalId: string) => {
    setFormData((prev) => {
      const newGoals = prev.goals.includes(goalId)
        ? prev.goals.filter((g) => g !== goalId)
        : [...prev.goals, goalId].slice(0, 3);
      return { ...prev, goals: newGoals };
    });
  };

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (currentStep === 1) {
      if (!formData.fullName.trim())
        newErrors.fullName = t("validation.fullNameRequired");
      if (!formData.email.trim())
        newErrors.email = t("validation.emailRequired");
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = t("validation.emailInvalid");
      if (
        formData.phoneNumber &&
        !/^\+?[0-9\s-()]{7,}$/.test(formData.phoneNumber)
      ) {
        newErrors.phoneNumber = t("validation.phoneInvalid");
      }
    } else if (currentStep === 2) {
      if (!formData.schoolName.trim())
        newErrors.schoolName = t("validation.schoolNameRequired");
      if (!formData.schoolLocation.trim())
        newErrors.schoolLocation = t("validation.schoolLocationRequired");
      if (!formData.role) newErrors.role = t("validation.roleRequired");
      if (!formData.studentCount)
        newErrors.studentCount = t("validation.studentCountRequired");
    } else if (currentStep === 3) {
      if (
        formData.goals.length === 0 &&
        !formData.otherGoal.trim() &&
        showOtherGoalInput
      ) {
        newErrors.goals = t("validation.goalOrOtherRequired");
      } else if (
        formData.goals.length === 0 &&
        !showOtherGoalInput &&
        GOAL_OPTIONS.length > 0 &&
        !formData.otherGoal.trim()
      ) {
        newErrors.goals = t("validation.goalRequired");
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      if (currentStep < TOTAL_STEPS) {
        setPreviousStep(currentStep);
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setPreviousStep(currentStep);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle"); // Should be 'submitting' effectively, but UI handles loader via isSubmitting
    setApiError(null);

    try {
      const response = await fetch("/api/request-demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setApiError(
          errorData.details || errorData.error || t("error.messageGeneric")
        );
        setSubmitStatus("error");
        return;
      }
      setSubmitStatus("success");
    } catch (error) {
      console.error("Demo request submission error:", error);
      setApiError(t("error.messageNetwork"));
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  const getStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: t("step1.title"),
          icon: <UserCircle className="h-5 w-5 mr-2.5 text-primary" />,
        };
      case 2:
        return {
          title: t("step2.title"),
          icon: <Building2 className="h-5 w-5 mr-2.5 text-primary" />,
        };
      case 3:
        return {
          title: t("step3.title"),
          icon: <Target className="h-5 w-5 mr-2.5 text-primary" />,
        };
      default:
        return { title: t("modalTitle"), icon: null };
    }
  };
  const currentStepInfo = getStepInfo();

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("step1.fullNameLabel")}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder={t("step1.fullNamePlaceholder")}
                aria-invalid={!!errors.fullName}
                className="mt-1"
              />
              {errors.fullName && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.fullName}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("step1.emailLabel")}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t("step1.emailPlaceholder")}
                aria-invalid={!!errors.email}
                className="mt-1"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="phoneNumber"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("step1.phoneLabel")}{" "}
                <span className="text-xs text-muted-foreground/80">
                  ({t("common.optionalMicrocopy")})
                </span>
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder={t("step1.phonePlaceholder")}
                aria-invalid={!!errors.phoneNumber}
                className="mt-1"
              />
              {errors.phoneNumber && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.phoneNumber}
                </p>
              )}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <Label
                htmlFor="schoolName"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("step2.schoolNameLabel")}
              </Label>
              <Input
                id="schoolName"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleInputChange}
                placeholder={t("step2.schoolNamePlaceholder")}
                aria-invalid={!!errors.schoolName}
                className="mt-1"
              />
              {errors.schoolName && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.schoolName}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="schoolLocation"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("step2.schoolLocationLabel")}
              </Label>
              <Input
                id="schoolLocation"
                name="schoolLocation"
                value={formData.schoolLocation}
                onChange={handleInputChange}
                placeholder={t("step2.schoolLocationPlaceholder")}
                aria-invalid={!!errors.schoolLocation}
                className="mt-1"
              />
              {errors.schoolLocation && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.schoolLocation}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="role"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("step2.roleLabel")}
              </Label>
              <Select
                name="role"
                onValueChange={(value) => handleSelectChange("role", value)}
                value={formData.role}
              >
                <SelectTrigger
                  id="role"
                  aria-invalid={!!errors.role}
                  className="mt-1 w-full text-left"
                >
                  <SelectValue placeholder={t("step2.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">
                    {t("step2.roles.principal")}
                  </SelectItem>
                  <SelectItem value="administrator">
                    {t("step2.roles.administrator")}
                  </SelectItem>
                  <SelectItem value="owner">
                    {t("step2.roles.owner")}
                  </SelectItem>
                  <SelectItem value="it_staff">
                    {t("step2.roles.it_staff")}
                  </SelectItem>
                  <SelectItem value="teacher">
                    {t("step2.roles.teacher")}
                  </SelectItem>
                  <SelectItem value="other">
                    {t("step2.roles.other")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive mt-1.5">{errors.role}</p>
              )}
            </div>
            <div>
              <Label
                htmlFor="studentCount"
                className="text-sm font-medium text-muted-foreground"
              >
                {t("step2.studentCountLabel")}
              </Label>
              <Select
                name="studentCount"
                onValueChange={(value) =>
                  handleSelectChange("studentCount", value)
                }
                value={formData.studentCount}
              >
                <SelectTrigger
                  id="studentCount"
                  aria-invalid={!!errors.studentCount}
                  className="mt-1 w-full text-left"
                >
                  <SelectValue
                    placeholder={t("step2.studentCountPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<100">
                    {t("step2.studentCounts.less100")}
                  </SelectItem>
                  <SelectItem value="100-300">
                    {t("step2.studentCounts.s100_300")}
                  </SelectItem>
                  <SelectItem value="301-500">
                    {t("step2.studentCounts.s301_500")}
                  </SelectItem>
                  <SelectItem value="501-1000">
                    {t("step2.studentCounts.s501_1000")}
                  </SelectItem>
                  <SelectItem value=">1000">
                    {t("step2.studentCounts.over1000")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.studentCount && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.studentCount}
                </p>
              )}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label className="text-sm font-medium text-muted-foreground block mb-1">
              {t("step3.goalsLabel")}
            </Label>
            <p className="text-xs text-muted-foreground/80 mb-3">
              {t("step3.goalsSubtext")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
              {GOAL_OPTIONS.map((goal) => (
                <motion.div
                  key={goal.id}
                  className="flex items-center space-x-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  whileTap={{ scale: 0.97 }}
                >
                  <Checkbox
                    id={goal.id}
                    checked={formData.goals.includes(goal.id)}
                    onCheckedChange={() => handleGoalChange(goal.id)}
                    disabled={
                      formData.goals.length >= 3 &&
                      !formData.goals.includes(goal.id)
                    }
                  />
                  <Label
                    htmlFor={goal.id}
                    className="font-normal text-sm text-foreground cursor-pointer select-none"
                  >
                    {t(goal.labelKey)}
                  </Label>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center space-x-2.5 p-2 rounded-md hover:bg-muted/50 transition-colors pt-3">
              <Checkbox
                id="otherGoalCheckbox"
                checked={showOtherGoalInput}
                onCheckedChange={(checked) =>
                  setShowOtherGoalInput(Boolean(checked))
                }
              />
              <Label
                htmlFor="otherGoalCheckbox"
                className="font-normal text-sm text-foreground cursor-pointer select-none"
              >
                {t("step3.otherGoalLabel")}
              </Label>
            </div>
            {showOtherGoalInput && (
              <Textarea
                name="otherGoal"
                value={formData.otherGoal}
                onChange={handleInputChange}
                placeholder={t("step3.otherGoalPlaceholder")}
                className="mt-1.5 min-h-[70px] text-sm"
              />
            )}
            {errors.goals && (
              <p className="text-xs text-destructive mt-1.5">{errors.goals}</p>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Modal open/close logic
  if (!isOpen && submitStatus === "idle") return null;

  // --- Success State ---
  if (submitStatus === "success") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="bg-card p-6 py-8 sm:p-8 sm:py-10 rounded-xl shadow-2xl w-full max-w-md text-center border border-border"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 200,
              damping: 10,
            }}
          >
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-5 sm:mb-6" />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2.5">
            {t("success.title", {
              name: formData.fullName.split(" ")[0] || "User",
            })}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            {t("success.message", { email: formData.email })}
          </p>
          <p className="text-xs text-muted-foreground/80 mb-8">
            {t("success.expectation")}
          </p>
          <Button
            onClick={() => {
              setSubmitStatus("idle"); // Reset status to allow modal to fully close
              onClose(); // Call parent's onClose to set isOpen to false
            }}
            className="w-full h-11 text-sm bg-primary hover:bg-primary/90"
          >
            {t("success.closeButton")}
          </Button>
        </motion.div>
      </div>
    );
  }

  // --- Error State ---
  if (submitStatus === "error") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="bg-card p-6 py-8 sm:p-8 sm:py-10 rounded-xl shadow-2xl w-full max-w-md text-center border border-border"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 200,
              damping: 10,
            }}
          >
            <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-destructive mx-auto mb-5 sm:mb-6" />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2.5">
            {t("error.title")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-8">
            {apiError || t("error.message")}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setSubmitStatus("idle");
                setApiError(null);
              }}
              variant="outline"
              className="flex-1 h-11 text-sm"
            >
              {t("error.tryAgainButton")}
            </Button>
            <Button
              onClick={() => {
                setSubmitStatus("idle"); // Reset status to allow modal to fully close
                onClose(); // Call parent's onClose to set isOpen to false
              }}
              className="flex-1 h-11 text-sm bg-primary hover:bg-primary/90"
            >
              {t("success.closeButton")}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Main Modal Content (When form is active, i.e., submitStatus is 'idle' and isOpen is true) ---
  return (
    <AnimatePresence>
      {isOpen && ( // This effectively means: render if isOpen is true AND submitStatus is 'idle' (due to above checks)
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200]"
          onClick={(e) => {
            if (isSubmitting) return;
            // When closing via backdrop, submitStatus is 'idle', so onClose() is enough
            onClose();
          }}
        >
          <motion.div
            key="modal-content-main"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 30,
              scale: 0.95,
              transition: { duration: 0.2 },
            }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border">
              <div className="flex items-center">
                {currentStepInfo.icon}
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  {currentStepInfo.title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isSubmitting) return;
                  // When closing via X button, submitStatus is 'idle', so onClose() is enough
                  onClose();
                }}
                aria-label={t("common.close")}
                className="text-muted-foreground hover:text-foreground"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="px-5 sm:px-6 pt-5">
              <Progress
                value={progressPercentage}
                className="h-1.5 rounded-full bg-primary/15 [&>div]:bg-primary"
              />
              <p className="text-xs text-muted-foreground mt-1.5 text-right font-medium">
                {t("common.step", { current: currentStep, total: TOTAL_STEPS })}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="p-5 sm:p-6 sm:pt-3 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{
                    opacity: 0,
                    x: previousStep < currentStep ? 25 : -25,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    x: previousStep < currentStep ? -25 : 25,
                  }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <div className="flex items-center justify-between p-5 sm:p-6 border-t border-border bg-muted/20">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 1 || isSubmitting}
                className={`transition-opacity duration-200 h-10 text-sm ${
                  currentStep === 1
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100"
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                {t("common.previous")}
              </Button>
              {currentStep < TOTAL_STEPS ? (
                <Button
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                  className="h-10 text-sm bg-primary hover:bg-primary/90"
                >
                  {t("common.next")}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-10 text-sm bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("common.submitting")}
                    </>
                  ) : (
                    t("common.submitRequest")
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
