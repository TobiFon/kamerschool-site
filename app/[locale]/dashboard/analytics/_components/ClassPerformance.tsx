"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  LineChart,
  PieChart,
  AlertCircle,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  School,
  BookOpen,
  Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ClassMetrics = ({ data, timeScope }) => {
  const t = useTranslations("ClassMetrics");

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg shadow-sm">
        <p>{t("noDataAvailable")}</p>
      </div>
    );
  }

  const {
    class_info,
    sequence_info,
    term_info,
    year_info,
    overall_performance,
    grade_distribution,
    subject_performance,
    top_students,
    risk_analysis,
    largest_performance_gaps,
  } = data;

  // Dynamic period display based on timeScope
  let periodDisplay;
  if (timeScope === "sequence" && sequence_info) {
    periodDisplay = t("sequencePeriod", {
      sequence: sequence_info.name,
      term: sequence_info.term,
      year: sequence_info.year,
    });
  } else if (timeScope === "term" && term_info) {
    periodDisplay = t("termPeriod", {
      term: term_info.name,
      year: term_info.year,
    });
  } else if (timeScope === "year" && year_info) {
    periodDisplay = t("yearPeriod", { year: year_info.name });
  } else {
    periodDisplay = t("unknownPeriod");
  }

  // Sort subject performance by average score (descending)
  const sortedSubjects = [...subject_performance].sort(
    (a, b) => b.avg_score - a.avg_score
  );

  return (
    <div className="space-y-8 p-4 bg-gray-100 rounded-xl shadow-inner">
      {/* Class Overview Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <School className="mr-2 h-6 w-6 text-primary" />
              {class_info.name}
            </h2>
            <p className="text-gray-500 mt-1">{periodDisplay}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge
              className={`px-3 py-1.5 text-sm ${
                overall_performance.comparison_to_school >= 0
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {overall_performance.comparison_to_school >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {t("comparisonToSchool", {
                points: Math.abs(
                  overall_performance.comparison_to_school
                ).toFixed(1),
                direction:
                  overall_performance.comparison_to_school >= 0
                    ? t("above")
                    : t("below"),
              })}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {t("classAverage")}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {overall_performance.class_average.toFixed(2)}/20
                  </h3>
                </div>
                <div
                  className={`rounded-full p-2 ${
                    overall_performance.comparison_to_school >= 0
                      ? "bg-green-100 text-green-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {overall_performance.comparison_to_school >= 0 ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )}
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  {t("schoolAverage", {
                    average: overall_performance.school_average.toFixed(2),
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {t("passRate")}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {overall_performance.pass_rate.toFixed(1)}%
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-2">
                <Progress
                  value={overall_performance.pass_rate}
                  className="h-2 bg-blue-100"
                  indicatorClassName="bg-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {t("totalStudents")}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {overall_performance.total_students}
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-indigo-100 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  {t("range", {
                    lowest: overall_performance.lowest_average.toFixed(2),
                    highest: overall_performance.highest_average.toFixed(2),
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {t("atRiskStudents")}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {risk_analysis.total_at_risk}
                  </h3>
                </div>
                <div className="rounded-full p-2 bg-red-100 text-red-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  {t("percentageOfClass", {
                    percentage:
                      risk_analysis.total_at_risk_percentage.toFixed(1),
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Charts & Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary" />
              {t("gradeDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-green-700">
                    {t("excellent")}
                  </span>
                  <span className="text-gray-600">
                    {t("studentsCount", {
                      count: grade_distribution.excellent,
                    })}
                  </span>
                </div>
                <Progress
                  value={
                    (grade_distribution.excellent /
                      overall_performance.total_students) *
                    100
                  }
                  className="h-2 bg-green-100"
                  indicatorClassName="bg-green-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-700">{t("good")}</span>
                  <span className="text-gray-600">
                    {t("studentsCount", { count: grade_distribution.good })}
                  </span>
                </div>
                <Progress
                  value={
                    (grade_distribution.good /
                      overall_performance.total_students) *
                    100
                  }
                  className="h-2 bg-blue-100"
                  indicatorClassName="bg-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-yellow-700">
                    {t("average")}
                  </span>
                  <span className="text-gray-600">
                    {t("studentsCount", { count: grade_distribution.average })}
                  </span>
                </div>
                <Progress
                  value={
                    (grade_distribution.average /
                      overall_performance.total_students) *
                    100
                  }
                  className="h-2 bg-yellow-100"
                  indicatorClassName="bg-yellow-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-red-700">
                    {t("belowAverage")}
                  </span>
                  <span className="text-gray-600">
                    {t("studentsCount", {
                      count: grade_distribution.below_average,
                    })}
                  </span>
                </div>
                <Progress
                  value={
                    (grade_distribution.below_average /
                      overall_performance.total_students) *
                    100
                  }
                  className="h-2 bg-red-100"
                  indicatorClassName="bg-red-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-primary" />
              {t("riskAnalysis")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col justify-center h-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {risk_analysis.high_risk}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {t("highRisk")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t("percentageOfClass", {
                      percentage: risk_analysis.high_risk_percentage.toFixed(1),
                    })}
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {risk_analysis.moderate_risk}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {t("moderateRisk")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t("percentageOfClass", {
                      percentage:
                        risk_analysis.moderate_risk_percentage.toFixed(1),
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {t("totalAtRisk")}
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    {t("studentsCount", { count: risk_analysis.total_at_risk })}
                  </span>
                </div>
                <Progress
                  value={risk_analysis.total_at_risk_percentage}
                  className="h-2 mt-2 bg-gray-200"
                  indicatorClassName="bg-red-500"
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {t("percentageOfClass", {
                    percentage:
                      risk_analysis.total_at_risk_percentage.toFixed(1),
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              {t("topStudents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-auto pr-2">
              {top_students.map((student, index) => (
                <div
                  key={student.student_id}
                  className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        index < 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {student.rank}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {student.name}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-primary">
                    {student.average.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-primary" />
            {t("subjectPerformance")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-600">
                    {t("subject")}
                  </th>
                  <th className="text-center p-3 font-medium text-gray-600">
                    {t("coefficient")}
                  </th>
                  <th className="text-center p-3 font-medium text-gray-600">
                    {t("average")}
                  </th>
                  <th className="text-center p-3 font-medium text-gray-600">
                    {t("passRate")}
                  </th>
                  <th className="text-center p-3 font-medium text-gray-600">
                    {t("vsSchool")}
                  </th>
                  <th className="text-center p-3 font-medium text-gray-600">
                    {t("standardDev")}
                  </th>
                  <th className="text-center p-3 font-medium text-gray-600">
                    {t("gradeDistribution")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSubjects.map((subject, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium">{subject.subject_name}</td>
                    <td className="p-3 text-center">{subject.coefficient}</td>
                    <td className="p-3 text-center font-medium">
                      {subject.avg_score.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            subject.pass_rate >= 70
                              ? "bg-green-100 text-green-800"
                              : subject.pass_rate >= 50
                              ? "bg-blue-100 text-blue-800"
                              : subject.pass_rate >= 40
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {subject.pass_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div
                        className={`flex items-center justify-center ${
                          subject.comparison > 0
                            ? "text-green-600"
                            : subject.comparison < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {subject.comparison > 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : subject.comparison < 0 ? (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        ) : null}
                        {Math.abs(subject.comparison).toFixed(2)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {subject.std_dev.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-1 h-5">
                        <div
                          className="bg-green-500 rounded-l-sm"
                          style={{
                            width: `${
                              (subject.excellent_count /
                                overall_performance.total_students) *
                              100
                            }%`,
                          }}
                          title={`${subject.excellent_count} ${t("excellent")}`}
                        />
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${
                              (subject.good_count /
                                overall_performance.total_students) *
                              100
                            }%`,
                          }}
                          title={`${subject.good_count} ${t("good")}`}
                        />
                        <div
                          className="bg-yellow-500"
                          style={{
                            width: `${
                              (subject.average_count /
                                overall_performance.total_students) *
                              100
                            }%`,
                          }}
                          title={`${subject.average_count} ${t("average")}`}
                        />
                        <div
                          className="bg-red-500 rounded-r-sm"
                          style={{
                            width: `${
                              (subject.below_average_count /
                                overall_performance.total_students) *
                              100
                            }%`,
                          }}
                          title={`${subject.below_average_count} ${t(
                            "belowAverage"
                          )}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Gaps & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Gaps */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-primary" />
              {t("largestPerformanceGaps")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {largest_performance_gaps.map((gap, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{gap.subject_name}</div>
                    <div
                      className={`text-sm font-medium ${
                        gap.gap > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {gap.gap > 0 ? "+" : ""}
                      {gap.gap.toFixed(2)} {t("points")}
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 justify-between">
                    <div>
                      {t("classAvg", { avg: gap.class_avg.toFixed(2) })}
                    </div>
                    <div>
                      {t("schoolAvg", { avg: gap.school_avg.toFixed(2) })}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center">
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          gap.gap > 0 ? "bg-green-500" : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.abs(gap.gap) * 20)}%`,
                          marginLeft:
                            gap.gap > 0
                              ? `${50}%`
                              : `${50 - Math.min(50, Math.abs(gap.gap) * 10)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary" />
              {t("insightsAndRecommendations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overall Performance */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  {t("overallPerformance")}
                </h4>
                <p className="text-sm text-gray-600">
                  {overall_performance.comparison_to_school >= 0
                    ? t("performanceAbove", {
                        points:
                          overall_performance.comparison_to_school.toFixed(2),
                        passRate: overall_performance.pass_rate.toFixed(1),
                      })
                    : t("performanceBelow", {
                        points: Math.abs(
                          overall_performance.comparison_to_school
                        ).toFixed(2),
                        passRate: overall_performance.pass_rate.toFixed(1),
                      })}
                </p>
              </div>

              {/* Risk Assessment */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  {t("riskAssessment")}
                </h4>
                <p className="text-sm text-gray-600">
                  {risk_analysis.total_at_risk_percentage > 50
                    ? t("highRiskAssessment", {
                        percentage:
                          risk_analysis.total_at_risk_percentage.toFixed(1),
                        highRisk: risk_analysis.high_risk,
                      })
                    : t("lowRiskAssessment", {
                        totalAtRisk: risk_analysis.total_at_risk,
                        percentage:
                          risk_analysis.total_at_risk_percentage.toFixed(1),
                        highRisk: risk_analysis.high_risk,
                      })}
                </p>
              </div>

              {/* Subject Focus */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  {t("subjectFocusAreas")}
                </h4>
                <p className="text-sm text-gray-600">
                  {largest_performance_gaps.filter((gap) => gap.gap < 0)
                    .length > 0
                    ? t("improveSubjects", {
                        subjects: largest_performance_gaps
                          .filter((gap) => gap.gap < 0)
                          .map((gap) => gap.subject_name)
                          .join(", "),
                      })
                    : t("maintainPerformance")}
                </p>
              </div>

              {/* Distribution Analysis */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  {t("distributionAnalysis")}
                </h4>
                <p className="text-sm text-gray-600">
                  {grade_distribution.below_average >
                  grade_distribution.average +
                    grade_distribution.good +
                    grade_distribution.excellent
                    ? t("skewedDistribution", {
                        belowAverage: grade_distribution.below_average,
                      })
                    : t("balancedDistribution", {
                        highPerforming:
                          grade_distribution.excellent +
                          grade_distribution.good,
                      })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassMetrics;
