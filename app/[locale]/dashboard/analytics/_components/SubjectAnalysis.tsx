// src/components/Analytics/_components/SubjectAnalysis.tsx

"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  Award,
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const SubjectAnalysis = ({
  data,
  isLoading,
  subjectFilter,
  setSubjectFilter,
  sortField,
  sortDirection,
  setSortField,
  setSortDirection,
}) => {
  const t = useTranslations("SubjectAnalysis");

  // Local state for UI toggles
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);

  if (!data && !isLoading) return null;

  const {
    period_info = {},
    subject_analysis = [],
    breakdown = [],
    breakdown_type = null,
  } = isLoading ? {} : normalizeData(data) || {};

  // The data is now pre-sorted and pre-filtered by the backend.
  const subjectsToDisplay = subject_analysis;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to descending when changing field
    }
  };

  const handleRowClick = (subjectId) => {
    setExpandedSubjectId(expandedSubjectId === subjectId ? null : subjectId);
  };

  const getScoreColor = (score) => {
    if (score >= 16) return "bg-green-100 text-green-800";
    if (score >= 14) return "bg-emerald-100 text-emerald-800";
    if (score >= 10) return "bg-blue-100 text-blue-800";
    return "bg-red-100 text-red-800";
  };

  const getHeatmapColor = (score) => {
    if (!score && score !== 0) return "bg-gray-50 text-gray-400";
    const intensity = Math.min(Math.floor((score / 20) * 9) + 1, 9);
    return `bg-blue-${intensity}00 ${
      intensity > 5 ? "text-white" : "text-blue-900"
    }`;
  };

  const bestSubject =
    sortField === "average_score" && sortDirection === "desc"
      ? subjectsToDisplay[0]
      : null;

  return (
    <div className="space-y-6">
      {/* Header with overview metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subjects */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("totalSubjects")}
                </p>
                <h3 className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    subject_analysis.length
                  )}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Pass Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-5 w-5 text-green-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("avgPassRate")}
                </p>
                <h3 className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${(subject_analysis.length > 0
                      ? subject_analysis.reduce(
                          (sum, subj) => sum + subj.pass_rate,
                          0
                        ) / subject_analysis.length
                      : 0
                    ).toFixed(1)}%`
                  )}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-indigo-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("avgScore")}
                </p>
                <h3 className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${(subject_analysis.length > 0
                      ? subject_analysis.reduce(
                          (sum, subj) => sum + subj.average_score,
                          0
                        ) / subject_analysis.length
                      : 0
                    ).toFixed(1)}/20`
                  )}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Subject */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="h-5 w-5 text-amber-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {t("bestSubject")}
                </p>
                <h3 className="text-2xl font-bold truncate max-w-36">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    bestSubject?.subject_name || t("notApplicable")
                  )}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid grid-cols-2 w-52">
          <TabsTrigger value="table" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t("tableView")}
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t("breakdownView")}
          </TabsTrigger>
        </TabsList>

        {/* Table View Content */}
        <TabsContent value="table" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  {t("subjectPerformanceAnalysis")}
                  {period_info.name && (
                    <Badge className="ml-3 bg-blue-100 text-blue-800 border-0">
                      {period_info.name}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-xs h-8"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                    {t("filters")}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                        {t("sortBy")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleSort("subject_name")}
                      >
                        {t("subjectName")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSort("average_score")}
                      >
                        {t("averageScore")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort("pass_rate")}>
                        {t("passRate")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSort("total_students")}
                      >
                        {t("numberOfStudents")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSort("coefficient")}
                      >
                        {t("coefficient")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label
                        htmlFor="subject-filter"
                        className="text-sm font-medium block mb-2"
                      >
                        {t("subjectName")}
                      </label>
                      <input
                        id="subject-filter"
                        type="text"
                        placeholder={t("filterBySubjectName")}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead
                        onClick={() => handleSort("subject_name")}
                        className="font-medium cursor-pointer"
                      >
                        <div className="flex items-center">
                          {t("subject")}
                          {sortField === "subject_name" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("coefficient")}
                        className="font-medium text-right cursor-pointer"
                      >
                        <div className="flex items-center justify-end">
                          {t("coefficient")}
                          {sortField === "coefficient" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        <div
                          onClick={() => handleSort("average_score")}
                          className="flex items-center justify-end cursor-pointer"
                        >
                          {t("averageScore")}
                          {sortField === "average_score" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        <div
                          onClick={() => handleSort("pass_rate")}
                          className="flex items-center justify-end cursor-pointer"
                        >
                          {t("passRate")}
                          {sortField === "pass_rate" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        <div
                          onClick={() => handleSort("total_students")}
                          className="flex items-center justify-end cursor-pointer"
                        >
                          {t("students")}
                          {sortField === "total_students" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-1 h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="font-medium">
                        {t("performance")}
                      </TableHead>
                      <TableHead className="font-medium">
                        {t("gradeDistribution")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center">
                          <div className="flex items-center justify-center text-gray-500">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="ml-3">
                              {t("loadingSubjectData")}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : subjectsToDisplay.length > 0 ? (
                      subjectsToDisplay.map((subject) => (
                        <React.Fragment key={subject.subject_id}>
                          <TableRow
                            onClick={() => handleRowClick(subject.subject_id)}
                            className="cursor-pointer hover:bg-gray-100/60"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {expandedSubjectId === subject.subject_id ? (
                                  <ChevronUp className="h-4 w-4 mr-2 text-primary transition-transform" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 mr-2 text-gray-400 transition-transform" />
                                )}
                                {subject.subject_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {subject.coefficient}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={getScoreColor(subject.average_score)}
                              >
                                {subject.average_score}/20
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={
                                  subject.pass_rate >= 70
                                    ? "bg-green-100 text-green-800"
                                    : subject.pass_rate >= 50
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                }
                              >
                                {subject.pass_rate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {subject.total_students}
                            </TableCell>
                            <TableCell>
                              <div className="w-full max-w-24">
                                <Progress
                                  value={subject.pass_rate}
                                  className="h-2"
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1 text-xs">
                                {/* Grade Distribution */}
                                <div className="flex flex-col items-center">
                                  <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                    {subject.grade_distribution.excellent}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {t("exc")}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                    {subject.grade_distribution.good}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {t("good")}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                    {subject.grade_distribution.average}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {t("avg")}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                                    {subject.grade_distribution.below_average}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {t("below")}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Collapsible Row for Class Breakdown */}
                          {expandedSubjectId === subject.subject_id && (
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableCell colSpan={7} className="p-0">
                                <div className="p-4">
                                  <h4 className="font-semibold text-sm mb-3 text-slate-700">
                                    {t("classBreakdownTitle", {
                                      subjectName: subject.subject_name,
                                    })}
                                  </h4>
                                  {subject.class_performance?.length > 0 ? (
                                    <Table className="bg-white rounded-md border">
                                      <TableHeader>
                                        <TableRow className="bg-slate-100">
                                          <TableHead className="font-medium">
                                            {t("class")}
                                          </TableHead>
                                          <TableHead className="font-medium text-right">
                                            {t("averageScore")}
                                          </TableHead>
                                          <TableHead className="font-medium text-right">
                                            {t("students")}
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {subject.class_performance.map(
                                          (perf) => (
                                            <TableRow
                                              key={perf.class_id}
                                              className="border-b-0"
                                            >
                                              <TableCell>
                                                {perf.class_name}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <Badge
                                                  className={getScoreColor(
                                                    perf.avg_score
                                                  )}
                                                >
                                                  {perf.avg_score}/20
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {perf.student_count}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <p className="text-sm text-slate-500 py-4 text-center">
                                      {t("noClassBreakdownData")}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-48 text-center py-8 text-gray-500"
                        >
                          {t("noSubjectDataFound")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown View Content */}
        <TabsContent value="breakdown" className="mt-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-gray-50 px-6 py-4">
              <CardTitle className="text-lg font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                {breakdown_type
                  ? t("breakdownTitle", { type: t(breakdown_type) })
                  : t("performanceBreakdown")}
                {period_info.name && (
                  <Badge className="ml-3 bg-blue-100 text-blue-800 border-0">
                    {period_info.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {breakdown && breakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-medium">
                          {t("subject")}
                        </TableHead>
                        {getUniquePeriodNames(breakdown).map((periodName) => (
                          <TableHead
                            key={periodName}
                            className="font-medium text-center"
                          >
                            {periodName}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupBySubject(breakdown)).map(
                        ([subject, periodScores]) => (
                          <TableRow key={subject}>
                            <TableCell className="font-medium">
                              {subject}
                            </TableCell>
                            {getUniquePeriodNames(breakdown).map(
                              (periodName) => {
                                const score = periodScores.find(
                                  (p) => p.period_name === periodName
                                )?.avg_score;
                                return (
                                  <TableCell
                                    key={`${subject}-${periodName}`}
                                    className={`text-center ${getHeatmapColor(
                                      score
                                    )}`}
                                  >
                                    {score != null ? score : "-"}
                                  </TableCell>
                                );
                              }
                            )}
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-3">{t("loadingBreakdown")}</span>
                    </div>
                  ) : period_info.type === "sequence" ? (
                    <p>{t("noBreakdownForSequences")}</p>
                  ) : (
                    <p>{t("noBreakdownDataAvailable")}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions (remain unchanged)
function normalizeData(data) {
  if (!data) return null;
  // This logic seems designed to handle different API response shapes based on time scope. It's fine to keep.
  if (data.period_info?.type === "sequence") {
    return {
      school_info: data.school_info,
      period_info: data.period_info,
      subject_analysis: data.subject_analysis,
      breakdown: [],
      breakdown_type: null,
    };
  }
  if (data.period_info?.type === "term") {
    return {
      school_info: data.school_info,
      period_info: data.period_info,
      subject_analysis: data.subject_analysis,
      breakdown: (data.breakdown || []).map((item) => ({
        subject_name: item.subject_name,
        period_name: item.period_name, // Backend provides period_name now
        avg_score: item.avg_score,
      })),
      breakdown_type: "sequence",
    };
  }
  if (data.period_info?.type === "year") {
    return {
      school_info: data.school_info,
      period_info: data.period_info,
      subject_analysis: data.subject_analysis,
      breakdown: (data.breakdown || []).map((item) => ({
        subject_name: item.subject_name,
        period_name: item.period_name, // Backend provides period_name now
        avg_score: item.avg_score,
      })),
      breakdown_type: "term",
    };
  }
  // Fallback for an unexpected data structure
  return data;
}

function getUniquePeriodNames(breakdown) {
  if (!breakdown) return [];
  return [...new Set(breakdown.map((item) => item.period_name))];
}

function groupBySubject(breakdown) {
  if (!breakdown) return {};
  return breakdown.reduce((acc, item) => {
    if (!acc[item.subject_name]) {
      acc[item.subject_name] = [];
    }
    acc[item.subject_name].push(item);
    return acc;
  }, {});
}

export default SubjectAnalysis;
