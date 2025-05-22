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

const SubjectAnalysis = ({ data }) => {
  const t = useTranslations("SubjectAnalysis");
  const [sortField, setSortField] = useState("average_score");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");

  if (!data) return null;

  const {
    period_info,
    subject_analysis,
    breakdown,
    breakdown_type,
    school_info,
  } = normalizeData(data);

  // Sort subjects based on the selected field and direction
  const sortedSubjects = [...subject_analysis].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  // Filter subjects if a filter is applied
  const filteredSubjects = subjectFilter
    ? sortedSubjects.filter((subject) =>
        subject.subject_name.toLowerCase().includes(subjectFilter.toLowerCase())
      )
    : sortedSubjects;

  // Toggle sort direction or change sort field
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Get the color for score badges based on分支 value
  const getScoreColor = (score) => {
    if (score >= 16) return "bg-green-100 text-green-800";
    if (score >= 14) return "bg-emerald-100 text-emerald-800";
    if (score >= 10) return "bg-blue-100 text-blue-800";
    return "bg-red-100 text-red-800";
  };

  // Get color intensity for heatmap cells (darker blue = higher value)
  const getHeatmapColor = (score) => {
    if (!score) return "bg-gray-50 text-gray-400";
    const intensity = Math.min(Math.floor((score / 20) * 9) + 1, 9);
    return `bg-blue-${intensity}00 ${
      intensity > 5 ? "text-white" : "text-blue-900"
    }`;
  };

  return (
    <div className="space-y-6">
      {/* Header with overview metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {subject_analysis.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {(
                    subject_analysis.reduce(
                      (sum, subj) => sum + subj.pass_rate,
                      0
                    ) / subject_analysis.length
                  ).toFixed(1)}
                  %
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {(
                    subject_analysis.reduce(
                      (sum, subj) => sum + subj.average_score,
                      0
                    ) / subject_analysis.length
                  ).toFixed(1)}
                  /20
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {subject_analysis[0]?.subject_name || "-"}
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
                  <Badge className="ml-3 bg-blue-100 text-blue-800 border-0">
                    {period_info.name}
                  </Badge>
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

              {/* Filters section */}
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
                      <TableHead className="font-medium">
                        {t("subject")}
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        {t("coefficient")}
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
                        {t("students")}
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
                    {filteredSubjects.map((subject) => (
                      <TableRow key={subject.subject_id}>
                        <TableCell className="font-medium">
                          {subject.subject_name}
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
                    ))}

                    {filteredSubjects.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
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
                <Badge className="ml-3 bg-blue-100 text-blue-800 border-0">
                  {period_info.name}
                </Badge>
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
                                    {score || "-"}
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
                  {period_info.type === "sequence" ? (
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

// Helper function to normalize data structure from backend
function normalizeData(data) {
  if (data.sequence_info) {
    return {
      school_info: data.school_info,
      period_info: {
        type: "sequence",
        id: data.sequence_info.id,
        name: data.sequence_info.name,
        parent: data.sequence_info.term,
      },
      subject_analysis: data.subject_analysis,
      breakdown: [],
      breakdown_type: null,
    };
  }

  if (data.term_info) {
    return {
      school_info: data.school_info,
      period_info: {
        type: "term",
        id: data.term_info.id,
        name: data.term_info.name,
        parent: data.term_info.year,
      },
      subject_analysis: data.subject_analysis,
      breakdown: data.sequence_breakdown.map((item) => ({
        subject_name: item.subject_name,
        period_name: item.sequence,
        avg_score: item.avg_score,
      })),
      breakdown_type: "sequence",
    };
  }

  if (data.academic_year_info) {
    return {
      school_info: data.school_info,
      period_info: {
        type: "year",
        id: data.academic_year_info.id,
        name: data.academic_year_info.name,
      },
      subject_analysis: data.subject_analysis,
      breakdown: data.term_breakdown.map((item) => ({
        subject_name: item.subject_name,
        period_name: item.term,
        avg_score: item.avg_score,
      })),
      breakdown_type: "term",
    };
  }

  return data;
}

// Helper function to get unique period names from the breakdown data
function getUniquePeriodNames(breakdown) {
  return [...new Set(breakdown.map((item) => item.period_name))];
}

// Group breakdown data by subject name
function groupBySubject(breakdown) {
  return breakdown.reduce((acc, item) => {
    if (!acc[item.subject_name]) {
      acc[item.subject_name] = [];
    }
    acc[item.subject_name].push(item);
    return acc;
  }, {});
}

export default SubjectAnalysis;
