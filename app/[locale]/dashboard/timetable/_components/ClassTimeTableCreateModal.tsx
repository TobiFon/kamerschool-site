"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { ClassTimetable, ClassTimetableFormData } from "@/types/timetable";
import { createClassTimetable } from "@/queries/timetable";
import { getBackendErrorMessage } from "@/lib/utils";

import { Class } from "@/types/class";
import { AcademicYear } from "@/types/transfers";

// If not passed as props, fetch them here, but passing is often better from parent.
// import { fetchAllClassesForSchool } from "@/queries/class";
// import { fetchAcademicYears } from "@/queries/results";

const classTimetableSchema = z.object({
  school_class_id: z.string().min(1, "Class is required."), // Will be converted to number
  academic_year_id: z.string().min(1, "Academic Year is required."), // Will be converted to number
  is_active: z.boolean().default(true),
});

type ClassTimetableFormValues = z.infer<typeof classTimetableSchema>;

interface ClassTimetableCreateModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  schoolId: number; // For context if needed, though create usually relies on backend context
  existingClasses: Class[]; // Pass from parent for dropdown
  existingAcademicYears: AcademicYear[]; // Pass from parent for dropdown
}

const ClassTimetableCreateModal: React.FC<ClassTimetableCreateModalProps> = ({
  isOpen,
  onClose,
  schoolId, // Currently unused if backend sets school context
  existingClasses,
  existingAcademicYears,
}) => {
  const t = useTranslations("Timetable.ClassTimetablesModal");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();

  const form = useForm<ClassTimetableFormValues>({
    resolver: zodResolver(classTimetableSchema),
    defaultValues: {
      school_class_id: "",
      academic_year_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        // Reset to defaults when modal opens
        school_class_id: "",
        academic_year_id: "",
        is_active: true,
      });
    }
  }, [isOpen, form]);

  const mutation = useMutation<ClassTimetable, Error, ClassTimetableFormValues>(
    {
      mutationFn: async (formData) => {
        const payload: ClassTimetableFormData = {
          school_class_id: formData.school_class_id, // Already string ID
          academic_year_id: formData.academic_year_id, // Already string ID
          is_active: formData.is_active,
        };
        return createClassTimetable(payload);
      },
      onSuccess: () => {
        toast.success(t("createSuccess"));
        queryClient.invalidateQueries({
          queryKey: ["classTimetables", schoolId],
        }); // Invalidate list
        onClose(true);
      },
      onError: (error) => {
        toast.error(getBackendErrorMessage(error) || t("createError"));
      },
    }
  );

  const onSubmit = (values: ClassTimetableFormValues) => {
    mutation.mutate(values);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addTitle")}</DialogTitle>
          <DialogDescription>{t("addDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="class-timetable-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="school_class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("classLabel")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={existingClasses.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("selectClassPlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {existingClasses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.full_name}
                        </SelectItem>
                      ))}
                      {existingClasses.length === 0 && (
                        <SelectItem value="" disabled>
                          {tCommon("noDataAvailable")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="academic_year_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("yearLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={existingAcademicYears.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectYearPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {existingAcademicYears.map((y) => (
                        <SelectItem key={y.id} value={String(y.id)}>
                          {y.name}
                        </SelectItem>
                      ))}
                      {existingAcademicYears.length === 0 && (
                        <SelectItem value="" disabled>
                          {tCommon("noDataAvailable")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel>{t("isActiveLabel")}</FormLabel>
                    <FormDescription>
                      {t("isActiveDescription")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="mt-2 pt-4 border-t">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={mutation.isLoading}
            >
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="class-timetable-form"
            disabled={mutation.isLoading || !form.formState.isDirty}
          >
            {mutation.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {tCommon("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassTimetableCreateModal;
