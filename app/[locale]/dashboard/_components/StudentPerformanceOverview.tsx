"use client";
import React, { useState, useEffect } from "react"; // Added useEffect
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar } from "react-chartjs-2";
import {
  TrendingUp,
  Award,
  ArrowDown,
  Users,
  CalendarDays, // Keep if used
  BookOpen,
  Info, // Import Info icon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components

// Chart colors (keep as is)
const chartColors = {
  primary: {
    backgroundColor: "rgba(53, 162, 235, 0.8)",
    borderColor: "rgb(53, 162, 235)",
  },
  secondary: {
    backgroundColor: "rgba(255, 99, 132, 0.8)",
    borderColor: "rgb(255, 99, 132)",
  },
  tertiary: {
    backgroundColor: "rgba(75, 192, 192, 0.8)",
    borderColor: "rgb(75, 192, 192)",
  },
  positive: {
    backgroundColor: "rgba(34, 197, 94, 0.8)",
    borderColor: "rgb(34, 197, 94)",
  },
  negative: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    borderColor: "rgb(239, 68, 68)",
  },
};

// Safe number formatter (keep as is)
const safeToFixed = (value, digits = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return null; // Return null for easier checking later
  }
  try {
    return Number(value).toFixed(digits);
  } catch (error) {
    console.error("Error in safeToFixed:", error);
    return null;
  }
};

// Performance Data Type (keep as is or refine based on actual API response)
export type PerformanceDataType = {
  school_info?: { id: number; name: string };
  period_info?: {
    // Use a unified period_info structure from backend
    type: "sequence" | "term" | "year";
    details: {
      id: number;
      name: string;
      term?: string; // Optional for sequence
      term_name?: string; // Optional for sequence (alternative naming)
      term_id?: number; // Optional for sequence
      year?: string; // Optional for term/sequence
      year_name?: string; // Optional for term/sequence
      year_id?: number; // Optional for term/sequence
    };
  };
  // Deprecate sequence_info, term_info, year_info if period_info is reliable
  // sequence_info?: { id: number; name: string; term: string; year: string; };
  // term_info?: { id: number; name: string; year: string; };
  // year_info?: { id: number; name: string; };
  overall_performance: {
    average: number | null;
    pass_rate: number | null;
    total_students: number | null;
    highest_average: number | null;
    lowest_average: number | null;
  };
  grade_distribution: {
    excellent: number | null;
    good: number | null;
    average: number | null;
    below_average: number | null;
  };
  class_performance: Array<{
    class_id: number;
    class_name: string;
    avg_score: number | null;
    student_count: number | null;
    pass_rate: number | null;
    std_dev: number | null;
  }>;
  subject_performance: Array<{
    subject_name: string;
    avg_score: number | null;
    pass_rate: number | null;
    std_dev: number | null;
  }>;
  top_students?: Array<{
    student_id: number;
    name: string;
    average: number | null;
    rank: number | null;
    class_name: string;
  }>;
  // Add other fields if present in API response, e.g., teacher_effectiveness
  teacher_effectiveness?: any[];
};

