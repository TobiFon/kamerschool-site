"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react"; // Removed X as reset is separate
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassFee, PaginatedResponse } from "@/types/fees"; // Corrected types
import { assignFeesToStudents } from "@/queries/fees"; // Corrected queries
import { formatCurrency } from "@/lib/utils";

import { fetchStudents } from "@/queries/students"; // Specific query
import { StudentSimple } from "@/types/students"; // Simple student type
import LoadingErrorState from "./LoadingErrorState";

// Schema matches AssignFeesPayload structure
const formSchema = z.object({
  student_ids: z
    .array(z.number())
    .min(1, "At least one student must be selected"),
  custom_amount: z.coerce // Use coerce to handle string input from number field
    .number()
    .min(0, "Amount must be non-negative")
    .optional()
    .nullable(), // Allow null/undefined
});

type AssignFeesFormData = z.infer<typeof formSchema>;

interface AssignFeesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classFee: ClassFee | null; // Class fee being assigned
  schoolId?: number; // Needed for query invalidation
}

const AssignFeesDialog: React.FC<AssignFeesDialogProps> = ({
  isOpen,
  onClose,
  classFee,
  schoolId, // Accept schoolId
}) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();
  const locale = "fr-CM"; // TODO: Get from context/settings
  const currency = "XAF"; // TODO: Get from context/settings

  const form = useForm<AssignFeesFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_ids: [],
      custom_amount: null, // Initialize as null
    },
  });

  // Fetch eligible students for the specific class and year
  const {
    data: studentsData,
    isLoading: isLoadingStudents,
    error: studentsError,
  } = useQuery<PaginatedResponse<StudentSimple>, Error>({
    // Inside AssignFeesDialog.tsx - useQuery hook
    queryKey: [
      "enrolledStudents",
      classFee?.class_instance, // Keep class ID in key
      classFee?.academic_year, // Keep year ID in key
    ],
    queryFn: () => {
      if (!classFee?.class_instance || !classFee?.academic_year) {
        return Promise.resolve({
          /* ... empty response ... */
        });
      }
      // *** CHANGED: Use parameter names expected by fetchStudents ***
      return fetchStudents({
        enrollment_class: classFee.class_instance, // Pass class ID
        enrollment_year: classFee.academic_year, // Pass year ID
        enrollment_status_in: "confirmed,transferred_in",
        page_size: 1000,
      });
    },
    enabled: !!isOpen && !!classFee,
    staleTime: 5 * 60 * 1000,
  });

  const students = useMemo(() => studentsData?.results ?? [], [studentsData]);

  // Reset form when dialog opens/closes or classFee changes
  useEffect(() => {
    if (isOpen && classFee) {
      // Reset selection and custom amount when opened
      form.reset({ student_ids: [], custom_amount: null });
    }
  }, [isOpen, classFee, form]);

  const mutation = useMutation({
    mutationFn: (data: AssignFeesFormData) => {
      if (!classFee) throw new Error("Class Fee not selected");
      // Use number or null for custom_amount
      const amountToSend =
        typeof data.custom_amount === "number" ? data.custom_amount : null;
      return assignFeesToStudents(classFee.id, data.student_ids, amountToSend);
    },
    onSuccess: (createdFees) => {
      toast.success(tc("success"), {
        description: t("feesAssignedSuccess", { count: createdFees.length }),
      });
      // Invalidate student fees list for the potentially affected class/year
      queryClient.invalidateQueries({ queryKey: ["studentFees"] }); // Might need more specific key
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ["feeDashboard"] }); // Might need schoolId
      onClose();
    },
    onError: (err: Error) => {
      toast.error(tc("error"), {
        description: err.message || t("feesAssignedError"),
      });
    },
  });

  const onSubmit = (data: AssignFeesFormData) => {
    mutation.mutate(data);
  };

  const selectedStudentIds = form.watch("student_ids");

  const handleSelectAll = (checked: boolean) => {
    const allStudentIds = students.map((s) => s.id);
    form.setValue("student_ids", checked ? allStudentIds : []);
  };

  if (!classFee) return null; // Dialog shouldn't render without classFee

  return (
    <Dialog
      open={isOpen}
      onOpenChange={!mutation.isPending ? onClose : undefined}
    >
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t("assignFeesToStudents")}</DialogTitle>
          <DialogDescription>
            {t("assignFeesDesc", {
              feeName: classFee.fee_type_name,
              className: classFee.class_name,
              yearName: classFee.academic_year_name,
            })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Student Selection */}
            <FormField
              control={form.control}
              name="student_ids"
              render={() => (
                <FormItem>
                  <div className="mb-2 flex justify-between items-center">
                    <FormLabel className="text-base font-semibold">
                      {t("selectStudents")}*
                    </FormLabel>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-students"
                        checked={
                          students.length > 0 &&
                          selectedStudentIds.length === students.length
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAll(!!checked)
                        }
                        disabled={
                          isLoadingStudents ||
                          students.length === 0 ||
                          mutation.isPending
                        }
                      />
                      <label
                        htmlFor="select-all-students"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tc("selectAll")} ({selectedStudentIds.length}/
                        {students.length})
                      </label>
                    </div>
                  </div>
                  <FormControl>
                    <ScrollArea className="h-[250px] w-full rounded-md border p-2">
                      {isLoadingStudents && <LoadingErrorState isLoading />}
                      {studentsError && (
                        <LoadingErrorState error={studentsError} />
                      )}
                      {!isLoadingStudents &&
                        !studentsError &&
                        students.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {t("noEligibleStudents")}
                          </p>
                        )}
                      {!isLoadingStudents &&
                        !studentsError &&
                        students.length > 0 && (
                          <div className="space-y-1">
                            {students.map((student) => (
                              <FormField
                                key={student.id}
                                control={form.control}
                                name="student_ids"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded hover:bg-secondary/50 cursor-pointer">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          student.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          const currentIds = field.value || [];
                                          const newIds = checked
                                            ? [...currentIds, student.id]
                                            : currentIds.filter(
                                                (id) => id !== student.id
                                              );
                                          field.onChange(newIds);
                                        }}
                                        disabled={mutation.isPending}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer flex-grow">
                                      {student.first_name} {student.last_name} (
                                      {student.matricule || tc("noMatricule")}){" "}
                                      {/* Handle null matricule */}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        )}
                    </ScrollArea>
                  </FormControl>
                  <FormMessage />{" "}
                  {/* Shows validation errors for student_ids */}
                </FormItem>
              )}
            />

            {/* Custom Amount (Optional) */}
            <FormField
              control={form.control}
              name="custom_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("customAmountOptional")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      // Handle null value from form state for input display
                      value={field.value ?? ""}
                      // Ensure onChange converts empty string back to null/undefined for optional field
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : e.target.value
                        )
                      }
                      placeholder={t("defaultAmountPlaceholder", {
                        amount: formatCurrency(
                          classFee.amount,
                          currency,
                          locale
                        ),
                      })}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription>{t("customAmountDesc")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={mutation.isPending}
                >
                  {tc("cancel")}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  mutation.isPending ||
                  selectedStudentIds.length === 0 ||
                  isLoadingStudents
                }
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Users className="mr-2 h-4 w-4" />
                {t("assignFees")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignFeesDialog;
