"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  InfoIcon,
  AwardIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";

const ClassComparisonView = ({ data }) => {
  const t = useTranslations("ClassComp");
  const [viewMode, setViewMode] = useState("average");

  if (!data || !data.class_comparison || data.class_comparison.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <InfoIcon className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t("noDataTitle")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{t("noDataDescription")}</p>
        </div>
      </div>
    );
  }

  // Sort classes by average score for the chart
  const sortedClasses = [...data.class_comparison].sort(
    (a, b) => b.average_score - a.average_score
  );

  // Prepare data for the charts
  const averageScoreData = sortedClasses.map((cls) => ({
    name: cls.class_name,
    score: cls.average_score,
    comparison: cls.comparison_to_school,
    fill: cls.comparison_to_school >= 0 ? "#4ade80" : "#f87171",
  }));

  const passRateData = sortedClasses.map((cls) => ({
    name: cls.class_name,
    rate: cls.pass_rate,
    fill: cls.pass_rate >= 50 ? "#4ade80" : "#f87171",
  }));

  const gradeDistributionData = sortedClasses.map((cls) => ({
    name: cls.class_name,
    excellent: cls.grade_distribution.excellent,
    good: cls.grade_distribution.good,
    average: cls.grade_distribution.average,
    belowAverage: cls.grade_distribution.below_average,
    total: cls.student_count,
  }));

  // Get top and bottom performers
  const topPerformer = sortedClasses[0];
  const bottomPerformer = sortedClasses[sortedClasses.length - 1];

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      if (viewMode === "average") {
        return (
          <div className="bg-white p-4 shadow-md rounded-md border border-gray-200">
            <p className="font-medium">{label}</p>
            <p className="text-sm">
              {t("averageScore")}: {payload[0].value.toFixed(2)}
            </p>
            <p className="text-sm">
              {t("vsSchoolAverage")}:{" "}
              {payload[0].payload.comparison >= 0 ? "+" : ""}
              {payload[0].payload.comparison.toFixed(2)}
            </p>
          </div>
        );
      } else if (viewMode === "pass-rate") {
        return (
          <div className="bg-white p-4 shadow-md rounded-md border border-gray-200">
            <p className="font-medium">{label}</p>
            <p className="text-sm">
              {t("passRate")}: {payload[0].value.toFixed(2)}%
            </p>
          </div>
        );
      } else {
        return (
          <div className="bg-white p-4 shadow-md rounded-md border border-gray-200">
            <p className="font-medium">{label}</p>
            <p className="text-sm">
              {t("excellent")}: {payload[0].value} {t("students")} (
              {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}
              %)
            </p>
            <p className="text-sm">
              {t("good")}: {payload[1].value} {t("students")} (
              {((payload[1].value / payload[0].payload.total) * 100).toFixed(1)}
              %)
            </p>
            <p className="text-sm">
              {t("average")}: {payload[2].value} {t("students")} (
              {((payload[2].value / payload[0].payload.total) * 100).toFixed(1)}
              %)
            </p>
            <p className="text-sm">
              {t("belowAverage")}: {payload[3].value} {t("students")} (
              {((payload[3].value / payload[0].payload.total) * 100).toFixed(1)}
              %)
            </p>
            <p className="text-sm font-medium mt-1">
              {t("total")}: {payload[0].payload.total} {t("students")}
            </p>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Period info header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {data.school_info.name}
          </h2>
          <div className="flex items-center mt-1">
            <Badge variant="outline" className="mr-2">
              {t(data.period_info.type)}
            </Badge>
            <span className="text-gray-600">
              {data.period_info.name}
              {data.period_info.term && ` - ${data.period_info.term}`}
              {data.period_info.year && ` (${data.period_info.year})`}
            </span>
          </div>
        </div>
        <Badge className="bg-primary px-3 py-1 text-white">
          {t("schoolAverage")}: {data.school_average}
        </Badge>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {t("totalClasses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.class_comparison.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <AwardIcon className="h-4 w-4 mr-1" />
              {t("topPerformingClass")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">
              {topPerformer.class_name}
            </div>
            <div className="text-sm flex items-center gap-1 mt-1">
              <span className="font-medium">
                {t("score")}: {topPerformer.average_score}
              </span>
              <TrendingUpIcon className="h-4 w-4 text-green-600" />
              <span className="text-green-600">
                +{topPerformer.comparison_to_school.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center">
              <TrendingDownIcon className="h-4 w-4 mr-1" />
              {t("lowestPerformingClass")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-700">
              {bottomPerformer.class_name}
            </div>
            <div className="text-sm flex items-center gap-1 mt-1">
              <span className="font-medium">
                {t("score")}: {bottomPerformer.average_score}
              </span>
              {bottomPerformer.comparison_to_school < 0 ? (
                <>
                  <TrendingDownIcon className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">
                    {bottomPerformer.comparison_to_school.toFixed(2)}
                  </span>
                </>
              ) : (
                <>
                  <TrendingUpIcon className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">
                    +{bottomPerformer.comparison_to_school.toFixed(2)}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different charts */}
      <Tabs
        defaultValue="average"
        className="w-full"
        onValueChange={setViewMode}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="average">{t("averageScores")}</TabsTrigger>
          <TabsTrigger value="pass-rate">{t("passRates")}</TabsTrigger>
          <TabsTrigger value="distribution">
            {t("gradeDistribution")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="average" className="p-4 border rounded-md mt-2">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={averageScoreData}
                margin={{ top: 5, right: 30, left: 20, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis domain={[0, 20]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="score" name={t("averageScore")} fill="#3b82f6" />
                <CartesianGrid
                  y={data.school_average}
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            <span className="inline-block h-2 w-2 bg-orange-500 rounded-full mr-1"></span>
            {t("schoolAverageLine", { average: data.school_average })}
          </div>
        </TabsContent>

        <TabsContent value="pass-rate" className="p-4 border rounded-md mt-2">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={passRateData}
                margin={{ top: 5, right: 30, left: 20, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="rate" name={t("passRate")} fill="#3b82f6" />
                <CartesianGrid
                  y={50}
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            <span className="inline-block h-2 w-2 bg-orange-500 rounded-full mr-1"></span>
            {t("passRateThreshold")}
          </div>
        </TabsContent>

        <TabsContent
          value="distribution"
          className="p-4 border rounded-md mt-2"
        >
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gradeDistributionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 120 }}
                barSize={20}
                barGap={0}
                barCategoryGap={10}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="excellent"
                  name={t("excellent")}
                  stackId="a"
                  fill="#22c55e"
                />
                <Bar
                  dataKey="good"
                  name={t("good")}
                  stackId="a"
                  fill="#3b82f6"
                />
                <Bar
                  dataKey="average"
                  name={t("average")}
                  stackId="a"
                  fill="#f97316"
                />
                <Bar
                  dataKey="belowAverage"
                  name={t("belowAverage")}
                  stackId="a"
                  fill="#ef4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>

      {/* Class breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("classPerformanceBreakdown")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("class")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("students")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("averageScore")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("vsSchool")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("passRate")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("gradeDistribution")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedClasses.map((cls, index) => (
                  <tr
                    key={cls.class_id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cls.class_name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {cls.student_count}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-medium">
                      {cls.average_score}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cls.comparison_to_school >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cls.comparison_to_school >= 0 ? "+" : ""}
                        {cls.comparison_to_school.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cls.pass_rate >= 50
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cls.pass_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-center space-x-1">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{
                            width: `${
                              (cls.grade_distribution.excellent /
                                cls.student_count) *
                              100
                            }%`,
                          }}
                        ></div>
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{
                            width: `${
                              (cls.grade_distribution.good /
                                cls.student_count) *
                              100
                            }%`,
                          }}
                        ></div>
                        <div
                          className="h-2 rounded-full bg-orange-500"
                          style={{
                            width: `${
                              (cls.grade_distribution.average /
                                cls.student_count) *
                              100
                            }%`,
                          }}
                        ></div>
                        <div
                          className="h-2 rounded-full bg-red-500"
                          style={{
                            width: `${
                              (cls.grade_distribution.below_average /
                                cls.student_count) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sequence/Term breakdown if available */}
      {(data.class_comparison[0]?.sequence_breakdown?.length > 0 ||
        data.class_comparison[0]?.term_breakdown?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {data.class_comparison[0]?.sequence_breakdown?.length > 0
                ? t("sequenceBreakdown")
                : t("termBreakdown")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("class")}
                    </th>
                    {data.class_comparison[0]?.sequence_breakdown?.length > 0
                      ? data.class_comparison[0].sequence_breakdown.map(
                          (seq) => (
                            <th
                              key={seq.sequence}
                              className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {seq.sequence}
                            </th>
                          )
                        )
                      : data.class_comparison[0]?.term_breakdown?.map(
                          (term) => (
                            <th
                              key={term.term}
                              className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {term.term}
                            </th>
                          )
                        )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedClasses.map((cls, index) => (
                    <tr
                      key={cls.class_id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cls.class_name}
                      </td>
                      {cls.sequence_breakdown?.length > 0
                        ? cls.sequence_breakdown.map((seq) => (
                            <td
                              key={seq.sequence}
                              className="px-4 py-4 whitespace-nowrap text-sm text-center"
                            >
                              {seq.avg_score}
                            </td>
                          ))
                        : cls.term_breakdown?.map((term) => (
                            <td
                              key={term.term}
                              className="px-4 py-4 whitespace-nowrap text-sm text-center"
                            >
                              {term.avg_score}
                            </td>
                          ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassComparisonView;
