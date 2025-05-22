// src/app/[locale]/dashboard/students/[id]/_components/ResultsTab.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Loader2,
  AlertCircle,
  ArrowUpDown,
  BarChart3,
  CalendarRange,
  TrendingUp,
  TrendingDown,
  Archive,
  RefreshCw,
  BookOpen,
  UserSquare,
  Target,
  Download,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { fetchStudentDetailedResults } from "@/queries/students";
import { StudentDetailedResultsResponse, Student } from "@/types/students";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  fetchAcademicYears,
  fetchStudentHistoricalSequences,
  fetchTerms,
  // Removed: fetchSequences (admin-centric, replaced by fetchStudentHistoricalSequences)
} from "@/queries/results";
import { fetchSchool } from "@/lib/auth"; // For export
import { exportReportCardToPDF } from "@/lib/exportReportCard";
import { cn } from "@/lib/utils";
import { School } from "@/types/auth";
import { Sequence } from "@/types/results"; // Ensure correct types
import { AcademicYear } from "@/types/transfers";

interface ResultsTabProps {
  studentData: Student | null | undefined;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ studentData }) => {
  const t = useTranslations("Results.Tab");
  const tCommon = useTranslations("Common");
  const tStatus = useTranslations("Status");
  const tSummary = useTranslations("Results.Summary");
  const tFilters = useTranslations("Results.Filters");
  const tSubjects = useTranslations("Results.Subjects");
  const tExport = useTranslations("Export");

  const params = useParams();
  const studentId = params.id as string;

  const [filters, setFilters] = useState<{
    academicYearId: string | null;
    termId: string | null;
    sequenceId: string | null;
  }>({
    academicYearId: null,
    termId: null,
    sequenceId: null,
  });

  const [sortColumn, setSortColumn] = useState<string>("subject_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const {
    data: resultsData,
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
  } = useQuery<StudentDetailedResultsResponse, Error>({
    queryKey: ["studentDetailedResults", studentId, filters],
    queryFn: () =>
      fetchStudentDetailedResults({
        studentId: studentId,
        academicYearId: filters.academicYearId,
        termId: filters.termId,
        sequenceId: filters.sequenceId,
      }),
    enabled: !!studentId,
    staleTime: 60 * 1000,
    retry: 1,
  });
  console.log(resultsData);
  const { data: schoolData, isLoading: isLoadingSchool } = useQuery<
    School,
    Error
  >({
    // Removed: fetchStudentEnrollmentHistory (not strictly needed if historical sequences are fetched directly with studentId and year/term)
    fetchStudentHistoricalSequences, // USE THIS
    queryKey: ["schoolDataForExport"], // Ensure a unique key if this is different from other school queries
    queryFn: fetchSchool,
    staleTime: Infinity,
  });

  const { data: academicYears, isLoading: isLoadingYears } = useQuery<
    AcademicYear[],
    Error
  >({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
    staleTime: Infinity,
  });

  const { data: terms, isLoading: isLoadingTerms } = useQuery<Term[], Error>({
    queryKey: ["terms", filters.academicYearId],
    queryFn: () =>
      filters.academicYearId
        ? fetchTerms(Number(filters.academicYearId))
        : Promise.resolve([]),
    enabled: !!filters.academicYearId,
    staleTime: 5 * 60 * 1000,
  });

  // MODIFIED: Fetch Sequences using fetchStudentHistoricalSequences
  const { data: sequences, isLoading: isLoadingSequences } = useQuery<
    Sequence[],
    Error
  >({
    queryKey: [
      "studentHistoricalSequences", // Unique key for this query
      studentId,
      filters.academicYearId,
      filters.termId,
    ],
    queryFn: () => {
      if (!studentId || !filters.academicYearId) {
        // studentId and academicYearId are required to determine historical context
        return Promise.resolve([]);
      }
      return fetchStudentHistoricalSequences({
        studentId: studentId,
        academicYearId: filters.academicYearId,
        termId: filters.termId, // termId is optional for the backend endpoint
      });
    },
    // Enable if studentId and a specific academicYearId are selected,
    // as academicYearId is needed to determine the historical school for sequences.
    // TermId is not strictly required to enable, as backend might list all sequences for the year if termId is null.
    enabled: !!studentId && !!filters.academicYearId,
    staleTime: 1 * 60 * 1000,
  });

  useEffect(() => {
    if (!filters.academicYearId && academicYears?.length) {
      const activeYear =
        academicYears.find((y) => y.is_active) ?? academicYears[0];
      if (activeYear) {
        setFilters((prev) => ({
          ...prev,
          academicYearId: String(activeYear.id),
        }));
      }
    }
  }, [academicYears, filters.academicYearId]);

  const handleYearChange = (value: string) => {
    setFilters({ academicYearId: value, termId: null, sequenceId: null });
  };

  const handleTermChange = (value: string) => {
    setFilters((prev) => ({ ...prev, termId: value, sequenceId: null }));
  };

  const handleSequenceChange = (value: string) => {
    setFilters((prev) => ({ ...prev, sequenceId: value }));
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedSubjects = React.useMemo(() => {
    if (!resultsData?.results?.subject_breakdown) return [];
    const breakdown = Array.isArray(resultsData.results.subject_breakdown)
      ? resultsData.results.subject_breakdown
      : [];
    return [...breakdown].sort((a, b) => {
      if (!a || !b) return 0;
      let valA = a[sortColumn as keyof typeof a];
      let valB = b[sortColumn as keyof typeof b];
      if (
        ["rank", "class_average_subject", "score", "coefficient"].includes(
          sortColumn
        )
      ) {
        valA =
          valA === null || valA === undefined || valA === "-"
            ? sortDirection === "asc"
              ? Infinity
              : -Infinity
            : Number(valA);
        valB =
          valB === null || valB === undefined || valB === "-"
            ? sortDirection === "asc"
              ? Infinity
              : -Infinity
            : Number(valB);
      } else if (sortColumn === "subject_name") {
        valA = String(valA ?? "").toLowerCase();
        valB = String(valB ?? "").toLowerCase();
      } else {
        valA = String(valA ?? "");
        valB = String(valB ?? "");
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [resultsData?.results?.subject_breakdown, sortColumn, sortDirection]);

  const getScoreColor = (score: number | string | null | undefined): string => {
    if (score === null || score === undefined || score === "-")
      return "text-muted-foreground";
    const numScore = Number(score);
    if (numScore >= 16) return "text-blue-600 dark:text-blue-400 font-bold";
    if (numScore >= 14) return "text-cyan-600 dark:text-cyan-400 font-bold";
    if (numScore >= 10)
      return "text-emerald-600 dark:text-emerald-400 font-semibold";
    if (numScore >= 8)
      return "text-amber-600 dark:text-amber-400 font-semibold";
    return "text-rose-600 dark:text-rose-400 font-semibold";
  };

  const getGradeBackground = (
    score: number | string | null | undefined
  ): string => {
    if (score === null || score === undefined || score === "-")
      return "bg-transparent";
    const numScore = Number(score);
    if (numScore >= 16) return "bg-blue-50 dark:bg-blue-950/30";
    if (numScore >= 14) return "bg-cyan-50 dark:bg-cyan-950/30";
    if (numScore >= 10) return "bg-emerald-50 dark:bg-emerald-950/30";
    if (numScore >= 8) return "bg-amber-50 dark:bg-amber-950/30";
    return "bg-rose-50 dark:bg-rose-950/30";
  };

  const handleExportReportCard = () => {
    if (!resultsData?.results || !resultsData.period_type) {
      console.error("Cannot export: Results data or period type is missing.");
      alert(tExport("noDataError"));
      return;
    }
    if (!schoolData) {
      console.error("Cannot export: School data not loaded.");
      alert(tExport("noSchoolDataError"));
      return;
    }
    const studentDetailsForReport = resultsData?.student_info;
    const studentNameForFile = studentDetailsForReport
      ? `${studentDetailsForReport.full_name}`.trim()
      : tCommon("unknownStudent");
    const periodName =
      resultsData.results.period_info?.name || tExport("unknownPeriod");
    const safePeriodName = periodName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const safeStudentName = studentNameForFile
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const filename = `${safeStudentName}_${safePeriodName}`;
    exportReportCardToPDF(
      tExport,
      resultsData,
      studentData,
      filename,
      schoolData,
      10
    );
  };

  const FiltersHeader = () => (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between p-4 bg-gradient-to-br from-background to-muted/40 border-b">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center font-semibold">
            <CalendarRange className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
            {tFilters("academicYear")}
          </label>
          <Select
            value={filters.academicYearId ?? ""}
            onValueChange={handleYearChange}
            disabled={isLoadingYears}
          >
            <SelectTrigger className="w-full bg-background border-input h-9 shadow-sm text-sm">
              {isLoadingYears ? (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  {tFilters("loading")}
                </div>
              ) : (
                <SelectValue placeholder={tFilters("selectYear")} />
              )}
            </SelectTrigger>
            <SelectContent className="bg-background border-input shadow-lg max-h-60">
              {!academicYears || academicYears.length === 0 ? (
                <SelectItem
                  value="no-options"
                  disabled
                  className="text-muted-foreground italic"
                >
                  {tFilters("noOptions")}
                </SelectItem>
              ) : (
                academicYears.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.name}</span>
                      {option.is_active && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs border-primary text-primary bg-primary/5"
                        >
                          {tFilters("current")}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center font-semibold">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
            {tFilters("term")}
          </label>
          <Select
            value={filters.termId ?? ""}
            onValueChange={handleTermChange}
            disabled={isLoadingTerms || !filters.academicYearId}
          >
            <SelectTrigger className="w-full bg-background border-input h-9 shadow-sm text-sm">
              {isLoadingTerms ? (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  {tFilters("loading")}
                </div>
              ) : (
                <SelectValue
                  placeholder={
                    !filters.academicYearId
                      ? tFilters("selectYearFirst")
                      : tFilters("selectTerm")
                  }
                />
              )}
            </SelectTrigger>
            <SelectContent className="bg-background border-input shadow-lg max-h-60">
              {!terms || terms.length === 0 ? (
                <SelectItem
                  value="no-options"
                  disabled
                  className="text-muted-foreground italic"
                >
                  {filters.academicYearId
                    ? tFilters("noOptions")
                    : tFilters("selectYearFirstPrompt")}
                </SelectItem>
              ) : (
                terms.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name || option.get_name_display}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center font-semibold">
            <BookOpen className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
            {tFilters("sequence")}
          </label>
          <Select
            value={filters.sequenceId ?? ""}
            onValueChange={handleSequenceChange}
            disabled={
              isLoadingSequences || !filters.termId || !filters.academicYearId
            }
          >
            <SelectTrigger className="w-full bg-background border-input h-9 shadow-sm text-sm">
              {isLoadingSequences ? (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  {tFilters("loading")}
                </div>
              ) : (
                <SelectValue
                  placeholder={
                    !filters.academicYearId
                      ? tFilters("selectYearFirst")
                      : !filters.termId
                        ? tFilters("selectTermFirst")
                        : tFilters("selectSequence")
                  }
                />
              )}
            </SelectTrigger>
            <SelectContent className="bg-background border-input shadow-lg max-h-60">
              {!sequences || sequences.length === 0 ? (
                <SelectItem
                  value="no-options"
                  disabled
                  className="text-muted-foreground italic"
                >
                  {filters.academicYearId && filters.termId
                    ? tFilters("noOptions")
                    : !filters.academicYearId
                      ? tFilters("selectYearFirstPrompt")
                      : tFilters("selectTermFirstPrompt")}
                </SelectItem>
              ) : (
                sequences.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)}>
                    {option.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 mt-3 lg:mt-0">
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs font-medium tracking-wide"
          onClick={() => {
            if (academicYears?.length) {
              const activeYear =
                academicYears.find((y) => y.is_active) ?? academicYears[0];
              if (activeYear) {
                setFilters({
                  academicYearId: String(activeYear.id),
                  termId: null,
                  sequenceId: null,
                });
                refetch();
              } else {
                setFilters({
                  academicYearId: null,
                  termId: null,
                  sequenceId: null,
                });
                refetch();
              }
            } else {
              setFilters({
                academicYearId: null,
                termId: null,
                sequenceId: null,
              });
              refetch();
            }
          }}
          title={tFilters("fetchLatestTooltip")}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {tFilters("fetchLatest")}
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-9 text-xs font-medium tracking-wide"
          onClick={handleExportReportCard}
          disabled={
            !resultsData?.results ||
            !resultsData.period_type ||
            isLoadingSchool ||
            isFetching ||
            isLoading
          }
          title={tExport("exportButtonTooltip")}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {tExport("exportButton")}
        </Button>
      </div>
    </div>
  );

  const PeriodSummary = () => {
    if (
      !resultsData?.results?.period_info ||
      !resultsData?.results?.overall_performance
    )
      return null;
    const { period_info, overall_performance } = resultsData.results;
    const periodType = resultsData.period_type;
    return (
      <div className="border-b border-border/50 bg-background/30">
        <div className="p-4">
          <h3 className="font-semibold text-foreground text-lg">
            {period_info.name}
            {period_info.academic_year_name && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {period_info.academic_year_name}
                {periodType === "sequence" && period_info.term_name && (
                  <> · {period_info.term_name}</>
                )}
              </span>
            )}
          </h3>
          <div className="mt-1 mb-1 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {tSummary("averageScore")}
                </span>
                <span
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    getScoreColor(overall_performance.average)
                  )}
                >
                  {overall_performance.average != null
                    ? Number(overall_performance.average).toFixed(2)
                    : tCommon("notAvailableShort")}
                  <span className="text-muted-foreground text-xs font-normal ml-1">
                    /20
                  </span>
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded overflow-hidden">
                {overall_performance.average != null && (
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full",
                      Number(overall_performance.average) >= 16
                        ? "bg-blue-500"
                        : Number(overall_performance.average) >= 14
                          ? "bg-cyan-500"
                          : Number(overall_performance.average) >= 10
                            ? "bg-emerald-500"
                            : Number(overall_performance.average) >= 8
                              ? "bg-amber-500"
                              : "bg-rose-500"
                    )}
                    style={{
                      width: `${Math.min(
                        (Number(overall_performance.average) || 0) * 5,
                        100
                      )}%`,
                    }}
                  />
                )}
              </div>
              <div className="mt-3 flex justify-between items-center">
                <Badge
                  variant={
                    overall_performance.average != null
                      ? Number(overall_performance.average) >= 10
                        ? "success"
                        : "destructive"
                      : "secondary"
                  }
                >
                  {overall_performance.average != null
                    ? Number(overall_performance.average) >= 10
                      ? tStatus("passed")
                      : tStatus("failed")
                    : tStatus("unknown")}
                </Badge>
                {overall_performance.remarks && (
                  <span
                    className="text-xs italic text-muted-foreground text-right flex-1 ml-2 truncate"
                    title={overall_performance.remarks}
                  >
                    {overall_performance.remarks}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground flex items-center">
                  <Target className="h-3.5 w-3.5 mr-1 text-primary/70" />
                  {tSummary("classRank")}
                </span>
                <div className="flex items-center">
                  <span className="font-bold text-foreground tabular-nums">
                    {overall_performance.rank != null &&
                    overall_performance.class_size != null
                      ? `${overall_performance.rank} / ${overall_performance.class_size}`
                      : tCommon("notAvailableShort")}
                  </span>
                  {overall_performance.rank != null &&
                    overall_performance.rank <= 3 && (
                      <span className="ml-1.5">
                        {overall_performance.rank === 1
                          ? "🥇"
                          : overall_performance.rank === 2
                            ? "🥈"
                            : "🥉"}
                      </span>
                    )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground flex items-center">
                  <UserSquare className="h-3.5 w-3.5 mr-1 text-primary/70" />
                  {tSummary("classAverage")}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {overall_performance.class_average_overall != null
                    ? Number(overall_performance.class_average_overall).toFixed(
                        2
                      )
                    : tCommon("notAvailableShort")}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  {tSummary("totalPoints")}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {overall_performance.total_points != null
                    ? Number(overall_performance.total_points).toFixed(2)
                    : tCommon("notAvailableShort")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  {tSummary("totalCoefficient")}
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {overall_performance.total_coefficient ??
                    tCommon("notAvailableShort")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column)
      return (
        <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50 group-hover:text-muted-foreground" />
      );
    return sortDirection === "asc" ? (
      <TrendingUp className="h-3.5 w-3.5 ml-1 text-primary" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5 ml-1 text-primary" />
    );
  };

  const SubjectsTable = () => {
    if (!sortedSubjects || sortedSubjects.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-3">
          <Info className="h-7 w-7 text-blue-500" />
          {tSubjects("noSubjectDataPeriod")}
        </div>
      );
    }
    const periodType = resultsData?.period_type;
    return (
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[600px]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="bg-muted/70 border-b border-border">
              <TableHead
                className="cursor-pointer group px-4 py-3 min-w-[200px]"
                onClick={() => handleSort("subject_name")}
              >
                <div className="flex items-center">
                  {tSubjects("subject")} <SortIndicator column="subject_name" />
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer group px-3 py-3 w-16"
                onClick={() => handleSort("coefficient")}
              >
                <div className="flex items-center justify-center">
                  {tSubjects("coef")} <SortIndicator column="coefficient" />
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer group px-3 py-3 w-24"
                onClick={() => handleSort("score")}
              >
                <div className="flex items-center justify-center">
                  {tSubjects("score")}{" "}
                  <span className="text-xs text-muted-foreground ml-0.5">
                    /20
                  </span>{" "}
                  <SortIndicator column="score" />
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer group px-3 py-3 w-20"
                onClick={() => handleSort("rank")}
              >
                <div className="flex items-center justify-center">
                  {tSubjects("rank")} <SortIndicator column="rank" />
                </div>
              </TableHead>
              <TableHead
                className="text-center cursor-pointer group px-3 py-3 w-24"
                onClick={() => handleSort("class_average_subject")}
              >
                <div className="flex items-center justify-center">
                  {tSubjects("classAvg")}{" "}
                  <SortIndicator column="class_average_subject" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubjects.map((subj) => (
              <React.Fragment key={subj.subject_id}>
                <TableRow
                  className={cn(
                    "border-b border-border/80 hover:bg-muted/50",
                    getGradeBackground(subj.score)
                  )}
                >
                  <TableCell className="px-4 py-3">
                    <div className="font-medium">{subj.subject_name}</div>
                    {subj.teacher_name && (
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <UserSquare className="h-3 w-3" />
                        {subj.teacher_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-mono px-3 py-3">
                    {subj.coefficient ?? tCommon("notAvailableShort")}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-center font-bold px-3 py-3 tabular-nums",
                      getScoreColor(subj.score)
                    )}
                  >
                    {subj.score != null
                      ? Number(subj.score).toFixed(2)
                      : tCommon("notAvailableShort")}
                  </TableCell>
                  <TableCell className="text-center px-3 py-3 tabular-nums">
                    {subj.rank ?? tCommon("notAvailableShort")}
                  </TableCell>
                  <TableCell className="text-center px-3 py-3 tabular-nums">
                    {subj.class_average_subject != null
                      ? Number(subj.class_average_subject).toFixed(2)
                      : tCommon("notAvailableShort")}
                  </TableCell>
                </TableRow>
                {periodType === "term" &&
                  subj.sequence_details &&
                  subj.sequence_details.length > 0 && (
                    <TableRow className="bg-muted/30 border-b border-border/50 text-sm hover:bg-muted/40">
                      <TableCell colSpan={5} className="px-4 py-3">
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">
                          {tSubjects("sequenceBreakdown")}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {subj.sequence_details.map((seq) => (
                            <div
                              key={seq.sequence_id}
                              className="bg-background rounded-md p-2 border border-border/50 shadow-sm"
                            >
                              <div
                                className="font-medium mb-1 text-xs truncate"
                                title={seq.sequence_name}
                              >
                                {seq.sequence_name}
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Score:
                                </span>
                                <span
                                  className={cn(
                                    "font-semibold",
                                    getScoreColor(seq.normalized_score)
                                  )}
                                >
                                  {seq.normalized_score != null ? (
                                    Number(seq.normalized_score).toFixed(2)
                                  ) : seq.is_absent ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-1.5 py-0.5 bg-amber-50 border-amber-200 text-amber-700"
                                    >
                                      {tSubjects("absentShort")}
                                    </Badge>
                                  ) : (
                                    tCommon("notAvailableShort")
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                                <span>Wt: {seq.weight}%</span>
                                <span>Base: {seq.base_score ?? "-"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                {periodType === "year" &&
                  subj.term_details &&
                  subj.term_details.length > 0 && (
                    <TableRow className="bg-muted/30 border-b border-border/50 text-sm hover:bg-muted/40">
                      <TableCell colSpan={5} className="px-4 py-3">
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">
                          {tSubjects("termBreakdown")}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {subj.term_details.map((termDet) => (
                            <div
                              key={termDet.term_id}
                              className="bg-background rounded-md p-2 border border-border/50 shadow-sm"
                            >
                              <div
                                className="font-medium mb-1 text-xs truncate"
                                title={termDet.term_name}
                              >
                                {termDet.term_name}
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Score:
                                </span>
                                <span
                                  className={cn(
                                    "font-semibold",
                                    getScoreColor(termDet.term_average_score)
                                  )}
                                >
                                  {termDet.term_average_score != null
                                    ? Number(
                                        termDet.term_average_score
                                      ).toFixed(2)
                                    : tCommon("notAvailableShort")}
                                </span>
                              </div>
                              {termDet.term_rank != null && (
                                <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                                  <span>Rank:</span>
                                  <span>{termDet.term_rank}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading && !resultsData && !isError) {
    return (
      <Card className="bg-background border shadow-sm">
        <div className="space-y-4 p-4 animate-pulse">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-3 lg:mt-0">
              <div className="h-9 w-24 bg-muted rounded"></div>
              <div className="h-9 w-28 bg-muted rounded"></div>
            </div>
          </div>
          <div className="h-28 bg-muted rounded mt-4"></div>
          <div className="h-64 bg-muted rounded mt-4"></div>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-destructive/5 border-destructive shadow-sm">
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
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon("retry")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-background border shadow-sm overflow-hidden">
      <FiltersHeader />
      {!resultsData?.results && !isLoading && !isFetching && (
        <div className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Archive className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-lg font-medium">{t("noDataTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {filters.sequenceId
              ? t("noDataMessageSequence")
              : filters.termId
                ? t("noDataMessageTerm")
                : filters.academicYearId
                  ? t("noDataMessageYear")
                  : t("noDataMessageDefault")}
          </p>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {tCommon("refresh")}
            </Button>
          </div>
        </div>
      )}
      {resultsData?.results && (
        <>
          <PeriodSummary />
          <div className="mt-0 relative">
            {isFetching && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <SubjectsTable />
          </div>
        </>
      )}
    </Card>
  );
};

export default ResultsTab;
