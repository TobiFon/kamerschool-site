// src/app/[locale]/dashboard/students/[id]/_components/AnalyticsTab.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Loader2,
  AlertCircle,
  CalendarRange,
  BarChart3,
  BookOpen,
  RefreshCw,
  Info,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  MinusCircle,
  Activity,
  Target,
  ListChecks,
  BarChartHorizontal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Hash,
  Lightbulb,
  Award,
  ArrowUpDown,
} from "lucide-react"; // Removed UserSquare as it wasn't used directly in this file's primary logic
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
import { Separator } from "@/components/ui/separator";

import {
  StudentPerformanceAnalyticsResponse,
  SubjectPerformanceAnalytics,
  TrendData,
} from "@/types/students";
import {
  fetchAcademicYears,
  fetchStudentHistoricalSequences,
  fetchTerms,
  // fetchSequences, // Will be replaced by fetchStudentHistoricalSequences
} from "@/queries/results";
import { fetchStudentPerformanceAnalytics } from "@/queries/students"; // Ensure fetchStudentPerformanceAnalytics is here
import { Sequence } from "@/types/results"; // Ensure correct types
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AcademicYear } from "@/types/transfers";

// Helper Component for Stat Cards (Keep as is)
interface StatCardProps {
  title: string;
  value: string | number | null | undefined;
  icon: React.ReactNode;
  description?: string;
  valueClass?: string;
  isLoading?: boolean;
  unit?: string;
}
const getScoreColor = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined || score === "-")
    return "text-muted-foreground";
  const numScore = Number(score);
  if (numScore >= 16) return "text-blue-600 dark:text-blue-400 font-bold";
  if (numScore >= 14) return "text-cyan-600 dark:text-cyan-400 font-bold";
  if (numScore >= 10)
    return "text-emerald-600 dark:text-emerald-400 font-semibold";
  if (numScore >= 8) return "text-amber-600 dark:text-amber-400 font-semibold";
  return "text-rose-600 dark:text-rose-400 font-semibold";
};
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  valueClass,
  isLoading = false,
  unit = "",
}) => {
  const tCommon = useTranslations("Common");
  const displayValue =
    value === null || value === undefined
      ? tCommon("notAvailableShort")
      : `${value}${unit}`;
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
        ) : (
          <div className={cn("text-2xl font-bold", valueClass)}>
            {displayValue}
          </div>
        )}
        {description && !isLoading && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Helper for displaying trends (Keep as is)
const TrendDisplay: React.FC<{ trend: TrendData | null | undefined }> = ({
  trend,
}) => {
  const t = useTranslations("Analytics.Trends");
  if (!trend)
    return (
      <span className="text-muted-foreground italic text-xs">
        {t("noTrendData")}
      </span>
    );
  const getIcon = () => {
    if (trend.trend_direction === "improving")
      return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend.trend_direction === "declining")
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  };
  const getConsistencyIcon = () => {
    if (!trend.consistency_rating) return null;
    switch (trend.consistency_rating) {
      case "high":
        return <SignalHigh className="h-3 w-3 text-success" />;
      case "medium":
        return <SignalMedium className="h-3 w-3 text-warning" />;
      case "low":
        return <SignalLow className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };
  return (
    <div className="flex items-center gap-2 text-xs">
      {getIcon()}
      <span
        className={cn(
          "capitalize font-medium",
          trend.trend_direction === "improving"
            ? "text-success"
            : trend.trend_direction === "declining"
            ? "text-destructive"
            : "text-muted-foreground"
        )}
      >
        {t(trend.trend_direction)}
      </span>
      <Separator orientation="vertical" className="h-3" />
      <span className="text-muted-foreground">{t("consistency")}:</span>
      <span className="flex items-center gap-1">
        {getConsistencyIcon()}
        <span className="capitalize">
          {t(trend.consistency_rating ?? "unknown")}
        </span>{" "}
        ({trend.consistency?.toFixed(1)})
      </span>
      {trend.next_projection != null && (
        <>
          <Separator orientation="vertical" className="h-3" />
          <span className="text-muted-foreground">
            {t("projection")}: {trend.next_projection.toFixed(1)}
          </span>
        </>
      )}
    </div>
  );
};

// Trend Chart Component (Keep as is)
const TrendChart: React.FC<{
  data: { name: string; value: number | null }[];
  dataKey?: string;
  strokeColor?: string;
}> = ({ data, dataKey = "value", strokeColor = "#2563eb" }) => {
  const tCommon = useTranslations("Common");
  if (!data || data.length < 2)
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        {tCommon("notEnoughDataChart")}
      </div>
    );
  const chartData = data
    .map((item) => ({ name: item.name, [dataKey]: item.value }))
    .filter((item) => item[dataKey] !== null);
  if (chartData.length < 2)
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        {tCommon("notEnoughDataChart")}
      </div>
    );
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          domain={["dataMin - 1", "dataMax + 1"]}
          allowDecimals={false}
        />
        <Tooltip contentStyle={{ fontSize: 12, padding: "4px 8px" }} />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={strokeColor}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

