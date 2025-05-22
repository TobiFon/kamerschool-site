"use client"; // Ensure this is present

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Loader2,
  Users,
  UserPlus,
  ListTodo,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  ClipboardCheck,
  ClipboardList,
  ClipboardX,
  AlertTriangle,
  Calendar,
  UserCheck, // More specific icon for confirmed
  ChevronDown,
  ChevronUp,
  ActivitySquare, // Icon for Overview tab
  LineChart as LineChartIcon, // Icon for Time Series
  School, // Icon for Classes tab
  GraduationCap,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress"; // Keep Progress for potential use
import { getEnrollmentStatistics } from "@/queries/promotions"; // Assume this query exists and works
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// --- Helper Functions ---
const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString();
};

// Define consistent colors (Expanded palette)
const COLORS = {
  blue: "#3b82f6", // Primary Actions, Confirmed (alt)
  emerald: "#10b981", // Success, Completed, Promoted
  amber: "#f59e0b", // Pending, Awaiting, Repeated
  purple: "#a855f7", // New Students, Transferred In, Other Gender
  red: "#ef4444", // Withdrawn, Errors
  sky: "#0ea5e9", // Conditional Promotion
  slate: "#64748b", // Default, Graduated, Transferred Out
  indigo: "#6366f1", // Ready Workflows
  pink: "#ec4899", // Female Gender
  teal: "#14b8a6", // Returning Students (alt)
  orange: "#f97316", // Highlight
};

const enrollmentStatusColors = {
  confirmed: COLORS.emerald,
  pending: COLORS.amber,
  withdrawn: COLORS.red,
  transferred_in: COLORS.purple,
  transferred_out: COLORS.slate,
  default: COLORS.slate,
};

const promotionStatusColors = {
  promoted: COLORS.emerald,
  conditional: COLORS.sky,
  repeated: COLORS.amber,
  graduated: COLORS.indigo, // Changed to indigo for distinctness
  default: COLORS.slate,
};

const workflowStageColors = {
  awaiting_promotion_decision: COLORS.amber,
  ready_for_enrollment: COLORS.blue, // Stage before enrollment confirmed
  enrollment_complete: COLORS.emerald,
  default: COLORS.slate,
};

const genderColors = {
  male: COLORS.blue,
  female: COLORS.pink,
  other: COLORS.purple,
  default: COLORS.slate,
};

// --- Reusable Stat Card Component ---
const StatCard = ({
  title,
  value,
  icon: Icon,
  colorName = "blue",
  trend = null, // { direction: 'up' | 'down', value: percentage }
  subtitle = null,
  isLoading = false,
}) => {
  const t = useTranslations("EnrollmentStatistics.statCard");
  const colorClasses = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", ring: "ring-blue-50" },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      ring: "ring-purple-50",
    },
    emerald: {
      bg: "bg-emerald-100",
      text: "text-emerald-600",
      ring: "ring-emerald-50",
    },
    amber: {
      bg: "bg-amber-100",
      text: "text-amber-600",
      ring: "ring-amber-50",
    },
    red: { bg: "bg-red-100", text: "text-red-600", ring: "ring-red-50" },
    indigo: {
      bg: "bg-indigo-100",
      text: "text-indigo-600",
      ring: "ring-indigo-50",
    },
  };
  const colors = colorClasses[colorName] || colorClasses.blue;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-5">
        {isLoading ? (
          <div className="flex items-start justify-between space-x-2">
            <div className="space-y-1.5">
              <Skeleton
                className="h-4 w-24 rounded"
                aria-label={t("loadingTitle")}
              />
              <Skeleton
                className="h-7 w-12 rounded"
                aria-label={t("loadingValue")}
              />
              <Skeleton className="h-3 w-20 rounded" />{" "}
              {/* Placeholder for subtitle */}
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between space-x-2 mb-2">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <div
                className={`rounded-full p-2 ${colors.bg} ${colors.ring} ring-2`}
              >
                <Icon className={`h-4 w-4 ${colors.text}`} />
              </div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
              )}
              {/* Trend indicator (example - not implemented with real data yet) */}
              {/* {trend && (
                <div className="flex items-center gap-1 mt-1.5">
                  {trend.direction === "up" ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${trend.direction === "up" ? "text-emerald-500" : "text-red-500"}`}>
                    {trend.value}% {trend.direction === "up" ? t("increase") : t("decrease")}
                  </span>
                </div>
              )} */}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Workflow Progress Component ---
