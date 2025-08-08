"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Check, X, MoreHorizontal, Edit, Trash2 } from "lucide-react"; // Added icons
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
import { FeeType } from "@/types/fees"; // Updated type import

interface FeeTypeColumnsProps {
  t: (key: string) => string; // Translation function from useTranslations("Common") usually
  onEdit: (feeType: FeeType) => void;
  onDelete: (feeType: FeeType) => void;
  canEdit: boolean; // Prop to receive permission status
}

export const FeeTypeColumns = ({
  t,
  onEdit,
  onDelete,
  canEdit,
}: FeeTypeColumnsProps): ColumnDef<FeeType>[] => [
  {
    accessorKey: "name",
    header: t("name"), // Use common t for header names
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "description",
    header: t("description"),
    cell: ({ row }) => (
      <div className="text-sm text-gray-600 max-w-xs truncate">
        {row.getValue("description") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "is_active",
    header: t("active"),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return (
        <Badge
          variant="outline" // Use outline as base
          className={cn(
            "text-xs px-2 py-0.5", // Consistent padding/size
            isActive
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-gray-100 text-gray-700 border-gray-300"
          )}
        >
          {isActive ? (
            <Check className="h-3 w-3 mr-1" />
          ) : (
            <X className="h-3 w-3 mr-1" />
          )}
          {isActive ? t("yes") : t("no")}
        </Badge>
      );
    },
    // Simple boolean filter function
    filterFn: (row, id, value) => {
      const isActive = row.getValue(id);
      // `value` would typically be 'true' or 'false' string from a filter control
      return String(isActive) === String(value);
    },
    enableSorting: true,
  },
  // *** ADDED: School Name Column (useful for superusers) ***
  // Hide this column by default if needed via table state
  {
    accessorKey: "school_name",
    header: t("school"), // Add "school" to Common translations
    cell: ({ row }) => <div>{row.getValue("school_name")}</div>,
    enableSorting: true,
  },
  {
    id: "actions",
    enableHiding: false, // Keep actions visible
    cell: ({ row }) => {
      const feeType = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={!canEdit} // The button is disabled if user cannot edit
            >
              <span className="sr-only">{t("openMenu")}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(feeType)}>
              <Edit className="mr-2 h-4 w-4" /> {/* Icon */}
              <span>{t("edit")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(feeType)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" /> {/* Icon */}
              <span>{t("delete")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
