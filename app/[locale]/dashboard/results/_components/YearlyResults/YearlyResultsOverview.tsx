"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  LineChart,
  Trophy,
  Award,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";

const YearlyResultsOverviewTab = ({
  classStatistics,
  topStudents,
  worstStudents,
  getAverageColor,
  getAverageBg,
}) => {
  const t = useTranslations("YearlyResults");

  // Helper function to get performance text
  const getPerformanceText = (average) => {
    if (average >= 16) return t("excellent");
    if (average >= 14) return t("veryGood");
    if (average >= 12) return t("good");
    if (average >= 10) return t("average");
    return t("needsImprovement");
  };

  return (
    <div className="space-y-8">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">{t("totalStudents")}</p>
              <h3 className="text-3xl font-bold mt-1">
                {classStatistics.total_students}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex space-x-3 items-center">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${classStatistics.pass_percentage}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">
              {classStatistics.pass_percentage.toFixed(0)}%
            </span>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">{t("passed")}</p>
              <h3 className="text-3xl font-bold mt-1">
                {classStatistics.passed_students}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex space-x-1 items-center">
            <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200">
              {classStatistics.passed_students > 0
                ? `+${Math.round(
                    (classStatistics.passed_students /
                      classStatistics.total_students) *
                      100
                  )}%`
                : "0%"}
            </Badge>
            <span className="text-sm text-gray-500">{t("ofTotal")}</span>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">{t("failed")}</p>
              <h3 className="text-3xl font-bold mt-1">
                {classStatistics.failed_students}
              </h3>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <UserX className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex space-x-1 items-center">
            <Badge className="bg-red-50 hover:bg-red-50 text-red-700 border border-red-200">
              {classStatistics.failed_students > 0
                ? `+${Math.round(
                    (classStatistics.failed_students /
                      classStatistics.total_students) *
                      100
                  )}%`
                : "0%"}
            </Badge>
            <span className="text-sm text-gray-500">{t("ofTotal")}</span>
          </div>
        </Card>

        <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm">{t("classAverage")}</p>
              <h3 className="text-3xl font-bold mt-1">
                {classStatistics.class_average.toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <LineChart className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex space-x-3 items-center">
            <span
              className={`text-sm ${getAverageColor(
                classStatistics.class_average
              )} font-medium`}
            >
              {classStatistics.class_average >= 10
                ? t("passingAverage")
                : t("failingAverage")}
            </span>
            <Badge variant="outline" className="ml-1">
              /20
            </Badge>
          </div>
        </Card>
      </div>

      {/* Additional Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t("passRate")}</p>
                <h3 className="text-3xl font-bold mt-1 text-emerald-600">
                  {classStatistics.pass_percentage.toFixed(1)}%
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">
                {t("studentsAboveAverage")}
              </p>
              <Progress
                value={classStatistics.pass_percentage}
                className="h-2"
              />
            </div>
          </div>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t("highestAverage")}</p>
                <h3 className="text-3xl font-bold mt-1 text-blue-600">
                  {classStatistics.highest_average.toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">{t("performance")}</p>
              <Progress
                value={classStatistics.highest_average * 5}
                className="h-2 mb-2"
              />
              <Badge className={getAverageBg(classStatistics.highest_average)}>
                {getPerformanceText(classStatistics.highest_average)}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm">{t("lowestAverage")}</p>
                <h3 className="text-3xl font-bold mt-1 text-red-600">
                  {classStatistics.lowest_average.toFixed(2)}
                </h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">{t("performance")}</p>
              <Progress
                value={classStatistics.lowest_average * 5}
                className="h-2 mb-2"
              />
              <Badge className={getAverageBg(classStatistics.lowest_average)}>
                {getPerformanceText(classStatistics.lowest_average)}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Students, Worst Students & Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Students */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 border-b">
            <h3 className="font-bold flex items-center">
              <Trophy className="h-5 w-5 text-amber-500 mr-2" />
              {t("topStudents")}
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {topStudents.map((student, index) => (
              <div
                key={student.student_id || index}
                className="flex items-center space-x-4"
              >
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full font-bold text-white
                    ${
                      index === 0
                        ? "bg-amber-500"
                        : index === 1
                        ? "bg-gray-400"
                        : "bg-amber-700"
                    }
                  `}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{student.student_name}</p>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Badge
                      className={`mr-2 ${getAverageBg(student.yearly_average)}`}
                    >
                      {parseFloat(student.yearly_average).toFixed(2)}/20
                    </Badge>
                    <span>• Rank {student.class_rank}</span>
                  </div>
                </div>
                {index === 0 && <Award className="h-5 w-5 text-amber-500" />}
              </div>
            ))}
          </div>
        </Card>

        {/* Worst Students */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 border-b">
            <h3 className="font-bold flex items-center">
              <ArrowDown className="h-5 w-5 text-red-500 mr-2" />
              {t("studentsNeedingHelp")}
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {worstStudents.map((student, index) => (
              <div
                key={student.student_id || index}
                className="flex items-center space-x-4"
              >
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full font-bold text-white
                    bg-red-500
                  `}
                >
                  {student.class_rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{student.student_name}</p>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Badge
                      className={`mr-2 ${getAverageBg(student.yearly_average)}`}
                    >
                      {parseFloat(student.yearly_average).toFixed(2)}/20
                    </Badge>
                    <span>• {t("needsImprovement")}</span>
                  </div>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Distribution */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 border-b">
            <h3 className="font-bold flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
              {t("performanceDistribution")}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-emerald-600">
                  {t("excellent")} (16-20)
                </span>
                <span className="font-medium">
                  {classStatistics.excellent_count || 0}
                </span>
              </div>
              <Progress
                value={
                  ((classStatistics.excellent_count || 0) /
                    classStatistics.total_students) *
                  100
                }
                className="h-2 bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-600">
                  {t("veryGood")} (14-16)
                </span>
                <span className="font-medium">
                  {classStatistics.very_good_count || 0}
                </span>
              </div>
              <Progress
                value={
                  ((classStatistics.very_good_count || 0) /
                    classStatistics.total_students) *
                  100
                }
                className="h-2 bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-green-600">
                  {t("good")} (12-14)
                </span>
                <span className="font-medium">
                  {classStatistics.good_count || 0}
                </span>
              </div>
              <Progress
                value={
                  ((classStatistics.good_count || 0) /
                    classStatistics.total_students) *
                  100
                }
                className="h-2 bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-amber-600">
                  {t("average")} (10-12)
                </span>
                <span className="font-medium">
                  {classStatistics.average_count || 0}
                </span>
              </div>
              <Progress
                value={
                  ((classStatistics.average_count || 0) /
                    classStatistics.total_students) *
                  100
                }
                className="h-2 bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-red-600">
                  {t("needsImprovement")} (0-10)
                </span>
                <span className="font-medium">
                  {classStatistics.needs_improvement_count || 0}
                </span>
              </div>
              <Progress
                value={
                  ((classStatistics.needs_improvement_count || 0) /
                    classStatistics.total_students) *
                  100
                }
                className="h-2 bg-gray-100"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Subject Performance */}
      {classStatistics.subject_statistics &&
        classStatistics.subject_statistics.length > 0 && (
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6 border-b">
              <h3 className="font-bold flex items-center">
                <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                {t("subjectAnalysis")}
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classStatistics.subject_statistics
                  .sort((a, b) => b.average - a.average)
                  .map((subject) => (
                    <div
                      key={subject.subject_id}
                      className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{subject.subject_name}</p>
                        <Badge variant="outline" className="text-gray-600">
                          {t("coefficient")}: {subject.coefficient}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">
                            {t("average")}
                          </p>
                          <p
                            className={`font-bold text-lg ${getAverageColor(
                              subject.average
                            )}`}
                          >
                            {subject.average.toFixed(2)}/20
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            {t("passRate")}
                          </p>
                          <p className="font-bold text-lg">
                            {subject.pass_percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {t("highestScore")}: {subject.highest || 0}/20
                          </span>
                          <span>
                            {t("lowestScore")}: {subject.lowest || 0}/20
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              subject.pass_percentage >= 75
                                ? "bg-emerald-500"
                                : subject.pass_percentage >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${subject.pass_percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span
                            className={`font-medium ${
                              subject.pass_percentage >= 75
                                ? "text-emerald-600"
                                : subject.pass_percentage >= 50
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {subject.pass_percentage >= 75
                              ? t("excellent")
                              : subject.pass_percentage >= 50
                              ? t("satisfactory")
                              : t("needsImprovement")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {subject.pass_count || 0}/
                            {subject.total || classStatistics.total_students}{" "}
                            {t("passed")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        )}
    </div>
  );
};

export default YearlyResultsOverviewTab;
