"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl"; // Import useTranslations
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Function to create the schema, accepting the translation function `t`
const createNewStudentSchema = (t) =>
  z.object({
    // Student fields
    first_name: z.string().min(2, { message: t("validation.firstNameMin") }),
    last_name: z.string().min(2, { message: t("validation.lastNameMin") }),
    sex: z.enum(["m", "f"], { required_error: t("validation.genderRequired") }),

    // Date of birth fields
    birth_day: z.string().min(1, { message: t("validation.dayRequired") }),
    birth_month: z.string().min(1, { message: t("validation.monthRequired") }),
    birth_year: z.string().min(1, { message: t("validation.yearRequired") }),

    place_of_birth: z.string().min(2, { message: t("validation.pobRequired") }),

    // Parent fields
    name: z.string().min(3, { message: t("validation.parentNameMin") }),
    phone_number: z
      .string()
      .min(8, { message: t("validation.phoneMin") })
      .regex(/^\+237\d{9}$/, { message: t("validation.phoneFormat") }),
    secondary_phone_number: z.string().optional(),
    email: z.string().email({ message: t("validation.emailValid") }),
    address: z.string().min(3, { message: t("validation.addressMin") }),

    // Enrollment fields
    assigned_class: z
      .string()
      .min(1, { message: t("validation.classRequired") }),
    notes: z.string().optional(),
  });

