// components/transfers/TransferRequestTable.tsx
"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isValid, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import TransferActions from "./TransferActions"; // Ensure correct import
import { TransferRequest } from "@/types/transfers";

interface TransferRequestTableProps {
  requests: TransferRequest[];
  isLoading: boolean;
  onActionClick: (actionType: string, request: TransferRequest) => void;
  userSchoolId?: number | null;
}

const statusBadgeStyles: Record<string, string> = {
  pending:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  approved:
    "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  rejected:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  completed:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  cancelled:
    "bg-gray-100 text-gray-800 border-gray-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
};

function TransferRequestTable({
  requests = [],
  isLoading,
  onActionClick,
  userSchoolId,
}: TransferRequestTableProps) {
  const t = useTranslations("TransfersTab.table");
  const tc = useTranslations("Common");

  const getSchoolName = (
    school: TransferRequest["from_school" | "to_school"]
  ): string => {
    if (!school) return tc("notAvailableShort");
    return school.name || tc("notAvailableShort");
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return tc("notAvailableShort");
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "PP") : dateString;
    } catch (error) {
      return dateString;
    }
  };
  console.log(userSchoolId);

  const renderSkeleton = () =>
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skel-tr-${index}`} className="animate-pulse">
        {/* Student */}
        <TableCell>
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded mt-1" />
          <Skeleton className="h-3 w-1/2 rounded mt-1" /> {/* For Date */}
        </TableCell>
        {/* From/To Schools */}
        <TableCell>
          <Skeleton className="h-4 w-20 rounded" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20 rounded" />
        </TableCell>
        {/* Context (Level/Promo) */}
        <TableCell>
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-20 rounded mt-1" />
        </TableCell>
        {/* Status */}
        <TableCell>
          <Skeleton className="h-6 w-20 rounded-full" />
        </TableCell>
        {/* Actions */}
        <TableCell className="text-right">
          <Skeleton className="h-8 w-10 rounded" />
        </TableCell>
      </TableRow>
    ));

  const renderNoData = () => (
    <TableRow>
      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
        {t("noData.message")}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="border rounded-md overflow-x-auto dark:border-slate-700">
      <Table>
        {!isLoading && requests.length === 0 && (
          <TableCaption className="mt-4">
            {t("captions.noRequests")}
          </TableCaption>
        )}
        {isLoading && <TableCaption>{t("captions.loading")}</TableCaption>}
        <TableHeader className="bg-slate-50 dark:bg-slate-800">
          <TableRow>
            <TableHead>{t("headers.student")}</TableHead>
            <TableHead>{t("headers.fromSchool")}</TableHead>
            <TableHead>{t("headers.toSchool")}</TableHead>
            {/* Combine Year/Level/Promo into one Context column */}
            <TableHead>{t("headers.context")}</TableHead>
            <TableHead>{t("headers.status")}</TableHead>
            <TableHead className="text-right">{t("headers.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? renderSkeleton()
            : requests.length > 0
            ? requests.map((req) => (
                <TableRow
                  key={req.id}
                  className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {/* Student Cell */}
                  <TableCell className="font-medium whitespace-nowrap">
                    {req.student?.full_name || tc("unknownStudent")}
                    <span className="block text-xs text-muted-foreground mt-1">
                      ID: {req.student?.matricule || tc("noId")}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      {t("headers.requestedOn")}: {formatDate(req.request_date)}
                    </span>
                  </TableCell>
                  {/* From/To School Cells */}
                  <TableCell className="text-xs whitespace-nowrap">
                    {getSchoolName(req.from_school)}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {getSchoolName(req.to_school)}
                  </TableCell>
                  {/* Context Cell */}
                  <TableCell className="text-xs whitespace-nowrap">
                    <span className="block">
                      {t("headers.effectiveYearShort")}:{" "}
                      {req.effective_academic_year || tc("notAvailableShort")}
                    </span>
                    {/* Display Previous Level */}
                    <span className="block text-muted-foreground mt-1">
                      {t("headers.previousLevelShort")}:{" "}
                      {req.previous_level_display || tc("notAvailableShort")}
                    </span>
                    {/* Display Last Promotion Status */}
                    <span className="block text-muted-foreground mt-1">
                      {t("headers.lastPromoShort")}:{" "}
                      {req.last_promotion_status_display ||
                        tc("notAvailableShort")}
                    </span>
                  </TableCell>
                  {/* Status Cell */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium whitespace-nowrap ${
                        statusBadgeStyles[req.status] ||
                        statusBadgeStyles.cancelled
                      }`}
                    >
                      {req.status_display || req.status}
                    </Badge>
                  </TableCell>
                  {/* Actions Cell */}
                  <TableCell className="text-right">
                    <TransferActions
                      request={req}
                      onActionClick={onActionClick}
                      userSchoolId={userSchoolId}
                    />
                  </TableCell>
                </TableRow>
              ))
            : renderNoData()}
        </TableBody>
      </Table>
    </div>
  );
}

export default TransferRequestTable;
