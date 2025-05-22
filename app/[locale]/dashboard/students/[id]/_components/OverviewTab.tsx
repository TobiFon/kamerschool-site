"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  BookOpen,
  Phone,
  TrendingUp,
  DollarSign,
  CalendarCheck2,
  CalendarX2,
  Clock,
  ShieldCheck,
  Award,
  Users,
  Info,
  MapPin,
  Cake,
  Contact,
  GraduationCap,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertCircle,
  RefreshCw,
  AlertOctagon,
  Calendar as CalendarIcon,
  Loader2,
  AlertTriangle,
  TrendingDown,
  Edit, // Added Edit icon
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link"; // Added Link for navigation

import { StudentOverview, EnrollmentHistoryEntry } from "@/types/students";
import { fetchStudentOverview } from "@/queries/students";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { getBackendErrorMessage } from "@/lib/utils";

// --- Reusable Stat Card ---
interface StatCardProps {
  title: string;
  value: string | number | null | undefined;
  icon: React.ReactNode;
  unit?: string;
  description?: string;
  colorClass?: string;
  isLoading?: boolean;
}
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  unit,
  description,
  colorClass = "text-gray-900 dark:text-gray-100",
  isLoading = false,
}) => {
  const t = useTranslations("Students.Overview");
  const displayValue =
    value === null || value === undefined
      ? t("notAvailableShort")
      : `${value}${unit ?? ""}`;
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/30 dark:bg-gray-900/30">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="text-primary bg-primary-foreground dark:bg-primary/10 p-2 rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        {isLoading ? (
          <Skeleton className="h-8 w-24 rounded" />
        ) : (
          <div className={cn("text-3xl font-bold", colorClass)}>
            {displayValue}
          </div>
        )}
        {description && !isLoading && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

// --- Reusable Info Item ---
interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClass?: string;
  isLoading?: boolean;
}
const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value,
  icon,
  valueClass,
  isLoading = false,
}) => (
  <div className="flex items-start justify-between py-1.5">
    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span>{label}</span>
    </div>
    {isLoading ? (
      <Skeleton className="h-5 w-20 rounded" />
    ) : (
      <span className={cn("font-medium text-right text-sm", valueClass)}>
        {value ?? (
          <span className="text-xs text-muted-foreground italic">N/A</span>
        )}
      </span>
    )}
  </div>
);

// --- OverviewTab Props ---
interface OverviewTabProps {
  studentId: string;
}

// --- Default value for "Latest / Default" option ---
const LATEST_YEAR_VALUE = "latest";