interface AnalyticsTabProps {
  studentId: string;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ studentId }) => {
  const t = useTranslations("Analytics");
  const tFilters = useTranslations("Results.Filters");
  const tSubjects = useTranslations("Analytics.SubjectTable"); // Use Analytics specific translations for table headers
  const tCommon = useTranslations("Common");

  const [filters, setFilters] = useState<{
    timeScope: "latest" | "year" | "term" | "sequence";
    academicYearId: string | null;
    termId: string | null;
    sequenceId: string | null;
  }>({
    timeScope: "latest",
    academicYearId: null,
    termId: null,
    sequenceId: null,
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
    // Ensure Term[] type
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
    // Ensure Sequence[] type
    queryKey: [
      "studentHistoricalSequences", // Use the same unique key if data structure is identical
      studentId,
      filters.academicYearId,
      filters.termId,
    ],
    queryFn: () => {
      if (!studentId || !filters.academicYearId) {
        return Promise.resolve([]);
      }
      return fetchStudentHistoricalSequences({
        studentId: studentId,
        academicYearId: filters.academicYearId,
        termId: filters.termId,
      });
    },
    enabled: !!studentId && !!filters.academicYearId,
    staleTime: 1 * 60 * 1000,
  });

  useEffect(() => {
    if (
      filters.timeScope === "latest" &&
      !filters.academicYearId &&
      academicYears?.length
    ) {
      const activeYear =
        academicYears.find((y) => y.is_active) ?? academicYears[0];
      if (activeYear) {
        setFilters((prev) => ({
          ...prev,
          academicYearId: String(activeYear.id),
        }));
      }
    }
  }, [academicYears, filters.academicYearId, filters.timeScope]);

  const {
    data: analyticsData,
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
  } = useQuery<StudentPerformanceAnalyticsResponse, Error>({
    queryKey: ["studentAnalytics", studentId, filters],
    queryFn: () =>
      fetchStudentPerformanceAnalytics({
        studentId: studentId,
        timeScope: filters.timeScope,
        academicYearId: filters.academicYearId,
        termId: filters.termId,
        sequenceId: filters.sequenceId,
      }),
    enabled: !!studentId,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const handleYearChange = (value: string) => {
    const newYearId = value === "latest" ? null : value;
    setFilters({
      timeScope: newYearId ? "year" : "latest",
      academicYearId: newYearId,
      termId: null,
      sequenceId: null,
    });
  };

  const handleTermChange = (value: string) => {
    const newTermId = value === "latest" ? null : value;
    setFilters((prev) => ({
      ...prev,
      timeScope: newTermId ? "term" : prev.academicYearId ? "year" : "latest",
      termId: newTermId,
      sequenceId: null,
    }));
  };

  const handleSequenceChange = (value: string) => {
    const newSequenceId = value === "latest" ? null : value;
    setFilters((prev) => ({
      ...prev,
      timeScope: newSequenceId
        ? "sequence"
        : prev.termId
        ? "term"
        : prev.academicYearId
        ? "year"
        : "latest",
      sequenceId: newSequenceId,
    }));
  };

  const handleFetchLatest = () => {
    const activeYear = academicYears?.find((y) => y.is_active);
    const defaultYearId = activeYear?.id
      ? String(activeYear.id)
      : academicYears?.[0]?.id
      ? String(academicYears[0].id)
      : null;
    setFilters({
      timeScope: "latest",
      academicYearId: defaultYearId,
      termId: null,
      sequenceId: null,
    });
    refetch();
  };

  const overallTrendChartData = useMemo(() => {
    const history = analyticsData?.trend_analysis?.overall?.performance_history;
    const labels = analyticsData?.trend_analysis?.overall?.period_labels;
    if (!history || !labels || history.length !== labels.length) return [];
    return labels.map((label, index) => ({
      name: label,
      value: history[index],
    }));
  }, [analyticsData]);

  const FiltersHeader = () => (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between p-4 bg-gradient-to-br from-background to-muted/40 border-b">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center font-semibold">
            <CalendarRange className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
            {tFilters("academicYear")}
          </label>
          <Select
            value={filters.academicYearId ?? "latest"}
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
                <SelectValue placeholder={tFilters("selectYearOptional")} />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="latest"
                className="italic text-muted-foreground"
              >
                {tFilters("allYearsOrLatest")}
              </SelectItem>
              {academicYears?.map((option) => (
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
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center font-semibold">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
            {tFilters("term")}
          </label>
          <Select
            value={filters.termId ?? "latest"}
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
                      : tFilters("selectTermOptional")
                  }
                />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="latest"
                className="italic text-muted-foreground"
              >
                {tFilters("allTermsOrLatest")}
              </SelectItem>
              {terms?.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name || option.get_name_display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center font-semibold">
            <BookOpen className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
            {tFilters("sequence")}
          </label>
          <Select
            value={filters.sequenceId ?? "latest"}
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
                      : tFilters("selectSequenceOptional")
                  }
                />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="latest"
                className="italic text-muted-foreground"
              >
                {tFilters("allSequencesOrLatest")}
              </SelectItem>
              {/* Data for this dropdown now comes from `sequences` which is fetched contextually */}
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
          onClick={handleFetchLatest}
          title={tFilters("fetchLatestTooltip")}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {tFilters("fetchLatest")}
        </Button>
      </div>
    </div>
  );

  if (isLoading && !analyticsData && !isError) {
    return (
      <Card className="bg-background border shadow-sm">
        <FiltersHeader />
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="md:col-span-2 lg:col-span-3 h-48 bg-muted rounded-lg"></div>
          <div className="md:col-span-2 lg:col-span-3 h-64 bg-muted rounded-lg"></div>
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
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon("retry")}
          </Button>
        </div>
      </Card>
    );
  }

  if (!analyticsData || !analyticsData.period_info) {
    return (
      <Card className="bg-background border shadow-sm">
        <FiltersHeader />
        <div className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Info className="h-6 w-6 text-muted-foreground" />
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
      </Card>
    );
  }

  const {
    student_info,
    period_info,
    overall_performance,
    subject_performance,
    strengths_weaknesses,
    progress,
    trend_analysis,
  } = analyticsData;

  return (
    <Card className="bg-background border shadow-sm overflow-hidden">
      <FiltersHeader />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("averageScore")}
            value={overall_performance?.average?.toFixed(2)}
            icon={<Target className="h-5 w-5" />}
            valueClass={getScoreColor(overall_performance?.average)}
            description={t("outOf20")}
            isLoading={isFetching}
          />
          <StatCard
            title={t("classRank")}
            value={
              overall_performance?.rank && overall_performance?.class_size
                ? `${overall_performance.rank} / ${overall_performance.class_size}`
                : null
            }
            icon={<Award className="h-5 w-5" />}
            description={
              overall_performance?.percentile
                ? t("percentile", {
                    value: overall_performance.percentile.toFixed(0),
                  })
                : undefined
            }
            isLoading={isFetching}
          />
          <StatCard
            title={t("comparisonToClass")}
            value={overall_performance?.difference_from_class?.toFixed(2)}
            icon={
              overall_performance?.difference_from_class &&
              overall_performance.difference_from_class >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )
            }
            valueClass={
              overall_performance?.difference_from_class &&
              overall_performance.difference_from_class >= 0
                ? "text-success"
                : "text-destructive"
            }
            description={t("vsClassAvg", {
              value: overall_performance?.class_average?.toFixed(2) ?? "N/A",
            })}
            isLoading={isFetching}
          />
          <StatCard
            title={t("status")}
            value={overall_performance?.pass_status ? t("passed") : t("failed")}
            icon={
              overall_performance?.pass_status ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )
            }
            valueClass={
              overall_performance?.pass_status
                ? "text-success"
                : "text-destructive"
            }
            description={period_info?.name}
            isLoading={isFetching}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {t("overallTrendTitle")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("trendPeriod", { period: period_info.name })}
              </p>
            </CardHeader>
            <CardContent className="pt-4 px-2 pb-2">
              {isFetching ? (
                <div className="h-[150px] bg-muted rounded animate-pulse"></div>
              ) : (
                <>
                  {overallTrendChartData.length > 0 ? (
                    <TrendChart data={overallTrendChartData} />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {tCommon("notEnoughDataChart")}
                    </p>
                  )}{" "}
                  {trend_analysis?.overall?.trend && (
                    <div className="mt-2 px-2">
                      <TrendDisplay trend={trend_analysis.overall.trend} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChartHorizontal className="h-5 w-5 text-primary" />
                {t("progressTitle")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("progressDescription")}
              </p>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 space-y-3">
              {isFetching ? (
                <div className="h-20 bg-muted rounded animate-pulse"></div>
              ) : progress ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("previousPeriod", {
                        name: progress.previous_period_name,
                      })}
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        getScoreColor(progress.previous_average)
                      )}
                    >
                      {progress.previous_average.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("currentPeriod", { name: period_info.name })}
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        getScoreColor(progress.current_average)
                      )}
                    >
                      {progress.current_average.toFixed(2)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">
                      {t("improvement")}
                    </span>
                    <span
                      className={cn(
                        "font-bold text-lg flex items-center gap-1",
                        progress.improvement >= 0
                          ? "text-success"
                          : "text-destructive"
                      )}
                    >
                      {progress.improvement >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {progress.improvement.toFixed(2)}
                      <span className="text-xs font-normal ml-1">
                        ({progress.percent_change?.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noProgressData")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border">
            <CardHeader className="py-3 px-4 border-b bg-success/5">
              <CardTitle className="text-base font-semibold text-success flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {t("strengthsTitle")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("strengthsDescription")}
              </p>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 space-y-2">
              {isFetching ? (
                <div className="h-20 bg-muted rounded animate-pulse"></div>
              ) : strengths_weaknesses?.strongest &&
                strengths_weaknesses.strongest.length > 0 ? (
                strengths_weaknesses.strongest.map((subj, index) => (
                  <div
                    key={`strong-${index}`}
                    className="flex justify-between items-center text-sm border-b last:border-b-0 pb-1.5 pt-0.5"
                  >
                    <span className="font-medium text-foreground">
                      {subj.subject_name}
                    </span>
                    <Badge variant="success" className="text-xs gap-1">
                      +{subj.difference.toFixed(1)}{" "}
                      <span className="hidden sm:inline">{t("vsClass")}</span>
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noStrengths")}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardHeader className="py-3 px-4 border-b bg-destructive/5">
              <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t("weaknessesTitle")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("weaknessesDescription")}
              </p>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4 space-y-2">
              {isFetching ? (
                <div className="h-20 bg-muted rounded animate-pulse"></div>
              ) : strengths_weaknesses?.weakest &&
                strengths_weaknesses.weakest.length > 0 ? (
                strengths_weaknesses.weakest.map((subj, index) => (
                  <div
                    key={`weak-${index}`}
                    className="flex justify-between items-center text-sm border-b last:border-b-0 pb-1.5 pt-0.5"
                  >
                    <span className="font-medium text-foreground">
                      {subj.subject_name}
                    </span>
                    <Badge variant="destructive" className="text-xs gap-1">
                      {subj.difference.toFixed(1)}{" "}
                      <span className="hidden sm:inline">{t("vsClass")}</span>
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noWeaknesses")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="shadow-sm border overflow-hidden">
          <CardHeader className="py-3 px-4 border-b bg-muted/40">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              {t("subjectDetailsTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("subjectDetailsDescription", { period: period_info.name })}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {isFetching ? (
              <div className="h-64 bg-muted animate-pulse m-4 rounded"></div>
            ) : (
              <SubjectPerformanceTable subjects={subject_performance ?? []} />
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm border">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              {t("subjectTrendsTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t("subjectTrendsDescription")}
            </p>
          </CardHeader>
          <CardContent className="pt-4 px-4 pb-4">
            {isFetching ? (
              <div className="h-40 bg-muted rounded animate-pulse"></div>
            ) : trend_analysis?.subjects &&
              Object.keys(trend_analysis.subjects).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {Object.values(trend_analysis.subjects).map(
                  (subjTrend, index) => (
                    <div
                      key={`subj-trend-${index}`}
                      className="border rounded-lg p-3 bg-background"
                    >
                      <h4 className="font-semibold text-sm mb-1">
                        {subjTrend.subject_name}
                      </h4>
                      <TrendDisplay trend={subjTrend.trend} />
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t("noSubjectTrends")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Card>
  );
};

interface SubjectPerformanceTableProps {
  subjects: SubjectPerformanceAnalytics[];
}
const SubjectPerformanceTable: React.FC<SubjectPerformanceTableProps> = ({
  subjects,
}) => {
  const t = useTranslations("Analytics.SubjectTable"); // Use Analytics specific table translations
  const tCommon = useTranslations("Common");
  const [sortColumn, setSortColumn] = useState<
    keyof SubjectPerformanceAnalytics | null
  >("subject_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (column: keyof SubjectPerformanceAnalytics) => {
    if (sortColumn === column)
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedSubjects = useMemo(() => {
    if (!sortColumn) return subjects;
    return [...subjects].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (
        [
          "score",
          "rank",
          "difference",
          "class_average",
          "coefficient",
        ].includes(sortColumn)
      ) {
        valA =
          valA === null || valA === undefined
            ? sortDirection === "asc"
              ? Infinity
              : -Infinity
            : Number(valA);
        valB =
          valB === null || valB === undefined
            ? sortDirection === "asc"
              ? Infinity
              : -Infinity
            : Number(valB);
      } else {
        valA = String(valA ?? "").toLowerCase();
        valB = String(valB ?? "").toLowerCase();
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [subjects, sortColumn, sortDirection]);

  const SortIndicator = ({
    column,
  }: {
    column: keyof SubjectPerformanceAnalytics;
  }) => {
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

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="secondary">{tCommon("unknown")}</Badge>;
    const lowerStatus = status.toLowerCase().replace(/\s+/g, "_"); // Normalize for translation key
    const translatedStatus = t(
      `status.${lowerStatus}`,
      {},
      { defaultValue: status }
    ); // Use translation

    if (lowerStatus === "excellent")
      return (
        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
          {translatedStatus}
        </Badge>
      );
    if (lowerStatus === "above_average")
      return (
        <Badge variant="default" className="bg-cyan-500 hover:bg-cyan-600">
          {translatedStatus}
        </Badge>
      );
    if (lowerStatus === "average")
      return <Badge variant="success">{translatedStatus}</Badge>;
    if (lowerStatus === "below_average")
      return <Badge variant="warning">{translatedStatus}</Badge>;
    if (lowerStatus === "needs_improvement")
      return <Badge variant="destructive">{translatedStatus}</Badge>;
    return <Badge variant="secondary">{translatedStatus}</Badge>;
  };

  if (!subjects || subjects.length === 0)
    return (
      <div className="text-center py-10 text-muted-foreground">
        {t("noData")}
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <Table className="w-full min-w-[650px]">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/60 border-b">
            <TableHead
              className="cursor-pointer group px-3 py-2.5"
              onClick={() => handleSort("subject_name")}
            >
              <div className="flex items-center">
                {t("headerSubject")} <SortIndicator column="subject_name" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer group px-2 py-2.5 w-16"
              onClick={() => handleSort("coefficient")}
            >
              <div className="flex items-center justify-center">
                {t("headerCoef")} <SortIndicator column="coefficient" />
              </div>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer group px-3 py-2.5 w-20"
              onClick={() => handleSort("score")}
            >
              <div className="flex items-center justify-end">
                {t("headerScore")} <SortIndicator column="score" />
              </div>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer group px-3 py-2.5 w-24"
              onClick={() => handleSort("difference")}
            >
              <div className="flex items-center justify-end">
                {t("headerDifference")} <SortIndicator column="difference" />
              </div>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer group px-3 py-2.5 w-20"
              onClick={() => handleSort("rank")}
            >
              <div className="flex items-center justify-end">
                {t("headerRank")} <SortIndicator column="rank" />
              </div>
            </TableHead>
            <TableHead
              className="text-center cursor-pointer group px-3 py-2.5 w-36"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center justify-center">
                {t("headerStatus")} <SortIndicator column="status" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSubjects.map((subj, index) => (
            <TableRow key={index} className="text-sm hover:bg-muted/30">
              <TableCell className="font-medium text-foreground px-3 py-2">
                {subj.subject_name}
              </TableCell>
              <TableCell className="text-center text-muted-foreground font-mono px-2 py-2">
                {subj.coefficient ?? "-"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold px-3 py-2",
                  getScoreColor(subj.score)
                )}
              >
                {subj.score?.toFixed(2) ?? tCommon("notAvailableShort")}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium px-3 py-2",
                  subj.difference != null && subj.difference >= 0
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {subj.difference != null
                  ? `${
                      subj.difference >= 0 ? "+" : ""
                    }${subj.difference.toFixed(1)}`
                  : tCommon("notAvailableShort")}
              </TableCell>
              <TableCell className="text-right text-muted-foreground px-3 py-2">
                {subj.rank ?? tCommon("notAvailableShort")}
              </TableCell>
              <TableCell className="text-center px-3 py-2">
                {getStatusBadge(subj.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AnalyticsTab;
