"use client";
import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart as LineChartIcon,
  Award,
  BarChart3,
  BookOpen,
  PercentCircle,
  School,
  Users,
  TrendingUp,
  TrendingDown,
  Users2,
  Briefcase,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatPercentage, getTrend } from "@/lib/utils";

// MetricCard Component
const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = "blue",
}) => {
  const t = useTranslations("Analytics"); // Initialize translations
  const colorClasses = {
    blue: "from-blue-100 to-blue-200 text-blue-700 border-blue-300",
    green: "from-green-100 to-green-200 text-green-700 border-green-300",
    purple: "from-purple-100 to-purple-200 text-purple-700 border-purple-300",
    amber: "from-amber-100 to-amber-200 text-amber-700 border-amber-300",
  };

  return (
    <Card className="shadow-lg rounded-lg overflow-hidden transform transition hover:scale-105">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-6`}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-sm font-medium opacity-80">{title}</span>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold">{value}</span>
                {trend !== undefined && (
                  <span className="ml-2 flex items-center text-sm">
                    {trend > 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-500 mr-1" />
                    ) : trend < 0 ? (
                      <TrendingDown className="h-5 w-5 text-red-500 mr-1" />
                    ) : null}
                    <span
                      className={
                        trend > 0
                          ? "text-green-600"
                          : trend < 0
                          ? "text-red-600"
                          : "text-gray-500"
                      }
                    >
                      {trend > 0 ? "+" : ""}
                      {trend}%
                    </span>
                  </span>
                )}
              </div>
              {description && (
                <p className="mt-1 text-xs opacity-75">{description}</p>
              )}
            </div>
            <div className="flex items-center justify-center rounded-full bg-white/90 p-3 shadow-md">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// GradeDistributionChart Component
const GradeDistributionChart = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  const COLORS = ["#34D399", "#A3E635", "#F59E0B", "#F87171"];

  const gradeData = useMemo(() => {
    return [
      { name: t("excellent"), value: data?.grade_distribution?.Excellent || 0 },
      { name: t("good"), value: data?.grade_distribution?.Good || 0 },
      { name: t("average"), value: data?.grade_distribution?.Average || 0 },
      {
        name: t("belowAvg"),
        value: data?.grade_distribution?.BelowAverage || 0,
      },
    ].filter((item) => item.value > 0);
  }, [data, t]);

  if (gradeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">{t("noGradeData")}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={gradeData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) =>
            percent > 0.05 ? `${name}: ${(percent * 100).toFixed(1)}%` : ""
          }
        >
          {gradeData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "0.5rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          formatter={(value) => [`${value} ${t("students")}`, "Count"]}
          labelFormatter={(name) => `${t("grade")}: ${name}`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// TrendChart Component
const TrendChart = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  const trendData = useMemo(() => {
    if (data?.trend_analysis) {
      return [
        {
          name:
            data.trend_analysis.previous_sequence ||
            data.trend_analysis.previous_term ||
            t("previousPeriod"),
          average: parseFloat(data.trend_analysis.previous_average) || 0,
          percentChange: parseFloat(data.trend_analysis.percent_change) || 0,
        },
        {
          name: t("current"),
          average: parseFloat(data.trend_analysis.current_average) || 0,
          percentChange: 0,
        },
      ];
    }
    return [];
  }, [data, t]);

  if (trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <p className="text-gray-500 font-medium">{t("noTrendData")}</p>
      </div>
    );
  }

  const isImproving = trendData[1].average > trendData[0].average;
  const percentChange = trendData[0].percentChange;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {t("performanceTrend")}
          </h3>
          <div className="flex items-center mt-1">
            <span
              className={`text-sm font-medium ${
                isImproving ? "text-green-600" : "text-red-600"
              }`}
            >
              {isImproving ? "▲" : "▼"} {Math.abs(percentChange).toFixed(2)}%
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {isImproving ? t("improvement") : t("decline")}{" "}
              {t("fromPreviousPeriod")}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 pt-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              domain={[
                Math.min(0, Math.min(...trendData.map((d) => d.average))),
                Math.max(...trendData.map((d) => d.average)) * 1.1,
              ]}
            />
            <CartesianGrid
              vertical={false}
              stroke="#F3F4F6"
              strokeDasharray="3 3"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke={isImproving ? "#10B981" : "#EF4444"}
              strokeWidth={3}
              dot={{
                stroke: isImproving ? "#10B981" : "#EF4444",
                strokeWidth: 2,
                r: 6,
              }}
              activeDot={{
                stroke: isImproving ? "#10B981" : "#EF4444",
                strokeWidth: 3,
                r: 8,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ClassComparisonChart Component
const ClassComparisonChart = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  const classData = useMemo(() => {
    if (!data?.class_summary || !Array.isArray(data.class_summary)) return [];
    return data.class_summary
      .slice(0, 10)
      .map((cls) => ({
        name: cls.class_name,
        average: parseFloat(cls.average) || 0,
        passRate: (parseFloat(cls.pass_rate) || 0) * 100,
        schoolAverage: parseFloat(data.average) || 0,
        is_top_class: cls.is_top_class,
      }))
      .sort((a, b) => b.average - a.average);
  }, [data]);

  if (classData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">{t("noClassData")}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={classData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={50} />
        <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend verticalAlign="top" height={36} iconSize={10} />
        <Bar
          dataKey="average"
          name={t("classAverage")}
          fill="#0ea5e9"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="passRate"
          name={t("passRate")}
          fill="#84cc16"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// SubjectPerformanceChart Component
const SubjectPerformanceChart = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  const subjectData = useMemo(() => {
    if (!data?.subject_summary || !Array.isArray(data.subject_summary))
      return [];
    return data.subject_summary
      .slice(0, 10)
      .map((subj) => ({
        name: subj.subject_name,
        average: parseFloat(subj.average) || 0,
        passRate: (parseFloat(subj.pass_rate) || 0) * 100,
      }))
      .sort((a, b) => b.average - a.average);
  }, [data]);

  if (subjectData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">{t("noSubjectData")}</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={subjectData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 12 }} />
        <YAxis
          dataKey="name"
          type="category"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Legend verticalAlign="top" height={36} iconSize={10} />
        <Bar
          dataKey="average"
          name={t("subjectAverage")}
          fill="#6366f1"
          radius={[0, 4, 4, 0]}
        />
        <Bar
          dataKey="passRate"
          name={t("passRate")}
          fill="#ec4899"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// TopStudentsList Component
const TopStudentsList = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  const topStudents = data?.top_students || [];

  if (topStudents.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
        <p className="text-gray-500">{t("noStudentData")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-80">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("rank")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("student")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("class")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t("average")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {topStudents.map((student, index) => (
            <tr
              key={student.student_id || index}
              className={
                index < 3 ? "bg-amber-50" : "hover:bg-gray-50 transition"
              }
            >
              <td className="px-4 py-2 whitespace-nowrap">
                {index < 3 ? (
                  <span
                    className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-white font-medium ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : "bg-amber-700"
                    }`}
                  >
                    {student.rank || index + 1}
                  </span>
                ) : (
                  <span className="text-gray-500 pl-2">
                    {student.rank || index + 1}
                  </span>
                )}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {student.name}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {student.class_name}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  {parseFloat(student.average).toFixed(1)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// StatisticsChart Component
const StatisticsChart = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  const stats = [
    { name: t("stdDev"), value: data.std_deviation },
    { name: t("percentile25"), value: data.percentile_25 },
    { name: t("median"), value: data.percentile_50 },
    { name: t("percentile75"), value: data.percentile_75 },
    { name: t("iqr"), value: data.interquartile_range },
  ];

  return (
    <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
      <CardHeader className="pb-2 px-6 pt-4 border-b">
        <CardTitle className="text-lg font-semibold">
          {t("scoreDistributionStatistics")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={stats}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="value"
              fill="#0ea5e9"
              barSize={50}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// DemographicPerformance Component
const DemographicPerformance = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  const sexData = useMemo(() => data.demographic_breakdown?.sex || [], [data]);
  const ageData = useMemo(
    () => data.demographic_breakdown?.age_groups || [],
    [data]
  );

  return (
    <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
      <CardHeader className="pb-2 px-6 pt-4 border-b">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Users2 className="h-5 w-5 mr-2 text-teal-500" />
          {t("performanceByDemographics")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold mb-2 text-gray-700">
              {t("bySex")}
            </h4>
            {sexData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sexData}>
                  <CartesianGrid strokeDasharray="4 4" />
                  <XAxis dataKey="sex" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="avg_score"
                    fill="#14b8a6"
                    name={t("averageScore")}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">{t("noSexData")}</p>
            )}
          </div>
          <div>
            <h4 className="text-md font-semibold mb-2 text-gray-700">
              {t("byAgeGroup")}
            </h4>
            {ageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="4 4" />
                  <XAxis dataKey="age_group" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="avg_score"
                    fill="#0d9488"
                    name={t("averageScore")}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">{t("noAgeData")}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// TeacherEffectiveness Component
const TeacherEffectiveness = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  const teachers = data.teacher_effectiveness || [];

  if (teachers.length === 0) {
    return (
      <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
        <CardHeader className="pb-2 px-6 pt-4 border-b">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-indigo-500" />
            {t("teacherEffectiveness")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <p className="text-gray-500">{t("noTeacherData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
      <CardHeader className="pb-2 px-6 pt-4 border-b">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-indigo-500" />
          {t("teacherEffectiveness")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="overflow-auto max-h-80">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("teacher")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("avgClassScore")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("stdDev")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("classesTaught")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {teacher.teacher_name || t("unknown")}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold">
                    {teacher.avg_class_score.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {teacher.std_dev.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {teacher.classes_taught}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Main SchoolMetricsAndCharts Component
const SchoolMetricsAndCharts = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="averageScore"
          value={formatPercentage(data.average)}
          icon={BarChart3}
          trend={getTrend(data, "average")}
          description="overallSchoolAverage"
          color="blue"
        />
        <MetricCard
          title="passRate"
          value={formatPercentage(data.pass_rate * 100) + "%"}
          icon={PercentCircle}
          trend={getTrend(data, "pass_rate")}
          description="studentsAbovePassingThreshold"
          color="green"
        />
        <MetricCard
          title="attendanceRate"
          value={formatPercentage(data.attendance_rate * 100) + "%"}
          icon={Users}
          trend={getTrend(data, "attendance_rate")}
          description="averageStudentAttendance"
          color="purple"
        />
        <MetricCard
          title="topScore"
          value={formatPercentage(data.top_score)}
          icon={Award}
          description="highestStudentAverage"
          color="amber"
        />
      </div>

      {/* Distribution and Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
          <CardHeader className="pb-2 px-6 pt-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
              {t("gradeDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <GradeDistributionChart data={data} />
          </CardContent>
        </Card>
        <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
          <CardHeader className="pb-2 px-6 pt-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center">
              <LineChartIcon className="h-5 w-5 mr-2 text-blue-500" />
              {t("performanceTrends")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <TrendChart data={data} />
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution Statistics */}
      <div className="mb-6">
        <StatisticsChart data={data} />
      </div>

      {/* Subject and Class Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
          <CardHeader className="pb-2 px-6 pt-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-purple-500" />
              {t("subjectPerformance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <SubjectPerformanceChart data={data} />
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
          <CardHeader className="pb-2 px-6 pt-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center">
              <School className="h-5 w-5 mr-2 text-blue-500" />
              {t("classComparison")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <ClassComparisonChart data={data} />
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="mb-6">
        <Card className="shadow-lg bg-white rounded-lg overflow-hidden">
          <CardHeader className="pb-2 px-6 pt-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Award className="h-5 w-5 mr-2 text-amber-500" />
              {t("topPerformingStudents")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <TopStudentsList data={data} />
          </CardContent>
        </Card>
      </div>

      {/* Additional Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DemographicPerformance data={data} />
        <TeacherEffectiveness data={data} />
      </div>
    </>
  );
};

export default SchoolMetricsAndCharts;
