"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { fetchClassWeeklyAttendance } from "@/queries/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  RefreshCw,
  Calendar,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Check,
  Clock,
  X,
  FileText,
  Edit,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { exportAttendanceToPDF } from "@/lib/utils";
import RecordAttendanceDialog from "../record-attendance/page";
import { useRecordAttendance } from "./use-record-attendance";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const statusColors = {
  present: "bg-emerald-500 text-white",
  absent: "bg-rose-500 text-white",
  late: "bg-amber-500 text-white",
  excused: "bg-blue-500 text-white",
};

const statusIcons = {
  present: <Check className="h-3 w-3" />,
  absent: <X className="h-3 w-3" />,
  late: <Clock className="h-3 w-3" />,
  excused: <FileText className="h-3 w-3" />,
};

const WeeklyAttendanceTab = ({ classId, className = "", schoolData = {} }) => {
  const t = useTranslations("attendance");
  const [weekStart, setWeekStart] = useState(undefined);
  const { canEdit } = useCurrentUser();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["attendance", "weekly", classId, weekStart],
    queryFn: () =>
      fetchClassWeeklyAttendance(classId, { week_start: weekStart }),
  });

  const {
    isDialogOpen,
    setIsDialogOpen,
    selectedDate,
    openCreateDialog,
    openEditDialog,
    extractStudentsFromWeeklyData,
  } = useRecordAttendance(classId);

  const handlePrevWeek = () => {
    if (data) setWeekStart(data.navigation.prev_week);
  };

  const handleNextWeek = () => {
    if (data) setWeekStart(data.navigation.next_week);
  };

  const handleCurrentWeek = () => {
    setWeekStart(data?.navigation.current_week);
  };

  const canNavigateNext = data
    ? parseISO(data.navigation.next_week) <= new Date()
    : false;

  const formatDateForDisplay = (dateString) => {
    const date = parseISO(dateString);
    return {
      day: format(date, "EEE"),
      date: format(date, "MMM d"),
    };
  };

  const handleExportPDF = () => {
    if (!data) return;

    // Calculate actual school days with attendance data
    const datesWithRecords = data.week.dates.filter((date) => {
      // Check if at least one student has attendance data for this date
      return data.students.some((student) => student.attendance[date]);
    });

    const exportData = data.students.map((student, index) => {
      const rowData = {
        SN: index + 1,
        Name: student.name,
        "Student ID": student.matricule,
        "Attendance Rate": `${student.summary.attendance_rate}%`,
      };

      data.week.dates.forEach((date) => {
        const formattedDate = format(parseISO(date), "MMM d");
        const record = student.attendance[date];
        rowData[formattedDate] = record ? record.status : "-";
      });

      rowData["Present"] = student.summary.present;
      rowData["Absent"] = student.summary.absent;
      rowData["Late"] = student.summary.late;
      rowData["Excused"] = student.summary.excused;

      return rowData;
    });

    const weekStartDate = parseISO(data.week.start);
    const weekEndDate = parseISO(data.week.end);
    const dateRangeForFilename = `${format(weekStartDate, "MMM-d")}_to_${format(
      weekEndDate,
      "MMM-d-yyyy"
    )}`;

    const schoolInfo = {
      name: schoolData?.name || "School Name",
      active_academic_year:
        schoolData?.active_academic_year || "Current Academic Year",
      email: schoolData?.email || "",
      city: schoolData?.city || "",
    };

    const pdfTitle = `${data.class_name} - Weekly Attendance (${format(
      weekStartDate,
      "MMMM d"
    )} - ${format(weekEndDate, "MMMM d, yyyy")})`;

    exportAttendanceToPDF(
      exportData,
      `Attendance_${data.class_name}_${dateRangeForFilename}`,
      pdfTitle,
      schoolInfo
    );
  };

  // Handle edit attendance for a specific date
  const handleEditAttendance = (date) => {
    if (data) {
      openEditDialog(date, data);
    }
  };

  // Check if a date has recorded attendance
  const hasRecordedAttendance = (date) => {
    if (!data?.students) return false;
    return data.students.some((student) => student.attendance[date]);
  };

  const handleDialogSuccess = () => {
    // Refetch data after successful save
    refetch();
  };

  if (isLoading) return <AttendanceLoadingSkeleton />;

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            {t("errorLoadingAttendance")}
          </h2>
          <p className="text-sm text-red-600 mb-4">{t("errorTryAgain")}</p>
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate actual school days with attendance data
  const datesWithRecords = data.week.dates.filter((date) => {
    // Check if at least one student has attendance data for this date
    return data.students.some((student) => student.attendance[date]);
  });

  // Recalculate attendance rates based only on days with records
  const recalculatedStudents = data.students.map((student) => {
    // Create a copy of the student to avoid mutating the original data
    const updatedStudent = { ...student };

    if (datesWithRecords.length > 0) {
      // Count the statuses only for dates that have records
      let presentCount = 0;
      let totalRecords = 0;

      datesWithRecords.forEach((date) => {
        if (student.attendance[date]) {
          totalRecords++;
          if (student.attendance[date].status === "present") {
            presentCount++;
          }
        }
      });

      // Calculate the updated attendance rate
      updatedStudent.summary = {
        ...student.summary,
        attendance_rate:
          totalRecords > 0
            ? Math.round((presentCount / totalRecords) * 100)
            : 100, // Default to 100% if no records exist
      };
    }

    return updatedStudent;
  });

  // Recalculate class attendance summary
  const totalPossibleRecords =
    datesWithRecords.length > 0
      ? data.summary.total_students * datesWithRecords.length
      : 0;

  // Count total present records across all students for dates with records
  let totalPresentRecords = 0;
  let totalRecordedAttendances = 0;

  recalculatedStudents.forEach((student) => {
    datesWithRecords.forEach((date) => {
      if (student.attendance[date]) {
        totalRecordedAttendances++;
        if (student.attendance[date].status === "present") {
          totalPresentRecords++;
        }
      }
    });
  });

  const updatedClassAttendanceRate =
    totalRecordedAttendances > 0
      ? Math.round((totalPresentRecords / totalRecordedAttendances) * 100)
      : 100; // Default to 100% if no records

  const weekStartDate = parseISO(data.week.start);
  const weekEndDate = parseISO(data.week.end);
  const dateRangeDisplay = `${format(weekStartDate, "MMMM d")} - ${format(
    weekEndDate,
    "MMMM d, yyyy"
  )}`;

  const missingPercentage =
    totalPossibleRecords > 0
      ? (data.summary.missing_records / totalPossibleRecords) * 100
      : 0;

  const students = extractStudentsFromWeeklyData(data);

  // Sort students alphabetically by name before rendering
  const sortedStudents = [...recalculatedStudents].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className={`space-y-5 ${className}`}>
      <RecordAttendanceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        classId={classId}
        className={data.class_name}
        students={sortedStudents}
        date={selectedDate}
        onSuccess={handleDialogSuccess}
        AcademicYear={schoolData.active_academic_year}
      />
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-semibold">
                  {t("weeklyAttendance")}
                </CardTitle>
              </div>
              <p className="text-gray-500">
                {dateRangeDisplay} • {data.class_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevWeek}
                className="h-9 px-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("prevWeek")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentWeek}
                className="h-9 px-3"
              >
                {t("currentWeek")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                disabled={!canNavigateNext}
                className="h-9 px-3"
              >
                {t("nextWeek")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-1.5">
              <Button
                className="gap-2"
                onClick={openCreateDialog}
                disabled={!canEdit}
              >
                <ClipboardCheck className="h-4 w-4" />
                {t("recordAttendance")}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportPDF}
              >
                <Download className="h-4 w-4" />
                {t("exportPDF")}
              </Button>
            </div>
            <span className="text-sm text-gray-500">
              {t("attendanceRateClass")}:
              <Badge
                variant={
                  updatedClassAttendanceRate >= 90
                    ? "success"
                    : updatedClassAttendanceRate >= 80
                      ? "outline"
                      : "destructive"
                }
                className="ml-2"
              >
                {updatedClassAttendanceRate}%
              </Badge>
            </span>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* summary cards */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                {t("totalStudents")}
              </p>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mt-2">
              {data.summary.total_students}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {t("totalDays")}: {datesWithRecords.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                {t("present")}
              </p>
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-2 text-emerald-600">
              {totalPresentRecords}
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    (totalPresentRecords / totalRecordedAttendances) * 100
                  }%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{t("absent")}</p>
              <div className="h-8 w-8 bg-rose-100 rounded-full flex items-center justify-center">
                <X className="h-4 w-4 text-rose-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-2 text-rose-600">
              {data.summary.absent}
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
              <div
                className="bg-rose-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    (data.summary.absent / totalRecordedAttendances) * 100
                  }%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{t("late")}</p>
              <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-2 text-amber-600">
              {data.summary.late}
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    (data.summary.late / totalRecordedAttendances) * 100
                  }%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                {t("missing")}
              </p>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mt-2 text-gray-600">
              {data.summary.missing_records}
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
              <div
                className="bg-gray-400 h-1.5 rounded-full"
                style={{ width: `${missingPercentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  {/* Add new column for student number */}
                  <TableHead className="sticky left-0 bg-gray-50 z-20 w-12 text-center">
                    #
                  </TableHead>
                  <TableHead className="sticky left-12 bg-gray-50 z-20 w-60">
                    {t("student")}
                  </TableHead>
                  {data.week.dates.map((date) => {
                    const { day, date: dateDisplay } =
                      formatDateForDisplay(date);
                    const hasAttendance = hasRecordedAttendance(date);
                    return (
                      <TableHead
                        key={date}
                        className="text-center min-w-[100px] py-3" // Increased vertical padding
                      >
                        <div className="font-medium flex items-center justify-center gap-1">
                          {day}
                          {/* Add edit button if this date has attendance records */}
                          {hasAttendance && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-6 w-6 p-0 ml-1 rounded-full hover:bg-gray-200"
                              onClick={() => handleEditAttendance(date)}
                              title={t("editAttendance")}
                            >
                              <Edit className="h-3 w-3 text-gray-500" />
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dateDisplay}
                        </div>
                      </TableHead>
                    );
                  })}
                  <TableHead className="text-right px-6">
                    {t("attendanceRate")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.map((student, index) => (
                  <TableRow
                    key={student.student_id}
                    className="hover:bg-gray-50"
                  >
                    {/* Add new cell for student number */}
                    <TableCell className="sticky left-0 bg-white group-hover:bg-gray-50 text-center font-medium text-gray-500 w-12 border-r px-2">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium sticky left-12 bg-white group-hover:bg-gray-50 border-r">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-gray-500 font-mono">
                        {student.matricule}
                      </div>
                    </TableCell>
                    {data.week.dates.map((date) => {
                      const record = student.attendance[date];
                      return (
                        <TableCell
                          key={date}
                          className="text-center p-2 min-w-[100px]"
                        >
                          {record ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex justify-center">
                                    <span
                                      className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                        statusColors[record.status]
                                      }`}
                                    >
                                      {statusIcons[record.status]}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-center">
                                    <p className="font-medium">
                                      {t(record.status)}
                                    </p>
                                    {record.remarks && (
                                      <p className="text-xs mt-1 max-w-[200px]">
                                        {record.remarks}
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <div className="h-9 w-9 rounded-full border border-dashed border-gray-300 mx-auto" />
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right px-6">
                      <Badge
                        variant={
                          student.summary.attendance_rate >= 90
                            ? "success"
                            : student.summary.attendance_rate >= 80
                              ? "outline"
                              : "destructive"
                        }
                        className="ml-auto"
                      >
                        {student.summary.attendance_rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-4">
        <Card className="inline-flex px-4 py-3 border-0 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="text-sm font-medium text-gray-700 mr-2">
              {t("legend")}:
            </div>
            <div className="flex items-center space-x-1">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.present}`}
              >
                {statusIcons.present}
              </span>
              <span className="text-sm">{t("present")}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.absent}`}
              >
                {statusIcons.absent}
              </span>
              <span className="text-sm">{t("absent")}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.late}`}
              >
                {statusIcons.late}
              </span>
              <span className="text-sm">{t("late")}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.excused}`}
              >
                {statusIcons.excused}
              </span>
              <span className="text-sm">{t("excused")}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const AttendanceLoadingSkeleton = () => (
  <div className="space-y-5">
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-5 w-32" />
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mt-2" />
            <Skeleton className="h-1.5 w-full mt-3 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="bg-white border-0 shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
    <div className="flex justify-end mt-4">
      <Skeleton className="h-12 w-80" />
    </div>
  </div>
);

export default WeeklyAttendanceTab;
