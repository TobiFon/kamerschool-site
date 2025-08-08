"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { X, Loader2, AlertCircle, RefreshCcw, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  ClassTimetable,
  TimeSlot,
  TimetableEntry,
  ScheduledClassSubject,
  TimetableEntryFormData,
  ScheduledClassSubjectFormData,
  MultiPeriodEntryFormData,
} from "@/types/timetable";
import { ClassSubject, Teacher } from "@/types/teachers";
import { School } from "@/types/auth";

import {
  fetchClassTimetableDetail,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  createScheduledClassSubject,
  deleteScheduledClassSubject,
  createMultiPeriodTimetableEntries,
  fetchTimeSlots,
} from "@/queries/timetable";
import { fetchClassSubjects } from "@/queries/subjects";
import { fetchTeachers } from "@/queries/teachers";
import { getBackendErrorMessage } from "@/lib/utils";
import { fetchSchool } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser"; // Import the hook

import ConfirmationDialog from "../../fees/_components/ConfirmDailogue";
import TimetableGrid from "./TimeTableGrid";
import TimetableSlotEditModal from "./TimetableSlotEditModal";
import {
  exportTimetableToPDF,
  PdfLabels,
  SchoolDataForPdf,
} from "@/lib/timetablepdf";

interface TimetableEditorProps {
  timetableId: number;
  onClose: () => void;
}

