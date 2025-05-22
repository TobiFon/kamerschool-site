import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, UserCheck, UserX, Clock, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchClassMetrics } from "@/queries/attendance";

interface AttendanceSummaryProps {
  classId: string;
}

interface DateRange {
  fromDate: Date | undefined;
  toDate: Date | undefined;
}

const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({ classId }) => {
  const t = useTranslations("Classes");
  const [dateRange, setDateRange] = useState<DateRange>({
    fromDate: undefined,
    toDate: undefined,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Format dates for API
  const formatDate = (date: Date | undefined) => {
    if (!date) return undefined;
    return date.toISOString().split("T")[0];
  };

  // Query attendance data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["classMetrics", classId, dateRange.fromDate, dateRange.toDate],
    queryFn: () =>
      fetchClassMetrics(classId, {
        from_date: formatDate(dateRange.fromDate),
        to_date: formatDate(dateRange.toDate),
      }),
    enabled: !!classId,
  });

  const handleApplyFilter = () => {
    refetch();
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    setDateRange({ fromDate: undefined, toDate: undefined });
    setIsFilterOpen(false);
    refetch();
  };

  // Calculate percentages for visualization
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const getTotalEntries = () => {
    if (!data?.overall_stats) return 0;
    const { present, absent, late, excused } = data.overall_stats;
    return present + absent + late + excused;
  };

  const presentPercentage = data?.overall_stats
    ? calculatePercentage(data.overall_stats.present, getTotalEntries())
    : 0;

  const absentPercentage = data?.overall_stats
    ? calculatePercentage(data.overall_stats.absent, getTotalEntries())
    : 0;

  const latePercentage = data?.overall_stats
    ? calculatePercentage(data.overall_stats.late, getTotalEntries())
    : 0;

  const excusedPercentage = data?.overall_stats
    ? calculatePercentage(data.overall_stats.excused, getTotalEntries())
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 border-b px-6 py-4 flex flex-row justify-between items-center">
        <CardTitle className="flex items-center text-lg">
          <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
          {t("attendanceSummary")}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          {t("filterByDate")}
        </Button>
      </CardHeader>

      {isFilterOpen && (
        <div className="p-4 bg-slate-50 border-b">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium">{t("fromDate")}</label>
              <DatePicker
                date={dateRange.fromDate}
                setDate={(date) =>
                  setDateRange((prev) => ({ ...prev, fromDate: date }))
                }
                className="w-full"
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium">{t("toDate")}</label>
              <DatePicker
                date={dateRange.toDate}
                setDate={(date) =>
                  setDateRange((prev) => ({ ...prev, toDate: date }))
                }
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApplyFilter}>
                {t("apply")}
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetFilter}>
                {t("reset")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : isError ? (
          <div className="text-center p-6 text-red-500">
            <p>{t("errorLoadingAttendance")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              {t("tryAgain")}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <p className="text-sm text-gray-500">
                  {dateRange.fromDate && dateRange.toDate
                    ? `${formatDate(dateRange.fromDate)} - ${formatDate(
                        dateRange.toDate
                      )}`
                    : t("allTimeData")}
                </p>
                <p className="text-sm font-medium">
                  {t("schoolDays")}:{" "}
                  {data?.overall_stats?.total_school_days || 0}
                </p>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${presentPercentage}%` }}
                />
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${absentPercentage}%` }}
                />
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${latePercentage}%` }}
                />
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${excusedPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-800">
                      {t("present")}
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {data?.overall_stats?.present || 0}
                    </p>
                  </div>
                </div>
                <div className="relative h-1 w-full bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-green-500"
                    style={{ width: `${presentPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-green-700 mt-1 text-right">
                  {presentPercentage}%
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <UserX className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-800">
                      {t("absent")}
                    </p>
                    <p className="text-lg font-bold text-red-900">
                      {data?.overall_stats?.absent || 0}
                    </p>
                  </div>
                </div>
                <div className="relative h-1 w-full bg-red-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-red-500"
                    style={{ width: `${absentPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-red-700 mt-1 text-right">
                  {absentPercentage}%
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-800">
                      {t("late")}
                    </p>
                    <p className="text-lg font-bold text-amber-900">
                      {data?.overall_stats?.late || 0}
                    </p>
                  </div>
                </div>
                <div className="relative h-1 w-full bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-amber-500"
                    style={{ width: `${latePercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-amber-700 mt-1 text-right">
                  {latePercentage}%
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-800">
                      {t("excused")}
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {data?.overall_stats?.excused || 0}
                    </p>
                  </div>
                </div>
                <div className="relative h-1 w-full bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-500"
                    style={{ width: `${excusedPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700 mt-1 text-right">
                  {excusedPercentage}%
                </p>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              <p>
                {t("totalStudents")}: {data?.overall_stats?.total_students || 0}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceSummary;