const WorkflowProgress = ({ data, isLoading }) => {
  const t = useTranslations("EnrollmentStatistics");

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.workflow_overview) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-slate-500">
          {t("workflow.noData")}
        </CardContent>
      </Card>
    );
  }

  const totalWorkflows = data.workflow_overview?.total || 0;
  if (totalWorkflows === 0)
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-slate-500">
          {t("workflow.noData")}
        </CardContent>
      </Card>
    );

  // Use the correct keys from the backend response
  const awaiting =
    data.workflow_overview?.stage_breakdown?.awaiting_promotion_decision || 0;
  const ready =
    data.workflow_overview?.stage_breakdown?.ready_for_enrollment || 0; // Students promoted, ready for class assignment/confirmation
  const completed =
    data.workflow_overview?.stage_breakdown?.enrollment_complete || 0; // Enrollment process finished

  // Adjust calculation: What's the total we are visualizing? Total workflows.
  // The breakdown might not sum to total if other stages exist or are excluded.
  // We visualize the known stages as parts of the total.
  const awaitingPercent =
    totalWorkflows > 0 ? (awaiting / totalWorkflows) * 100 : 0;
  const readyPercent = totalWorkflows > 0 ? (ready / totalWorkflows) * 100 : 0;
  const completedPercent =
    totalWorkflows > 0 ? (completed / totalWorkflows) * 100 : 0;
  const otherPercent = Math.max(
    0,
    100 - awaitingPercent - readyPercent - completedPercent
  ); // Account for any other stages

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {t("workflow.progressTitle")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("workflow.progressDescription", {
            total: formatNumber(totalWorkflows),
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 w-full flex rounded-full overflow-hidden bg-slate-200">
            <div
              className="h-full"
              style={{
                width: `${awaitingPercent}%`,
                backgroundColor:
                  workflowStageColors.awaiting_promotion_decision,
              }}
              title={`${t("workflow.awaitingDecision")}: ${formatNumber(
                awaiting
              )} (${awaitingPercent.toFixed(1)}%)`}
            />
            <div
              className="h-full"
              style={{
                width: `${readyPercent}%`,
                backgroundColor: workflowStageColors.ready_for_enrollment,
              }}
              title={`${t("workflow.readyForEnrollment")}: ${formatNumber(
                ready
              )} (${readyPercent.toFixed(1)}%)`}
            />
            <div
              className="h-full"
              style={{
                width: `${completedPercent}%`,
                backgroundColor: workflowStageColors.enrollment_complete,
              }}
              title={`${t("workflow.completed")}: ${formatNumber(
                completed
              )} (${completedPercent.toFixed(1)}%)`}
            />
            {/* Optional: Visualize 'Other' stages if needed */}
            {/* <div
              className="h-full bg-slate-400"
              style={{ width: `${otherPercent}%` }}
              title={t("workflow.otherStages", { count: formatNumber(totalWorkflows - awaiting - ready - completed), percent: otherPercent.toFixed(1) })}
            /> */}
          </div>
          <div className="flex flex-wrap justify-between text-xs font-medium text-slate-600 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    workflowStageColors.awaiting_promotion_decision,
                }}
              ></span>
              <span>
                {t("workflow.awaitingDecision")}: {formatNumber(awaiting)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: workflowStageColors.ready_for_enrollment,
                }}
              ></span>
              <span>
                {t("workflow.readyForEnrollment")}: {formatNumber(ready)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: workflowStageColors.enrollment_complete,
                }}
              ></span>
              <span>
                {t("workflow.completed")}: {formatNumber(completed)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Custom Tooltip for Charts ---
const CustomTooltip = ({ active, payload, label, formatter, valueLabel }) => {
  const t = useTranslations("EnrollmentStatistics.charts"); // Namespace for chart tooltips if needed

  if (active && payload && payload.length) {
    const dataItem = payload[0].payload; // Access the data item object

    // Determine the main label (could be category name or a formatted label like month)
    const displayLabel = dataItem.name || label || "";

    return (
      <div className="bg-white/95 backdrop-blur-sm p-2.5 border border-slate-200 rounded-md shadow-lg text-sm z-50">
        {displayLabel && (
          <p className="font-semibold mb-1 text-slate-700">{displayLabel}</p>
        )}
        {payload.map((entry, index) => {
          // entry.name is often the dataKey ('value', 'count', 'size')
          // entry.payload.name holds the specific category name ('New', 'Confirmed', 'Class A')
          const itemName = entry.payload.name || entry.name; // Prefer payload name if available
          const itemValue = formatter
            ? formatter(entry.value)
            : formatNumber(entry.value);
          const itemColor = entry.color || entry.fill || COLORS.slate;

          // Determine label for the value (e.g., "Students", "Count")
          let finalValueLabel = valueLabel || t("tooltipValue"); // Default "Value" or specific label
          if (entry.name === "count") finalValueLabel = t("tooltipCount");
          if (entry.name === "size") finalValueLabel = t("tooltipSize");

          return (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: itemColor }}
                ></span>
                <span className="text-slate-600">{itemName}:</span>
              </div>
              <span className="font-medium text-slate-800">{itemValue}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// --- Time Series Chart Component ---
const TimeSeriesChart = ({ data, isLoading }) => {
  const t = useTranslations("EnrollmentStatistics.charts.timeSeries");

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const timeSeriesData = data?.charts?.enrollments_over_time;
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm italic">
        {t("noData")}
      </div>
    );
  }

  // Format dates and create cumulative data
  const formattedData = [...timeSeriesData]
    .sort((a, b) => new Date(a.month) - new Date(b.month)) // Ensure chronological order
    .map((item, index, array) => {
      const date = new Date(item.month);
      // Use short month name + year for clarity
      const monthName = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();

      // Calculate cumulative total up to this point
      const cumulativeCount = array
        .slice(0, index + 1)
        .reduce((sum, curr) => sum + curr.count, 0);

      return {
        monthLabel: `${monthName} ${year}`, // Use for XAxis display
        month: item.month, // Keep original date for potential tooltips
        count: item.count || 0, // New enrollments in this month
        cumulative: cumulativeCount, // Total enrollments up to this month
      };
    });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart
        data={formattedData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="hsl(var(--border) / 0.5)"
        />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
          interval="preserveStartEnd" // Show first and last label
          // Consider adding angle for more labels: angle={-30} dy={10}
        />
        <YAxis
          yAxisId="left" // Monthly count
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
          allowDecimals={false}
          label={{
            value: t("monthlyLabel"),
            angle: -90,
            position: "insideLeft",
            style: {
              fontSize: 11,
              textAnchor: "middle",
              fill: "hsl(var(--muted-foreground))",
            },
            dy: -10, // Adjust label position if needed
          }}
        />
        <YAxis
          yAxisId="right" // Cumulative count
          orientation="right"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
          allowDecimals={false}
          label={{
            value: t("cumulativeLabel"),
            angle: 90, // Correct angle for right axis
            position: "insideRight",
            style: {
              fontSize: 11,
              textAnchor: "middle",
              fill: "hsl(var(--muted-foreground))",
            },
            dy: 10, // Adjust label position if needed
          }}
        />
        <RechartsTooltip
          content={<CustomTooltip formatter={formatNumber} />}
          cursor={{ fill: "hsl(var(--muted) / 0.15)" }}
        />
        <Legend
          verticalAlign="top"
          height={40}
          iconSize={10}
          formatter={(value) => (
            <span className="text-xs font-medium text-slate-600">{value}</span>
          )}
        />
        <Bar
          yAxisId="left"
          dataKey="count"
          fill={COLORS.blue}
          radius={[4, 4, 0, 0]}
          name={t("monthly")} // Legend label
          barSize={20} // Adjust bar size if needed
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulative"
          stroke={COLORS.emerald}
          strokeWidth={2.5} // Make line slightly thicker
          dot={{ fill: COLORS.emerald, r: 3 }}
          activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }}
          name={t("cumulative")} // Legend label
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// --- Class Size Chart Component ---
const ClassSizeChart = ({ data, isLoading }) => {
  const t = useTranslations("EnrollmentStatistics.charts.classSize");

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const classSizeData = data?.charts?.class_size_distribution;
  if (!classSizeData || classSizeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm italic">
        {t("noData")}
      </div>
    );
  }

  // Format class names, sort by size (descending), and take top N (e.g., 15)
  const formattedData = classSizeData
    .map((item) => ({
      name: item.stream
        ? `${item.class_name} / ${item.stream}`
        : item.class_name,
      size: item.size || 0,
    }))
    .sort((a, b) => b.size - a.size) // Ensure sorted by size descending
    .slice(0, 15); // Limit to top 15 classes for readability

  return (
    <ResponsiveContainer width="100%" height={300}>
      {" "}
      {/* Increased height */}
      <RechartsBarChart
        data={formattedData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }} // Adjusted left margin
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false} // Grid lines for X-axis values
          vertical={true} // No grid lines for Y-axis categories
          stroke="hsl(var(--border) / 0.5)"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
          allowDecimals={false}
          // Consider domain padding if needed: domain={[0, 'dataMax + 5']}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 11, width: 120 }} // Allow more space for labels
          tickLine={false}
          axisLine={false} // Hide Y-axis line for cleaner look
          width={130} // Increased width to accommodate longer names
          interval={0} // Ensure all labels are shown
        />
        <RechartsTooltip
          content={<CustomTooltip valueLabel={t("students")} />} // Specific label for tooltip
          cursor={{ fill: "hsl(var(--muted) / 0.15)" }}
        />
        <Legend wrapperStyle={{ display: "none" }} />{" "}
        {/* Hide legend if only one bar type */}
        <Bar
          dataKey="size"
          name={t("students")} // Used in tooltip
          radius={[0, 4, 4, 0]} // Rounded corners on the right
          barSize={16}
          fill={COLORS.blue}
        >
          {/* If using specific colors per class, add Cells here */}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

// --- Gender Distribution Component ---
const GenderDistributionChart = ({ data, isLoading }) => {
  const t = useTranslations("EnrollmentStatistics"); // Use main and gender namespaces

  if (isLoading) {
    return <Skeleton className="h-56 w-full" />; // Slightly taller skeleton
  }

  const genderDistData = data?.charts?.gender_distribution;
  console.log(genderDistData);
  if (!genderDistData || genderDistData.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 text-sm italic">
        {t("charts.gender.noData")}
      </div>
    );
  }

  // Transform and translate gender labels, ensure lowercase keys for color lookup
  const genderData = genderDistData
    .map((item) => ({
      key: item.sex.toLowerCase(), // Use lowercase key for consistency
      name: t(
        `gender.${item.sex.toLowerCase()}`,
        {},
        { defaultMessage: item.sex }
      ),
      value: item.count || 0,
      color: genderColors[item.sex.toLowerCase()] || genderColors.default,
    }))
    .filter((item) => item.value > 0); // Filter out genders with 0 count

  // Calculate percentages for the legend
  const totalStudents = genderData.reduce((sum, item) => sum + item.value, 0);
  const genderDataWithPercentage = genderData.map((item) => ({
    ...item,
    percentage: totalStudents > 0 ? (item.value / totalStudents) * 100 : 0,
  }));

  // Custom label for Pie Chart (shows percentage inside segment)
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    value,
  }) => {
    const RADIAN = Math.PI / 180;
    // Position label slightly outside the middle for better readability on small segments
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is significant (e.g., > 3%)
    if (value > 0 && percent * 100 >= 3) {
      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11} // Slightly smaller font size
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    }
    return null; // Don't render label for very small segments
  };

  return (
    <div className="flex flex-col h-full">
      <ResponsiveContainer width="100%" height={180}>
        {" "}
        {/* Chart area */}
        <RechartsPieChart>
          <Pie
            data={genderDataWithPercentage}
            cx="50%"
            cy="50%"
            labelLine={false} // Hide connecting lines
            label={renderCustomizedLabel} // Use custom label component
            outerRadius={80} // Standard outer radius
            innerRadius={45} // Create a donut chart effect
            paddingAngle={2} // Small gap between segments
            dataKey="value"
            stroke="hsl(var(--background))" // Background color stroke for separation
            strokeWidth={2}
          >
            {genderDataWithPercentage.map((entry, index) => (
              <Cell key={`cell-gender-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip
            content={<CustomTooltip formatter={formatNumber} />}
            cursor={{ fill: "transparent" }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Legend below the chart */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-3 px-2">
        {genderDataWithPercentage.map((entry, index) => (
          <div
            key={`legend-gender-${index}`}
            className="flex items-center gap-1.5"
          >
            <div
              className="w-2.5 h-2.5 rounded-full" // Slightly smaller legend dots
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-600">
              {entry.name}:{" "}
              <span className="font-medium text-slate-700">
                {formatNumber(entry.value)}
              </span>{" "}
              ({entry.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
const EnrollmentStatistics = ({ academicYearId }) => {
  const t = useTranslations("EnrollmentStatistics");
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["enrollmentStatistics", academicYearId],
    queryFn: () => getEnrollmentStatistics(academicYearId),
    enabled: !!academicYearId, // Only fetch if academicYearId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch on focus for fresh data
    refetchInterval: 15 * 60 * 1000, // Optional: Refetch every 15 mins
  });

  // --- Define Loading State (isLoading or isFetching for background updates) ---
  const showLoadingSkeleton = isLoading && !data; // Show skeleton only on initial load
  const showUpdatingIndicator = isFetching && !isLoading; // Show subtle indicator during refetch

  // --- Error State ---
  if (isError && !isLoading) {
    // Show error only if not loading initially
    console.error("Error fetching enrollment stats:", error);
    return (
      <Card className="mb-6 border-destructive bg-destructive/5">
        <CardContent className="p-4 text-center text-destructive flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>
            {t("error.loadFailed", {
              message: error?.message || t("error.unknown"),
            })}
          </span>
        </CardContent>
      </Card>
    );
  }

  // --- No Academic Year Selected State ---
  if (!academicYearId) {
    return (
      <Card className="mb-6 border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="p-6 text-center text-slate-500">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          {t("noData.selectYear")}
        </CardContent>
      </Card>
    );
  }

  // --- Loading Skeleton State ---
  if (showLoadingSkeleton) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        {/* KPI Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StatCard
              key={`skeleton-kpi-${i}`}
              title="" // Pass empty or placeholder if needed by StatCard logic
              value=""
              icon={Loader2} // Use loader or a generic icon
              isLoading={true}
            />
          ))}
        </div>
        {/* Workflow Progress Skeleton */}
        <Skeleton className="h-36 w-full" />

        {/* Tabs Skeleton */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-3 md:w-auto md:inline-grid">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // --- No Data Available State (After load, if API returns nothing relevant) ---
  // Check specific critical data points to determine if there's *any* data
  const hasMeaningfulData =
    data &&
    (data.kpi?.total_confirmed_students !== undefined ||
      data.workflow_overview?.total !== undefined ||
      data.charts?.enrollment_composition !== undefined);
  if (!isLoading && !isError && !hasMeaningfulData) {
    return (
      <Card className="mb-6 border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="p-6 text-center text-slate-500">
          <ClipboardX className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          {t("noData.noStatsAvailable", {
            yearName: data?.academic_year_name || t("noData.thisYear"),
          })}
        </CardContent>
      </Card>
    );
  }

  // --- Data is available - Prepare for Charts ---
  // Null checks and default values are important here
  const enrollmentCompositionData = [
    {
      key: "new",
      name: t("composition.new"),
      value: data?.charts?.enrollment_composition?.new || 0,
      color: COLORS.purple,
    },
    {
      key: "returning",
      name: t("composition.returning"),
      value: data?.charts?.enrollment_composition?.returning || 0,
      color: COLORS.teal, // Use Teal for returning
    },
  ].filter((item) => item.value > 0);

  const enrollmentStatusData = Object.entries(
    data?.charts?.enrollment_status_breakdown || {}
  )
    .map(([statusKey, count]) => ({
      key: statusKey,
      name: t(
        `enrollmentStatus.${statusKey}`,
        {},
        {
          defaultMessage: statusKey
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        } // Better default message
      ),
      value: count || 0,
      color:
        enrollmentStatusColors[statusKey] || enrollmentStatusColors.default,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value); // Sort by count descending

  const promotionSourceData = Object.entries(
    data?.charts?.promotion_source_breakdown || {}
  )
    .map(([statusKey, count]) => ({
      key: statusKey,
      name: t(
        `promotionStatus.${statusKey}`,
        {},
        {
          defaultMessage: statusKey
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        } // Better default message
      ),
      value: count || 0,
      fill: promotionStatusColors[statusKey] || promotionStatusColors.default,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value); // Sort by count descending

  // Calculate workflow pipeline progress percentage for header badge
  const totalWorkflows = data?.workflow_overview?.total || 0;
  // Use 'enrollment_complete' as the definition of a completed workflow in this context
  const completedWorkflows =
    data?.workflow_overview?.stage_breakdown?.enrollment_complete || 0;
  const workflowCompletionPercentage =
    totalWorkflows > 0
      ? Math.round((completedWorkflows / totalWorkflows) * 100)
      : 0;

  // --- Render Dashboard ---
  return (
    <div className="space-y-6 relative">
      {/* Updating Indicator */}
      {showUpdatingIndicator && (
        <div className="absolute top-2 right-2 text-xs text-slate-500 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t("updating")}
        </div>
      )}

      {/* Academic Year Header */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-600" />
            {data?.academic_year_name || t("unknownYear")}
          </h2>
          <p className="text-sm text-slate-500">
            {t("header.enrollmentStatistics")}
          </p>
        </div>
        <Badge
          variant={workflowCompletionPercentage > 80 ? "success" : "outline"}
          className="px-3 py-1 text-xs"
        >
          {totalWorkflows > 0 ? (
            <>
              <ClipboardCheck className="h-3 w-3 mr-1.5" />
              {t("header.workflowsComplete", {
                percent: workflowCompletionPercentage,
              })}
            </>
          ) : (
            t("header.noWorkflows")
          )}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("kpi.totalConfirmed")}
          value={formatNumber(data?.kpi?.total_confirmed_students || 0)}
          icon={UserCheck}
          colorName="blue"
          subtitle={t("kpi.totalConfirmedSubtitle")}
          isLoading={showLoadingSkeleton}
        />
        <StatCard
          title={t("kpi.pendingAssignments")}
          value={formatNumber(data?.kpi?.pending_assignments || 0)}
          icon={ListTodo}
          colorName="amber"
          subtitle={t("kpi.pendingAssignmentsSubtitle")}
          isLoading={showLoadingSkeleton}
        />
        {/* Changed to show "Awaiting Decision" as a key workflow step */}
        <StatCard
          title={t("kpi.workflowsAwaiting")}
          value={formatNumber(
            data?.workflow_overview?.stage_breakdown
              ?.awaiting_promotion_decision || 0
          )}
          icon={Clock} // Icon indicating time/waiting
          colorName="indigo"
          subtitle={t("kpi.workflowsAwaitingSubtitle")}
          isLoading={showLoadingSkeleton}
        />
        <StatCard
          title={t("kpi.workflowsCompleted")}
          value={formatNumber(completedWorkflows)} // Use calculated completed workflows
          icon={CheckCircle}
          colorName="emerald"
          subtitle={t("kpi.workflowsCompletedSubtitle")}
          isLoading={showLoadingSkeleton}
        />
      </div>

      {/* Workflow Progress Bar */}
      <WorkflowProgress data={data} isLoading={showLoadingSkeleton} />

      {/* Tabs Navigation & Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 w-full md:w-auto md:inline-grid">
          <TabsTrigger value="overview">
            <ActivitySquare className="h-4 w-4 mr-1.5" />
            {t("tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="enrollment">
            <Users className="h-4 w-4 mr-1.5" />
            {t("tabs.enrollment")}
          </TabsTrigger>
          <TabsTrigger value="classes">
            <School className="h-4 w-4 mr-1.5" />
            {t("tabs.classes")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-0 space-y-6">
          {" "}
          {/* Remove default TabsContent margin-top */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrollment Composition Chart */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-slate-500" />
                  {t("charts.composition.title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("charts.composition.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] flex items-center justify-center">
                {enrollmentCompositionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={enrollmentCompositionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90} // Make pie slightly larger
                        paddingAngle={3}
                        dataKey="value"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      >
                        {enrollmentCompositionData.map((entry, index) => (
                          <Cell key={`cell-comp-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={<CustomTooltip formatter={formatNumber} />}
                      />
                      <Legend
                        iconSize={10}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                        formatter={(value, entry) => (
                          <span className="text-slate-600">
                            {entry.payload.name}
                          </span>
                        )}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    {t("charts.composition.noData")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Enrollment Status Chart */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-slate-500" />{" "}
                  {/* Changed icon */}
                  {t("charts.status.title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("charts.status.description", {
                    yearName: data?.academic_year_name || t("noData.thisYear"),
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] flex items-center justify-center">
                {enrollmentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={enrollmentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0} // Make it a Pie, not Donut
                        outerRadius={90}
                        paddingAngle={1}
                        dataKey="value"
                        stroke="hsl(var(--background))"
                        strokeWidth={1}
                      >
                        {enrollmentStatusData.map((entry, index) => (
                          <Cell
                            key={`cell-status-${index}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={<CustomTooltip formatter={formatNumber} />}
                      />
                      <Legend
                        iconSize={10}
                        layout="vertical" // Vertical layout fits better sometimes
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: "12px", paddingLeft: "10px" }}
                        formatter={(value, entry) => (
                          <span className="text-slate-600">
                            {entry.payload.name}
                          </span>
                        )}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    {t("charts.status.noData")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Promotion Source Chart */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-slate-500" />{" "}
                  {/* Changed icon */}
                  {t("charts.source.title")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("charts.source.description", {
                    yearName: data?.academic_year_name || t("noData.thisYear"),
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] flex items-center justify-center">
                {promotionSourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={promotionSourceData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 5, bottom: 5 }} // Adjusted margins
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="hsl(var(--border) / 0.5)"
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80} // Adjust width based on typical label length
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <RechartsTooltip
                        content={<CustomTooltip formatter={formatNumber} />}
                        cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        {promotionSourceData.map((entry, index) => (
                          <Cell key={`cell-promo-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    {t("charts.source.noData")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enrollment Tab Content */}
        <TabsContent value="enrollment" className="mt-0 space-y-6">
          {/* Enrollments Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <LineChartIcon className="h-4 w-4 text-slate-500" />
                {t("charts.timeSeries.title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("charts.timeSeries.description", {
                  yearName: data?.academic_year_name || t("noData.thisYear"),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimeSeriesChart data={data} isLoading={showLoadingSkeleton} />
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />{" "}
                {/* Users icon for gender */}
                {t("charts.gender.title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("charts.gender.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GenderDistributionChart
                data={data}
                isLoading={showLoadingSkeleton}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab Content */}
        <TabsContent value="classes" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-500" />
                {t("charts.classSize.title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("charts.classSize.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClassSizeChart data={data} isLoading={showLoadingSkeleton} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnrollmentStatistics;
