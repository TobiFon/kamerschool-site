"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MoreHorizontal, DollarSign, Eye, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { StudentFee } from "@/types/fees";
import StatusBadge from "./StatusBadge";

interface StudentFeeColumnsProps {
  t: (key: string, params?: any) => string;
  tc: (key: string, params?: any) => string;
  onViewDetails: (fee: StudentFee) => void;
  onMakePayment: (fee: StudentFee) => void;
  onWaive: (fee: StudentFee) => void;
  currency: string;
  locale: string;
  canEdit: boolean; // Prop to receive permission status
}

export const StudentFeeColumns = ({
  t,
  tc,
  onViewDetails,
  onMakePayment,
  onWaive,
  currency,
  locale,
  canEdit, // Receive the permission status
}: StudentFeeColumnsProps): ColumnDef<StudentFee>[] => [
  {
    accessorKey: "student_name",
    header: t("student"),
    cell: ({ row }) => {
      const studentId = row.original.student_id;
      return (
        <Link
          href={`/dashboard/students/${studentId}`}
          className="font-medium text-blue-600 hover:underline"
          title={tc("viewStudentProfile")}
        >
          {row.getValue("student_name")}
        </Link>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "fee_type_name",
    header: t("feeType"),
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">{t("totalAmount")}</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {formatCurrency(row.getValue("amount"), currency, locale)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "amount_paid",
    header: () => <div className="text-right">{t("amountPaid")}</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {formatCurrency(row.getValue("amount_paid"), currency, locale)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "balance",
    header: () => <div className="text-right">{t("balance")}</div>,
    cell: ({ row }) => {
      const balance = parseFloat(row.original.balance);
      return (
        <div
          className={`text-right font-medium ${
            balance > 0 ? "text-red-600" : "text-green-600"
          }`}
        >
          {formatCurrency(balance, currency, locale)}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: t("status"),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: (row, id, value) => {
      const statuses = String(value).split(",");
      return statuses.includes(row.original.status);
    },
    enableSorting: true,
  },
  {
    accessorKey: "due_date",
    header: t("dueDate"),
    cell: ({ row }) => {
      const date = row.original.due_date;
      return date ? formatDate(date, locale) : "-";
    },
    enableSorting: true,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const fee = row.original;
      const canPay = fee.status !== "paid" && fee.status !== "waived";
      const canWaive = fee.status !== "paid" && fee.status !== "waived";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* This button is NOT disabled, as "View Details" is always available */}
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{tc("openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{tc("actions")}</DropdownMenuLabel>
            {/* "View Details" is always visible */}
            <DropdownMenuItem onClick={() => onViewDetails(fee)}>
              <Eye className="mr-2 h-4 w-4" />
              <span>{t("viewDetails")}</span>
            </DropdownMenuItem>

            {/* Conditionally render actions that require edit permissions */}
            {canEdit && canPay && (
              <DropdownMenuItem onClick={() => onMakePayment(fee)}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span>{t("recordPayment")}</span>
              </DropdownMenuItem>
            )}

            {/* Conditionally render the separator and the waive action */}
            {canEdit && canWaive && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onWaive(fee)}
                  className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  <span>{t("waiveFee")}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