export default function SchoolPerformanceOverview({
  performanceData,
  isLoading,
  error,
  onTimeChange,
  timeScope = "sequence", // Default timeScope received from parent
}: {
  performanceData: PerformanceDataType | undefined | null; // Can be null if fetch returns no data
  isLoading: boolean;
  error: Error | null;
  onTimeChange?: (timeScope: string) => void;
  timeScope?: string; // Make optional if default is reliable
}) {
  const t = useTranslations("schoolPerformance");
  // Use the timeScope prop directly, manage internal state only if needed locally
  // const [currentTimeScope, setCurrentTimeScope] = useState<string>(timeScope);

  // // Sync internal state if the prop changes (though useQuery dependency should handle refetch)
  // useEffect(() => {
  //   setCurrentTimeScope(timeScope);
  // }, [timeScope]);

  // Handle time scope change
  const handleTimeScopeChange = (value: string) => {
    // setCurrentTimeScope(value); // Update local state if using it
    if (onTimeChange) {
      onTimeChange(value); // Call parent handler to trigger query refetch
    }
  };

  // Determine current period info based on time scope and data
  const getPeriodInfo = () => {
    if (!performanceData?.period_info?.details) {
      // Fallback to trying older structures if period_info is missing
      if (performanceData?.sequence_info && timeScope === "sequence")
        return {
          name: performanceData.sequence_info.name,
          term: performanceData.sequence_info.term,
          year: performanceData.sequence_info.year,
        };
      if (performanceData?.term_info && timeScope === "term")
        return {
          name: performanceData.term_info.name,
          term: performanceData.term_info.name,
          year: performanceData.term_info.year,
        };
      if (performanceData?.year_info && timeScope === "year")
        return {
          name: performanceData.year_info.name,
          term: "",
          year: performanceData.year_info.name,
        };
      return { name: t("nA"), term: "", year: "" }; // Default if no info found
    }

    const { type, details } = performanceData.period_info;
    // Ensure we only show info relevant to the *current* selected timeScope
    if (type !== timeScope) {
      return { name: t("loading"), term: "", year: "" }; // Show loading/mismatch if types don't align
    }

    switch (type) {
      case "sequence":
        return {
          name: details.name || t("nA"),
          term: details.term || details.term_name || t("nA"), // Check both possible keys
          year: details.year || details.year_name || t("nA"),
        };
      case "term":
        return {
          name: details.name || t("nA"),
          term: details.name || t("nA"), // Term name is the main name here
          year: details.year || details.year_name || t("nA"),
        };
      case "year":
        return {
          name: details.name || t("nA"),
          term: "", // No term for year scope
          year: details.name || t("nA"), // Year name is the main name
        };
      default:
        return { name: t("nA"), term: "", year: "" };
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden bg-white shadow-lg animate-pulse">
          <CardHeader className="h-14 bg-gray-200"></CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden bg-white shadow-lg animate-pulse">
          <CardHeader className="h-14 bg-gray-200"></CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="h-56 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="grid gap-6 lg:grid-cols-1">
        {" "}
        {/* Use single column for error */}
        <Card className="overflow-hidden bg-white shadow-lg border-red-200 border">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">{t("error.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTitle>{t("error.fetchFailed")}</AlertTitle>
              <AlertDescription>
                {error.message || t("error.unknown")}
                <br />
                <span className="text-xs text-gray-500">
                  {t("error.tryAgain")}
                </span>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- No Data State ---
  // This check handles both API returning 404 (fetcher returns null)
  // and API returning 200 OK but with empty data object.
  if (!performanceData) {
    const getNoDataMessage = () => {
      switch (timeScope) {
        case "sequence":
          return t("noData.noSequenceData");
        case "term":
          return t("noData.noTermData");
        case "year":
          return t("noData.noYearData");
        default:
          return t("noData.performanceData");
      }
    };
    return (
      <div className="grid gap-6 lg:grid-cols-1">
        {" "}
        {/* Use single column for no data message */}
        <Card className="overflow-hidden bg-white shadow-lg">
          <CardHeader className="border-b p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="font-semibold text-lg text-gray-800 flex items-center justify-between">
              <div className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-indigo-600" />
                {t("performanceOverview.title")}
              </div>
              {/* Still show the time scope selector */}
              <div className="flex items-center space-x-2">
                <Select value={timeScope} onValueChange={handleTimeScopeChange}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue placeholder={t("selectPeriod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequence">{t("sequence")}</SelectItem>
                    <SelectItem value="term">{t("term")}</SelectItem>
                    <SelectItem value="year">{t("year")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center text-gray-500 py-12 flex flex-col items-center">
              <Info className="h-10 w-10 text-gray-400 mb-3" />
              <p>{getNoDataMessage()}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t("noData.checkPublish")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Data Available - Proceed with Rendering ---
  const periodInfo = getPeriodInfo();

  // Safe access to potentially null data with fallbacks
  const overallMetrics = performanceData.overall_performance || {};
  const overallAverage = safeToFixed(overallMetrics.average);
  const highestAverage = safeToFixed(overallMetrics.highest_average);
  const lowestAverage = safeToFixed(overallMetrics.lowest_average);
  const passRate = safeToFixed(overallMetrics.pass_rate);
  const totalStudents = overallMetrics.total_students ?? 0; // Fallback to 0

  const gradeDist = performanceData.grade_distribution || {};
  const excellent = gradeDist.excellent ?? 0;
  const good = gradeDist.good ?? 0;
  const average = gradeDist.average ?? 0;
  const belowAverage = gradeDist.below_average ?? 0;
  const hasGradeDistribution =
    excellent > 0 || good > 0 || average > 0 || belowAverage > 0;

  const subjectPerformance = performanceData.subject_performance || [];
  const hasSubjectPerformanceData = subjectPerformance.length > 0;

  const classPerformance = performanceData.class_performance || [];
  const hasClassPerformance = classPerformance.length > 0;

  const topStudentsList = performanceData.top_students || [];
  const hasTopStudents = topStudentsList.length > 0;

  // Prepare chart data only if data exists
  const topSubjects = hasSubjectPerformanceData
    ? [...subjectPerformance]
        .sort((a, b) => (b.avg_score ?? -1) - (a.avg_score ?? -1)) // Handle nulls in sort
        .slice(0, 5)
    : [];

  const lowestSubjects = hasSubjectPerformanceData
    ? [...subjectPerformance]
        .sort((a, b) => (a.avg_score ?? 999) - (b.avg_score ?? 999)) // Handle nulls, put them last
        .slice(0, 5)
    : [];

  const topSubjectsData = {
    labels: topSubjects.map((s) => s.subject_name || t("nA")),
    datasets: [
      {
        label: t("topSubjects"),
        data: topSubjects.map((s) => s.avg_score ?? 0), // Use 0 for null
        backgroundColor: chartColors.positive.backgroundColor,
        borderColor: chartColors.positive.borderColor,
        borderWidth: 1,
        borderRadius: 4, // Adjusted border width/radius
      },
    ],
  };

  const lowestSubjectsData = {
    labels: lowestSubjects.map((s) => s.subject_name || t("nA")),
    datasets: [
      {
        label: t("lowestSubjects"),
        data: lowestSubjects.map((s) => s.avg_score ?? 0),
        backgroundColor: chartColors.negative.backgroundColor,
        borderColor: chartColors.negative.borderColor,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const gradeDistributionData = {
    labels: [
      t("gradeDistribution.excellent"),
      t("gradeDistribution.good"),
      t("gradeDistribution.average"),
      t("gradeDistribution.belowAverage"),
    ],
    datasets: [
      {
        label: t("numberOfStudents"),
        data: [excellent, good, average, belowAverage],
        backgroundColor: [
          chartColors.primary.backgroundColor,
          chartColors.secondary.backgroundColor,
          chartColors.tertiary.backgroundColor,
          chartColors.negative.backgroundColor,
        ],
        borderColor: [
          chartColors.primary.borderColor,
          chartColors.secondary.borderColor,
          chartColors.tertiary.borderColor,
          chartColors.negative.borderColor,
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 20,
        grid: { display: true, color: "rgba(0,0,0,0.05)" },
        ticks: { stepSize: 5 },
      }, // Added stepSize
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            const rawValue = context.raw;
            const score = safeToFixed(rawValue, 2); // Use 2 decimal places for tooltip
            return `${context.dataset.label || ""}: ${
              score !== null ? score + "/20" : t("nA")
            }`;
          },
        },
      },
    },
    barPercentage: 0.6, // Adjust for spacing
    categoryPercentage: 0.8, // Adjust for spacing
  };
  const gradeChartOptions = {
    // Specific options for grade distribution
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: true, color: "rgba(0,0,0,0.05)" },
        ticks: { precision: 0 },
      }, // Ensure integer ticks
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            const rawValue = context.raw || 0;
            return `${t("students")}: ${rawValue}`;
          },
        },
      },
    },
    barPercentage: 0.6,
    categoryPercentage: 0.8,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* School Performance Overview Card */}
      <Card className="overflow-hidden bg-white shadow-lg">
        <CardHeader className="border-b p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="font-semibold text-lg text-gray-800 flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-indigo-600" />
              {t("performanceOverview.title")}
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={timeScope} // Use the prop directly
                onValueChange={handleTimeScopeChange}
              >
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder={t("selectPeriod")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequence">{t("sequence")}</SelectItem>
                  <SelectItem value="term">{t("term")}</SelectItem>
                  <SelectItem value="year">{t("year")}</SelectItem>
                </SelectContent>
              </Select>
              {/* Display Dynamic Period Info */}
              <div
                className="text-sm font-normal text-indigo-600 truncate"
                title={`${periodInfo.name}${
                  periodInfo.term ? ` - ${periodInfo.term}` : ""
                }${periodInfo.year ? ` (${periodInfo.year})` : ""}`}
              >
                {periodInfo.name}
                {periodInfo.term && periodInfo.term !== periodInfo.name
                  ? ` - ${periodInfo.term}`
                  : ""}
                {periodInfo.year ? ` (${periodInfo.year})` : ""}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Overall Metrics Grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            {/* Use || t("nA") as fallback for display */}
            <div className="flex flex-col items-center p-3 bg-indigo-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="text-2xl font-bold text-indigo-800">
                {overallAverage !== null ? `${overallAverage}/20` : t("nA")}
              </span>
              <span className="text-sm text-indigo-600 mt-1 text-center">
                {t("metrics.schoolAverage")}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-amber-50 rounded-lg">
              <Award className="h-8 w-8 text-amber-600 mb-2" />
              <span className="text-2xl font-bold text-amber-800">
                {highestAverage !== null ? `${highestAverage}/20` : t("nA")}
              </span>
              <span className="text-sm text-amber-600 mt-1 text-center">
                {t("metrics.highestAverage")}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
              <ArrowDown className="h-8 w-8 text-red-600 mb-2" />
              <span className="text-2xl font-bold text-red-800">
                {lowestAverage !== null ? `${lowestAverage}/20` : t("nA")}
              </span>
              <span className="text-sm text-red-600 mt-1 text-center">
                {t("metrics.lowestAverage")}
              </span>
            </div>
            <div className="flex flex-col items-center p-3 bg-emerald-50 rounded-lg">
              <Users className="h-8 w-8 text-emerald-600 mb-2" />
              <span className="text-2xl font-bold text-emerald-800">
                {passRate !== null ? `${passRate}%` : t("nA")}
              </span>
              <span className="text-sm text-emerald-600 mt-1 text-center">
                {t("metrics.passRate")}
              </span>
              {/* Show total students only if value exists */}
              {totalStudents > 0 && (
                <span className="text-xs text-emerald-600">
                  ({totalStudents} {t("students")})
                </span>
              )}
            </div>
          </div>

          {/* Conditional rendering for charts based on data */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                {t("topPerformingSubjects")}
              </h3>
              {hasSubjectPerformanceData && topSubjects.length > 0 ? (
                <div className="h-48">
                  {" "}
                  {/* Ensure fixed height */}
                  <Bar data={topSubjectsData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                  {t("noData.topSubjects")}
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                {t("lowestPerformingSubjects")}
              </h3>
              {hasSubjectPerformanceData && lowestSubjects.length > 0 ? (
                <div className="h-48">
                  <Bar data={lowestSubjectsData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                  {t("noData.lowestSubjects")}
                </div>
              )}
            </div>
          </div>

          {/* Class Performance List */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-base font-medium text-gray-800 mb-3">
              {t("classPerformance")}
            </h3>
            {hasClassPerformance ? (
              <div className="overflow-auto max-h-96 pr-1 space-y-2">
                {" "}
                {/* Adjusted max height */}
                {classPerformance.map((cls, index) => {
                  const classAvgScore = safeToFixed(cls.avg_score);
                  const classPassRate = safeToFixed(cls.pass_rate);
                  return (
                    <div
                      key={cls.class_id || index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {cls.class_name || t("nA")}
                        </span>
                        {/* Show student count and pass rate */}
                        <div className="text-xs text-gray-500 mt-1">
                          {(cls.student_count ?? 0) > 0
                            ? `${cls.student_count} ${t("students")}`
                            : ""}
                          {cls.pass_rate !== null
                            ? ` • ${classPassRate}% ${t("passRate")}`
                            : ""}
                        </div>
                      </div>
                      <span className="text-base font-semibold text-indigo-600">
                        {" "}
                        {/* Adjusted text size */}
                        {classAvgScore !== null
                          ? `${classAvgScore}/20`
                          : t("nA")}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                {t("noData.classPerformance")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution Card */}
      <Card className="overflow-hidden bg-white shadow-lg">
        <CardHeader className="border-b p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50">
          <CardTitle className="font-semibold text-lg text-gray-800 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
            {t("gradeDistribution.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-800 mb-3">
              {t("gradeDistribution.distribution")}
            </h3>
            {hasGradeDistribution ? (
              <div className="h-56">
                <Bar data={gradeDistributionData} options={gradeChartOptions} />
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
                {t("noData.gradeDistribution")}
              </div>
            )}
          </div>

          {/* Subject Performance Analysis Table */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-base font-medium text-gray-800 mb-3">
              {t("subjectPerformanceAnalysis")}
            </h3>
            {hasSubjectPerformanceData ? (
              <div className="overflow-auto max-h-[300px] pr-1">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("subject")}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("averageScore")}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("passRate")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjectPerformance.map((subject, index) => {
                      const subjectAvgScore = safeToFixed(subject.avg_score);
                      const subjectPassRate = safeToFixed(subject.pass_rate);
                      return (
                        <tr
                          key={`${subject.subject_name}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {subject.subject_name || t("nA")}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                subjectAvgScore === null
                                  ? "bg-gray-100 text-gray-600"
                                  : (subject.avg_score ?? 0) >= 10
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {subjectAvgScore !== null
                                ? `${subjectAvgScore}/20`
                                : t("nA")}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                subjectPassRate === null
                                  ? "bg-gray-100 text-gray-600"
                                  : (subject.pass_rate ?? 0) >= 50
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {subjectPassRate !== null
                                ? `${subjectPassRate}%`
                                : t("nA")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                {t("noData.subjectPerformance")}
              </div>
            )}
          </div>

          {/* Top Students Section */}
          {hasTopStudents && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-base font-medium text-gray-800 mb-3">
                {t("topStudents")}
              </h3>
              <div className="overflow-auto max-h-96 pr-1 space-y-2">
                {topStudentsList.map((student, index) => {
                  const studentAvg = safeToFixed(student.average);
                  return (
                    <div
                      key={student.student_id || index}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {student.name || t("nA")} (#{student.rank || "?"}){" "}
                          {/* Show rank */}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.class_name || t("nA")}
                        </div>
                      </div>
                      <span className="text-base font-semibold text-purple-600">
                        {studentAvg !== null ? `${studentAvg}/20` : t("nA")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
