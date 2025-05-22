// src/components/Timetable/Editor/TimetableSlotEditModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UseMutationResult } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2, PlusCircle, Trash2, Save } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";

import {
  TimeSlot,
  TimetableEntry,
  ScheduledClassSubject,
  TimetableEntryFormData,
  ScheduledClassSubjectFormData,
} from "@/types/timetable";
import { ClassSubject, Teacher } from "@/types/teachers";

// --- Zod Schemas (Updated) ---
const createSlotWithSubjectSchema = z.object({
  class_subject_id: z.string().min(1, "Subject selection is required."),
  assigned_teacher_id: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});
type CreateSlotWithSubjectValues = z.infer<typeof createSlotWithSubjectSchema>;

const addSubjectToSlotSchema = z.object({
  class_subject_id: z.string().min(1, "Subject selection is required."),
  assigned_teacher_id: z.string().optional().nullable(),
});
type AddSubjectToSlotValues = z.infer<typeof addSubjectToSlotSchema>;

const slotNotesSchema = z.object({
  notes: z.string().trim().max(500).optional().nullable(),
});
type SlotNotesFormValues = z.infer<typeof slotNotesSchema>;

// --- Component Props (Updated) ---
interface TimetableSlotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayOfWeek: number;
  timeSlotId: number;
  existingSlotData: TimetableEntry | null;
  classTimetableId: number;
  allClassSubjects: ClassSubject[];
  allTeachers: Teacher[]; // New prop
  timeSlots: TimeSlot[];
  createSlotMutation: UseMutationResult<
    TimetableEntry,
    Error,
    TimetableEntryFormData
  >;
  scheduleSubjectMutation: UseMutationResult<
    ScheduledClassSubject,
    Error,
    ScheduledClassSubjectFormData // This now includes assigned_teacher_id
  >;
  unscheduleSubjectMutation: UseMutationResult<void, Error, number>;
  updateSlotNotesMutation: UseMutationResult<
    TimetableEntry,
    Error,
    { id: number; data: Partial<TimetableEntryFormData> }
  >;
}

const NO_TEACHER_SELECTED_VALUE = "__NO_TEACHER_OVERRIDE__";

