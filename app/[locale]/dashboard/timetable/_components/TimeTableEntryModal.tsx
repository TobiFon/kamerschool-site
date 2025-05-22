"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UseMutationResult,
  // useQueryClient, // Not used, can be removed if not needed elsewhere
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
// import { toast } from "sonner"; // Not used directly in this component for success/error
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
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { TimetableEntry, TimetableEntryFormData } from "@/types/timetable";
import { Teacher } from "@/types/teachers";
import { ClassSubject } from "@/types/class";

// Special value for representing "No Teacher" in the Select form field
const NO_TEACHER_VALUE = "__NO_TEACHER_SELECTED__";
const NO_SUBJECTS_PLACEHOLDER_VALUE = "__NO_SUBJECTS__";
const NO_TEACHERS_PLACEHOLDER_VALUE = "__NO_TEACHERS__";

// Zod schema for the edit form
const timetableEntryEditSchema = z.object({
  class_subject_id: z.string().min(1, "Subject is required."),
  teacher_id: z
    .string()
    .nullable()
    .optional()
    .or(z.literal("")) // Handles initial empty state from form if not touched
    .or(z.literal(NO_TEACHER_VALUE)), // Allows our special value for "None"
  notes: z.string().trim().max(500).optional().nullable().or(z.literal("")),
});

type TimetableEntryEditFormValues = z.infer<typeof timetableEntryEditSchema>;

interface TimetableEntryModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  entryData: TimetableEntry | null;
  classSubjects: ClassSubject[];
  teachers: Teacher[];
  updateMutation: UseMutationResult<
    TimetableEntry,
    Error,
    { id: number; data: Partial<TimetableEntryFormData> }
  >;
}

const TimetableEntryModal: React.FC<TimetableEntryModalProps> = ({
  isOpen,
  onClose,
  entryData,
  classSubjects,
  teachers,
  updateMutation,
}) => {
  const t = useTranslations("Timetable.EntryModal");
  const tCommon = useTranslations("Common");
  // const queryClient = useQueryClient();

  const form = useForm<TimetableEntryEditFormValues>({
    resolver: zodResolver(timetableEntryEditSchema),
    defaultValues: useMemo(
      () => ({
        class_subject_id: "",
        teacher_id: "", // Initial teacher_id can be empty string for placeholder
        notes: "",
      }),
      []
    ),
  });

  useEffect(() => {
    if (isOpen && entryData) {
      form.reset({
        class_subject_id: String(entryData.class_subject?.id || ""),
        teacher_id: entryData.teacher?.id
          ? String(entryData.teacher.id)
          : NO_TEACHER_VALUE, // Use special value if no teacher
        notes: entryData.notes || "",
      });
    }
  }, [isOpen, entryData, form]);

  const onSubmit = (values: TimetableEntryEditFormValues) => {
    if (!entryData) return;

    let finalTeacherId: string | null = null;
    if (values.teacher_id && values.teacher_id !== NO_TEACHER_VALUE) {
      finalTeacherId = values.teacher_id;
    }

    const payload: Partial<TimetableEntryFormData> = {
      class_subject_id: values.class_subject_id,
      teacher_id: finalTeacherId,
      notes: values.notes || "",
    };

    updateMutation.mutate({ id: entryData.id, data: payload });
  };

  if (!isOpen || !entryData) return null;

  const selectedSubjectData = classSubjects.find(
    (cs) => String(cs.id) === form.watch("class_subject_id")
  );
  const defaultTeacherName = selectedSubjectData?.teacher_name;
  const currentFormTeacherId = form.watch("teacher_id");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
          <DialogDescription>
            {t("editDescription", {
              day: entryData.day_of_week_display,
              time: entryData.time_slot?.name,
            })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="edit-entry-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="class_subject_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("subjectLabel")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const subj = classSubjects.find(
                        (cs) => String(cs.id) === value
                      );
                      if (subj?.teacher) {
                        form.setValue("teacher_id", String(subj.teacher), {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      } else {
                        // If new subject has no default teacher,
                        // and current teacher is not user-selected (i.e., it was a default or none)
                        // set to "None"
                        const previousSubject = classSubjects.find(
                          (cs) => String(cs.id) === entryData?.class_subject?.id
                        );
                        if (
                          form.getValues("teacher_id") ===
                            String(previousSubject?.teacher) ||
                          form.getValues("teacher_id") === NO_TEACHER_VALUE
                        ) {
                          form.setValue("teacher_id", NO_TEACHER_VALUE, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }
                      }
                    }}
                    value={field.value || ""} // Ensure value is not null/undefined for Select
                    disabled={classSubjects.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("subjectPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classSubjects.length === 0 ? (
                        <SelectItem
                          value={NO_SUBJECTS_PLACEHOLDER_VALUE}
                          disabled
                        >
                          {tCommon("noDataAvailable")}
                        </SelectItem>
                      ) : (
                        classSubjects.map((cs) => (
                          <SelectItem key={cs.id} value={String(cs.id)}>
                            {cs.subject_name} ({cs.subject_code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedSubjectData &&
                    defaultTeacherName &&
                    currentFormTeacherId !==
                      String(selectedSubjectData?.teacher) && // Check against actual teacher ID
                    currentFormTeacherId !== NO_TEACHER_VALUE && ( // Don't show if "None" is selected
                      <p className="text-xs text-muted-foreground px-1">
                        {t("defaultTeacherNote", { name: defaultTeacherName })}
                      </p>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("teacherLabel")}{" "}
                    <span className="text-muted-foreground text-xs">
                      ({tCommon("optional")})
                    </span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""} // Ensure value is not null/undefined for Select
                    disabled={teachers.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("teacherPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_TEACHER_VALUE}>
                        {t("teacherNone")}
                      </SelectItem>
                      {teachers.length === 0 &&
                      currentFormTeacherId !== NO_TEACHER_VALUE ? ( // Show "no data" only if no teachers and "None" isn't the selected value
                        <SelectItem
                          value={NO_TEACHERS_PLACEHOLDER_VALUE}
                          disabled
                        >
                          {tCommon("noDataAvailable")}
                        </SelectItem>
                      ) : (
                        teachers.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
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
                  <FormLabel>
                    {t("notesLabel")}{" "}
                    <span className="text-muted-foreground text-xs">
                      ({tCommon("optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("notesPlaceholder")}
                      className="resize-y min-h-[60px]"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="mt-4 pt-4 border-t">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={updateMutation.isLoading}
            >
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="edit-entry-form"
            disabled={updateMutation.isLoading || !form.formState.isDirty}
          >
            {updateMutation.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {tCommon("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimetableEntryModal;
