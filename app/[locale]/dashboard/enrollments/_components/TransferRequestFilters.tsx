"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { AcademicYear } from "@/types/transfers";

// Define filter options referencing translation keys
const STATUS_OPTIONS = [
  { value: "all", labelKey: "statusOptions.all" },
  { value: "pending", labelKey: "statusOptions.pending" },
  { value: "approved", labelKey: "statusOptions.approved" },
  { value: "rejected", labelKey: "statusOptions.rejected" },
  { value: "completed", labelKey: "statusOptions.completed" },
  { value: "cancelled", labelKey: "statusOptions.cancelled" },
];

// Removed Direction Options as it's likely not supported by backend filterset
// const DIRECTION_OPTIONS = [ ... ];

interface TransferRequestFiltersProps {
  filters: {
    status: string;
    // direction: string; // Removed
    effectiveYearId: string; // Keep as string for Select value
    search: string;
    // Add other filter keys if needed (e.g., fromSchoolId, toSchoolId)
  };
  onFilterChange: (key: string, value: string | number) => void;
  academicYears: AcademicYear[];
  isLoading?: boolean;
}

function TransferRequestFilters({
  filters,
  onFilterChange,
  academicYears = [],
  isLoading = false,
}: TransferRequestFiltersProps) {
  const t = useTranslations("TransfersTab.filters"); // Namespace for filter translations

  return (
    // Adjust grid columns if Direction is removed
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/60 dark:bg-slate-800/40">
      {/* Status Filter */}
      <div>
        <Label
          htmlFor="transferStatusFilter"
          className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block"
        >
          {t("labels.status")}
        </Label>
        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange("status", value)}
          disabled={isLoading}
        >
          <SelectTrigger
            id="transferStatusFilter"
            className="h-9 bg-white dark:bg-slate-900 text-sm"
            aria-label={t("labels.status")}
          >
            <SelectValue placeholder={t("placeholders.status")} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Effective Year Filter */}
      <div>
        <Label
          htmlFor="transferYearFilter"
          className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block"
        >
          {t("labels.effectiveYear")}
        </Label>
        <Select
          // Ensure value is always string, handle empty string for "all"
          value={filters.effectiveYearId || "all"}
          onValueChange={(value) =>
            // Send empty string if 'all' is selected, otherwise the ID string
            onFilterChange("effectiveYearId", value === "all" ? "" : value)
          }
          disabled={isLoading}
        >
          <SelectTrigger
            id="transferYearFilter"
            className="h-9 bg-white dark:bg-slate-900 text-sm"
            aria-label={t("labels.effectiveYear")}
          >
            <SelectValue placeholder={t("placeholders.year")} />
          </SelectTrigger>
          <SelectContent>
            {/* Explicit "All Years" option */}
            <SelectItem value="all" className="text-sm">
              {t("yearOptions.all")}
            </SelectItem>
            {academicYears.map((year) => (
              <SelectItem
                key={year.id}
                value={year.id.toString()} // Ensure value is string
                className="text-sm"
              >
                {year.name}{" "}
                {year.is_active ? `(${t("yearOptions.activeSuffix")})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search Filter */}
      <div>
        <Label
          htmlFor="transferSearch"
          className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block"
        >
          {t("labels.searchStudentOrSchool")} {/* Updated label */}
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="transferSearch"
            type="search"
            placeholder={t("placeholders.search")} // Generic search placeholder
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-8 h-9 bg-white dark:bg-slate-900 text-sm"
            disabled={isLoading}
            aria-label={t("labels.searchStudentOrSchool")}
          />
        </div>
      </div>
    </div>
  );
}

export default TransferRequestFilters;
