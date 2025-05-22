// src/app/[locale]/dashboard/finance/_components/columns/ClassFeeColumn.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, X, MoreHorizontal, Users, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ClassFee } from "@/types/fees";

// Define props for specific translated labels
interface ClassFeeColumnLabels {
  yesLabel: string;
  noLabel: string;
  openMenuLabel: string;
  actionsLabel: string;
  editLabel: string;
  deleteLabel: string;
  // Finance specific labels (optional if 't' is still used for headers)
  assignFeesLabel: string;
  academicYearHeader: string;
  classHeader: string;
  feeTypeHeader: string;
  amountHeader: string;
  dueDateHeader: string;
  installmentsHeader: string;
  maxNumHeader: string;
}

interface ClassFeeColumnsProps {
  labels: ClassFeeColumnLabels; // Pass translated labels object
  onEdit: (classFee: ClassFee) => void;
  onAssign: (classFee: ClassFee) => void;
  onDelete: (classFee: ClassFee) => void;
  currency: string;
  locale: string;
}

// Accept labels object instead of translator functions
export const ClassFeeColumns = ({
  labels,
  onEdit,
  onAssign,
  onDelete,
  currency,
  locale,
}: ClassFeeColumnsProps): ColumnDef<ClassFee>[] => [
  {
    accessorKey: "academic_year_name",
    header: labels.academicYearHeader, // Use label prop
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("academic_year_name")}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "class_name",
    header: labels.classHeader, // Use label prop
    cell: ({ row }) => <div>{row.getValue("class_name")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "fee_type_name",
    header: labels.feeTypeHeader, // Use label prop
    cell: ({ row }) => <div>{row.getValue("fee_type_name")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">{labels.amountHeader}</div>, // Use label prop
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.getValue("amount"), currency, locale)}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "due_date",
    header: labels.dueDateHeader, // Use label prop
    cell: ({ row }) => {
      const date = row.getValue("due_date");
      return date ? formatDate(date as string, locale) : "-";
    },
    enableSorting: true,
  },
  {
    accessorKey: "installment_allowed",
    header: labels.installmentsHeader, // Use label prop
    cell: ({ row }) => {
      const allowed = row.getValue("installment_allowed");
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs px-2 py-0.5",
            allowed
              ? "border-blue-300 text-blue-800 bg-blue-50"
              : "border-gray-300 text-gray-700 bg-gray-100"
          )}
        >
          {allowed ? (
            <Check className="h-3 w-3 mr-1" />
          ) : (
            <X className="h-3 w-3 mr-1" />
          )}
          {/* Use translated string props */}
          {allowed ? labels.yesLabel : labels.noLabel}
        </Badge>
      );
    },
    filterFn: (row, id, value) => String(row.getValue(id)) === String(value),
    enableSorting: true,
  },
  {
    accessorKey: "max_installments",
    header: labels.maxNumHeader, // Use label prop
    cell: ({ row }) => {
      const allowed = row.original.installment_allowed;
      const max = row.getValue("max_installments");
      return allowed && max ? max : "-";
    },
    enableSorting: true,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const classFee = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              {/* Use translated string prop */}
              <span className="sr-only">{labels.openMenuLabel}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Use translated string prop */}
            <DropdownMenuLabel>{labels.actionsLabel}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(classFee)}>
              <Edit className="mr-2 h-4 w-4" />
              {/* Use translated string prop */}
              <span>{labels.editLabel}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAssign(classFee)}>
              <Users className="mr-2 h-4 w-4" />
              {/* Use translated string prop */}
              <span>{labels.assignFeesLabel}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(classFee)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {/* Use translated string prop */}
              <span>{labels.deleteLabel}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
