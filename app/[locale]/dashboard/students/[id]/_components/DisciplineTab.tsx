"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Added useQueryClient
import { useTranslations } from "next-intl";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";

// Icons
import {
  Loader2,
  AlertCircle,
  Calendar as CalendarIcon,
  ListFilter,
  RefreshCcw,
  Info,
  PlusCircle,
  AlertOctagon,
  Megaphone,
  NotebookText,
  Gavel,
  HelpCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  User,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

// UI Components
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
import { Skeleton } from "@/components/ui/skeleton";
import { DatePickerWithRange } from "./date-picker"; // Ensure this path is correct

// Import the modal component
import DisciplineRecordModal from "@/app/[locale]/dashboard/discipline/_components/DisciplineAddModal"; // Adjust path if needed

// Queries and Types
import { fetchStudentDisciplineRecords } from "@/queries/discipline";
import {
  PaginatedDisciplineResponse,
  DisciplineCategory,
  DisciplineSeverity,
  DisciplineRecord,
} from "@/types/discipline";
import {
  cn,
  formatDate,
  formatTime,
  getBackendErrorMessage,
} from "@/lib/utils";
import PaginationControls from "../../../results/_components/PaginationControls";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Filter choices - same as Management page, keep consistent
const CATEGORY_CHOICES: {
  value: DisciplineCategory | "all";
  labelKey: string;
}[] = [
  { value: "all", labelKey: "allCategories" },
  { value: "incident", labelKey: "incident" },
  { value: "merit", labelKey: "merit" },
  { value: "observation", labelKey: "observation" },
  { value: "sanction", labelKey: "sanction" },
  { value: "other", labelKey: "other" },
];

const SEVERITY_CHOICES: {
  value: DisciplineSeverity | "all";
  labelKey: string;
}[] = [
  { value: "all", labelKey: "allSeverities" },
  { value: "high", labelKey: "high" },
  { value: "medium", labelKey: "medium" },
  { value: "low", labelKey: "low" },
  { value: "info", labelKey: "info" },
  { value: "n/a", labelKey: "na" },
];

interface DisciplineTabProps {
  studentId: string; // Expect studentId as a string from URL usually
}

const DisciplineTab: React.FC<DisciplineTabProps> = ({ studentId }) => {
  const t = useTranslations("Discipline.Tab");
  const tCategory = useTranslations("Discipline.Category");
  const tSeverity = useTranslations("Discipline.Severity");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient(); // Get query client instance
  const { canEdit } = useCurrentUser();

  const defaultPageSize = 15; // Items per page for this tab

  // --- State ---
  const [filters, setFilters] = useState<{
    dateRange: DateRange | undefined;
    category: string;
    severity: string;
  }>({
    dateRange: (() => {
      // Default date range (e.g., last 90 days)
      const today = new Date();
      const pastDate = addDays(today, -90);
      return { from: pastDate, to: today };
    })(),
    category: "all",
    severity: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: defaultPageSize,
  });
  // State to control the Add/Edit Modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    recordId: number | null; // null for add, number for edit (if edit is added later)
  }>({ isOpen: false, recordId: null });

  // --- Derived filter values for the API query ---
  const filtersForQuery = useMemo(
    () => ({
      date_from: filters.dateRange?.from
        ? format(filters.dateRange.from, "yyyy-MM-dd")
        : undefined,
      date_to: filters.dateRange?.to
        ? format(filters.dateRange.to, "yyyy-MM-dd")
        : undefined,
      record_category:
        filters.category === "all" ? undefined : filters.category,
      severity: filters.severity === "all" ? undefined : filters.severity,
      // Default ordering for the student tab
      ordering: "-date_occurred,-created_at",
    }),
    [filters.dateRange, filters.category, filters.severity]
  );

  // --- Data Fetching ---
  const {
    data: disciplineResponse,
    isLoading,
    error,
    isError,
    isFetching, // Use isFetching for background loading indicators
    refetch,
  } = useQuery<PaginatedDisciplineResponse, Error>({
    // Query key includes all dependencies that should trigger a refetch
    queryKey: [
      "studentDiscipline",
      studentId,
      filtersForQuery,
      pagination.page,
      pagination.pageSize,
    ],
    queryFn: () =>
      fetchStudentDisciplineRecords({
        // Use the specific query function
        studentId,
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filtersForQuery, // Spread the derived filters
      }),
    enabled: !!studentId, // Ensure query runs only when studentId is available
    staleTime: 30 * 1000, // Data is considered fresh for 30 seconds
    keepPreviousData: true, // Show previous data while refetching in the background
  });

  // --- Derived data from response ---
  const records = disciplineResponse?.results ?? [];
  const totalRecords = disciplineResponse?.count ?? 0;
  const totalPages = Math.ceil(totalRecords / pagination.pageSize);

  // --- Handlers ---
  const handleFilterChange = useCallback(
    (name: keyof typeof filters, value: any) => {
      setFilters((prev) => ({ ...prev, [name]: value }));
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    const today = new Date();
    const pastDate = addDays(today, -90);
    setFilters({
      dateRange: { from: pastDate, to: today },
      category: "all",
      severity: "all",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    // refetch(); // Not strictly needed as query key change triggers refetch
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    // Scroll to top of the tab/card maybe?
    // document.getElementById('discipline-card')?.scrollTo(0, 0);
  }, []);

  // Handlers for the modal
  const handleOpenAddModal = useCallback(() => {
    setModalState({ isOpen: true, recordId: null }); // Open in 'add' mode
  }, []);

  const handleCloseModal = useCallback(
    (refresh: boolean = false) => {
      setModalState({ isOpen: false, recordId: null });
      if (refresh) {
        // Invalidate or refetch the query to show the new record
        queryClient.invalidateQueries({
          queryKey: ["studentDiscipline", studentId],
        });
        // refetch(); // Or explicitly refetch
      }
    },
    [queryClient, studentId]
  ); // Include dependencies

  // --- UI Helper Functions ---
  const getCategoryIcon = useCallback(
    (category?: DisciplineCategory): JSX.Element => {
      switch (category) {
        case "incident":
          return (
            <AlertOctagon
              className="h-4 w-4 text-destructive"
              aria-label={tCategory("incident")}
            />
          );
        case "merit":
          return (
            <Megaphone
              className="h-4 w-4 text-success"
              aria-label={tCategory("merit")}
            />
          );
        case "observation":
          return (
            <NotebookText
              className="h-4 w-4 text-blue-500"
              aria-label={tCategory("observation")}
            />
          );
        case "sanction":
          return (
            <Gavel
              className="h-4 w-4 text-orange-600"
              aria-label={tCategory("sanction")}
            />
          );
        default:
          return (
            <HelpCircle
              className="h-4 w-4 text-muted-foreground"
              aria-label={tCategory("other")}
            />
          );
      }
    },
    [tCategory]
  );

  const getSeverityIcon = useCallback(
    (severity?: DisciplineSeverity | null): JSX.Element => {
      switch (severity) {
        case "high":
          return (
            <SignalHigh
              className="h-4 w-4 text-destructive"
              aria-label={tSeverity("high")}
            />
          );
        case "medium":
          return (
            <SignalMedium
              className="h-4 w-4 text-orange-500"
              aria-label={tSeverity("medium")}
            />
          );
        case "low":
          return (
            <SignalLow
              className="h-4 w-4 text-yellow-500"
              aria-label={tSeverity("low")}
            />
          );
        case "info":
          return (
            <Info
              className="h-4 w-4 text-blue-500"
              aria-label={tSeverity("info")}
            />
          );
        default:
          return (
            <HelpCircle
              className="h-4 w-4 text-muted-foreground"
              aria-label={tSeverity("na")}
            />
          );
      }
    },
    [tSeverity]
  );

  // --- Sub-Components ---

  const FiltersHeader = () => (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between p-4 border-b bg-muted/40 print:hidden">
      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center flex-1">
        {/* Date Range Picker */}
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(value) => handleFilterChange("dateRange", value)}
            className="bg-background shadow-sm border-input h-9 text-sm w-[250px] sm:w-[270px]" // Adjust width
          />
        </div>
        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-background shadow-sm border-input text-sm h-9">
              <SelectValue placeholder={t("filterByCategory")} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_CHOICES.map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {tCategory(choice.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Severity Filter */}
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />{" "}
          {/* Changed Icon */}
          <Select
            value={filters.severity}
            onValueChange={(value) => handleFilterChange("severity", value)}
          >
            <SelectTrigger className="w-full sm:w-[150px] bg-background shadow-sm border-input text-sm h-9">
              <SelectValue placeholder={t("filterBySeverity")} />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_CHOICES.map((choice) => (
                <SelectItem key={choice.value} value={choice.value}>
                  {tSeverity(choice.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="flex items-center justify-end gap-2 flex-shrink-0 mt-3 lg:mt-0">
        {/* Reset Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilters}
          className="text-xs text-muted-foreground hover:text-foreground h-9 px-3"
          disabled={isFetching} // Disable while fetching
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
          {t("resetFilters")}
        </Button>
        {/* Add Record Button - TODO: Add Permission Check Here later */}
        <Button
          variant="default"
          size="sm"
          onClick={handleOpenAddModal}
          className="h-9 text-xs"
          disabled={isFetching || !canEdit} // Disable while fetching
        >
          <PlusCircle className="h-4 w-4 mr-1.5" />
          {t("addRecord")}
        </Button>
      </div>
    </div>
  );

  const RecordsTable = ({
    recordsData,
  }: {
    recordsData: DisciplineRecord[];
  }) => {
    // Initial Loading Skeleton
    if (isLoading && recordsData.length === 0) {
      return (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[110px] px-3 py-2.5">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="w-[180px] px-3 py-2.5">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="w-[100px] px-3 py-2.5">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="px-3 py-2.5 min-w-[250px]">
                  <Skeleton className="h-4 w-48" />
                </TableHead>
                <TableHead className="w-[150px] px-3 py-2.5">
                  <Skeleton className="h-4 w-28" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skel-disc-${index}`} className="animate-pulse">
                  {/* Add TableCells with Skeletons */}
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    // No Records Found Message
    if (recordsData.length === 0 && !isFetching) {
      return (
        <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/30">
          <AlertOctagon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <p>{t("noRecordsFound")}</p>
          <p className="text-xs mt-1">{t("noRecordsHint")}</p>
        </div>
      );
    }

    // Render the actual table
    return (
      <div className="border rounded-lg overflow-x-auto">
        {" "}
        {/* Allow horizontal scroll if needed */}
        <Table className="w-full min-w-[700px]">
          {" "}
          {/* Minimum width */}
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60 text-xs uppercase tracking-wider">
              <TableHead className="w-[110px] px-3 py-2">
                {t("tableDate")}
              </TableHead>
              <TableHead className="w-[180px] px-3 py-2">
                {t("tableType")}
              </TableHead>
              <TableHead className="w-[100px] px-3 py-2">
                {t("tableSeverity")}
              </TableHead>
              <TableHead className="px-3 py-2 min-w-[250px]">
                {t("tableDescription")}
              </TableHead>
              <TableHead className="w-[150px] px-3 py-2">
                {t("tableReportedBy")}
              </TableHead>
              {/* Add Actions column if needed later for edit/delete */}
              {/* <TableHead className="w-[80px] px-3 py-2 text-center">{tCommon("actions")}</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordsData.map((record) => (
              <TableRow key={record.id} className="text-sm hover:bg-muted/30">
                {/* Date Cell */}
                <TableCell className="px-3 py-2 whitespace-nowrap align-top">
                  <div>{formatDate(record.date_occurred)}</div>
                  {record.time_occurred && (
                    <div className="text-xs text-muted-foreground">
                      {formatTime(record.time_occurred)}
                    </div>
                  )}
                </TableCell>
                {/* Type/Category Cell */}
                <TableCell className="px-3 py-2 align-top">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(record.record_category)}
                    <span className="font-medium">
                      {record.record_type_name || "N/A"}
                    </span>
                    {/* Indicator for positive/negative (based on type) */}
                    {record.is_positive_record ? (
                      <ThumbsUp
                        className="h-3.5 w-3.5 text-success opacity-80"
                        title={t("positiveRecordTooltip")}
                      />
                    ) : (
                      <ThumbsDown
                        className="h-3.5 w-3.5 text-destructive opacity-70"
                        title={t("negativeRecordTooltip")}
                      />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize ml-6">
                    {record.record_category_display ||
                      record.record_category ||
                      "N/A"}
                  </div>
                </TableCell>
                {/* Severity Cell */}
                <TableCell className="px-3 py-2 align-top">
                  <Badge
                    variant={
                      record.severity === "high"
                        ? "destructive"
                        : record.severity === "medium"
                          ? "warning"
                          : "outline"
                    }
                    className={cn(
                      "capitalize text-xs flex items-center gap-1",
                      record.severity === "info" &&
                        "bg-blue-100 text-blue-800 border-blue-300"
                    )}
                    title={record.severity_display || tSeverity("unknown")}
                  >
                    {getSeverityIcon(record.severity)}
                    {record.severity_display || tSeverity("unknown")}
                  </Badge>
                </TableCell>
                {/* Description/Action Cell */}
                <TableCell className="px-3 py-2 text-xs leading-relaxed align-top">
                  {/* Main Description */}
                  <p
                    className="text-foreground font-medium"
                    title={record.description}
                  >
                    {record.description || (
                      <span className="text-muted-foreground italic">
                        {tCommon("none")}
                      </span>
                    )}
                  </p>
                  {/* Action Taken (if present) */}
                  {record.action_taken && (
                    <div className="mt-1.5 pt-1.5 border-t border-dashed text-muted-foreground italic">
                      <p className="flex items-start gap-1.5">
                        <span className="font-semibold text-foreground">
                          {t("tableActionTaken")}:
                        </span>
                        <span className="flex-1" title={record.action_taken}>
                          {record.action_taken}
                        </span>
                      </p>
                    </div>
                  )}
                </TableCell>
                {/* Reported By Cell */}
                <TableCell className="px-3 py-2 text-muted-foreground text-xs align-top">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 flex-shrink-0" />
                    {record.reported_by_name || tCommon("system")}
                  </div>
                  {/* Timestamp of creation */}
                  <div
                    className="text-[11px] mt-0.5 opacity-80"
                    title={`${tCommon("recordedOn")} ${formatDate(
                      record.created_at,
                      true
                    )}`}
                  >
                    {formatDate(record.created_at)}{" "}
                    {/* Show only date by default */}
                  </div>
                </TableCell>
                {/* Actions Cell Placeholder */}
                {/* <TableCell className="px-3 py-2 text-center align-top"> ... Edit/Delete buttons ... </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // --- Main Render ---

  // Error state for the main query
  if (isError && !isLoading) {
    // Show error only if not in initial loading state
    return (
      <Card
        className="bg-destructive/5 border-destructive shadow-sm"
        id="discipline-card"
      >
        <FiltersHeader /> {/* Still show filters potentially */}
        <div className="p-6 text-center flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-semibold text-destructive">{t("errorTitle")}</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {getBackendErrorMessage(error) || t("errorMessage")}
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

  // --- Main Component Structure ---
  return (
    <>
      <Card
        className="bg-background border shadow-sm overflow-hidden relative"
        id="discipline-card"
      >
        {/* Loading overlay for background fetching */}
        {isFetching &&
          !isLoading && ( // Show overlay only during refetch, not initial load
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

        {/* Filters */}
        <FiltersHeader />

        {/* Table and Pagination Container */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Records Table */}
          <RecordsTable recordsData={records} />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center print:hidden">
              <PaginationControls
                currentPage={pagination.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                // Pass other props if your PaginationControls component needs them
                // e.g., totalItems={totalRecords}, itemsPerPage={pagination.pageSize}
              />
            </div>
          )}
        </div>
      </Card>

      {/* --- Add/Edit Modal --- */}
      {/* Render the modal, controlling its state */}
      <DisciplineRecordModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        recordId={modalState.recordId} // Pass null for adding
        studentId={studentId}
      />
    </>
  );
};

export default DisciplineTab;