// --- Component ---
const TimetableSlotEditModal: React.FC<TimetableSlotEditModalProps> = ({
  isOpen,
  onClose,
  dayOfWeek,
  timeSlotId,
  existingSlotData,
  classTimetableId,
  allClassSubjects,
  allTeachers, // New prop
  timeSlots,
  createSlotMutation,
  scheduleSubjectMutation,
  unscheduleSubjectMutation,
  updateSlotNotesMutation,
}) => {
  const t = useTranslations("Timetable.SlotEditModal");
  const tManage = useTranslations("Timetable.ManageSlotModal");
  const tCommon = useTranslations("Common");
  const tDays = useTranslations("Days");
  const DAY_KEYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const isCreateMode = !existingSlotData;
  const currentSlotId = existingSlotData?.id;

  const [defaultTeacherForUi, setDefaultTeacherForUi] = useState<{
    id: string | null;
    name: string | null;
  }>({ id: null, name: null });

  const createForm = useForm<CreateSlotWithSubjectValues>({
    resolver: zodResolver(createSlotWithSubjectSchema),
    defaultValues: {
      class_subject_id: "",
      assigned_teacher_id: NO_TEACHER_SELECTED_VALUE,
      notes: "",
    },
  });

  const addSubjectForm = useForm<AddSubjectToSlotValues>({
    resolver: zodResolver(addSubjectToSlotSchema),
    defaultValues: {
      class_subject_id: "",
      assigned_teacher_id: NO_TEACHER_SELECTED_VALUE,
    },
  });

  const slotNotesForm = useForm<SlotNotesFormValues>({
    resolver: zodResolver(slotNotesSchema),
    defaultValues: { notes: existingSlotData?.notes || "" },
  });

  const updateTeacherDropdown = (
    subjectId: string,
    formInstance: typeof createForm | typeof addSubjectForm
  ) => {
    if (subjectId) {
      const selectedClassSub = allClassSubjects.find(
        (cs) => String(cs.id) === subjectId
      );
      const defaultTeacherId = selectedClassSub?.teacher
        ? String(selectedClassSub.teacher)
        : null;
      const defaultTeacherName = selectedClassSub?.teacher_name || null;

      setDefaultTeacherForUi({
        id: defaultTeacherId,
        name: defaultTeacherName,
      });
      formInstance.setValue(
        "assigned_teacher_id",
        defaultTeacherId || NO_TEACHER_SELECTED_VALUE
      );
    } else {
      setDefaultTeacherForUi({ id: null, name: null });
      formInstance.setValue("assigned_teacher_id", NO_TEACHER_SELECTED_VALUE);
    }
  };

  const watchedCreateFormSubjectId = createForm.watch("class_subject_id");
  useEffect(() => {
    updateTeacherDropdown(watchedCreateFormSubjectId, createForm);
  }, [watchedCreateFormSubjectId, allClassSubjects, createForm]);

  const watchedAddFormSubjectId = addSubjectForm.watch("class_subject_id");
  useEffect(() => {
    updateTeacherDropdown(watchedAddFormSubjectId, addSubjectForm);
  }, [watchedAddFormSubjectId, allClassSubjects, addSubjectForm]);

  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        createForm.reset({
          class_subject_id: "",
          assigned_teacher_id: NO_TEACHER_SELECTED_VALUE,
          notes: "",
        });
      } else {
        addSubjectForm.reset({
          class_subject_id: "",
          assigned_teacher_id: NO_TEACHER_SELECTED_VALUE,
        });
        slotNotesForm.reset({ notes: existingSlotData?.notes || "" });
      }
      setDefaultTeacherForUi({ id: null, name: null }); // Reset on open/mode change
    }
  }, [
    isOpen,
    isCreateMode,
    existingSlotData,
    createForm,
    addSubjectForm,
    slotNotesForm,
  ]);

  const timeSlotForDisplay = useMemo(
    () => timeSlots.find((ts) => ts.id === timeSlotId),
    [timeSlots, timeSlotId]
  );
  const dayNameForDisplay = tDays(DAY_KEYS[dayOfWeek] ?? "unknownDay");
  const scheduledSubjectsInSlot = existingSlotData?.scheduled_subjects || [];

  const availableClassSubjectsToAdd = useMemo(() => {
    if (isCreateMode) return allClassSubjects;
    return allClassSubjects.filter(
      (cs) =>
        !scheduledSubjectsInSlot.some((ss) => ss.class_subject.id === cs.id)
    );
  }, [allClassSubjects, scheduledSubjectsInSlot, isCreateMode]);

  const handleCreateSlotAndScheduleSubject = async (
    values: CreateSlotWithSubjectValues
  ) => {
    try {
      const newSlotPayload: TimetableEntryFormData = {
        class_timetable_id: classTimetableId,
        day_of_week: dayOfWeek,
        time_slot_id: String(timeSlotId),
        notes: values.notes || "",
      };
      const createdSlot = await createSlotMutation.mutateAsync(newSlotPayload);

      const schedulePayload: ScheduledClassSubjectFormData = {
        timetable_entry_id: createdSlot.id,
        class_subject_id: values.class_subject_id,
        assigned_teacher_id:
          values.assigned_teacher_id &&
          values.assigned_teacher_id !== NO_TEACHER_SELECTED_VALUE
            ? values.assigned_teacher_id
            : null, // Send null if no override or default is intended to be used from ClassSubject
      };
      await scheduleSubjectMutation.mutateAsync(schedulePayload);
      onClose();
    } catch (error) {
      console.error("Error during create slot & schedule subject flow:", error);
    }
  };

  const handleAddSubjectToExistingSlot = (values: AddSubjectToSlotValues) => {
    if (!currentSlotId) return;
    const payload: ScheduledClassSubjectFormData = {
      timetable_entry_id: currentSlotId,
      class_subject_id: values.class_subject_id,
      assigned_teacher_id:
        values.assigned_teacher_id &&
        values.assigned_teacher_id !== NO_TEACHER_SELECTED_VALUE
          ? values.assigned_teacher_id
          : null,
    };
    scheduleSubjectMutation.mutate(payload, {
      onSuccess: () => {
        addSubjectForm.reset({
          class_subject_id: "",
          assigned_teacher_id: NO_TEACHER_SELECTED_VALUE,
        });
        setDefaultTeacherForUi({ id: null, name: null });
      },
    });
  };

  const handleUpdateSlotNotes = (values: SlotNotesFormValues) => {
    if (!currentSlotId) return;
    updateSlotNotesMutation.mutate(
      { id: currentSlotId, data: { notes: values.notes || "" } },
      {
        onSuccess: (updatedSlot) =>
          slotNotesForm.reset({ notes: updatedSlot.notes || "" }),
      }
    );
  };

  const handleUnscheduleSubjectFromSlot = (scheduledClassSubjectId: number) => {
    unscheduleSubjectMutation.mutate(scheduledClassSubjectId);
  };

  const isCreatingSlot =
    createSlotMutation.isLoading ||
    (scheduleSubjectMutation.isLoading && isCreateMode);
  const isAddingSubjectToSlot =
    scheduleSubjectMutation.isLoading && !isCreateMode;
  const isUpdatingSlotNotes = updateSlotNotesMutation.isLoading;
  const isUnschedulingSubject = unscheduleSubjectMutation.isLoading;
  const isBusy =
    isCreatingSlot ||
    isAddingSubjectToSlot ||
    isUpdatingSlotNotes ||
    isUnschedulingSubject;

  const teacherSelectLabel = defaultTeacherForUi.id
    ? `${t("useDefaultTeacher")} (${defaultTeacherForUi.name || "N/A"})`
    : watchedCreateFormSubjectId || watchedAddFormSubjectId
    ? t("noDefaultTeacher")
    : t("selectTeacherPlaceholder");

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isBusy && onClose()}
    >
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => {
          if (isBusy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isCreateMode ? t("createTitle") : t("manageTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("description", {
              day: dayNameForDisplay,
              time: timeSlotForDisplay?.name ?? `ID ${timeSlotId}`,
            })}
          </DialogDescription>
        </DialogHeader>

        {isCreateMode ? (
          <Form {...createForm}>
            <form
              id="create-slot-subject-form"
              onSubmit={createForm.handleSubmit(
                handleCreateSlotAndScheduleSubject
              )}
              className="space-y-4 py-4"
            >
              <FormField
                control={createForm.control}
                name="class_subject_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("firstSubjectLabel")}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={allClassSubjects.length === 0 || isBusy}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={tManage("addSubjectPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allClassSubjects.map((cs) => (
                          <SelectItem key={cs.id} value={String(cs.id)}>
                            {cs.subject_name} ({cs.subject_code})
                            {cs.teacher_name && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (Default T: {cs.teacher_name})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                        {allClassSubjects.length === 0 && (
                          <SelectItem value="" disabled>
                            {tCommon("noDataAvailable", {
                              item: tCommon("subjects").toLowerCase(),
                            })}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="assigned_teacher_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("teacherLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || NO_TEACHER_SELECTED_VALUE}
                      disabled={
                        isBusy ||
                        !watchedCreateFormSubjectId ||
                        allTeachers.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("selectTeacherPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_TEACHER_SELECTED_VALUE}>
                          {teacherSelectLabel}
                        </SelectItem>
                        {allTeachers.map((teacher) => (
                          <SelectItem
                            key={teacher.id}
                            value={String(teacher.id)}
                          >
                            {teacher.name}
                          </SelectItem>
                        ))}
                        {allTeachers.length === 0 && (
                          <SelectItem value="" disabled>
                            {tCommon("noDataAvailable", {
                              item: tCommon("teachers").toLowerCase(),
                            })}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {tManage("slotNotesLabel")}{" "}
                      <span className="text-muted-foreground text-xs">
                        ({tCommon("optional")})
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={tManage("slotNotesPlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isBusy || !createForm.formState.isValid}
              >
                {isCreatingSlot ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                {t("createButton")}
              </Button>
            </form>
          </Form>
        ) : (
          // MANAGE MODE UI
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-md font-semibold mb-2">
                {tManage("scheduledSubjectsSectionTitle")}
              </h3>
              <ScrollArea className="h-[150px] border rounded-md p-1 mb-3 bg-muted/30">
                {scheduledSubjectsInSlot.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 text-center">
                    {tManage("noSubjectsScheduled")}
                  </p>
                ) : (
                  <ul className="space-y-1.5 p-1">
                    {scheduledSubjectsInSlot.map((ss) => (
                      <li
                        key={ss.id}
                        className="flex items-center justify-between text-sm p-1.5 bg-background rounded shadow-sm"
                      >
                        <div className="flex flex-col overflow-hidden mr-2">
                          <span
                            className="font-medium truncate"
                            title={ss.class_subject.subject.name}
                          >
                            {ss.class_subject.subject.name}
                          </span>
                          {/* Display effective teacher from ss.effective_teacher_name if backend sends it */}
                          {ss.effective_teacher_name && (
                            <span
                              className="text-xs text-muted-foreground truncate"
                              title={ss.effective_teacher_name}
                            >
                              {tCommon("teacherLabel")}:{" "}
                              {ss.effective_teacher_name}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => handleUnscheduleSubjectFromSlot(ss.id)}
                          disabled={
                            isBusy ||
                            (isUnschedulingSubject &&
                              unscheduleSubjectMutation.variables === ss.id)
                          }
                        >
                          {isUnschedulingSubject &&
                          unscheduleSubjectMutation.variables === ss.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span className="sr-only">
                            {tManage("removeSubject")}
                          </span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
              <Form {...addSubjectForm}>
                <form
                  onSubmit={addSubjectForm.handleSubmit(
                    handleAddSubjectToExistingSlot
                  )}
                  className="space-y-3"
                >
                  <FormField
                    control={addSubjectForm.control}
                    name="class_subject_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">
                          {tManage("addSubjectLabel")}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={
                            availableClassSubjectsToAdd.length === 0 || isBusy
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={tManage("addSubjectPlaceholder")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableClassSubjectsToAdd.map((cs) => (
                              <SelectItem key={cs.id} value={String(cs.id)}>
                                {cs.subject_name} ({cs.subject_code})
                                {cs.teacher_name && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    (Default T: {cs.teacher_name})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                            {availableClassSubjectsToAdd.length === 0 && (
                              <SelectItem value="" disabled>
                                {tManage("noMoreSubjectsToAdd")}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addSubjectForm.control}
                    name="assigned_teacher_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("teacherLabel")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || NO_TEACHER_SELECTED_VALUE}
                          disabled={
                            isBusy ||
                            !watchedAddFormSubjectId ||
                            allTeachers.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("selectTeacherPlaceholder")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_TEACHER_SELECTED_VALUE}>
                              {teacherSelectLabel}
                            </SelectItem>
                            {allTeachers.map((teacher) => (
                              <SelectItem
                                key={teacher.id}
                                value={String(teacher.id)}
                              >
                                {teacher.name}
                              </SelectItem>
                            ))}
                            {allTeachers.length === 0 && (
                              <SelectItem value="" disabled>
                                {tCommon("noDataAvailable", {
                                  item: tCommon("teachers").toLowerCase(),
                                })}
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
                    size="sm"
                    className="w-full"
                    disabled={
                      isBusy ||
                      availableClassSubjectsToAdd.length === 0 ||
                      !addSubjectForm.formState.isValid
                    }
                  >
                    {isAddingSubjectToSlot ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    {tManage("addSubjectButton")}
                  </Button>
                </form>
              </Form>
            </div>
            <Separator />
            <div>
              <h3 className="text-md font-semibold mb-2">
                {tManage("slotNotesSectionTitle")}
              </h3>
              <Form {...slotNotesForm}>
                <form
                  onSubmit={slotNotesForm.handleSubmit(handleUpdateSlotNotes)}
                  className="space-y-3"
                >
                  <FormField
                    control={slotNotesForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">
                          {tManage("slotNotesLabel")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={tManage("slotNotesPlaceholder")}
                            className="min-h-[60px]"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isBusy}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    disabled={isBusy || !slotNotesForm.formState.isDirty}
                  >
                    {isUpdatingSlotNotes ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {tManage("saveSlotNotesButton")}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}
        <DialogFooter className="mt-2 pt-4 border-t">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isBusy}
            >
              {tCommon("close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimetableSlotEditModal;
