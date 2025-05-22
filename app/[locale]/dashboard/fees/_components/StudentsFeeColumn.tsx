// src/app/[locale]/dashboard/finance/_components/columns/StudentsFeeColumn.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MoreHorizontal, DollarSign, Eye, XCircle } from "lucide-react"; // Added icons
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
  // Use Finance namespace t for specific labels
  t: (key: string, params?: any) => string;
  // Use Common namespace tc for generic labels like actions
  tc: (key: string, params?: any) => string;
  onViewDetails: (fee: StudentFee) => void; // Handler to open details view
  onMakePayment: (fee: StudentFee) => void;
  onWaive: (fee: StudentFee) => void;
  currency: string;
  locale: string;
}

export const StudentFeeColumns = ({
  // Standardized name
  t,
  tc,
  onViewDetails, // Receive handler
  onMakePayment,
  onWaive,
  currency,
  locale,
}: StudentFeeColumnsProps): ColumnDef<StudentFee>[] => [
  {
    accessorKey: "student_name",
    header: t("student"),
    cell: ({ row }) => {
      // Assuming student_id is now available from the serializer update
      const studentId = row.original.student_id;
      return (
        <Link
          href={`/dashboard/students/${studentId}`} // Link to student profile
          className="font-medium text-blue-600 hover:underline"
          title={tc("viewStudentProfile")} // Add tooltip text
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
      // Parse balance string to number for comparison
      const balance = parseFloat(row.original.balance); // Use original balance string
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
    accessorKey: "status", // Filter/sort by the key
    header: t("status"),
    cell: ({ row }) => (
      // Display using the badge component which uses the key
      <StatusBadge status={row.original.status} />
    ),
    // Filter function using the status key
    filterFn: (row, id, value) => {
      // value might be a single status or comma-separated
      const statuses = String(value).split(",");
      return statuses.includes(row.original.status);
    },
    enableSorting: true,
  },
  {
    accessorKey: "due_date",
    header: t("dueDate"),
    cell: ({ row }) => {
      const date = row.original.due_date; // Use original data
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
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{tc("openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{tc("actions")}</DropdownMenuLabel>
            {/* Call onViewDetails handler */}
            <DropdownMenuItem onClick={() => onViewDetails(fee)}>
              <Eye className="mr-2 h-4 w-4" />
              <span>{t("viewDetails")}</span>
            </DropdownMenuItem>
            {canPay && (
              <DropdownMenuItem onClick={() => onMakePayment(fee)}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span>{t("recordPayment")}</span>
              </DropdownMenuItem>
            )}
            {/* Add Edit Notes action if implemented */}
            {/* <DropdownMenuItem onClick={() => onEditNotes(fee)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>{tc("editNotes")}</span>
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            {canWaive && (
              <DropdownMenuItem
                onClick={() => onWaive(fee)}
                className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
              >
                <XCircle className="mr-2 h-4 w-4" />{" "}
                {/* Different icon for waive */}
                <span>{t("waiveFee")}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
