import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  addWeeks,
  isSameDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Calendar,
  Users,
  Clock,
  FileCheck,
  FileX,
  InboxIcon,
} from "lucide-react";
import { fetchAttendanceMetrics } from "@/queries/schoolmetrix";
import { useTranslations } from "next-intl";

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return format(date, "MMM dd");
};

export default function AttendanceDashboard() {
  // Set up translations
  const t = useTranslations("attendance");

  // State for date ranges
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  // Calculate end of week
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Get the start of the current week for comparison
  const actualCurrentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Check if current week is selected - comparing dates properly
  const isCurrentWeek = isSameDay(currentWeekStart, actualCurrentWeekStart);

  // Fetch attendance data with react-query
  const {
    data: attendanceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "attendanceMetrics",
      currentWeekStart.toISOString(),
      currentWeekEnd.toISOString(),
    ],
    queryFn: () => fetchAttendanceMetrics(currentWeekStart, currentWeekEnd),
    staleTime: 5 * 60 * 1000,
  });

  // Navigation handlers
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    // Calculate the next week start
    const nextWeekStart = addWeeks(currentWeekStart, 1);

    // Don't allow navigating past the current week
    if (nextWeekStart <= actualCurrentWeekStart) {
      setCurrentWeekStart(nextWeekStart);
    }
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(actualCurrentWeekStart);
  };

  // Safely check if data exists and has content
  const hasOverviewData =
    attendanceData?.overview && Object.keys(attendanceData.overview).length > 0;

  const hasClassData =
    attendanceData?.by_class?.data &&
    Array.isArray(attendanceData.by_class.data) &&
    attendanceData.by_class.data.length > 0;

  // Format class data for enhanced visualization
  const classChartData = hasClassData
    ? attendanceData.by_class.data.map((classData) => ({
        name: classData.class_name,
        attendanceRate: classData.attendance_rate,
        totalStudents: classData.total_students,
        present: classData.present,
        late: classData.late,
        excused: classData.excused,
        absent: classData.absent,
        // Calculated metrics for better visualization
        presentRate: (classData.present / classData.total_students) * 100,
        lateRate: (classData.late / classData.total_students) * 100,
        excusedRate: (classData.excused / classData.total_students) * 100,
        absentRate: (classData.absent / classData.total_students) * 100,
      }))
    : [];

  // Sort class data by attendance rate (descending)
  classChartData.sort((a, b) => b.attendanceRate - a.attendanceRate);

  // Colors for different attendance types - enhanced palette
  const colors = {
    present: "#10b981", // Emerald green
    late: "#f59e0b", // Amber
    excused: "#3b82f6", // Blue
    absent: "#ef4444", // Red
    attendance: "#8b5cf6", // Purple for attendance rate
  };

  // Calculate average attendance rate for reference line
  const averageAttendance = hasOverviewData
    ? attendanceData.overview.attendance_rate || 0
    : 0;

  // Dynamically calculate height based on number of classes
  // Set a minimum height of 300px and add 40px per class
  const chartHeight = Math.max(300, classChartData.length * 40 + 100);

  // Custom tooltip for comprehensive class metrics
  const ClassMetricsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const classData = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <p className="text-xs text-gray-500 mb-3">
            {t("students", { count: classData.totalStudents })}
          </p>
          <div className="space-y-2">
            <p className="text-xs flex justify-between">
              <span className="flex items-center">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: colors.present }}
                ></span>
                {t("present")}:
              </span>
              <span className="font-medium" style={{ color: colors.present }}>
                {classData.present} ({classData.presentRate.toFixed(1)}%)
              </span>
            </p>
            <p className="text-xs flex justify-between">
              <span className="flex items-center">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: colors.late }}
                ></span>
                {t("late")}:
              </span>
              <span className="font-medium" style={{ color: colors.late }}>
                {classData.late} ({classData.lateRate.toFixed(1)}%)
              </span>
            </p>
            <p className="text-xs flex justify-between">
              <span className="flex items-center">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: colors.excused }}
                ></span>
                {t("excused")}:
              </span>
              <span className="font-medium" style={{ color: colors.excused }}>
                {classData.excused} ({classData.excusedRate.toFixed(1)}%)
              </span>
            </p>
            <p className="text-xs flex justify-between">
              <span className="flex items-center">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: colors.absent }}
                ></span>
                {t("absent")}:
              </span>
              <span className="font-medium" style={{ color: colors.absent }}>
                {classData.absent} ({classData.absentRate.toFixed(1)}%)
              </span>
            </p>
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs flex justify-between font-bold">
                <span>{t("attendanceRate")}:</span>
                <span
                  style={{
                    color:
                      classData.attendanceRate >= 90
                        ? colors.present
                        : classData.attendanceRate >= 80
                        ? colors.late
                        : colors.absent,
                  }}
                >
                  {classData.attendanceRate.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get attendance color based on rate
  const getAttendanceColor = (rate) => {
    if (rate >= 90) return colors.present;
    if (rate >= 80) return colors.late;
    return colors.absent;
  };

  // Empty state component
  const EmptyState = ({ message, icon: Icon = InboxIcon }) => (
    <div className="flex flex-col items-center justify-center h-40 text-gray-400 p-4">
      <Icon className="h-8 w-8 mb-3 text-gray-300" />
      <p className="text-center text-sm">{message}</p>
    </div>
  );

  return (
    <div className="space-y-8 p-6 bg-gray-50 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {t("attendanceMetrics")}
        </h2>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg shadow-sm">
          <Button
            onClick={handlePrevWeek}
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> {t("previous")}
          </Button>
          <Button
            onClick={handleCurrentWeek}
            variant={isCurrentWeek ? "default" : "outline"}
            size="sm"
            className={isCurrentWeek ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          >
            <Calendar className="h-4 w-4 mr-1" />
            {t("currentWeek")}
          </Button>
          <Button
            onClick={handleNextWeek}
            variant="ghost"
            size="sm"
            disabled={isCurrentWeek}
            className="hover:bg-gray-100"
          >
            {t("next")} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm text-center">
        <p className="text-lg font-medium text-gray-700">
          <span className="text-indigo-600 font-semibold">
            {format(currentWeekStart, "MMM dd")}
          </span>{" "}
          -
          <span className="text-indigo-600 font-semibold">
            {" "}
            {format(currentWeekEnd, "MMM dd, yyyy")}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overview Card */}
        <Card className="overflow-hidden border-none shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-2">
            <CardTitle className="text-lg flex items-center">
              <span className="bg-white p-2 rounded-full mr-2 shadow-sm">
                <Users className="h-5 w-5 text-indigo-600" />
              </span>
              {t("attendanceOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 text-red-500">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>{t("errorLoadingData")}</p>
              </div>
            ) : hasOverviewData ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl shadow-inner">
                  <span
                    className="text-4xl font-bold"
                    style={{
                      color: getAttendanceColor(
                        attendanceData.overview.attendance_rate
                      ),
                    }}
                  >
                    {attendanceData.overview.attendance_rate.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-600 mt-1">
                    {t("overallAttendance")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl shadow-sm border border-green-100">
                    <span className="text-xl font-semibold text-green-600">
                      {attendanceData.overview.present}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      {t("present")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-amber-50 rounded-xl shadow-sm border border-amber-100">
                    <span className="text-xl font-semibold text-amber-600">
                      {attendanceData.overview.late}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center mt-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-1"></span>
                      {t("late")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
                    <span className="text-xl font-semibold text-blue-600">
                      {attendanceData.overview.excused}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center mt-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      {t("excused")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-red-50 rounded-xl shadow-sm border border-red-100">
                    <span className="text-xl font-semibold text-red-600">
                      {attendanceData.overview.absent}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center mt-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                      {t("absent")}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-indigo-500" />
                      {t("totalStudents")}:
                    </span>
                    <span className="font-semibold">
                      {attendanceData.overview.total_students}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                      {t("schoolDays")}:
                    </span>
                    <span className="font-semibold">
                      {attendanceData.overview.total_school_days}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState message={t("noAttendanceData")} icon={Calendar} />
            )}
          </CardContent>
        </Card>

        {/* Comprehensive Class Attendance Chart - Takes 2/3 of the width */}
        <Card className="md:col-span-2 border-none shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-2">
            <CardTitle className="text-lg flex items-center">
              <span className="bg-white p-2 rounded-full mr-2 shadow-sm">
                <FileCheck className="h-5 w-5 text-indigo-600" />
              </span>
              {t("classAttendancePerformance")}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {hasClassData
                ? t("classesRanked", { count: classChartData.length })
                : t("classPerformanceSubtitle")}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-96 text-red-500">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>{t("errorLoadingChartData")}</p>
              </div>
            ) : hasClassData ? (
              <div
                className="rounded-lg bg-gray-50 p-4 shadow-inner"
                style={{
                  height: `${chartHeight}px`,
                  maxHeight: "600px",
                  overflowY: "auto",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classChartData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={90}
                      tick={{ fontSize: 12, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ClassMetricsTooltip />} />
                    <Legend
                      verticalAlign="top"
                      wrapperStyle={{ paddingBottom: "10px" }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <ReferenceLine
                      x={90}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{
                        value: t("target", { value: "90%" }),
                        fill: "#10b981",
                        fontSize: 11,
                        position: "insideTopLeft",
                      }}
                    />
                    <ReferenceLine
                      x={averageAttendance}
                      stroke="#8b5cf6"
                      strokeDasharray="3 3"
                      label={{
                        value: t("avg", {
                          value: averageAttendance.toFixed(1),
                        }),
                        fill: "#8b5cf6",
                        fontSize: 11,
                        position: "insideBottomLeft",
                      }}
                    />
                    <Bar
                      dataKey="presentRate"
                      name={t("present")}
                      stackId="a"
                      fill={colors.present}
                      radius={[4, 0, 0, 4]}
                    />
                    <Bar
                      dataKey="lateRate"
                      name={t("late")}
                      stackId="a"
                      fill={colors.late}
                    />
                    <Bar
                      dataKey="excusedRate"
                      name={t("excused")}
                      stackId="a"
                      fill={colors.excused}
                    />
                    <Bar
                      dataKey="absentRate"
                      name={t("absent")}
                      stackId="a"
                      fill={colors.absent}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96">
                <EmptyState message={t("noClassData")} icon={FileCheck} />
                <p className="text-sm text-gray-500 mt-4 max-w-md text-center">
                  {t("selectDifferentDateRange")}
                </p>
                <Button
                  onClick={handleCurrentWeek}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("backToCurrentWeek")}
                </Button>
              </div>
            )}
            {hasClassData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center">
                    <span className="flex items-center mr-4">
                      <span className="block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm text-gray-600">
                        {t("present")}
                      </span>
                    </span>
                    <span className="flex items-center mr-4">
                      <span className="block w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
                      <span className="text-sm text-gray-600">{t("late")}</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="flex items-center mr-4">
                      <span className="block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      <span className="text-sm text-gray-600">
                        {t("excused")}
                      </span>
                    </span>
                    <span className="flex items-center">
                      <span className="block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      <span className="text-sm text-gray-600">
                        {t("absent")}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row justify-between">
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="font-medium">
                      {t("target", { value: "90%" })}
                    </span>
                    {t("targetValue")}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center mt-2 sm:mt-0">
                    <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    <span className="font-medium">{t("schoolAverage")}:</span>{" "}
                    {averageAttendance.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