// --- OverviewTab Component ---
const OverviewTab: React.FC<OverviewTabProps> = ({ studentId }) => {
  const t = useTranslations("Students.Overview");
  const tStatus = useTranslations("Status");
  const tSubjects = useTranslations("Subjects");
  const tCommon = useTranslations("Common");

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<
    string | null
  >(null);

  const {
    data: studentOverviewData,
    isLoading,
    isFetching,
    error,
    isError,
    refetch,
  } = useQuery<StudentOverview, Error>({
    queryKey: ["studentOverviewTabData", studentId, selectedAcademicYearId],
    queryFn: () => fetchStudentOverview(studentId, selectedAcademicYearId),
    enabled: !!studentId,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const {
    enrollment_history,
    latest_performance,
    current_fees_summary,
    academic_year_attendance_summary,
    academic_year_discipline_summary,
    enrolled_subjects,
    parent_name,
    parent_phone_number,
    class_name,
    school_name,
    sex_display,
    age,
    place_of_birth,
    status_display,
  } = studentOverviewData || {};

  const handleYearChange = (value: string) => {
    const newYearId = value === LATEST_YEAR_VALUE ? null : value;
    setSelectedAcademicYearId(newYearId);
  };

  const getPerformanceIndicator = (
    avg: number | null | undefined
  ): JSX.Element => {
    if (avg === null || avg === undefined)
      return <MinusCircle className="h-5 w-5 text-gray-400" />;
    if (avg >= 10) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getPromotionStatusIcon = (
    status: string | null | undefined
  ): JSX.Element => {
    if (!status) return <Info className="h-5 w-5 text-gray-500" />;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("promoted") || lowerStatus.includes("pass"))
      return <Award className="h-5 w-5 text-green-600" />;
    if (lowerStatus.includes("repeated") || lowerStatus.includes("fail"))
      return <TrendingUp className="h-5 w-5 text-red-600" />;
    if (lowerStatus.includes("pending"))
      return <Clock className="h-5 w-5 text-yellow-600" />;
    return <Info className="h-5 w-5 text-gray-500" />;
  };

  const attendancePercentage = useMemo(() => {
    if (
      !academic_year_attendance_summary?.days_with_records_in_period ||
      academic_year_attendance_summary.days_with_records_in_period === 0
    )
      return 0;
    const attended =
      (academic_year_attendance_summary.present ?? 0) +
      (academic_year_attendance_summary.late ?? 0);
    return Math.max(
      0,
      Math.min(
        100,
        (attended /
          academic_year_attendance_summary.days_with_records_in_period) *
          100
      )
    );
  }, [academic_year_attendance_summary]);

  const paymentPercentage = useMemo(() => {
    if (
      !current_fees_summary?.total_due ||
      Number(current_fees_summary.total_due) <= 0
    ) {
      return Number(current_fees_summary?.total_paid || 0) > 0 ? 100 : 0;
    }
    const paid = Number(current_fees_summary.total_paid || 0);
    const due = Number(current_fees_summary.total_due);
    return Math.max(0, Math.min(100, (paid / due) * 100));
  }, [current_fees_summary]);

  if (isLoading && !isError) {
    return (
      <div className="space-y-8 p-6 animate-pulse">
        <Skeleton className="h-10 w-1/3 ml-auto mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8">
            <Skeleton className="h-60 rounded-lg" />
            <Skeleton className="h-44 rounded-lg" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-60 rounded-lg" />
            <Skeleton className="h-72 rounded-lg" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-60 rounded-lg" />
            <Skeleton className="h-52 rounded-lg" />
            <Skeleton className="h-44 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center flex flex-col items-center gap-3 border rounded-lg m-4 bg-destructive/5 border-destructive">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-semibold text-destructive">{t("errorTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {getBackendErrorMessage(error) || t("errorMessage")}
        </p>
        <Button
          variant="destructive"
          outline
          size="sm"
          onClick={() => refetch()}
          className="mt-2"
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  if (!isLoading && !isFetching && !studentOverviewData) {
    return (
      <div className="p-8 text-center border rounded-lg m-4 bg-muted/40">
        <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium">{t("noDataFound")}</p>
        <p className="text-sm text-muted-foreground mt-1">{t("noDataHint")}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-4"
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          {tCommon("refresh")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 relative">
      {isFetching && !isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20 rounded-lg backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {enrollment_history && enrollment_history.length > 0 && (
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-3 -mx-6 px-6 rounded-b-lg">
          {/* Adjust -mx-6 px-6 if parent padding changes */}
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-2 bg-card dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 max-w-sm">
              <label
                htmlFor="overview-year-select"
                className="whitespace-nowrap text-sm font-medium text-muted-foreground flex items-center"
              >
                <CalendarIcon className="h-4 w-4 mr-1.5 text-primary shrink-0" />
                {t("viewingYear")}:
              </label>
              <Select
                value={selectedAcademicYearId ?? LATEST_YEAR_VALUE}
                onValueChange={handleYearChange}
                disabled={isFetching}
              >
                <SelectTrigger
                  id="overview-year-select"
                  className="h-8 text-sm bg-background shadow-sm border-input min-w-[180px] ml-1 flex-1"
                  aria-label={t("selectAcademicYear")}
                >
                  <SelectValue placeholder={t("selectYear")} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border shadow-lg max-h-[300px] overflow-y-auto">
                  <SelectItem
                    value={LATEST_YEAR_VALUE}
                    className="italic font-medium text-primary"
                  >
                    {t("latestYearDefault")}
                  </SelectItem>
                  {enrollment_history.map((entry) => (
                    <SelectItem
                      key={entry.academic_year_id}
                      value={String(entry.academic_year_id)}
                    >
                      <span className="truncate block max-w-[250px]">
                        {entry.academic_year_name} ({entry.class_name})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title={t("latestAvgScore")}
          value={latest_performance?.average?.toFixed(2)}
          icon={<GraduationCap className="h-5 w-5" />}
          description={`${latest_performance?.period_type || ""} ${
            latest_performance?.period_name || t("notAvailable")
          }`}
          colorClass={
            latest_performance?.average
              ? latest_performance.average >= 10
                ? "text-success"
                : "text-destructive"
              : "text-muted-foreground"
          }
          isLoading={isFetching}
        />
        <StatCard
          title={t("feeBalance")}
          value={
            current_fees_summary?.balance !== undefined
              ? formatCurrency(Number(current_fees_summary.balance))
              : null
          }
          icon={<DollarSign className="h-5 w-5" />}
          description={t("forYear", {
            year: current_fees_summary?.academic_year || t("currentYear"),
          })}
          colorClass={
            current_fees_summary?.balance !== undefined
              ? Number(current_fees_summary.balance) > 0
                ? "text-orange-500"
                : "text-success"
              : "text-muted-foreground"
          }
          isLoading={isFetching}
        />
        <StatCard
          title={t("recentAbsences")}
          value={academic_year_attendance_summary?.absent}
          icon={<CalendarX2 className="h-5 w-5" />}
          description={
            academic_year_attendance_summary?.academic_year || t("selectedYear")
          }
          colorClass={
            academic_year_attendance_summary?.absent !== undefined
              ? academic_year_attendance_summary.absent > 0
                ? "text-destructive"
                : "text-success"
              : "text-muted-foreground"
          }
          isLoading={isFetching}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 gap-2">
                <User className="h-5 w-5 text-primary" />
                {t("personalInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-4 space-y-3">
              <InfoItem
                label={t("currentClass")}
                value={class_name || t("notEnrolled")}
                icon={
                  <GraduationCap className="h-5 w-5 text-primary opacity-70" />
                }
                isLoading={isFetching}
              />
              <InfoItem
                label={t("currentSchool")}
                value={school_name || t("noSchool")}
                icon={<Info className="h-5 w-5 text-primary opacity-70" />}
                isLoading={isFetching}
              />
              <InfoItem
                label={t("gender")}
                value={sex_display}
                icon={<User className="h-5 w-5 text-primary opacity-70" />}
                isLoading={isFetching}
              />
              <InfoItem
                label={t("age")}
                value={age ? `${age} ${t("yearsOld")}` : null}
                icon={<Cake className="h-5 w-5 text-primary opacity-70" />}
                isLoading={isFetching}
              />
              <InfoItem
                label={t("placeOfBirth")}
                value={place_of_birth}
                icon={<MapPin className="h-5 w-5 text-primary opacity-70" />}
                isLoading={isFetching}
              />
              <InfoItem
                label={t("status")}
                value={
                  <Badge
                    variant={
                      status_display === "Active" ? "success" : "secondary"
                    }
                    className="capitalize px-2.5 py-0.5 text-xs"
                  >
                    {status_display || tStatus("unknown")}
                  </Badge>
                }
                icon={<Info className="h-5 w-5 text-primary opacity-70" />}
                isLoading={isFetching}
              />
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 gap-2">
                <Contact className="h-5 w-5 text-primary" />
                {t("parentContact")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-4 space-y-3">
              {isFetching ? (
                <>
                  <InfoItem
                    label={t("parentName")}
                    value={<Skeleton className="h-5 w-24" />}
                    icon={<User className="h-5 w-5 text-primary opacity-70" />}
                    isLoading={true}
                  />
                  <InfoItem
                    label={t("parentPhone")}
                    value={<Skeleton className="h-5 w-20" />}
                    icon={<Phone className="h-5 w-5 text-primary opacity-70" />}
                    isLoading={true}
                  />
                </>
              ) : parent_name ? (
                <>
                  <InfoItem
                    label={t("parentName")}
                    value={parent_name}
                    icon={<User className="h-5 w-5 text-primary opacity-70" />}
                  />
                  <InfoItem
                    label={t("parentPhone")}
                    value={parent_phone_number}
                    icon={<Phone className="h-5 w-5 text-primary opacity-70" />}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noParentInfo")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t("latestPerformance")}
              </CardTitle>
              {latest_performance && (
                <p className="text-xs text-muted-foreground pt-1">{`${
                  latest_performance.period_type || ""
                } - ${latest_performance.period_name || ""} (${
                  latest_performance.academic_year || ""
                })`}</p>
              )}
            </CardHeader>
            <CardContent className="pt-6 pb-4 space-y-3">
              {isFetching ? (
                <>
                  <InfoItem
                    label={t("averageScore")}
                    value={<Skeleton className="h-5 w-16" />}
                    icon={<MinusCircle className="h-5 w-5 text-gray-400" />}
                    isLoading={true}
                  />
                  <InfoItem
                    label={t("classRank")}
                    value={<Skeleton className="h-5 w-20" />}
                    icon={<Award className="h-5 w-5 text-primary opacity-70" />}
                    isLoading={true}
                  />
                </>
              ) : latest_performance ? (
                <>
                  <InfoItem
                    label={t("averageScore")}
                    value={latest_performance.average?.toFixed(2)}
                    icon={getPerformanceIndicator(latest_performance.average)}
                    valueClass={
                      latest_performance.average !== null &&
                      latest_performance.average !== undefined
                        ? latest_performance.average >= 10
                          ? "text-success font-bold"
                          : "text-destructive font-bold"
                        : "text-muted-foreground"
                    }
                  />
                  <InfoItem
                    label={t("classRank")}
                    value={
                      latest_performance.rank && latest_performance.class_size
                        ? `${latest_performance.rank} / ${latest_performance.class_size}`
                        : t("notAvailableShort")
                    }
                    icon={<Award className="h-5 w-5 text-primary opacity-70" />}
                  />
                  <InfoItem
                    label={t("classAverage")}
                    value={latest_performance.class_average?.toFixed(2)}
                    icon={<Users className="h-5 w-5 text-primary opacity-70" />}
                  />
                  {latest_performance.period_type === "Year" && (
                    <InfoItem
                      label={t("promotionStatus")}
                      value={
                        latest_performance.promotion_status ||
                        t("notAvailableShort")
                      }
                      icon={getPromotionStatusIcon(
                        latest_performance.promotion_status
                      )}
                      valueClass={cn(
                        "font-semibold",
                        latest_performance.promotion_status
                          ?.toLowerCase()
                          .includes("promoted")
                          ? "text-success"
                          : latest_performance.promotion_status
                              ?.toLowerCase()
                              .includes("repeated") ||
                            latest_performance.promotion_status
                              ?.toLowerCase()
                              .includes("fail")
                          ? "text-destructive"
                          : latest_performance.promotion_status
                              ?.toLowerCase()
                              .includes("pending")
                          ? "text-yellow-600"
                          : "text-muted-foreground"
                      )}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noPerformanceData")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 gap-2">
                <CalendarCheck2 className="h-5 w-5 text-primary" />
                {selectedAcademicYearId
                  ? t("attendanceForYear")
                  : t("recentAttendance")}
              </CardTitle>
              {academic_year_attendance_summary && (
                <p className="text-xs text-muted-foreground pt-1">
                  {academic_year_attendance_summary.academic_year || ""}{" "}
                  {academic_year_attendance_summary.period &&
                    `(${academic_year_attendance_summary.period})`}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              {isFetching ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-2.5 w-full" />
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                  </div>
                </div>
              ) : academic_year_attendance_summary &&
                (academic_year_attendance_summary.total_days_recorded ?? 0) >
                  0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("attendanceRate")}
                    </span>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {attendancePercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={attendancePercentage}
                    className="h-2.5"
                    indicatorClassName={cn(
                      attendancePercentage > 80
                        ? "bg-success"
                        : attendancePercentage > 50
                        ? "bg-yellow-500"
                        : "bg-destructive"
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex flex-col items-center border border-green-200 dark:border-green-700/50 hover:shadow-md transition-all">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t("daysPresent")}
                      </span>
                      <span className="text-lg font-bold text-green-700 dark:text-green-300">
                        {academic_year_attendance_summary.present || 0}
                      </span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex flex-col items-center border border-red-200 dark:border-red-700/50 hover:shadow-md transition-all">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t("daysAbsent")}
                      </span>
                      <span className="text-lg font-bold text-red-700 dark:text-red-300">
                        {academic_year_attendance_summary.absent || 0}
                      </span>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg flex flex-col items-center border border-orange-200 dark:border-orange-700/50 hover:shadow-md transition-all">
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t("daysLate")}
                      </span>
                      <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
                        {academic_year_attendance_summary.late || 0}
                      </span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex flex-col items-center border border-blue-200 dark:border-blue-700/50 hover:shadow-md transition-all">
                      <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t("daysExcused")}
                      </span>
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        {academic_year_attendance_summary.excused || 0}
                      </span>
                    </div>
                  </div>
                  <InfoItem
                    label={t("totalDaysRecorded")}
                    value={
                      academic_year_attendance_summary.days_with_records_in_period
                    }
                    icon={
                      <CalendarCheck2 className="h-5 w-5 text-primary opacity-70" />
                    }
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {academic_year_attendance_summary?.message ||
                    t("noAttendanceData")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {t("feesSummary")}
              </CardTitle>
              {current_fees_summary && (
                <p className="text-xs text-muted-foreground pt-1">
                  {t("forYear", {
                    year:
                      current_fees_summary?.academic_year ||
                      t("notAvailableShort"),
                  })}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              {isFetching ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-2.5 w-full" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full mt-2 pt-2 border-t border-dashed" />
                  </div>
                </div>
              ) : current_fees_summary &&
                current_fees_summary.balance !== undefined ? (
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("paymentProgress")}
                    </span>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {paymentPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={paymentPercentage}
                    className="h-2.5"
                    indicatorClassName={cn(
                      paymentPercentage === 100
                        ? "bg-success"
                        : paymentPercentage > 60
                        ? "bg-yellow-500"
                        : "bg-destructive"
                    )}
                  />
                  <div className="mt-4 space-y-3">
                    <InfoItem
                      label={t("totalDue")}
                      value={formatCurrency(
                        Number(current_fees_summary.total_due || 0)
                      )}
                      icon={
                        <DollarSign className="h-5 w-5 text-primary opacity-70" />
                      }
                    />
                    <InfoItem
                      label={t("totalPaid")}
                      value={formatCurrency(
                        Number(current_fees_summary.total_paid || 0)
                      )}
                      icon={<CheckCircle className="h-5 w-5 text-green-500" />}
                      valueClass="text-success font-semibold"
                    />
                    <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      <InfoItem
                        label={t("remainingBalance")}
                        value={formatCurrency(
                          Number(current_fees_summary.balance || 0)
                        )}
                        valueClass={cn(
                          "text-xl font-bold",
                          Number(current_fees_summary.balance || 0) > 0
                            ? "text-destructive"
                            : "text-success"
                        )}
                        icon={
                          <DollarSign className="h-5 w-5 text-primary opacity-70" />
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {current_fees_summary?.message || t("noFeeData")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {selectedAcademicYearId
                  ? t("subjectsForYear")
                  : t("activeSubjects")}
              </CardTitle>
              <div className="flex items-center gap-2">
                {!isFetching &&
                  studentOverviewData &&
                  class_name && ( // Only show edit if student is in a class
                    <Link
                      href={`/dashboard/students/${studentId}/subjects`}
                      passHref
                      legacyBehavior
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        title={t("editStudentSubjects")}
                        disabled={isFetching}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                {!isFetching && (
                  <Badge variant="outline" className="text-sm">
                    {enrolled_subjects?.length || 0}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isFetching ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded" />
                  ))}
                </div>
              ) : enrolled_subjects && enrolled_subjects.length > 0 ? (
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                  {enrolled_subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className={cn(
                        "p-3 flex justify-between items-center",
                        "hover:bg-muted/50 transition-colors duration-150"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-full bg-primary-foreground dark:bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                          {subject.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                          {subject.name}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-xs"
                      >
                        {tSubjects("coefficientShort")}: {subject.coefficient}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  {t("noActiveSubjects")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200 gap-2">
                <AlertOctagon className="h-5 w-5 text-primary" />
                {t("disciplineSummaryTitle")}
              </CardTitle>
              {academic_year_discipline_summary && (
                <p className="text-xs text-muted-foreground pt-1">
                  {t("forYear", {
                    year:
                      academic_year_discipline_summary?.academic_year ||
                      t("selectedYear"),
                  })}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-6 pb-4 space-y-3">
              {isFetching ? (
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : academic_year_discipline_summary &&
                academic_year_discipline_summary.total_records > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem
                    label={t("totalRecords")}
                    value={academic_year_discipline_summary.total_records}
                    icon={<Info className="h-5 w-5 text-primary opacity-70" />}
                  />
                  <InfoItem
                    label={t("incidents")}
                    value={academic_year_discipline_summary.incidents}
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    valueClass={
                      academic_year_discipline_summary.incidents > 0
                        ? "text-destructive font-bold"
                        : "text-muted-foreground"
                    }
                  />
                  <InfoItem
                    label={t("merits")}
                    value={academic_year_discipline_summary.merits}
                    icon={<Award className="h-5 w-5 text-green-500" />}
                    valueClass={
                      academic_year_discipline_summary.merits > 0
                        ? "text-success font-bold"
                        : "text-muted-foreground"
                    }
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {academic_year_discipline_summary?.message ||
                    t("noDisciplineData")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
