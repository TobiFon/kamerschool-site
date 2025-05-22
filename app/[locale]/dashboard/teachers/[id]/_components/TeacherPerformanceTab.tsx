import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Loader2,
  TrendingUp,
  BarChart3,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchTeacherPerformance } from "@/queries/teachers";

const TeacherPerformanceTab = ({
  teacherId,
}: {
  teacherId: number | string;
}) => {
  const t = useTranslations("Teachers");
  const { data, isLoading, error } = useQuery({
    queryKey: ["teacherPerformance", teacherId],
    queryFn: () => fetchTeacherPerformance(teacherId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
          <p className="text-gray-500">{t("loadingPerformanceData")}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-sm">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            {t("errorLoadingPerformance")}
          </h2>
          <p className="text-sm text-red-600 mb-4">
            {t("performanceDataUnavailable")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { overall_metrics, subject_breakdown, term_trends } = data;

  // Helper function to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 65) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">
                {t("averageScore")}
              </h3>
              <div className="rounded-full p-2 bg-blue-100">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(
                overall_metrics.average_score
              )}`}
            >
              {overall_metrics.average_score.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("outOf100")}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">
                {t("passRate")}
              </h3>
              <div className="rounded-full p-2 bg-green-100">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(
                overall_metrics.pass_rate
              )}`}
            >
              {overall_metrics.pass_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("passingStudents")}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">
                {t("excellent")}
              </h3>
              <div className="rounded-full p-2 bg-purple-100">
                <BookOpen className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {(
                (overall_metrics.grade_distribution.excellent /
                  overall_metrics.total_students) *
                100
              ).toFixed(1)}
              %
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {overall_metrics.grade_distribution.excellent}{" "}
              {t("studentsWithExcellent")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">
                {t("totalStudents")}
              </h3>
              <div className="rounded-full p-2 bg-gray-100">
                <BookOpen className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {overall_metrics.total_students}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("acrossAllClasses")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="bg-gray-50 border-b px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {t("gradeDistribution")}
          </CardTitle>
          <CardDescription>{t("overallGradeDistribution")}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Grade Distribution Bar */}
          <div className="mb-6">
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div
                className="bg-green-500 h-full flex items-center justify-center"
                style={{
                  width: `${
                    (overall_metrics.grade_distribution.excellent /
                      overall_metrics.total_students) *
                    100
                  }%`,
                }}
              >
                <span className="text-xs text-white font-medium px-1">
                  {overall_metrics.grade_distribution.excellent >
                  overall_metrics.total_students * 0.1
                    ? `${Math.round(
                        (overall_metrics.grade_distribution.excellent /
                          overall_metrics.total_students) *
                          100
                      )}%`
                    : ""}
                </span>
              </div>
              <div
                className="bg-blue-500 h-full flex items-center justify-center"
                style={{
                  width: `${
                    (overall_metrics.grade_distribution.good /
                      overall_metrics.total_students) *
                    100
                  }%`,
                }}
              >
                <span className="text-xs text-white font-medium px-1">
                  {overall_metrics.grade_distribution.good >
                  overall_metrics.total_students * 0.1
                    ? `${Math.round(
                        (overall_metrics.grade_distribution.good /
                          overall_metrics.total_students) *
                          100
                      )}%`
                    : ""}
                </span>
              </div>
              <div
                className="bg-yellow-500 h-full flex items-center justify-center"
                style={{
                  width: `${
                    (overall_metrics.grade_distribution.average /
                      overall_metrics.total_students) *
                    100
                  }%`,
                }}
              >
                <span className="text-xs text-white font-medium px-1">
                  {overall_metrics.grade_distribution.average >
                  overall_metrics.total_students * 0.1
                    ? `${Math.round(
                        (overall_metrics.grade_distribution.average /
                          overall_metrics.total_students) *
                          100
                      )}%`
                    : ""}
                </span>
              </div>
              <div
                className="bg-red-500 h-full flex items-center justify-center"
                style={{
                  width: `${
                    (overall_metrics.grade_distribution.below_average /
                      overall_metrics.total_students) *
                    100
                  }%`,
                }}
              >
                <span className="text-xs text-white font-medium px-1">
                  {overall_metrics.grade_distribution.below_average >
                  overall_metrics.total_students * 0.1
                    ? `${Math.round(
                        (overall_metrics.grade_distribution.below_average /
                          overall_metrics.total_students) *
                          100
                      )}%`
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <div>
                <p className="text-sm font-medium">{t("excellent")}</p>
                <p className="text-xs text-gray-500">
                  {overall_metrics.grade_distribution.excellent} {t("students")}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <div>
                <p className="text-sm font-medium">{t("good")}</p>
                <p className="text-xs text-gray-500">
                  {overall_metrics.grade_distribution.good} {t("students")}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <div>
                <p className="text-sm font-medium">{t("average")}</p>
                <p className="text-xs text-gray-500">
                  {overall_metrics.grade_distribution.average} {t("students")}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <div>
                <p className="text-sm font-medium">{t("belowAverage")}</p>
                <p className="text-xs text-gray-500">
                  {overall_metrics.grade_distribution.below_average}{" "}
                  {t("students")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Term Trends */}
      <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="bg-gray-50 border-b px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {t("termTrends")}
          </CardTitle>
          <CardDescription>{t("performanceOverTime")}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {term_trends.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium">{t("term")}</TableHead>
                    <TableHead className="font-medium">
                      {t("averageScore")}
                    </TableHead>
                    <TableHead className="font-medium">
                      {t("passRate")}
                    </TableHead>
                    <TableHead className="font-medium">{t("change")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {term_trends.map((trend, idx) => {
                    // Calculate change from previous term
                    const previousScore =
                      idx > 0 ? term_trends[idx - 1].avg_score : null;
                    const scoreChange =
                      previousScore !== null
                        ? trend.avg_score - previousScore
                        : null;

                    return (
                      <TableRow key={idx} className="hover:bg-gray-50 border-b">
                        <TableCell className="font-medium">
                          {trend.term_name}
                        </TableCell>
                        <TableCell className={getScoreColor(trend.avg_score)}>
                          {trend.avg_score.toFixed(1)}
                        </TableCell>
                        <TableCell>{trend.pass_rate.toFixed(1)}%</TableCell>
                        <TableCell>
                          {scoreChange !== null && (
                            <span
                              className={
                                scoreChange >= 0
                                  ? "text-green-600 flex items-center"
                                  : "text-red-600 flex items-center"
                              }
                            >
                              {scoreChange >= 0 ? (
                                <TrendingUp className="h-4 w-4 mr-1" />
                              ) : (
                                <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />
                              )}
                              {Math.abs(scoreChange).toFixed(1)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>{t("noTermTrends")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject Breakdown */}
      <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="bg-gray-50 border-b px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {t("subjectBreakdown")}
          </CardTitle>
          <CardDescription>{t("performanceBySubject")}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {subject_breakdown.length ? (
            <div className="space-y-8">
              {subject_breakdown.map((subject) => {
                // Compute aggregated average score and pass rate for the subject
                const subjectAvgScore =
                  subject.class_performance.reduce(
                    (acc: number, curr: any) => acc + curr.avg_score,
                    0
                  ) / subject.class_performance.length;
                const subjectPassRate =
                  subject.class_performance.reduce(
                    (acc: number, curr: any) => acc + curr.pass_rate,
                    0
                  ) / subject.class_performance.length;

                return (
                  <div
                    key={subject.subject_id}
                    className="border-b pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {subject.subject_name}
                      </h3>
                      <div className="flex space-x-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getScoreColor(
                            subjectAvgScore
                          )
                            .replace("text-", "bg-")
                            .replace("600", "100")} ${getScoreColor(
                            subjectAvgScore
                          )}`}
                        >
                          {t("avg")}: {subjectAvgScore.toFixed(1)}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-600">
                          {t("pass")}: {subjectPassRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-medium">
                              {t("class")}
                            </TableHead>
                            <TableHead className="font-medium">
                              {t("averageScore")}
                            </TableHead>
                            <TableHead className="font-medium">
                              {t("passRate")}
                            </TableHead>
                            <TableHead className="font-medium">
                              {t("students")}
                            </TableHead>
                            <TableHead className="font-medium">
                              {t("distribution")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subject.class_performance.map((perf: any) => (
                            <TableRow
                              key={perf.class_id}
                              className="hover:bg-gray-50 border-b"
                            >
                              <TableCell className="font-medium">
                                {perf.class_name}
                              </TableCell>
                              <TableCell
                                className={getScoreColor(perf.avg_score)}
                              >
                                {perf.avg_score.toFixed(1)}
                              </TableCell>
                              <TableCell>
                                {perf.pass_rate.toFixed(1)}%
                              </TableCell>
                              <TableCell>{perf.total_students}</TableCell>
                              <TableCell>
                                <div className="flex h-6 w-32 rounded overflow-hidden">
                                  <div
                                    className="bg-green-500 h-full"
                                    style={{
                                      width: `${
                                        (perf.grade_distribution.excellent /
                                          perf.total_students) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                  <div
                                    className="bg-blue-500 h-full"
                                    style={{
                                      width: `${
                                        (perf.grade_distribution.good /
                                          perf.total_students) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                  <div
                                    className="bg-yellow-500 h-full"
                                    style={{
                                      width: `${
                                        (perf.grade_distribution.average /
                                          perf.total_students) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                  <div
                                    className="bg-red-500 h-full"
                                    style={{
                                      width: `${
                                        (perf.grade_distribution.below_average /
                                          perf.total_students) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>{t("noSubjectBreakdown")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherPerformanceTab;
