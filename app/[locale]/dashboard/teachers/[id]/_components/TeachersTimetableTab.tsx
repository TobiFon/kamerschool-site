// src/app/[locale]/dashboard/teachers/[id]/_components/TeacherTimetableTab.tsx
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

import { Teacher } from "@/types/teachers";
import { AcademicYear } from "@/types/transfers";
import {
  TeacherScheduleEntry,
  TimeSlot,
  PaginatedTeacherScheduleResponse, // Keep this as the API returns this structure
} from "@/types/timetable";

import { fetchTeacherSchedule, fetchTimeSlots } from "@/queries/timetable";
import { fetchAcademicYears } from "@/queries/results";
import { getBackendErrorMessage } from "@/lib/utils";
import { fetchSchool } from "@/lib/auth";
import { School } from "@/types/auth";
import { fetchTeacher } from "@/queries/teachers";
import {
  exportTeacherTimetableToPDF,
  SchoolDataForTeacherPdf,
  TeacherTimetablePdfLabels,
} from "@/lib/timetablepdf";

const DAYS_OF_WEEK_TIMETABLE = [0, 1, 2, 3, 4, 5];
const DAY_KEYS_TIMETABLE = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface TeacherTimetableTabProps {
  teacherId: string;
}

const TeacherTimetableTab: React.FC<TeacherTimetableTabProps> = ({
  teacherId,
}) => {
  const t = useTranslations("Teachers.TimetableTab");
  const tDays = useTranslations("Days");
  const tCommon = useTranslations("Common");
  const tPdfLabels = useTranslations("PdfUtils.teacherTimetable");

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<
    string | undefined
  >(undefined);

  const { data: schoolApiData, isLoading: isLoadingSchool } = useQuery<
    School,
    Error
  >({
    queryKey: ["currentSchoolDataForTimetable"],
    queryFn: fetchSchool,
    staleTime: Infinity,
  });
  const schoolIdForQueries = schoolApiData?.id;

  const { data: teacherDetails, isLoading: isLoadingTeacherDetails } = useQuery<
    Teacher,
    Error
  >({
    queryKey: ["teacherDetailsForPdf", teacherId],
    queryFn: () => fetchTeacher(teacherId),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: academicYearsData, isLoading: isLoadingAcademicYears } =
    useQuery<AcademicYear[], Error>({
      queryKey: ["academicYearsForTimetable"],
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
    queryKey: ["allTimeSlotsForSchool", schoolIdForQueries],
    queryFn: () =>
      fetchTimeSlots({
        school_id: schoolIdForQueries,
        ordering: "order,start_time",
        pageSize: 200, // Assuming this gets all non-paginated slots
      }).then((res) => res.results),
    enabled: !!schoolIdForQueries,
    staleTime: 60 * 60 * 1000,
  });
  const timeSlots = timeSlotsData || [];

  const teacherScheduleQueryKey = useMemo(
    () => ["teacherSchedule", teacherId, selectedAcademicYearId],
    [teacherId, selectedAcademicYearId]
  );

  const {
    data: paginatedScheduleData, // This holds the { count, next, previous, results } object
    isLoading: isLoadingScheduleData,
    isError: isErrorSchedule,
    error: errorSchedule,
    isFetching: isFetchingSchedule,
  } = useQuery<PaginatedTeacherScheduleResponse, Error>({
    queryKey: teacherScheduleQueryKey,
    queryFn: () => {
      return fetchTeacherSchedule({
        teacher_id: teacherId,
        academic_year_id: selectedAcademicYearId!,
      });
    },
    enabled: !!teacherId && !!selectedAcademicYearId && !!schoolIdForQueries,
  });

  const scheduleEntries = useMemo(() => {
    // Safely extract the results array
    return paginatedScheduleData?.results || [];
  }, [paginatedScheduleData]);

  const isPrimaryLoading =
    isLoadingSchool ||
    isLoadingAcademicYears ||
    isLoadingTimeSlots ||
    isLoadingTeacherDetails;
  const isContentLoading =
    isLoadingScheduleData && paginatedScheduleData === undefined;

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
      !teacherDetails ||
      !selectedAcademicYearId ||
      !schoolApiData ||
      !academicYears.length ||
      schedulableTimeSlots.length === 0 ||
      scheduleEntries.length === 0 // scheduleEntries is now an array
    ) {
      toast.error(t("errorPdfDataMissing"));
      return;
    }
    const currentAcademicYear = academicYears.find(
      (ay) => String(ay.id) === selectedAcademicYearId
    );
    if (!currentAcademicYear) {
      toast.error(t("errorPdfDataMissing"));
      return;
    }
    const schoolDataForPdf: SchoolDataForTeacherPdf = {
      name: schoolApiData.name,
    };
    const pdfLabels: TeacherTimetablePdfLabels = {
      schoolNamePlaceholder: tPdfLabels("schoolNamePlaceholder"),
      academicYearPrefix: tPdfLabels("academicYearPrefix"),
      teacherScheduleForPrefix: tPdfLabels("teacherScheduleForPrefix"),
      dayHeader: tPdfLabels("dayHeader"),
      noActivity: tPdfLabels("noActivity"),
      pagePdf: (current, total) => tCommon("pagePdf", { current, total }),
      generatedOn: (date) => tCommon("generatedOn", { date }),
      pdfFileNamePrefix: tPdfLabels("pdfFileNamePrefix"),
      days: {
        0: tDays(DAY_KEYS_TIMETABLE[0]),
        1: tDays(DAY_KEYS_TIMETABLE[1]),
        2: tDays(DAY_KEYS_TIMETABLE[2]),
        3: tDays(DAY_KEYS_TIMETABLE[3]),
        4: tDays(DAY_KEYS_TIMETABLE[4]),
        5: tDays(DAY_KEYS_TIMETABLE[5]),
      },
    };
    exportTeacherTimetableToPDF(
      teacherDetails,
      scheduleEntries,
      schedulableTimeSlots,
      currentAcademicYear.name,
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
    teacherDetails &&
    selectedAcademicYearId &&
    academicYears.length > 0 &&
    schoolApiData &&
    scheduleEntries.length > 0 &&
    !isFetchingSchedule;

  return (
    <Card className="shadow-md relative">
      {isFetchingSchedule && !isContentLoading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <CardHeader className="border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select
            value={selectedAcademicYearId}
            onValueChange={setSelectedAcademicYearId}
            disabled={
              isLoadingAcademicYears ||
              academicYears.length === 0 ||
              isFetchingSchedule
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
            disabled={!canPrint || isLoadingTeacherDetails}
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
        ) : isErrorSchedule ? (
          <div className="text-center py-10 text-destructive-foreground bg-destructive/10 p-6 rounded-md">
            <AlertCircle className="mx-auto h-12 w-12 mb-3" />
            <p className="font-semibold">{tCommon("errorTitle")}</p>
            <p>
              {getBackendErrorMessage(errorSchedule) ||
                tCommon("fetchErrorGeneric")}
            </p>
          </div>
        ) : isContentLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : scheduleEntries.length === 0 && !isFetchingSchedule ? (
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
              {DAYS_OF_WEEK_TIMETABLE.map((dayIndex) => (
                <React.Fragment key={`row-${dayIndex}`}>
                  <div className="p-2.5 border-b border-r font-semibold text-sm text-center bg-muted/70 sticky left-0 z-20 flex items-center justify-center">
                    {tDays(DAY_KEYS_TIMETABLE[dayIndex])}
                  </div>
                  {schedulableTimeSlots.map((ts) => {
                    const cellKey = `cell-${dayIndex}-${ts.id}`;
                    const entriesInSlot = scheduleEntries.filter(
                      // scheduleEntries is now guaranteed to be an array
                      (entry) =>
                        entry.day_of_week === dayIndex &&
                        entry.time_slot_name === ts.name &&
                        entry.start_time.substring(0, 5) ===
                          ts.start_time.substring(0, 5) &&
                        entry.end_time.substring(0, 5) ===
                          ts.end_time.substring(0, 5)
                    );
                    return (
                      <div
                        key={cellKey}
                        className="border-b border-r p-1.5 min-h-[90px] flex flex-col justify-center items-center text-center bg-white"
                      >
                        {entriesInSlot.length > 0 ? (
                          entriesInSlot.map((entry, idx) => (
                            <div
                              key={idx}
                              className="text-xs w-full mb-1 last:mb-0 py-0.5 px-1 rounded bg-blue-50 border border-blue-200"
                            >
                              <p
                                className="font-semibold text-blue-700 truncate"
                                title={entry.subject_name}
                              >
                                {entry.subject_name}
                              </p>
                              <p
                                className="text-gray-600 truncate"
                                title={entry.school_class_name}
                              >
                                {entry.school_class_name}
                              </p>
                              {entry.slot_notes && (
                                <p
                                  className="text-gray-500 italic truncate text-[0.65rem]"
                                  title={entry.slot_notes}
                                >
                                  {entry.slot_notes}
                                </p>
                              )}
                            </div>
                          ))
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

export default TeacherTimetableTab;
