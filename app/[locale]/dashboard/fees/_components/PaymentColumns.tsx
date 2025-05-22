// src/app/[locale]/dashboard/finance/_components/columns/PaymentColumns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Payment } from "@/types/fees"; // Updated type import
import { Badge } from "@/components/ui/badge"; // For payment method
import { MoreHorizontal, Receipt, Trash2 } from "lucide-react"; // Added icons
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentColumnsProps {
  t: (key: string, params?: any) => string; // Common translations
  tf: (key: string, params?: any) => string; // Finance translations
  currency: string;
  locale: string;
  onViewReceipt?: (payment: Payment) => void; // Optional action
  onDelete?: (payment: Payment) => void; // Handler for delete action
}

export const PaymentColumns = ({
  t,
  tf,
  currency,
  locale,
  onViewReceipt,
  onDelete, // Receive onDelete handler
}: PaymentColumnsProps): ColumnDef<Payment>[] => [
  {
    accessorKey: "payment_date",
    header: tf("paymentDate"),
    cell: ({ row }) => formatDate(row.getValue("payment_date"), locale),
    enableSorting: true,
  },
  {
    accessorKey: "student_name",
    header: tf("student"),
    cell: ({ row }) => {
      // Link to student requires the student ID.
      // Assuming student_id is available via student_fee relation on backend if needed
      // const studentId = row.original.student_fee?.student_id; // Example access
      // if (studentId) {
      //   return (
      //     <Link href={`/dashboard/students/${studentId}`} className="font-medium text-blue-600 hover:underline">
      //       {row.getValue("student_name")}
      //     </Link>
      //   );
      // }
      return (
        <span className="font-medium">{row.getValue("student_name")}</span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "fee_type_name",
    header: tf("feeType"),
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">{tf("amountPaid")}</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.getValue("amount"), currency, locale)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "payment_method_display",
    header: tf("paymentMethod"),
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize text-xs">
        {row.getValue("payment_method_display")}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      // Filter by the key ('cash', 'bank_transfer') not the display value
      const methods = String(value).split(",");
      return methods.includes(row.original.payment_method);
    },
    enableSorting: true,
  },
  {
    accessorKey: "reference_number",
    header: tf("reference"),
    cell: ({ row }) => row.getValue("reference_number") || "-",
    enableSorting: false, // Usually not sorted
  },
  {
    accessorKey: "received_by_name",
    header: tf("receivedBy"),
    enableSorting: true, // Sort by receiver name
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t("openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
            {onViewReceipt && (
              <DropdownMenuItem onClick={() => onViewReceipt(payment)}>
                <Receipt className="mr-2 h-4 w-4" />
                <span>{tf("viewReceipt")}</span> {/* Add translation */}
              </DropdownMenuItem>
            )}
            {/* Add Delete action */}
            {onDelete && (
              <>
                {onViewReceipt && <DropdownMenuSeparator />}{" "}
                {/* Separator if view receipt exists */}
                <DropdownMenuItem
                  onClick={() => onDelete(payment)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{t("delete")}</span> {/* Or "Cancel Payment" */}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
