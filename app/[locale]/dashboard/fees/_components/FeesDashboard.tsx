"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  TrendingUp,
  Clock,
  Users,
  ListChecks,
  CreditCard,
  CircleDollarSign,
  FileWarning,
  ChevronRight,
  Info,
  Calendar,
} from "lucide-react";

import { fetchAcademicYears } from "@/queries/results";
import { fetchFeeDashboard } from "@/queries/fees";
import LoadingErrorState from "./LoadingErrorState";
import { FilterControls } from "./FilterControls";
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardTab({ school }) {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const locale = "fr-CM"; // TODO: Get from context
  const currency = "XAF"; // TODO: Get from context

  // State for Filters
  const [filters, setFilters] = useState({
    academic_year_id: undefined,
  });

  // Tab state for recent payments/trends
  const [activeTab, setActiveTab] = useState("payments");

  const queryParams = useMemo(
    () => ({
      academic_year_id: filters.academic_year_id,
    }),
    [filters]
  );

  // Fetch Dashboard Data
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["feeDashboard", queryParams],
    queryFn: () => fetchFeeDashboard(queryParams),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Data for filters
  const { data: academicYears } = useQuery({
    queryKey: ["academicYearsSimple"],
    queryFn: () => fetchAcademicYears({ page_size: 1000 }),
  });

  // Filter Configuration
  const filterConfig = useMemo(
    () => [
      {
        id: "academic_year_id",
        label: t("academicYear"),
        type: "select",
        placeholder: t("currentOrSelectYear"),
        options:
          academicYears?.map((y) => ({ value: y.id, label: y.name })) || [],
      },
    ],
    [t, academicYears]
  );

  // Chart data transformation
  const chartData = useMemo(() => {
    if (!data?.payment_trends) return [];
    return data.payment_trends.map((item) => ({
      ...item,
      collectedAmount: item.collected_amount,
      pendingAmount: item.pending_amount,
      period: item.period_label,
    }));
  }, [data?.payment_trends]);

  // Loading states
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Handle error state
  if (error) {
    return <LoadingErrorState error={error} className="mt-6" />;
  }

  // Handle case where data is unexpectedly null/undefined after loading
  if (!data) {
    return (
      <LoadingErrorState
        error={new Error(t("errorLoadingDashboard"))}
        className="mt-6"
      />
    );
  }

  // Deconstruct data after checks
  const {
    overall_stats,
    stats_by_type,
    stats_by_class,
    recent_payments,
    payment_trends,
  } = data;

  // Check for backend error within overall_stats
  const backendError = overall_stats?.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("financeDashboard")}
          </h2>
          <p className="text-muted-foreground mt-1">{t("financialOverview")}</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FilterControls
            filters={filters}
            setFilters={setFilters}
            config={filterConfig}
          />
          {isFetching && (
            <LoadingErrorState
              isLoading={true}
              spinnerSize="small"
              className="ml-2"
            />
          )}
        </div>
      </div>

      {/* Overall Stats Cards */}
      {backendError ? (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              {tc("error")}
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{backendError}</p>
            <p className="text-xs text-destructive/80 mt-1">
              {t("checkActiveYear")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card: Total Fees Expected */}
          <StatsCard
            title={t("totalFeesExpected")}
            value={formatCurrency(overall_stats.total_fees, currency, locale)}
            icon={<CircleDollarSign className="h-5 w-5 text-primary" />}
            description={
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{t("currentAcademicYear")}</span>
              </div>
            }
          />

          {/* Card: Total Collected */}
          <StatsCard
            title={t("totalCollected")}
            value={formatCurrency(
              overall_stats.total_collected,
              currency,
              locale
            )}
            icon={<CreditCard className="h-5 w-5 text-green-500" />}
            valueClassName="text-green-600"
            description={
              <div className="space-y-1">
                <Progress
                  value={overall_stats.collection_rate || 0}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {(overall_stats.collection_rate || 0).toFixed(1)}%{" "}
                  {t("collectionRate")}
                </p>
              </div>
            }
          />

          {/* Card: Total Pending */}
          <StatsCard
            title={t("totalPending")}
            value={formatCurrency(
              overall_stats.total_pending,
              currency,
              locale
            )}
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            valueClassName="text-blue-600"
            description={
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3 mr-1" />
                <span>
                  {(overall_stats.fee_status_counts?.pending || 0) +
                    (overall_stats.fee_status_counts?.partial || 0)}{" "}
                  {t("pendingFeesCount")}
                </span>
              </div>
            }
          />

          {/* Card: Total Overdue */}
          <StatsCard
            title={t("totalOverdue")}
            value={formatCurrency(
              overall_stats.total_overdue,
              currency,
              locale
            )}
            icon={<FileWarning className="h-5 w-5 text-destructive" />}
            valueClassName="text-destructive"
            description={
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1 text-destructive" />
                <span>
                  {overall_stats.fee_status_counts?.overdue || 0}{" "}
                  {t("overdueFeesCount")}
                </span>
              </div>
            }
          />
        </div>
      )}

      {/* Stats by Type and Class */}
      {!backendError && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stats by Fee Type Table */}
          <DataCard
            title={t("statsByFeeType")}
            icon={<ListChecks className="h-5 w-5 text-primary" />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("feeType")}</TableHead>
                  <TableHead className="text-right">{t("collected")}</TableHead>
                  <TableHead className="text-right">{t("pending")}</TableHead>
                  <TableHead className="text-right">{t("rate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats_by_type.length > 0 ? (
                  stats_by_type.map((item) => (
                    <TableRow key={item.fee_type_id}>
                      <TableCell className="font-medium">
                        {item.fee_type_name}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(
                          item.collected_amount,
                          currency,
                          locale
                        )}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(item.pending_amount, currency, locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <CollectionRateBadge rate={item.collection_rate} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      {tc("noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DataCard>

          {/* Stats by Class Table */}
          <DataCard
            title={t("statsByClass")}
            icon={<Users className="h-5 w-5 text-primary" />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("class")}</TableHead>
                  <TableHead className="text-right">{t("collected")}</TableHead>
                  <TableHead className="text-right">{t("pending")}</TableHead>
                  <TableHead className="text-right">{t("rate")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats_by_class.length > 0 ? (
                  stats_by_class.map((item) => (
                    <TableRow key={item.class_id}>
                      <TableCell className="font-medium">
                        {item.class_name}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(
                          item.collected_amount,
                          currency,
                          locale
                        )}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(item.pending_amount, currency, locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        <CollectionRateBadge rate={item.collection_rate} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      {tc("noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DataCard>
        </div>
      )}

      {/* Payments & Trends Tabs */}
      {!backendError && (
        <Card className="overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="text-lg font-semibold">
                {t("activityAndTrends")}
              </h3>
              <TabsList>
                <TabsTrigger
                  value="payments"
                  className="flex items-center gap-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>{t("recentPayments")}</span>
                </TabsTrigger>
                <TabsTrigger value="trends" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{t("paymentTrends")}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="payments" className="m-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {recent_payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>{t("date")}</TableHead>
                          <TableHead>{t("student")}</TableHead>
                          <TableHead>{t("feeType")}</TableHead>
                          <TableHead className="text-right">
                            {t("amount")}
                          </TableHead>
                          <TableHead>{t("method")}</TableHead>
                          <TableHead>{t("receivedBy")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recent_payments.map((item) => (
                          <TableRow
                            key={item.payment_id}
                            className="hover:bg-muted/30"
                          >
                            <TableCell>
                              {formatDate(item.payment_date, locale)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.student_name}
                            </TableCell>
                            <TableCell>{item.fee_type}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.amount, currency, locale)}
                            </TableCell>
                            <TableCell>
                              <PaymentMethodBadge
                                method={item.payment_method_display}
                              />
                            </TableCell>
                            <TableCell>{item.received_by_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      {t("noRecentPayments")}
                    </div>
                  )}
                </div>

                {recent_payments.length > 0 && (
                  <div className="flex items-center justify-center border-t p-4 bg-muted/10">
                    <button className="flex items-center text-sm font-medium text-primary">
                      {t("viewAllPayments")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="trends" className="m-0">
              <CardContent className="p-6">
                {chartData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 25,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 12 }}
                          tickMargin={10}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            formatCurrency(value, currency, locale, true)
                          }
                          width={70}
                        />
                        <Tooltip
                          formatter={(value) =>
                            formatCurrency(value, currency, locale)
                          }
                          labelFormatter={(label) => `${t("period")}: ${label}`}
                        />
                        <Legend />
                        <Bar
                          dataKey="collectedAmount"
                          name={t("collected")}
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="pendingAmount"
                          name={t("pending")}
                          fill="#f97316"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    {t("noTrendData")}
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}

// Helper Components

const StatsCard = ({
  title,
  value,
  icon,
  description,
  valueClassName = "",
}) => (
  <Card className="overflow-hidden transition-all hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
      {description}
    </CardContent>
  </Card>
);

const DataCard = ({ title, icon, children }) => (
  <Card className="overflow-hidden transition-all hover:shadow-md">
    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
      <div className="flex items-center gap-2">
        {icon}
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="p-0 overflow-x-auto">{children}</CardContent>
  </Card>
);

const CollectionRateBadge = ({ rate }) => {
  let variant = "secondary";

  if (rate >= 90) variant = "success";
  else if (rate >= 70) variant = "warning";
  else if (rate < 50) variant = "destructive";

  return (
    <Badge variant={variant} className="text-xs">
      {rate.toFixed(1)}%
    </Badge>
  );
};

const PaymentMethodBadge = ({ method }) => {
  let variant = "outline";

  // Safely check method if it exists and is a string
  if (typeof method === "string") {
    const methodLower = method.toLowerCase();
    if (methodLower.includes("cash")) variant = "secondary";
    else if (methodLower.includes("mobile")) variant = "info";
    else if (methodLower.includes("bank")) variant = "primary";
  }

  return (
    <Badge variant={variant} className="capitalize text-xs">
      {method}
    </Badge>
  );
};

// Loading skeleton
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>
      <Skeleton className="h-10 w-48" />
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 py-8">
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  </div>
);
