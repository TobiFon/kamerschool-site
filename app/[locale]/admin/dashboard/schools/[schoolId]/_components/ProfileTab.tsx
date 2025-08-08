"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { fetchSchoolDashboardData } from "@/queries/admin";
import { School } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  Library,
  Calendar,
  DollarSign,
  Receipt,
  AlertCircle,
  Activity,
  UserCog,
  FileClock,
} from "lucide-react";
import SchoolFormModal from "../../../_components/SchoolFormModal";
import { formatCurrency } from "./InvoiceTab";

// A reusable Stat Card component for this page
const StatCard = ({
  title,
  value,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading: boolean;
}) => (
  <div className="flex items-start gap-4 p-4 border rounded-lg bg-background">
    <div className="p-2 bg-muted rounded-md">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {isLoading ? (
        <Skeleton className="h-6 w-16 mt-1" />
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </div>
  </div>
);

interface ProfileTabProps {
  school: School;
}

export default function ProfileTab({ school }: ProfileTabProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["schoolDashboardData", school.id],
    queryFn: () => fetchSchoolDashboardData(school.id),
  });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>School Profile</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <UserCog className="mr-2 h-4 w-4" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>Email:</strong> {school.email}
              </p>
              <p>
                <strong>Phone:</strong> {school.phone_number}
              </p>
              <p>
                <strong>City:</strong> {school.city}, {school.province}
              </p>
              <p>
                <strong>Motto:</strong> {school.moto || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow
                label="Total Invoiced"
                value={data?.financial_summary.total_invoiced}
                isLoading={isLoading}
                isCurrency
              />
              <DetailRow
                label="Total Paid"
                value={data?.financial_summary.total_paid}
                isLoading={isLoading}
                isCurrency
              />
              <DetailRow
                label="Outstanding Balance"
                value={data?.financial_summary.outstanding_balance}
                isLoading={isLoading}
                isCurrency
                isBold
              />
              <Link
                href={`/admin/dashboard/schools/${school.id}?tab=invoices`}
                className="w-full"
              >
                <Button variant="secondary" className="w-full">
                  <Receipt className="mr-2 h-4 w-4" /> View All Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Active Students"
              value={data?.key_metrics.active_students ?? 0}
              icon={GraduationCap}
              isLoading={isLoading}
            />
            <StatCard
              title="Total Teachers"
              value={data?.key_metrics.total_teachers ?? 0}
              icon={Users}
              isLoading={isLoading}
            />
            <StatCard
              title="Active Classes"
              value={data?.key_metrics.active_classes ?? 0}
              icon={Library}
              isLoading={isLoading}
            />
            <StatCard
              title="Academic Year"
              value={data?.key_metrics.active_academic_year ?? "N/A"}
              icon={Calendar}
              isLoading={isLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <Skeleton className="h-40 w-full" />}
              {isError && (
                <p className="text-destructive">Could not load activity.</p>
              )}
              {data?.recent_activity.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <FileClock className="mx-auto h-8 w-8 mb-2" />
                  <p>No recent activity found for this school.</p>
                </div>
              )}
              <div className="space-y-4">
                {data?.recent_activity.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        {log.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {log.user} ·{" "}
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

      {/* Reusing the existing modal for editing the school profile */}
      {isEditModalOpen && (
        <SchoolFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          school={school}
          // The onSubmit logic for this modal is now in the main page component
        />
      )}
    </>
  );
}

const DetailRow = ({
  label,
  value,
  isLoading,
  isCurrency,
  isBold,
}: {
  label: string;
  value?: number | string;
  isLoading: boolean;
  isCurrency?: boolean;
  isBold?: boolean;
}) => (
  <div className="flex justify-between items-center text-sm">
    <p className="text-muted-foreground">{label}</p>
    {isLoading ? (
      <Skeleton className="h-5 w-20" />
    ) : (
      <p className={isBold ? "font-bold" : "font-medium"}>
        {isCurrency ? formatCurrency(value ?? 0) : value}
      </p>
    )}
  </div>
);