const TimetableEditor: React.FC<TimetableEditorProps> = ({
  timetableId,
  onClose,
}) => {
  const t = useTranslations("Timetable.Editor");
  const tCommon = useTranslations("Common");
  const tDays = useTranslations("Days");
  const tGrid = useTranslations("Timetable.Grid");
  const queryClient = useQueryClient();
  const { canEdit } = useCurrentUser(); // Get user permission status

  const [slotEditModalState, setSlotEditModalState] =
    useState<SlotEditModalState | null>(null);
  const [deletionConfirmation, setDeletionConfirmation] =
    useState<DeletionConfirmationState | null>(null);

  const timetableDetailQueryKey = useMemo(
    () => ["classTimetableDetail", timetableId],
    [timetableId]
  );

  const {
    data: timetableData,
    isLoading: isLoadingTimetable,
    isError: isErrorTimetable,
    error: errorTimetable,
    refetch: refetchTimetable,
  } = useQuery<ClassTimetable, Error>({
    queryKey: timetableDetailQueryKey,
    queryFn: () => fetchClassTimetableDetail(timetableId),
  });

  const { data: schoolApiData, isLoading: isLoadingSchoolApiData } = useQuery<
    School,
    Error
  >({
    queryKey: ["currentSchoolDataForPdf"],
    queryFn: fetchSchool,
    staleTime: Infinity,
  });

  const schoolIdForQueries = schoolApiData?.id;
  const classId = timetableData?.school_class?.id;

  const { data: timeSlots = [], isLoading: isLoadingTimeSlots } = useQuery<
    TimeSlot[],
    Error
  >({
    queryKey: ["timeSlots", schoolIdForQueries],
    queryFn: () =>
      fetchTimeSlots({
        school_id: schoolIdForQueries,
        ordering: "order,start_time",
        pageSize: 200,
      }).then((res) => res.results),
    enabled: !!schoolIdForQueries,
    staleTime: 60 * 60 * 1000,
  });

  const {
    data: classSubjectsForClass = [],
    isLoading: isLoadingClassSubjects,
  } = useQuery<ClassSubject[], Error>({
    queryKey: ["classSubjects", classId],
    queryFn: () => fetchClassSubjects(classId!),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: schoolTeachers = [], isLoading: isLoadingSchoolTeachers } =
    useQuery<Teacher[], Error>({
      queryKey: ["allSchoolTeachers", schoolIdForQueries],
      queryFn: () => fetchTeachers({ school_id: schoolIdForQueries }),
      enabled: !!schoolIdForQueries,
      staleTime: 10 * 60 * 1000,
    });

  const commonMutationOptions = (operationNameKey?: string) => ({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableDetailQueryKey });
      queryClient.invalidateQueries({ queryKey: ["classTimetables"] });
    },
    onError: (error: Error) => {
      const message = operationNameKey
        ? t("errorGenericOperationWithName", { operation: t(operationNameKey) })
        : t("errorGenericOperation");
      toast.error(getBackendErrorMessage(error) || message);
    },
  });

  const createSlotMutation = useMutation<
    TimetableEntry,
    Error,
    TimetableEntryFormData
  >({
    mutationFn: createTimetableEntry,
    ...commonMutationOptions("opCreatingSlot"),
    onSuccess: (createdSlot) => {
      commonMutationOptions().onSuccess();
      toast.success(
        t("slotCreatedSuccess", { time: createdSlot.time_slot.name })
      );
    },
  });

  const scheduleSubjectInSlotMutation = useMutation<
    ScheduledClassSubject,
    Error,
    ScheduledClassSubjectFormData
  >({
    mutationFn: createScheduledClassSubject,
    ...commonMutationOptions("opSchedulingSubject"),
    onSuccess: (scheduledItem) => {
      commonMutationOptions().onSuccess();
      toast.success(
        t("subjectScheduledSuccess", {
          subject: scheduledItem.class_subject.subject.name,
        })
      );
    },
  });

  const updateSlotNotesMutation = useMutation<
    TimetableEntry,
    Error,
    { id: number; data: Partial<TimetableEntryFormData> }
  >({
    mutationFn: ({ id, data }) => updateTimetableEntry(id, data),
    ...commonMutationOptions("opUpdatingSlotNotes"),
    onSuccess: (updatedSlot) => {
      commonMutationOptions().onSuccess();
      toast.success(
        t("slotNotesUpdateSuccess", { time: updatedSlot.time_slot.name })
      );
    },
  });

  const deleteSlotMutation = useMutation<void, Error, number>({
    mutationFn: deleteTimetableEntry,
    ...commonMutationOptions("opDeletingSlot"),
    onSuccess: () => {
      commonMutationOptions().onSuccess();
      toast.success(t("slotDeletedSuccess"));
      setDeletionConfirmation(null);
    },
    onError: (e) => {
      commonMutationOptions("opDeletingSlot").onError?.(e);
      setDeletionConfirmation(null);
    },
  });

  const unscheduleSubjectMutation = useMutation<void, Error, number>({
    mutationFn: deleteScheduledClassSubject,
    ...commonMutationOptions("opUnschedulingSubject"),
    onSuccess: () => {
      commonMutationOptions().onSuccess();
      toast.success(t("subjectUnscheduledSuccess"));
      if (
        deletionConfirmation?.targetType ===
        DeletionTargetType.SCHEDULED_SUBJECT
      ) {
        setDeletionConfirmation(null);
      }
    },
    onError: (e) => {
      commonMutationOptions("opUnschedulingSubject").onError?.(e);
      if (
        deletionConfirmation?.targetType ===
        DeletionTargetType.SCHEDULED_SUBJECT
      ) {
        setDeletionConfirmation(null);
      }
    },
  });

  const createMultiPeriodMutation = useMutation<
    ScheduledClassSubject[],
    Error,
    MultiPeriodEntryFormData
  >({
    mutationFn: createMultiPeriodTimetableEntries,
    ...commonMutationOptions("opCreatingMultiPeriod"),
    onSuccess: (data) => {
      commonMutationOptions().onSuccess();
      if (data?.length > 0)
        toast.success(
          t("multiEntryAddedSuccess", {
            count: data.length,
            subject: data[0].class_subject.subject.name,
          })
        );
      else toast.success(t("multiEntryOperationSuccess"));
    },
  });

  const handleCellClick = useCallback(
    (
      dayOfWeek: number,
      timeSlotId: number,
      existingSlot: TimetableEntry | undefined
    ) => {
      setSlotEditModalState({
        dayOfWeek,
        timeSlotId,
        existingSlotData: existingSlot || null,
      });
    },
    []
  );

  const handleCloseSlotEditModal = useCallback(
    () => setSlotEditModalState(null),
    []
  );

  const handleDeleteScheduledSubject = useCallback(
    (scheduledSubject: ScheduledClassSubject) => {
      const parentSlot = timetableData?.entries?.find((entry) =>
        entry.scheduled_subjects.some((ss) => ss.id === scheduledSubject.id)
      );
      setDeletionConfirmation({
        targetType: DeletionTargetType.SCHEDULED_SUBJECT,
        item: scheduledSubject,
        messageContext: {
          subject: scheduledSubject.class_subject.subject.name,
          day: parentSlot?.day_of_week_display ?? tCommon("unknownDay"),
          time: parentSlot?.time_slot.name ?? tCommon("unknownTime"),
        },
      });
    },
    [timetableData?.entries, tCommon]
  );

  const handleDeleteEntireSlot = useCallback((slot: TimetableEntry) => {
    setDeletionConfirmation({
      targetType: DeletionTargetType.SLOT,
      item: slot,
      messageContext: {
        day: slot.day_of_week_display,
        time: slot.time_slot.name,
        count: slot.scheduled_subjects.length,
      },
    });
  }, []);

  const handlePrintTimetable = () => {
    if (!timetableData || !timeSlots || !schoolApiData) {
      toast.error(t("errorPdfDataMissing"));
      return;
    }
    const schedulableTimeSlotsForPdf = timeSlots.sort(
      (a, b) => a.order - b.order || a.start_time.localeCompare(b.start_time)
    );
    const schoolDataForPdf: SchoolDataForPdf = { name: schoolApiData.name };
    const labels: PdfLabels = {
      schoolNamePlaceholder: tCommon("schoolNamePlaceholder"),
      academicYearPrefix: t("pdfAcademicYearPrefix"),
      classTimetableForPrefix: t("pdfClassTimetableForPrefix"),
      dayHeader: tGrid("dayHeader"),
      breakTime: tGrid("breakTime"),
      pagePdf: (current, total) => tCommon("pagePdf", { current, total }),
      generatedOn: (date) => tCommon("generatedOn", { date }),
      pdfFileNamePrefix: t("pdfFileNamePrefix"),
      days: {
        0: tDays(DAY_KEYS_PDF_EDITOR[0]),
        1: tDays(DAY_KEYS_PDF_EDITOR[1]),
        2: tDays(DAY_KEYS_PDF_EDITOR[2]),
        3: tDays(DAY_KEYS_PDF_EDITOR[3]),
        4: tDays(DAY_KEYS_PDF_EDITOR[4]),
        5: tDays(DAY_KEYS_PDF_EDITOR[5]),
      },
    };
    exportTimetableToPDF(
      timetableData,
      schedulableTimeSlotsForPdf,
      schoolDataForPdf,
      labels
    );
  };
  const DAY_KEYS_PDF_EDITOR = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const isLoadingPrimaryData = isLoadingTimetable || isLoadingTimeSlots;
  const isLoadingSupportingData =
    isLoadingClassSubjects || isLoadingSchoolTeachers;
  const isOverallLoading =
    isLoadingPrimaryData || (!!timetableData && isLoadingSupportingData);

  if (isLoadingPrimaryData && !timetableData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-16" />
        </CardHeader>
        <CardContent className="mt-4 space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isErrorTimetable) {
    return (
      <Card className="bg-destructive/5 border-destructive">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle /> {tCommon("errorTitle")}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          <p className="text-center">
            {getBackendErrorMessage(errorTimetable) ||
              tCommon("fetchErrorGeneric")}
          </p>
          <Button
            variant="destructive"
            outline
            onClick={() => refetchTimetable()}
            disabled={isLoadingTimetable}
          >
            <RefreshCcw className="h-4 w-4 mr-2" /> {tCommon("retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (!timetableData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("timetableNotFound")}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <p>{t("couldNotLoadTimetable")}</p>
        </CardContent>
      </Card>
    );
  }

  const isMutating =
    createSlotMutation.isLoading ||
    scheduleSubjectInSlotMutation.isLoading ||
    createMultiPeriodMutation.isLoading ||
    updateSlotNotesMutation.isLoading ||
    deleteSlotMutation.isLoading ||
    unscheduleSubjectMutation.isLoading;

  return (
    <Card className="relative overflow-hidden">
      {isMutating && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-30">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b pb-4">
        <div>
          <CardTitle className="text-xl mb-1">
            {t("editorTitle", { class: timetableData.school_class.full_name })}
          </CardTitle>
          <CardDescription>
            {t("editorDescription", { year: timetableData.academic_year.name })}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintTimetable}
            disabled={
              isLoadingPrimaryData ||
              isLoadingSchoolApiData ||
              !timetableData ||
              !timeSlots.length
            }
          >
            <Printer className="h-4 w-4 mr-1.5" /> {tCommon("print")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4 mr-1.5" /> {tCommon("close")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mt-2">
          <TimetableGrid
            timeSlots={timeSlots}
            entries={timetableData.entries || []}
            isLoading={isOverallLoading}
            onCellClick={handleCellClick}
            onDeleteScheduledSubject={handleDeleteScheduledSubject}
            onDeleteEntireSlot={handleDeleteEntireSlot}
            canEdit={canEdit} // Pass permission status down
          />
        </div>
      </CardContent>

      {/* The modal is only triggered by actions inside the grid, which are now disabled for non-editors */}
      {slotEditModalState && canEdit && (
        <TimetableSlotEditModal
          isOpen={!!slotEditModalState}
          onClose={handleCloseSlotEditModal}
          dayOfWeek={slotEditModalState.dayOfWeek}
          timeSlotId={slotEditModalState.timeSlotId}
          existingSlotData={slotEditModalState.existingSlotData}
          classTimetableId={timetableId}
          allClassSubjects={classSubjectsForClass}
          allTeachers={schoolTeachers}
          timeSlots={timeSlots}
          createSlotMutation={createSlotMutation}
          scheduleSubjectMutation={scheduleSubjectInSlotMutation}
          unscheduleSubjectMutation={unscheduleSubjectMutation}
          updateSlotNotesMutation={updateSlotNotesMutation}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletionConfirmation && canEdit}
        onClose={() => setDeletionConfirmation(null)}
        onConfirm={() => {
          if (deletionConfirmation) {
            if (deletionConfirmation.targetType === DeletionTargetType.SLOT) {
              deleteSlotMutation.mutate(
                (deletionConfirmation.item as TimetableEntry).id
              );
            } else if (
              deletionConfirmation.targetType ===
              DeletionTargetType.SCHEDULED_SUBJECT
            ) {
              unscheduleSubjectMutation.mutate(
                (deletionConfirmation.item as ScheduledClassSubject).id
              );
            }
          }
        }}
        title={
          deletionConfirmation?.targetType === DeletionTargetType.SLOT
            ? t("deleteSlotConfirmTitle")
            : t("deleteScheduledSubjectConfirmTitle")
        }
        description={
          deletionConfirmation?.targetType === DeletionTargetType.SLOT
            ? t(
                "deleteSlotConfirmDescription",
                deletionConfirmation.messageContext
              )
            : t(
                "deleteScheduledSubjectConfirmDescription",
                deletionConfirmation?.messageContext
              )
        }
        confirmText={tCommon("delete")}
        confirmVariant="destructive"
        isConfirming={
          deleteSlotMutation.isLoading || unscheduleSubjectMutation.isLoading
        }
      />
    </Card>
  );
};

enum DeletionTargetType {
  SLOT = "slot",
  SCHEDULED_SUBJECT = "scheduled_subject",
}

interface DeletionConfirmationState {
  targetType: DeletionTargetType;
  item: TimetableEntry | ScheduledClassSubject;
  messageContext?: Record<string, string | number | undefined>;
}

interface SlotEditModalState {
  dayOfWeek: number;
  timeSlotId: number;
  existingSlotData: TimetableEntry | null;
}

export default TimetableEditor;
