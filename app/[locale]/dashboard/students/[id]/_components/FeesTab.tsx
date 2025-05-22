// src/app/[locale]/dashboard/students/[id]/_components/FeesTab.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Loader2,
  AlertCircle,
  CalendarRange,
  DollarSign,
  Receipt, // Icon for payments
  ListOrdered, // Icon for fee list
  Info,
  CheckCircle,
  XCircle,
  Clock, // For overdue
  CircleSlash, // For waived
  Percent,
  RefreshCcw,
  Wallet, // For Payment Method
  User, // For Received By
  FileText, // For Reference
  TrendingUp, // For progress
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { fetchStudentFeesTabData } from "@/queries/students"; // New query function
import { StudentFeesTabDataResponse, FeeStatus } from "@/types/fees";
import { fetchAcademicYears } from "@/queries/results"; // For year filter
import { AcademicYear } from "@/types/transfers"; // Reuse type
import { cn, formatDate, formatCurrency } from "@/lib/utils"; // Ensure formatCurrency exists
import { Skeleton } from "@/components/ui/skeleton"; // For loading states
import PaginationControls from "../../../results/_components/PaginationControls";

interface FeesTabProps {
  studentId: string;
}

const FeesTab: React.FC<FeesTabProps> = ({ studentId }) => {
  const t = useTranslations("Fees.Tab");
  const tStatus = useTranslations("Fees.Status");
  const tCommon = useTranslations("Common");

  const defaultPageSize = 10; // Smaller page size for details

  // State
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [feeCurrentPage, setFeeCurrentPage] = useState(1);
  const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Fetch Academic Years for filter dropdown
  const { data: academicYears, isLoading: isLoadingYears } = useQuery<
    AcademicYear[],
    Error
  >({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
    staleTime: Infinity,
  });

  // Set default year on initial load or when years load
  useEffect(() => {
    if (!academicYearId && academicYears?.length) {
      const activeYear =
        academicYears.find((y) => y.is_active) ?? academicYears[0];
      if (activeYear) {
        setAcademicYearId(String(activeYear.id));
      }
    }
  }, [academicYears, academicYearId]);

  // Fetch Fees Tab Data
  const {
    data: feesTabData,
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
  } = useQuery<StudentFeesTabDataResponse, Error>({
    queryKey: [
      "studentFeesTab",
      studentId,
      academicYearId,
      feeCurrentPage,
      paymentCurrentPage,
      pageSize,
    ],
    queryFn: () =>
      fetchStudentFeesTabData({
        studentId,
        academicYearId,
        feePage: feeCurrentPage,
        paymentPage: paymentCurrentPage,
        pageSize,
      }),
    enabled: !!studentId && !!academicYearId, // Only fetch when year is selected
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
    keepPreviousData: true,
  });

  // Derived data
  const summary = feesTabData?.summary;
  const feeDetails = feesTabData?.fee_details;
  const paymentHistory = feesTabData?.payment_history;

  // Handlers
  const handleYearChange = (value: string) => {
    setAcademicYearId(value === "all" ? null : value); // Use 'all' value
    setFeeCurrentPage(1); // Reset pagination
    setPaymentCurrentPage(1);
  };

  const handleFeePageChange = (newPage: number) => {
    setFeeCurrentPage(newPage);
  };

  const handlePaymentPageChange = (newPage: number) => {
    setPaymentCurrentPage(newPage);
  };

  const handleRefresh = () => {
    refetch();
  };

  // --- UI Components ---

  const FiltersHeader = () => (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border-b bg-muted/40">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground flex items-center whitespace-nowrap">
          <CalendarRange className="h-4 w-4 mr-1.5" />
          {t("academicYearLabel")}:
        </label>
        <Select
          value={academicYearId ?? "all"} // Default to 'all' if null
          onValueChange={handleYearChange}
          disabled={isLoadingYears}
        >
          <SelectTrigger className="w-full sm:w-[250px] bg-background shadow-sm border-input h-9 text-sm">
            {isLoadingYears ? (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                {tCommon("loading")}
              </div>
            ) : (
              <SelectValue placeholder={t("selectYear")} />
            )}
          </SelectTrigger>
          <SelectContent>
            {/* Allow selecting 'all' years? Backend might not support it well for summary. Let's stick to specific year for now. */}
            {/* <SelectItem value="all" className="italic">{t('allYears')}</SelectItem> */}
            {academicYears?.map((year) => (
              <SelectItem key={year.id} value={String(year.id)}>
                <div className="flex items-center justify-between w-full">
                  <span>{year.name}</span>
                  {year.is_active && (
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs border-primary text-primary bg-primary/5"
                    >
                      {t("currentYear")}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
            {(!academicYears || academicYears.length === 0) &&
              !isLoadingYears && (
                <SelectItem
                  value="no-years"
                  disabled
                  className="text-muted-foreground italic"
                >
                  {t("noYearsAvailable")}
                </SelectItem>
              )}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={isFetching || isLoading}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        <RefreshCcw
          className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
        />
        {isFetching ? tCommon("loading") : tCommon("refresh")}
      </Button>
    </div>
  );

  const SummarySection = ({ data }: { data?: typeof summary }) => {
    if (isLoading && !data) {
      // Skeleton for summary
      return (
        <Card className="mb-6 animate-pulse">
          <CardHeader className="pb-2 pt-3 px-4">
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-full mt-4 rounded" />{" "}
            {/* Progress bar skeleton */}
          </CardContent>
        </Card>
      );
    }

    if (!data) return null; // Hide if no data after loading

    const progress = parseFloat(
      data.payment_progress_percentage?.toString() ?? "0"
    );

    return (
      <Card className="mb-6 border-l-4 border-primary shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t("summaryTitle")}{" "}
            {feesTabData?.academic_year?.name
              ? `(${feesTabData.academic_year.name})`
              : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <SummaryItem
              label={t("totalDue")}
              value={formatCurrency(data.total_fees_amount)}
            />
            <SummaryItem
              label={t("totalPaid")}
              value={formatCurrency(data.total_amount_paid)}
              valueClass="text-success"
            />
            <SummaryItem
              label={t("balanceDue")}
              value={formatCurrency(data.total_balance_due)}
              valueClass={
                parseFloat(data.total_balance_due.toString()) > 0
                  ? "text-destructive font-bold"
                  : "text-muted-foreground"
              }
            />
          </div>
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-muted-foreground font-medium">
                {t("paymentProgress")}
              </span>
              <span className="font-bold text-primary">
                {progress.toFixed(1)}%
              </span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const SummaryItem: React.FC<{
    label: string;
    value: string | number;
    valueClass?: string;
  }> = ({ label, value, valueClass }) => (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className={cn("text-lg font-semibold tabular-nums", valueClass)}>
        {value}
      </span>
    </div>
  );

  const FeesTable = ({ data }: { data?: typeof feeDetails }) => {
    const getStatusBadge = (status: FeeStatus): JSX.Element => {
      const lowerStatus = status?.toLowerCase();
      switch (lowerStatus) {
        case "paid":
          return (
            <Badge variant="success" className="capitalize">
              <CheckCircle className="h-3 w-3 mr-1" />
              {tStatus(status)}
            </Badge>
          );
        case "partial":
          return (
            <Badge variant="warning" className="capitalize">
              <Clock className="h-3 w-3 mr-1" />
              {tStatus(status)}
            </Badge>
          );
        case "pending":
          return (
            <Badge variant="secondary" className="capitalize">
              <Info className="h-3 w-3 mr-1" />
              {tStatus(status)}
            </Badge>
          );
        case "overdue":
          return (
            <Badge variant="destructive" className="capitalize">
              <Clock className="h-3 w-3 mr-1" />
              {tStatus(status)}
            </Badge>
          );
        case "waived":
          return (
            <Badge variant="outline" className="capitalize">
              <CircleSlash className="h-3 w-3 mr-1" />
              {tStatus(status)}
            </Badge>
          );
        default:
          return (
            <Badge variant="secondary" className="capitalize">
              {tStatus("unknown")}
            </Badge>
          );
      }
    };

    if (isLoading && !data) {
      return <Skeleton className="h-64 w-full rounded-lg" />; // Table Skeleton
    }

    if (!data?.results || data.results.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/30">
          {t("noFeesAssigned")}
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60">
              <TableHead className="px-3 py-2.5">{t("feeType")}</TableHead>
              <TableHead className="text-right px-3 py-2.5">
                {t("totalAmount")}
              </TableHead>
              <TableHead className="text-right px-3 py-2.5">
                {t("amountPaid")}
              </TableHead>
              <TableHead className="text-right px-3 py-2.5">
                {t("balance")}
              </TableHead>
              <TableHead className="text-center px-3 py-2.5">
                {t("status")}
              </TableHead>
              <TableHead className="text-center px-3 py-2.5">
                {t("dueDate")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((fee) => (
              <TableRow key={fee.id} className="text-sm hover:bg-muted/30">
                <TableCell className="font-medium px-3 py-2">
                  {fee.fee_type_name}
                </TableCell>
                <TableCell className="text-right px-3 py-2 tabular-nums">
                  {formatCurrency(fee.amount)}
                </TableCell>
                <TableCell className="text-right px-3 py-2 tabular-nums text-success">
                  {formatCurrency(fee.amount_paid)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold px-3 py-2 tabular-nums",
                    parseFloat(fee.balance.toString()) > 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(fee.balance)}
                </TableCell>
                <TableCell className="text-center px-3 py-2">
                  {getStatusBadge(fee.status)}
                </TableCell>
                <TableCell className="text-center px-3 py-2 whitespace-nowrap">
                  {fee.due_date ? formatDate(fee.due_date) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Fee Pagination */}
        {data.count > pageSize && (
          <div className="p-4 border-t flex justify-center">
            <PaginationControls
              currentPage={feeCurrentPage}
              totalPages={Math.ceil(data.count / pageSize)}
              onPageChange={handleFeePageChange}
            />
          </div>
        )}
      </div>
    );
  };

  const PaymentsTable = ({ data }: { data?: typeof paymentHistory }) => {
    if (isLoading && !data) {
      return <Skeleton className="h-64 w-full rounded-lg" />; // Table Skeleton
    }

    if (!data?.results || data.results.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/30">
          {t("noPaymentsMade")}
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60">
              <TableHead className="px-3 py-2.5">{t("paymentDate")}</TableHead>
              <TableHead className="px-3 py-2.5">{t("feeType")}</TableHead>
              <TableHead className="text-right px-3 py-2.5">
                {t("paymentAmount")}
              </TableHead>
              <TableHead className="text-center px-3 py-2.5">
                {t("paymentMethod")}
              </TableHead>
              <TableHead className="px-3 py-2.5">{t("referenceNo")}</TableHead>
              <TableHead className="px-3 py-2.5">{t("receivedBy")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.results.map((payment) => (
              <TableRow key={payment.id} className="text-sm hover:bg-muted/30">
                <TableCell className="px-3 py-2 whitespace-nowrap">
                  {formatDate(payment.payment_date)}
                </TableCell>
                <TableCell className="px-3 py-2">
                  {payment.fee_type_name}
                </TableCell>
                <TableCell className="text-right font-medium text-success px-3 py-2 tabular-nums">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell className="text-center px-3 py-2">
                  <Badge
                    variant="outline"
                    className="text-xs capitalize bg-background"
                  >
                    {/* You might want icons per method */}
                    {payment.payment_method === "cash" && (
                      <Wallet className="h-3 w-3 mr-1 opacity-70" />
                    )}
                    {payment.payment_method_display}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2 text-muted-foreground text-xs font-mono">
                  {payment.reference_number || "-"}
                </TableCell>
                <TableCell className="px-3 py-2 text-muted-foreground text-xs">
                  {payment.received_by_name || tCommon("system")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Payment Pagination */}
        {data.count > pageSize && (
          <div className="p-4 border-t flex justify-center">
            <PaginationControls
              currentPage={paymentCurrentPage}
              totalPages={Math.ceil(data.count / pageSize)}
              onPageChange={handlePaymentPageChange}
            />
          </div>
        )}
      </div>
    );
  };

  // --- Loading, Error States ---
  // Initial loading handled by skeleton in sub-components if !feesTabData

  if (isError && !isLoading) {
    // Show error only after initial load attempt fails
    return (
      <Card className="bg-destructive/5 border-destructive shadow-sm">
        <FiltersHeader /> {/* Still show filters */}
        <div className="p-6 text-center flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-semibold text-destructive">{t("errorTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {error?.message || t("errorMessage")}
          </p>
          <Button
            variant="destructive"
            outline
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            {tCommon("retry")}
          </Button>
        </div>
      </Card>
    );
  }

  // --- Main Render ---
  return (
    <Card className="bg-background border shadow-sm overflow-hidden relative">
      {/* Loading overlay for refetching */}
      {isFetching &&
        !isLoading && ( // Show only during refetch, not initial load
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

      <FiltersHeader />

      <div className="p-4 md:p-6 space-y-6">
        {/* Pass isLoading state to SummarySection for its skeleton */}
        <SummarySection data={summary} />

        {/* Fee Details Section */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-primary" />
            {t("feeDetailsTitle")}
          </h3>
          {/* Pass isLoading state to FeesTable for its skeleton */}
          <FeesTable data={feeDetails} />
        </div>

        {/* Payment History Section */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {t("paymentHistoryTitle")}
          </h3>
          {/* Pass isLoading state to PaymentsTable for its skeleton */}
          <PaymentsTable data={paymentHistory} />
        </div>
      </div>
    </Card>
  );
};

export default FeesTab;
