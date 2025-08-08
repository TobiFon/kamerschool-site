"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { fetchAdminDashboardMetrics } from "@/queries/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Building,
  Check,
  GraduationCap,
  User,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// StatCard component remains the same, but can be co-located or imported
const StatCard = ({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  isLoading: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-24 mt-1" />
      ) : (
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      )}
    </CardContent>
  </Card>
);

// Main Dashboard Page
export default function AdminDashboardPage() {
  const t = useTranslations("AdminDashboard");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminDashboardMetrics"],
    queryFn: fetchAdminDashboardMetrics,
  });

  const stats = data?.stats;
  const trendData = data?.school_registration_trend;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <Link href="/admin/dashboard/schools">
          <Button>{t("manageSchools")}</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalSchools")}
          value={stats?.total_schools ?? 0}
          icon={Building}
          isLoading={isLoading}
        />
        <StatCard
          title={t("totalStudents")}
          value={stats?.total_students ?? 0}
          icon={GraduationCap}
          isLoading={isLoading}
        />
        <StatCard
          title={t("totalTeachers")}
          value={stats?.total_teachers ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title={t("activeSubscriptions")} // Placeholder
          value={stats?.active_subscriptions ?? 0}
          icon={Check}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>New School Registrations</CardTitle>
            <CardDescription>
              A summary of new schools added over the last 12 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading && <Skeleton className="h-[350px] w-full" />}
            {trendData && (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar
                    dataKey="Total"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {isError && (
              <p className="text-destructive">Could not load activity.</p>
            )}
            <div className="space-y-4">
              {data?.recent_activities.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{log.user}</span>{" "}
                      {log.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
