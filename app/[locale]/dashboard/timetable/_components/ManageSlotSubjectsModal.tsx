import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useMutation,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, PlusCircle, Trash2, X } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import {
  TimetableEntry, // This is the slot data
  ScheduledClassSubject,
  ScheduledClassSubjectFormData,
  ClassSubject, // From @/types/class
  TimetableEntryFormData, // For slot notes update
} from "@/types/timetable";
// Make sure ClassSubject is correctly imported if it's from a different type file.
// Assuming it's part of '@/types/timetable' or re-exported for simplicity here.
// If ClassSubject is from '@/types/class', adjust import.

import { getBackendErrorMessage } from "@/lib/utils";

// Schema for adding a new subject to the slot
const addSubjectToSlotSchema = z.object({
  class_subject_id: z.string().min(1, "Subject selection is required."),
});
type AddSubjectToSlotValues = z.infer<typeof addSubjectToSlotSchema>;

// Schema for editing slot notes
const slotNotesSchema = z.object({
  notes: z.string().trim().max(500).optional().nullable(),
});
type SlotNotesFormValues = z.infer<typeof slotNotesSchema>;

interface ManageSlotSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotData: TimetableEntry; // The slot (TimetableEntry) being managed
  allClassSubjects: ClassSubject[]; // All available ClassSubjects for the class of this timetable

  // Mutations passed from TimetableEditor
  scheduleSubjectMutation: UseMutationResult<
    ScheduledClassSubject,
    Error,
    ScheduledClassSubjectFormData
  >;
  unscheduleSubjectMutation: UseMutationResult<void, Error, number>; // Takes ID of ScheduledClassSubject
  updateSlotNotesMutation: UseMutationResult<
    TimetableEntry,
    Error,
    { id: number; data: Partial<TimetableEntryFormData> }
  >;
}

const ManageSlotSubjectsModal: React.FC<ManageSlotSubjectsModalProps> = ({
  isOpen,
  onClose,
  slotData,
  allClassSubjects, // These are specific to the SchoolClass of the slotData.class_timetable
  scheduleSubjectMutation,
  unscheduleSubjectMutation,
  updateSlotNotesMutation,
}) => {
  const t = useTranslations("Timetable.ManageSlotModal");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();

  const addSubjectForm = useForm<AddSubjectToSlotValues>({
    resolver: zodResolver(addSubjectToSlotSchema),
    defaultValues: { class_subject_id: "" },
  });

  const slotNotesForm = useForm<SlotNotesFormValues>({
    resolver: zodResolver(slotNotesSchema),
    defaultValues: { notes: slotData.notes || "" },
  });

  useEffect(() => {
    if (isOpen) {
      addSubjectForm.reset({ class_subject_id: "" });
      slotNotesForm.reset({ notes: slotData.notes || "" });
    }
  }, [isOpen, slotData, addSubjectForm, slotNotesForm]);

  const handleAddSubjectSubmit = (values: AddSubjectToSlotValues) => {
    const payload: ScheduledClassSubjectFormData = {
      timetable_entry_id: slotData.id,
      class_subject_id: values.class_subject_id,
    };
    scheduleSubjectMutation.mutate(payload, {
      onSuccess: () => {
        addSubjectForm.reset();
        // Invalidation is handled by the mutation's own onSuccess in TimetableEditor
      },
      // onError handled by mutation's own onError
    });
  };

  const handleUnscheduleSubject = (scheduledClassSubjectId: number) => {
    unscheduleSubjectMutation.mutate(scheduledClassSubjectId);
    // Invalidation handled by mutation's own onSuccess
  };

  const handleSlotNotesSubmit = (values: SlotNotesFormValues) => {
    updateSlotNotesMutation.mutate(
      {
        id: slotData.id,
        data: { notes: values.notes || "" }, // Only updating notes
      },
      {
        onSuccess: () => {
          // toast.success(t("slotNotesUpdateSuccess")); // Or handle in main mutation
          onClose(); // Close modal on successful notes update
        },
      }
    );
  };

  // Filter out subjects already scheduled in this slot from the dropdown
  const availableClassSubjects = allClassSubjects.filter(
    (cs) =>
      !slotData.scheduled_subjects.some((ss) => ss.class_subject.id === cs.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", {
              day: slotData.day_of_week_display,
              time: slotData.time_slot.name,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Section 1: Edit Slot Notes */}
          <div>
            <h3 className="text-md font-semibold mb-2">
              {t("slotNotesSectionTitle")}
            </h3>
            <Form {...slotNotesForm}>
              <form
                id="slot-notes-form"
                onSubmit={slotNotesForm.handleSubmit(handleSlotNotesSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={slotNotesForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">
                        {t("slotNotesLabel")}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("slotNotesPlaceholder")}
                          className="resize-y min-h-[60px]"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  form="slot-notes-form"
                  size="sm"
                  className="w-full"
                  disabled={
                    updateSlotNotesMutation.isLoading ||
                    !slotNotesForm.formState.isDirty
                  }
                >
                  {updateSlotNotesMutation.isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("saveSlotNotesButton")}
                </Button>
              </form>
            </Form>
          </div>

          {/* Section 2: Manage Scheduled Subjects */}
          <div>
            <h3 className="text-md font-semibold mb-2">
              {t("scheduledSubjectsSectionTitle")}
            </h3>
            {/* List of currently scheduled subjects */}
            <ScrollArea className="h-[150px] border rounded-md p-1 mb-3 bg-muted/30">
              {slotData.scheduled_subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">
                  {t("noSubjectsScheduled")}
                </p>
              ) : (
                <ul className="space-y-1.5 p-1">
                  {slotData.scheduled_subjects.map((ss) => (
                    <li
                      key={ss.id}
                      className="flex items-center justify-between text-sm p-1.5 bg-background rounded shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {ss.class_subject.subject.name}
                        </span>
                        {ss.class_subject.teacher && (
                          <span className="text-xs text-muted-foreground">
                            {tCommon("teacherLabel")}:{" "}
                            {ss.class_subject.teacher.name}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm" // custom smaller icon button
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleUnscheduleSubject(ss.id)}
                        disabled={
                          unscheduleSubjectMutation.isLoading &&
                          unscheduleSubjectMutation.variables === ss.id
                        }
                      >
                        {unscheduleSubjectMutation.isLoading &&
                        unscheduleSubjectMutation.variables === ss.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="sr-only">{t("removeSubject")}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>

            {/* Form to add a new subject */}
            <Form {...addSubjectForm}>
              <form
                id="add-subject-to-slot-form"
                onSubmit={addSubjectForm.handleSubmit(handleAddSubjectSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={addSubjectForm.control}
                  name="class_subject_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">
                        {t("addSubjectLabel")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={
                          availableClassSubjects.length === 0 ||
                          scheduleSubjectMutation.isLoading
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("addSubjectPlaceholder")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableClassSubjects.map((cs) => (
                            <SelectItem key={cs.id} value={String(cs.id)}>
                              {cs.subject_name} ({cs.subject_code})
                              {cs.teacher_name && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({cs.teacher_name})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                          {availableClassSubjects.length === 0 && (
                            <SelectItem value="" disabled>
                              {t("noMoreSubjectsToAdd")}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  form="add-subject-to-slot-form"
                  size="sm"
                  className="w-full"
                  disabled={
                    scheduleSubjectMutation.isLoading ||
                    availableClassSubjects.length === 0 ||
                    !addSubjectForm.formState.isValid
                  }
                >
                  {scheduleSubjectMutation.isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  {t("addSubjectButton")}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter className="mt-2 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSlotSubjectsModal;
