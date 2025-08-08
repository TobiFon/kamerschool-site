// src/app/[locale]/dashboard/students/[id]/_components/AttendanceTab.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { DateRange } from "react-day-picker";
import {
  Loader2,
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  ListFilter,
  RefreshCcw,
  Info,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { fetchStudentAttendance } from "@/queries/students";
import {
  StudentAttendanceResponse,
  AttendanceStatus,
  AttendanceRecord,
  AttendanceSummary,
} from "@/types/students";
import { cn, formatDate } from "@/lib/utils";
import { addDays, format, isValid } from "date-fns"; // 1. Import 'isValid' from date-fns
import { DatePickerWithRange } from "./date-picker";
import PaginationControls from "../../../results/_components/TermResultsComponents/PaginationControls";

// Define valid status choices matching the backend model
const STATUS_CHOICES: { value: AttendanceStatus | "all"; labelKey: string }[] =
  [
    { value: "all", labelKey: "allStatuses" },
    { value: "present", labelKey: "present" },
    { value: "absent", labelKey: "absent" },
    { value: "late", labelKey: "late" },
    { value: "excused", labelKey: "excused" },
  ];

interface AttendanceTabProps {
  studentId: string;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ studentId }) => {
  const t = useTranslations("Attendance.Tab");
  const tStatus = useTranslations("Attendance.Status");
  const tCommon = useTranslations("Common");

  const defaultPageSize = 15;

  // State for filters and pagination
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const pastDate = addDays(today, -30);
    return { from: pastDate, to: today };
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Derived filter values for the query
  const filtersForQuery = useMemo(() => {
    // 2. More robustly check if the dates are valid before formatting
    const date_from =
      dateRange?.from && isValid(dateRange.from)
        ? format(dateRange.from, "yyyy-MM-dd")
        : null;
    const date_to =
      dateRange?.to && isValid(dateRange.to)
        ? format(dateRange.to, "yyyy-MM-dd")
        : null;

    return {
      date_from,
      date_to,
      status: statusFilter === "all" ? null : statusFilter,
    };
  }, [dateRange, statusFilter]);

  // ... (the rest of your component code remains unchanged)
  // Fetch attendance data
  const {
    data: attendanceResponse,
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
  } = useQuery<StudentAttendanceResponse, Error>({
    queryKey: [
      "studentAttendance",
      studentId,
      filtersForQuery,
      currentPage,
      pageSize,
    ],
    queryFn: () =>
      fetchStudentAttendance({
        studentId,
        page: currentPage,
        pageSize: pageSize,
        ...filtersForQuery,
      }),
    enabled: !!studentId,
    staleTime: 30 * 1000,
    retry: 1,
    keepPreviousData: true,
  });

  // Derived data
  const attendanceRecords = attendanceResponse?.results ?? [];
  const summary = attendanceResponse?.summary;
  const totalRecords = attendanceResponse?.count ?? 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Filter handlers
  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const today = new Date();
    const pastDate = addDays(today, -30);
    setDateRange({ from: pastDate, to: today });
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // --- UI Components ---
  const FiltersHeader = () => (
    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between p-4 border-b bg-muted/40">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <DatePickerWithRange
            date={dateRange}
            onDateChange={handleDateChange}
            className="bg-background shadow-sm border-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background shadow-sm border-input text-sm h-9">
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_CHOICES.map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {tStatus(choice.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleResetFilters}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
        {t("resetFilters")}
      </Button>
    </div>
  );

  const SummarySection = ({
    summaryData,
  }: {
    summaryData?: AttendanceSummary | null;
  }) => {
    if (!summaryData) return null;

    const getRateColor = (rate: number | null) => {
      if (rate === null) return "text-muted-foreground";
      if (rate >= 95) return "text-success";
      if (rate >= 85) return "text-warning";
      return "text-destructive";
    };

    return (
      <Card className="mb-6 border-dashed border-primary/20 bg-primary/5">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            {t("summaryTitle")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("summaryPeriod", {
              from: summaryData.filters_applied.date_from
                ? formatDate(summaryData.filters_applied.date_from)
                : tCommon("start"),
              to: summaryData.filters_applied.date_to
                ? formatDate(summaryData.filters_applied.date_to)
                : tCommon("end"),
            })}
            {summaryData.filters_applied.status &&
              ` (${tStatus(summaryData.filters_applied.status)})`}
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
            <SummaryItem
              icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
              label={t("attendanceRate")}
              value={`${summaryData.attendance_rate?.toFixed(1) ?? "--"}%`}
              valueClass={getRateColor(summaryData.attendance_rate)}
            />
            <SummaryItem
              icon={<CheckCircle className="h-5 w-5 text-success" />}
              label={tStatus("present")}
              value={summaryData.present}
            />
            <SummaryItem
              icon={<XCircle className="h-5 w-5 text-destructive" />}
              label={tStatus("absent")}
              value={summaryData.absent}
            />
            <SummaryItem
              icon={<Clock className="h-5 w-5 text-warning" />}
              label={tStatus("late")}
              value={summaryData.late}
            />
            <SummaryItem
              icon={<ShieldCheck className="h-5 w-5 text-blue-500" />}
              label={tStatus("excused")}
              value={summaryData.excused}
            />
            <SummaryItem
              icon={<CalendarIcon className="h-5 w-5 text-muted-foreground" />}
              label={t("recordedDays")}
              value={summaryData.days_with_records_in_period}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const SummaryItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    valueClass?: string;
  }> = ({ icon, label, value, valueClass }) => (
    <div className="bg-background p-3 rounded-lg border shadow-sm flex flex-col items-center justify-center">
      <div className="mb-1.5">{icon}</div>
      <span className={cn("text-xl font-bold tabular-nums", valueClass)}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );

  const RecordsTable = ({ records }: { records: AttendanceRecord[] }) => {
    const getStatusBadgeVariant = (
      status: AttendanceStatus
    ): "success" | "destructive" | "warning" | "info" | "secondary" => {
      switch (status) {
        case "present":
          return "success";
        case "absent":
          return "destructive";
        case "late":
          return "warning";
        case "excused":
          return "info";
        default:
          return "secondary";
      }
    };

    if (records.length === 0 && !isFetching) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <Info className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          {t("noRecordsFound")}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60">
              <TableHead className="w-[120px] px-3 py-2.5">
                {t("tableDate")}
              </TableHead>
              <TableHead className="w-[120px] text-center px-3 py-2.5">
                {t("tableStatus")}
              </TableHead>
              <TableHead className="px-3 py-2.5 min-w-[200px]">
                {t("tableRemarks")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || (isFetching && records.length === 0)
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skel-${index}`} className="animate-pulse">
                    <TableCell className="px-3 py-3">
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <div className="h-6 w-20 bg-muted rounded-full mx-auto"></div>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </TableCell>
                  </TableRow>
                ))
              : records.map((record) => (
                  <TableRow
                    key={record.id}
                    className="text-sm hover:bg-muted/30"
                  >
                    <TableCell className="font-medium px-3 py-2 whitespace-nowrap">
                      {/* 3. Added a check here for extra safety */}
                      {record.date ? formatDate(record.date) : "—"}
                    </TableCell>
                    <TableCell className="text-center px-3 py-2">
                      <Badge
                        variant={getStatusBadgeVariant(record.status)}
                        className="capitalize text-xs px-2.5 py-0.5"
                      >
                        {tStatus(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground px-3 py-2 text-xs italic">
                      {record.remarks || "-"}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading && !attendanceResponse && !isError) {
    return (
      <Card className="bg-background border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between p-4 border-b bg-muted/40 animate-pulse">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
            <div className="h-9 w-60 bg-muted rounded"></div>
            <div className="h-9 w-44 bg-muted rounded"></div>
          </div>
          <div className="h-8 w-24 bg-muted rounded"></div>
        </div>
        <div className="p-4 mb-6 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="p-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-full mb-2"></div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded w-full mb-1.5"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-destructive/5 border-destructive shadow-sm">
        <FiltersHeader />
        <div className="p-6 text-center flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-semibold text-destructive">{t("errorTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {error?.message || t("errorMessage")}
          </p>
          <Button
            variant="destructive"
            outline
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {tCommon("retry")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-background border shadow-sm overflow-hidden">
      <FiltersHeader />
      <div className="p-4 md:p-6">
        {summary && <SummarySection summaryData={summary} />}
        <RecordsTable records={attendanceRecords} />
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
      {isFetching && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </Card>
  );
};

export default AttendanceTab;
