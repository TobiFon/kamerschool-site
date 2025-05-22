"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
import { toast } from "sonner"; // Or your preferred toast library

import { updateStudentWithParent } from "@/queries/students"; // Adjusted import
import { Student } from "@/types/students"; // Adjust path if needed
import { getBackendErrorMessage } from "@/lib/utils"; // Adjust path if needed
import * as z from "zod";

// Function to create the schema, accepting the translation function `t`
export const createEditStudentSchema = (t) =>
  z.object({
    // Student fields
    first_name: z.string().min(2, { message: t("validation.firstNameMin") }),
    last_name: z.string().min(2, { message: t("validation.lastNameMin") }),
    sex: z.enum(["m", "f"], { required_error: t("validation.genderRequired") }),

    // Date of birth fields (kept separate for form inputs)
    birth_day: z.string().min(1, { message: t("validation.dayRequired") }),
    birth_month: z.string().min(1, { message: t("validation.monthRequired") }),
    birth_year: z.string().min(1, { message: t("validation.yearRequired") }),

    place_of_birth: z.string().min(2, { message: t("validation.pobRequired") }),
    status: z.enum(["active", "graduated", "inactive", "alumni"], {
      required_error: t("validation.statusRequired"),
    }),
    // profile_picture: z.any().optional(), // Handle file uploads separately if needed

    // Parent fields
    parent_name: z.string().min(3, { message: t("validation.parentNameMin") }), // Renamed for clarity in flat structure
    parent_phone_number: z
      .string()
      .min(8, { message: t("validation.phoneMin") })
      .regex(/^\+237\d{9}$/, { message: t("validation.phoneFormat") }),
    parent_secondary_phone_number: z.string().optional(),
    parent_email: z.string().email({ message: t("validation.emailValid") }),
    parent_address: z.string().min(3, { message: t("validation.addressMin") }),

    // No enrollment fields
  });

// Define the type based on the schema
export type EditStudentFormData = z.infer<
  ReturnType<typeof createEditStudentSchema>
>;
// Generate days and years (no translation needed)
const days = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);
const currentYear = new Date().getFullYear();
// Adjust range as needed, maybe allow slightly older students?
const years = Array.from({ length: 70 }, (_, i) => String(currentYear - i - 1));

// Helper to parse YYYY-MM-DD
const parseDateString = (dateString) => {
  if (!dateString || typeof dateString !== "string")
    return { day: "", month: "", year: "" };
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  return { day: "", month: "", year: "" };
};

// ProgressSteps component
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

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentData: Student | null; // Pass the full student data including parent
  onSuccess?: () => void; // Optional callback after successful update
}