const ProgressSteps = ({ currentStep, steps = [] }) => (
  <div className="flex mb-6">
    {steps.map((step, index) => {
      const stepIndex = index + 1;
      const isActive = stepIndex === currentStep;
      const isCompleted = stepIndex < currentStep;
      return (
        <div key={step} className="step flex-1 text-center relative">
          <div
            className={`step-number mx-auto mb-2 flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
              isActive
                ? "bg-primary text-primary-foreground"
                : isCompleted
                ? "bg-green-500 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isCompleted ? "✓" : stepIndex}
          </div>
          <div
            className={`text-xs ${
              isActive
                ? "text-primary font-medium"
                : isCompleted
                ? "text-green-600"
                : "text-muted-foreground"
            }`}
          >
            {step} {/* Step label passed already translated */}
          </div>
          {stepIndex < steps.length && (
            <div
              className={`absolute top-4 left-1/2 w-full h-0.5 ${
                isCompleted ? "bg-green-500" : "bg-muted"
              } -z-10`}
            ></div>
          )}
        </div>
      );
    })}
  </div>
);

// Generate days and years (no translation needed)
const days = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => String(currentYear - i - 1));

const FORM_STORAGE_KEY = "student_enrollment_form_data";
const FORM_STEP_KEY = "student_enrollment_step";

function NewStudentModal({
  isOpen,
  onClose,
  onSubmit,
  classes = [],
  isLoading,
}) {
  const t = useTranslations("NewStudentModal"); // Initialize hook

  // Generate months with translated labels
  const months = useMemo(
    () => [
      { value: "01", label: t("months.january") },
      { value: "02", label: t("months.february") },
      { value: "03", label: t("months.march") },
      { value: "04", label: t("months.april") },
      { value: "05", label: t("months.may") },
      { value: "06", label: t("months.june") },
      { value: "07", label: t("months.july") },
      { value: "08", label: t("months.august") },
      { value: "09", label: t("months.september") },
      { value: "10", label: t("months.october") },
      { value: "11", label: t("months.november") },
      { value: "12", label: t("months.december") },
    ],
    [t]
  );

  // Create the schema using the translation function
  const newStudentSchema = useMemo(() => createNewStudentSchema(t), [t]);

  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== "undefined") {
      const savedStep = localStorage.getItem(FORM_STEP_KEY);
      return savedStep ? parseInt(savedStep) : 1;
    }
    return 1;
  });

  const steps = useMemo(
    () => [
      t("steps.studentInfo"),
      t("steps.parentInfo"),
      t("steps.classAssignment"),
    ],
    [t]
  );

  const getSavedFormData = () => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (e) {
          console.error("Failed to parse saved form data", e);
        }
      }
    }
    return {
      first_name: "",
      last_name: "",
      sex: undefined,
      birth_day: "",
      birth_month: "",
      birth_year: "",
      place_of_birth: "",
      name: "",
      phone_number: "+237",
      secondary_phone_number: "+237",
      email: "",
      address: "",
      assigned_class: "",
      notes: "",
    };
  };

  const form = useForm({
    resolver: zodResolver(newStudentSchema),
    defaultValues: getSavedFormData(),
  });

  useEffect(() => {
    const subscription = form.watch((formData) => {
      if (typeof window !== "undefined" && isOpen) {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
      }
    });
    if (typeof window !== "undefined" && isOpen) {
      localStorage.setItem(FORM_STEP_KEY, currentStep.toString());
    }
    return () => subscription.unsubscribe();
  }, [form, isOpen, currentStep]);

  const handleFormSubmit = (values) => {
    const day = parseInt(values.birth_day, 10);
    const month = parseInt(values.birth_month, 10) - 1;
    const year = parseInt(values.birth_year, 10);
    const dateObj = new Date(year, month, day);
    const formattedDOB = dateObj.toISOString().split("T")[0];

    // Build student object
    const student = {
      first_name: values.first_name,
      last_name: values.last_name,
      sex: values.sex,
      date_of_birth: formattedDOB,
      place_of_birth: values.place_of_birth,
    };

    // Build parent object
    const parent = {
      name: values.name,
      phone_number: values.phone_number,
      secondary_phone_number:
        values.secondary_phone_number === "+237"
          ? ""
          : values.secondary_phone_number,
      email: values.email,
      address: values.address,
    };

    // Create the final payload
    const payload = {
      notes: values.notes,
      student,
      parent,
    };
    const classId = parseInt(values.assigned_class, 10);
    setCurrentStep(4);
    onSubmit({ classId, studentData: payload });
    if (typeof window !== "undefined") {
      localStorage.removeItem(FORM_STORAGE_KEY);
      localStorage.removeItem(FORM_STEP_KEY);
    }
  };

  useEffect(() => {
    if (!isOpen && currentStep === 4) {
      form.reset();
      setCurrentStep(1);
      if (typeof window !== "undefined") {
        localStorage.removeItem(FORM_STORAGE_KEY);
        localStorage.removeItem(FORM_STEP_KEY);
      }
    }
  }, [isOpen, form, currentStep]);

  const handleClose = () => {
    onClose();
  };

  const handleNext = async (step) => {
    let fieldsToValidate = [];
    if (step === 1)
      fieldsToValidate = [
        "first_name",
        "last_name",
        "sex",
        "birth_day",
        "birth_month",
        "birth_year",
        "place_of_birth",
      ];
    else if (step === 2)
      fieldsToValidate = ["name", "phone_number", "email", "address"];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setCurrentStep(step + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
            {currentStep < 4 && (
              <span className="text-blue-500 block mt-1">
                {t("autoSaveNote")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <ProgressSteps currentStep={currentStep} steps={steps} />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
          >
            {/* Step 1: Student Information */}
            <div className={currentStep === 1 ? "block" : "hidden"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.firstName")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("placeholders.firstName")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.lastName")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("placeholders.lastName")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.gender")} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("placeholders.gender")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="m">
                            {t("genderOptions.male")}
                          </SelectItem>
                          <SelectItem value="f">
                            {t("genderOptions.female")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormLabel className="block mb-2">
                    {t("labels.dob")} *
                  </FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="birth_day"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("placeholders.day")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {days.map((day) => (
                                <SelectItem key={day} value={day}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birth_month"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("placeholders.month")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem
                                  key={month.value}
                                  value={month.value}
                                >
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birth_year"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("placeholders.year")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-56">
                              {years.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="place_of_birth"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t("labels.pob")} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t("placeholders.pob")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Step 2: Parent Information */}
            <div className={currentStep === 2 ? "block" : "hidden"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.parentName")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("placeholders.parentName")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.primaryPhone")} *</FormLabel>
                      <FormControl>
                        <Input placeholder="+23799999999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondary_phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.secondaryPhone")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("placeholders.secondaryPhone")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("labels.email")} *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t("placeholders.email")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t("labels.address")} *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("placeholders.address")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Step 3: Class Assignment */}
            <div className={currentStep === 3 ? "block space-y-4" : "hidden"}>
              <FormField
                control={form.control}
                name="assigned_class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.assignClass")} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("placeholders.class")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.length === 0 ? (
                          <SelectItem value="-" disabled>
                            {t("noClasses")}
                          </SelectItem>
                        ) : (
                          classes.map((cls) => (
                            <SelectItem key={cls.id} value={String(cls.id)}>
                              {cls.full_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("placeholders.notes")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Loading indicator */}
            <div
              className={
                currentStep === 4 ? "block text-center py-8" : "hidden"
              }
            >
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">{t("loadingText")}</p>
            </div>

            {/* Footer buttons */}
            <DialogFooter className="mt-6 pt-4 border-t">
              {currentStep > 1 && currentStep < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((s) => s - 1)}
                >
                  {t("buttons.previous")}
                </Button>
              )}
              {currentStep === 1 && (
                <Button type="button" onClick={() => handleNext(1)}>
                  {t("buttons.next")}
                </Button>
              )}
              {currentStep === 2 && (
                <Button type="button" onClick={() => handleNext(2)}>
                  {t("buttons.next")}
                </Button>
              )}
              {currentStep === 3 && (
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("buttons.saveAndEnroll")}
                </Button>
              )}
              {currentStep < 4 && (
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    {t("buttons.cancel")}
                  </Button>
                </DialogClose>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default NewStudentModal;
