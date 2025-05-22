// src/app/[locale]/dashboard/students/[id]/_components/StudentTimetableTab.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CalendarDays, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Student } from "@/types/students";
import { AcademicYear } from "@/types/transfers";
import {
  StudentTimetableResponse,
  TimeSlot,
  StudentTimetableSlotEntry,
} from "@/types/timetable";

import { fetchStudentTimetable, fetchTimeSlots } from "@/queries/timetable";
import { fetchAcademicYears } from "@/queries/results";
import { fetchStudentById } from "@/queries/students";
import { getBackendErrorMessage } from "@/lib/utils";
import { fetchSchool } from "@/lib/auth";
import { School } from "@/types/auth";
import {
  exportStudentTimetableToPDF,
  SchoolDataForStudentPdf,
  StudentTimetablePdfLabels,
} from "@/lib/timetablepdf";

const DAYS_OF_WEEK_STUDENT_TIMETABLE = [0, 1, 2, 3, 4, 5];
const DAY_KEYS_STUDENT_TIMETABLE = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface StudentTimetableTabProps {
  studentId: string;
}

const StudentTimetableTab: React.FC<StudentTimetableTabProps> = ({
  studentId,
}) => {
  const t = useTranslations("Students.TimetableTab");
  const tDays = useTranslations("Days");
  const tCommon = useTranslations("Common");
  const tPdfLabels = useTranslations("PdfUtils.studentTimetable");

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<
    string | undefined
  >(undefined);

  const { data: schoolApiData, isLoading: isLoadingSchool } = useQuery<
    School,
    Error
  >({
    queryKey: ["currentSchoolDataForStudentTimetable"],
    queryFn: fetchSchool,
    staleTime: Infinity,
  });
  const schoolIdForQueries = schoolApiData?.id;

  const { data: studentDetails, isLoading: isLoadingStudentDetails } = useQuery<
    Student,
    Error
  >({
    queryKey: ["studentDetailsForPdf", studentId],
    queryFn: () => fetchStudentById(studentId),
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: academicYearsData, isLoading: isLoadingAcademicYears } =
    useQuery<AcademicYear[], Error>({
      queryKey: ["academicYearsForStudentTimetable"],
      queryFn: () => fetchAcademicYears(),
      staleTime: 5 * 60 * 1000,
      enabled: !!schoolIdForQueries,
    });
  const academicYears = academicYearsData || [];

  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYearId) {
      const activeYear = academicYears.find((year) => year.is_active);
      const targetYear =
        activeYear ||
        [...academicYears].sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        )[0];
      if (targetYear) {
        setSelectedAcademicYearId(String(targetYear.id));
      }
    }
  }, [academicYears, selectedAcademicYearId]);

  const { data: timeSlotsData = [], isLoading: isLoadingTimeSlots } = useQuery<
    TimeSlot[],
    Error
  >({
    queryKey: ["allTimeSlotsForStudentSchool", schoolIdForQueries],
    queryFn: () =>
      fetchTimeSlots({
        school_id: schoolIdForQueries,
        ordering: "order,start_time",
        pageSize: 200,
      }).then((res) => res.results),
    enabled: !!schoolIdForQueries,
    staleTime: 60 * 60 * 1000,
  });
  const timeSlots = timeSlotsData || [];

  const studentTimetableQueryKey = useMemo(
    () => ["studentTimetable", studentId, selectedAcademicYearId],
    [studentId, selectedAcademicYearId]
  );

  const {
    data: timetableResponse,
    isLoading: isLoadingTimetableData,
    isError: isErrorTimetable,
    error: errorTimetable,
    isFetching: isFetchingTimetable,
  } = useQuery<StudentTimetableResponse, Error>({
    queryKey: studentTimetableQueryKey,
    queryFn: () =>
      fetchStudentTimetable({
        student_id: studentId,
        academic_year_id: selectedAcademicYearId!,
      }),
    enabled: !!studentId && !!selectedAcademicYearId && !!schoolIdForQueries,
  });

  const scheduleEntries: StudentTimetableSlotEntry[] = useMemo(() => {
    return timetableResponse?.entries || [];
  }, [timetableResponse]);

  const isPrimaryLoading =
    isLoadingSchool ||
    isLoadingAcademicYears ||
    isLoadingTimeSlots ||
    isLoadingStudentDetails;
  const isContentLoading =
    isLoadingTimetableData && timetableResponse === undefined;

  const schedulableTimeSlots = useMemo(
    () =>
      (timeSlots || [])
        .filter((ts) => !ts.is_break)
        .sort(
          (a, b) =>
            a.order - b.order || a.start_time.localeCompare(b.start_time)
        ),
    [timeSlots]
  );

  const handlePrintTimetable = () => {
    if (
      !studentDetails ||
      !timetableResponse ||
      !selectedAcademicYearId ||
      !schoolApiData ||
      !academicYears || // Check if academicYears array is loaded
      academicYears.length === 0 ||
      schedulableTimeSlots.length === 0
      // No need to check timetableResponse.entries.length here as PDF can handle empty
    ) {
      toast.error(t("errorPdfDataMissing"));
      console.error("Missing data for PDF:", {
        studentDetails,
        timetableResponse,
        selectedAcademicYearId,
        schoolApiData,
        academicYears,
        schedulableTimeSlots,
      });
      return;
    }

    const schoolDataForPdf: SchoolDataForStudentPdf = {
      name: schoolApiData.name,
    };

    const pdfLabels: StudentTimetablePdfLabels = {
      schoolNamePlaceholder: tPdfLabels("schoolNamePlaceholder"),
      academicYearPrefix: tPdfLabels("academicYearPrefix"),
      studentScheduleForPrefix: tPdfLabels("studentScheduleForPrefix"),
      classLabel: tPdfLabels("classLabel"),
      dayHeader: tPdfLabels("dayHeader"),
      noActivity: tPdfLabels("noActivity"),
      pagePdf: (current, total) => tCommon("pagePdf", { current, total }),
      generatedOn: (date) => tCommon("generatedOn", { date }),
      pdfFileNamePrefix: tPdfLabels("pdfFileNamePrefix"),
      days: {
        0: tDays(DAY_KEYS_STUDENT_TIMETABLE[0]),
        1: tDays(DAY_KEYS_STUDENT_TIMETABLE[1]),
        2: tDays(DAY_KEYS_STUDENT_TIMETABLE[2]),
        3: tDays(DAY_KEYS_STUDENT_TIMETABLE[3]),
        4: tDays(DAY_KEYS_STUDENT_TIMETABLE[4]),
        5: tDays(DAY_KEYS_STUDENT_TIMETABLE[5]),
      },
    };

    exportStudentTimetableToPDF(
      studentDetails,
      timetableResponse,
      schedulableTimeSlots,
      schoolDataForPdf,
      pdfLabels
    );
  };

  if (isPrimaryLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const canPrint =
    studentDetails &&
    timetableResponse && // Check for the main response object
    selectedAcademicYearId &&
    academicYears.length > 0 && // Ensure academicYears is loaded and has content
    schoolApiData &&
    // We can print even if entries are empty, the PDF will show an empty schedule
    !isFetchingTimetable;

  return (
    <Card className="shadow-md relative">
      {isFetchingTimetable && !isContentLoading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardHeader className="border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle className="text-xl">
            {timetableResponse?.class_name
              ? t("titleForClass", { className: timetableResponse.class_name })
              : studentDetails
              ? t("titleGenericStudent", {
                  studentName: studentDetails.full_name,
                })
              : t("titleGeneric")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select
            value={selectedAcademicYearId}
            onValueChange={setSelectedAcademicYearId}
            disabled={
              isLoadingAcademicYears ||
              academicYears.length === 0 ||
              isFetchingTimetable
            }
          >
            <SelectTrigger className="w-full sm:w-[220px] h-9 text-sm">
              <CalendarDays className="h-4 w-4 mr-2 opacity-70" />
              <SelectValue placeholder={t("selectYearPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingAcademicYears ? (
                <SelectItem value="loading" disabled>
                  {tCommon("loading")}...
                </SelectItem>
              ) : academicYears.length > 0 ? (
                academicYears.map((year) => (
                  <SelectItem key={year.id} value={String(year.id)}>
                    {year.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-years" disabled>
                  {t("noAcademicYears")}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handlePrintTimetable}
            variant="outline"
            size="sm"
            className="h-9 w-full sm:w-auto"
            disabled={
              !canPrint || isLoadingStudentDetails || isFetchingTimetable
            }
          >
            <Printer className="h-4 w-4 mr-2" />
            {tCommon("print")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!selectedAcademicYearId ? (
          <div className="text-center py-10 text-muted-foreground">
            <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p>{t("selectYearPrompt")}</p>
          </div>
        ) : isErrorTimetable ? (
          <div className="text-center py-10 text-destructive-foreground bg-destructive/10 p-6 rounded-md">
            <AlertCircle className="mx-auto h-12 w-12 mb-3" />
            <p className="font-semibold">{tCommon("errorTitle")}</p>
            <p>
              {getBackendErrorMessage(errorTimetable) ||
                tCommon("fetchErrorGeneric")}
            </p>
          </div>
        ) : isContentLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : timetableResponse?.message &&
          scheduleEntries.length === 0 &&
          !isFetchingTimetable ? (
          <div className="text-center py-10 text-muted-foreground">
            <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p>{timetableResponse.message}</p>
          </div>
        ) : scheduleEntries.length === 0 && !isFetchingTimetable ? (
          <div className="text-center py-10 text-muted-foreground">
            <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p>{t("noScheduleFound")}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto shadow-sm bg-card">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `minmax(100px, auto) repeat(${schedulableTimeSlots.length}, minmax(160px, 1fr))`,
                minWidth: `${100 + schedulableTimeSlots.length * 160}px`,
              }}
            >
              <div className="p-2.5 border-b border-r text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/70 sticky top-0 left-0 z-30 flex items-center justify-center"></div>
              {schedulableTimeSlots.map((slot) => (
                <div
                  key={`header-slot-${slot.id}`}
                  className="p-2.5 border-b border-r text-xs font-semibold text-center bg-muted/70 sticky top-0 z-20 flex flex-col justify-center items-center"
                  title={`${slot.name} (${slot.start_time.substring(
                    0,
                    5
                  )}-${slot.end_time.substring(0, 5)})`}
                >
                  <span className="truncate block max-w-[150px]">
                    {slot.name}
                  </span>
                  <span className="text-muted-foreground/80 font-normal block">
                    {slot.start_time.substring(0, 5)} -{" "}
                    {slot.end_time.substring(0, 5)}
                  </span>
                </div>
              ))}
              {DAYS_OF_WEEK_STUDENT_TIMETABLE.map((dayIndex) => (
                <React.Fragment key={`row-${dayIndex}`}>
                  <div className="p-2.5 border-b border-r font-semibold text-sm text-center bg-muted/70 sticky left-0 z-20 flex items-center justify-center">
                    {tDays(DAY_KEYS_STUDENT_TIMETABLE[dayIndex])}
                  </div>
                  {schedulableTimeSlots.map((ts) => {
                    const cellKey = `cell-${dayIndex}-${ts.id}`;
                    const slotEntryForDayAndTime = scheduleEntries.find(
                      (entry) =>
                        entry.day_of_week === dayIndex &&
                        entry.time_slot.id === ts.id
                    );
                    return (
                      <div
                        key={cellKey}
                        className="border-b border-r p-1.5 min-h-[90px] flex flex-col justify-center items-center text-center bg-white"
                      >
                        {slotEntryForDayAndTime &&
                        slotEntryForDayAndTime.scheduled_subjects.length > 0 ? (
                          slotEntryForDayAndTime.scheduled_subjects.map(
                            (ss, idx) => (
                              <div
                                key={ss.id} // Use ss.id which is unique ScheduledClassSubject id
                                className="text-xs w-full mb-1 last:mb-0 py-0.5 px-1 rounded bg-green-50 border border-green-200"
                              >
                                <p
                                  className="font-semibold text-green-700 truncate"
                                  title={ss.class_subject.subject.name}
                                >
                                  {ss.class_subject.subject.name}
                                </p>
                                {ss.effective_teacher_name && (
                                  <p
                                    className="text-gray-600 truncate text-[0.65rem]"
                                    title={ss.effective_teacher_name}
                                  >
                                    T: {ss.effective_teacher_name}
                                  </p>
                                )}
                                {slotEntryForDayAndTime.notes && idx === 0 && (
                                  <p
                                    className="text-gray-500 italic truncate text-[0.65rem]"
                                    title={slotEntryForDayAndTime.notes}
                                  >
                                    {slotEntryForDayAndTime.notes}
                                  </p>
                                )}
                              </div>
                            )
                          )
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentTimetableTab;