function EditStudentModal({
  isOpen,
  onClose,
  studentData,
  onSuccess,
}: EditStudentModalProps) {
  const t = useTranslations("EditStudentModal");
  const tShared = useTranslations("NewStudentModal");
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnyFieldBeenEdited, setHasAnyFieldBeenEdited] = useState(false);

  // Generate months with translated labels
  const months = useMemo(
    () => [
      { value: "01", label: tShared("months.january") },
      { value: "02", label: tShared("months.february") },
      { value: "03", label: tShared("months.march") },
      { value: "04", label: tShared("months.april") },
      { value: "05", label: tShared("months.may") },
      { value: "06", label: tShared("months.june") },
      { value: "07", label: tShared("months.july") },
      { value: "08", label: tShared("months.august") },
      { value: "09", label: tShared("months.september") },
      { value: "10", label: tShared("months.october") },
      { value: "11", label: tShared("months.november") },
      { value: "12", label: tShared("months.december") },
    ],
    [tShared]
  );

  // Create the schema using the translation function
  const editStudentSchema = useMemo(
    () => createEditStudentSchema(tShared),
    [tShared]
  ); // Reuse validation messages if applicable

  const steps = useMemo(
    () => [
      tShared("steps.studentInfo"), // Reuse step names
      tShared("steps.parentInfo"),
    ],
    [tShared]
  );

  // Prepare default values from studentData
  const defaultValues = useMemo(() => {
    if (!studentData) return {};
    const { day, month, year } = parseDateString(studentData.date_of_birth);
    return {
      first_name: studentData.first_name || "",
      last_name: studentData.last_name || "",
      sex: studentData.sex || undefined,
      birth_day: day,
      birth_month: month,
      status: studentData.status || "active",
      birth_year: year,
      place_of_birth: studentData.place_of_birth || "",
      parent_name: studentData.parent?.name || "",
      parent_phone_number: studentData.parent?.phone_number || "+237",
      parent_secondary_phone_number:
        studentData.parent?.secondary_phone_number || "+237",
      parent_email: studentData.parent?.email || "",
      parent_address: studentData.parent?.address || "",
    };
  }, [studentData]);

  const form = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: defaultValues,
  });

  // Reset form when studentData changes or modal opens/closes
  useEffect(() => {
    if (isOpen && studentData) {
      setHasAnyFieldBeenEdited(false);
      const { day, month, year } = parseDateString(studentData.date_of_birth);
      form.reset({
        first_name: studentData.first_name || "",
        last_name: studentData.last_name || "",
        sex: studentData.sex || undefined,
        birth_day: day,
        birth_month: month,
        birth_year: year,
        status: studentData.status || "active",
        place_of_birth: studentData.place_of_birth || "",
        parent_name: studentData.parent?.name || "",
        parent_phone_number: studentData.parent?.phone_number || "+237",
        parent_secondary_phone_number:
          studentData.parent?.secondary_phone_number || "+237",
        parent_email: studentData.parent?.email || "",
        parent_address: studentData.parent?.address || "",
      });
      setCurrentStep(1); // Reset to first step when modal opens
    } else if (!isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen, studentData, form]);

  useEffect(() => {
    if (form.formState.isDirty) {
      setHasAnyFieldBeenEdited(true);
    }
  }, [form.formState.isDirty]);

  // Single mutation for updating both student and parent
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: any }) =>
      updateStudentWithParent(data.id, data.payload),
  });

  const handleFormSubmit = async (values: EditStudentFormData) => {
    if (!studentData) {
      toast.error(t("errors.missingData"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date of birth for the backend
      const day = parseInt(values.birth_day, 10);
      const month = parseInt(values.birth_month, 10) - 1; // JS months are 0-indexed
      const year = parseInt(values.birth_year, 10);
      const dateObj = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone issues
      const formattedDOB = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD

      // Prepare payload matching the backend serializer field names
      const payload = {
        // Student fields
        first_name: values.first_name,
        last_name: values.last_name,
        sex: values.sex,
        date_of_birth: formattedDOB,
        place_of_birth: values.place_of_birth,
        status: values.status,
        // profile_picture: values.profile_picture, // Uncomment if implementing file upload

        // Parent fields with the prefixes expected by the backend
        parent_name: values.parent_name,
        parent_phone_number: values.parent_phone_number,
        parent_secondary_phone_number:
          values.parent_secondary_phone_number === "+237" ||
          !values.parent_secondary_phone_number
            ? "" // Send empty string for clearing/empty
            : values.parent_secondary_phone_number,
        parent_email: values.parent_email,
        parent_address: values.parent_address,
      };

      // Execute the update
      await updateMutation.mutateAsync({
        id: studentData.id,
        payload,
      });

      toast.success(
        t("successMessage", {
          studentName: `${values.first_name} ${values.last_name}`,
        })
      );

      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({
        queryKey: ["student", String(studentData.id)],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] }); // Invalidate list if names changed etc.

      if (onSuccess) {
        onSuccess(); // Call the success callback if provided
      }
      handleClose(); // Close modal on success
    } catch (error: any) {
      console.error("Error updating student/parent:", error);
      const backendError = getBackendErrorMessage(
        error?.response?.data || error
      );
      toast.error(
        t("errors.submitFailed", {
          error: backendError || t("errors.unknownError"),
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: Array<keyof EditStudentFormData> = [];
    if (currentStep === 1) {
      fieldsToValidate = [
        "first_name",
        "last_name",
        "sex",
        "birth_day",
        "birth_month",
        "birth_year",
        "place_of_birth",
      ];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((s) => s + 1);
    } else {
      // Optional: focus on the first error field
      const firstErrorField = Object.keys(
        form.formState.errors
      )[0] as keyof EditStudentFormData;
      if (firstErrorField) {
        form.setFocus(firstErrorField);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep((s) => s - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", {
              studentName: studentData
                ? `${studentData.first_name} ${studentData.last_name}`
                : "the student",
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} steps={steps} />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
            id="edit-student-form"
          >
            {/* Step 1: Student Information */}
            <div className={currentStep === 1 ? "block" : "hidden"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tShared("labels.firstName")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tShared("placeholders.firstName")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tShared("labels.lastName")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tShared("placeholders.lastName")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender/Sex */}
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tShared("labels.gender")} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={tShared("placeholders.gender")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="m">
                            {tShared("genderOptions.male")}
                          </SelectItem>
                          <SelectItem value="f">
                            {tShared("genderOptions.female")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth Fields */}
                <div className="md:col-span-2">
                  <FormLabel className="block mb-2">
                    {tShared("labels.dob")} *
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
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={tShared("placeholders.day")}
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
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={tShared("placeholders.month")}
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
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={tShared("placeholders.year")}
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

                {/* Place of Birth */}
                <FormField
                  control={form.control}
                  name="place_of_birth"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{tShared("labels.pob")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tShared("placeholders.pob")}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      {" "}
                      {/* Or md:col-span-1 if preferred */}
                      <FormLabel>{tShared("labels.status")} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={tShared("placeholders.status")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">
                            {tShared("statusOptions.active")}
                          </SelectItem>
                          <SelectItem value="graduated">
                            {tShared("statusOptions.graduated")}
                          </SelectItem>
                          <SelectItem value="inactive">
                            {tShared("statusOptions.inactive")}
                          </SelectItem>
                          <SelectItem value="alumni">
                            {tShared("statusOptions.alumni")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Add profile picture upload if needed */}
                {/* <FormField control={form.control} name="profile_picture" ... /> */}
              </div>
            </div>

            {/* Step 2: Parent Information */}
            <div className={currentStep === 2 ? "block" : "hidden"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parent Name */}
                <FormField
                  control={form.control}
                  name="parent_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tShared("labels.parentName")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tShared("placeholders.parentName")}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Primary Phone */}
                <FormField
                  control={form.control}
                  name="parent_phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tShared("labels.primaryPhone")} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+23799999999"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Secondary Phone */}
                <FormField
                  control={form.control}
                  name="parent_secondary_phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tShared("labels.secondaryPhone")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tShared("placeholders.secondaryPhone")}
                          {...field}
                          value={field.value || "+237"} // Ensure prefix is shown if empty/null
                          onChange={(e) =>
                            field.onChange(e.target.value || "+237")
                          } // Keep prefix if cleared
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="parent_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tShared("labels.email")} *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={tShared("placeholders.email")}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="parent_address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{tShared("labels.address")} *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={tShared("placeholders.address")}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>

        {/* Footer buttons */}
        <DialogFooter className="mt-6 pt-4 border-t">
          {currentStep === 1 && (
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              {t("buttons.next")}
            </Button>
          )}
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              {t("buttons.previous")}
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              type="submit"
              form="edit-student-form" // Link button to the form
              disabled={
                isSubmitting ||
                (!hasAnyFieldBeenEdited && !form.formState.isDirty)
              }
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("buttons.saveChanges")}
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={isSubmitting}>
              {t("buttons.cancel")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditStudentModal;
