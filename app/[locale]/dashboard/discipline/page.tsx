"use client";

import React, { useState, useMemo, useCallback, JSX } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

// Icons (Import all needed icons)
import {
  Loader2,
  AlertCircle,
  RefreshCcw,
  PlusCircle,
  Search,
  AlertOctagon,
  Edit,
  Trash2,
  User,
  Info,
  Megaphone,
  NotebookText,
  Gavel,
  HelpCircle,
  SignalHigh,
  SignalMedium,
  SignalLow,
  ThumbsUp,
  ThumbsDown,
  Calendar as CalendarIcon,
  ListFilter,
  Building,
  CalendarDays,
  Tag,
  ListChecks,
  Settings,
  CheckSquare,
  Square, // Added icons for tabs/types
} from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

import DisciplineRecordModal from "./_components/DisciplineAddModal";
import DisciplineTypeModal from "./_components/RecordType";
import ConfirmationDialog from "../fees/_components/ConfirmDailogue";
import PageHeader from "../_components/PageHeader";
import PaginationControls from "../results/_components/PaginationControls";
import { DatePickerWithRange } from "../students/[id]/_components/date-picker";

// Hooks and Utils
import { useDebounce } from "@/hooks/useDebounce";
import {
  cn,
  formatDate,
  formatTime,
  getBackendErrorMessage,
} from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Queries and Types
import {
  fetchDisciplineRecords,
  deleteDisciplineRecord,
  fetchDisciplineRecordTypes as fetchActiveTypesForFilter,
  fetchPaginatedRecordTypes,
  createRecordType,
  updateRecordType,
  deleteRecordType,
} from "@/queries/discipline";
import { fetchAcademicYears } from "@/queries/results";
import { fetchAllClasses } from "@/queries/class";
import {
  PaginatedDisciplineResponse,
  DisciplineRecord,
  DisciplineCategory,
  DisciplineSeverity,
  DisciplineRecordType,
  PaginatedRecordTypesResponse,
} from "@/types/discipline";
import { Class } from "@/types/class";
import { AcademicYear } from "@/types/transfers";

// --- Constants for Filters ---
const CATEGORY_CHOICES: {
  value: DisciplineCategory | "all";
  labelKey: string;
}[] = [
  { value: "all", labelKey: "allCategories" },
  { value: "incident", labelKey: "incident" },
  { value: "merit", labelKey: "merit" },
  { value: "observation", labelKey: "observation" },
  { value: "sanction", labelKey: "sanction" },
  { value: "other", labelKey: "other" },
];
const CATEGORY_FILTER_OPTIONS = CATEGORY_CHOICES;
const SEVERITY_CHOICES: {
  value: DisciplineSeverity | "all";
  labelKey: string;
}[] = [
  { value: "all", labelKey: "allSeverities" },
  { value: "high", labelKey: "high" },
  { value: "medium", labelKey: "medium" },
  { value: "low", labelKey: "low" },
  { value: "info", labelKey: "info" },
  { value: "n/a", labelKey: "na" },
];
const BOOLEAN_FILTER_OPTIONS = [
  { value: "all", labelKey: "all" },
  { value: "true", labelKey: "yes" },
  { value: "false", labelKey: "no" },
];

// --- State Interfaces ---
interface RecordFilters {
  searchTerm: string;
  dateRange: DateRange | undefined;
  category: string;
  severity: string;
  recordTypeId: string;
  classId: string;
  academicYearId: string;
}
interface TypeFilters {
  searchTerm: string;
  category: string;
  isActive: string;
}

// --- Props Interfaces for Extracted Components ---
interface RecordFiltersHeaderProps {
  filters: RecordFilters;
  isFetching: boolean;
  canEdit: boolean | undefined;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onFilterChange: (name: keyof RecordFilters, value: any) => void;
  onReset: () => void;
  filterData: {
    classes: Class[] | undefined;
    academicYears: AcademicYear[] | undefined;
    activeRecordTypes: DisciplineRecordType[] | undefined;
  };
  isLoadingFilterData: {
    isLoadingClasses: boolean;
    isLoadingYears: boolean;
    isLoadingActiveTypes: boolean;
  };
  t: (key: string) => string;
  tCategory: (key: string) => string;
  tSeverity: (key: string) => string;
}

interface RecordsTableProps {
  recordsData: DisciplineRecord[];
  isLoading: boolean;
  isFetching: boolean;
  canEdit: boolean | undefined;
  recordToDelete: DisciplineRecord | null;
  deleteRecordMutationIsLoading: boolean;
  onEdit: (record: DisciplineRecord) => void;
  onDelete: (record: DisciplineRecord) => void;
  getCategoryIcon: (category?: DisciplineCategory) => JSX.Element;
  getSeverityIcon: (severity?: DisciplineSeverity | null) => JSX.Element;
  t: (key: string) => string;
  tCommon: (key: string) => string;
  tSeverity: (key: string) => string;
}

interface TypeFiltersHeaderProps {
  filters: TypeFilters;
  isFetching: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onFilterChange: (name: keyof TypeFilters, value: string) => void;
  onReset: () => void;
  tTypes: (key: string) => string;
  tCategory: (key: string) => string;
  tCommon: (key: string) => string;
}

interface RecordTypesTableProps {
  typesData: DisciplineRecordType[];
  isLoading: boolean;
  isFetching: boolean;
  typeToDelete: DisciplineRecordType | null;
  deleteTypeMutationIsLoading: boolean;
  onEdit: (type: DisciplineRecordType) => void;
  onDelete: (type: DisciplineRecordType) => void;
  getCategoryIcon: (category?: DisciplineCategory) => JSX.Element;
  getSeverityIcon: (severity?: DisciplineSeverity | null) => JSX.Element;
  tTypes: (key: string) => string;
  tCommon: (key: string) => string;
}

// --- Extracted Sub-Components ---

const RecordFiltersHeader = React.memo((props: RecordFiltersHeaderProps) => {
  const {
    filters,
    isFetching,
    canEdit,
    onSearchChange,
    onAdd,
    onFilterChange,
    onReset,
    filterData,
    isLoadingFilterData,
    t,
    tCategory,
    tSeverity,
  } = props;

  return (
    <div className="p-4 border-b bg-muted/40 space-y-3 print:hidden">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="pl-8 bg-background h-9"
            value={filters.searchTerm}
            onChange={onSearchChange}
            disabled={isFetching}
          />
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="w-full sm:w-auto h-9"
          disabled={isFetching || !canEdit}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> {t("addRecord")}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <DatePickerWithRange
          date={filters.dateRange}
          onDateChange={(v) => onFilterChange("dateRange", v)}
          className="bg-background [&>button]:h-9 [&>button]:text-sm"
          align="start"
          disabled={isFetching}
        />
        <Select
          value={filters.classId}
          onValueChange={(v) => onFilterChange("classId", v)}
          disabled={isLoadingFilterData.isLoadingClasses || isFetching}
        >
          <SelectTrigger className="bg-background h-9 text-sm">
            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("filterByClass")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allClasses")}</SelectItem>
            {filterData.classes?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.academicYearId}
          onValueChange={(v) => onFilterChange("academicYearId", v)}
          disabled={isLoadingFilterData.isLoadingYears || isFetching}
        >
          <SelectTrigger className="bg-background h-9 text-sm">
            <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("filterByYear")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allYears")}</SelectItem>
            {filterData.academicYears?.map((y) => (
              <SelectItem key={y.id} value={String(y.id)}>
                {y.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.category}
          onValueChange={(v) => onFilterChange("category", v)}
          disabled={isFetching}
        >
          <SelectTrigger className="bg-background h-9 text-sm">
            <ListFilter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("filterByCategory")} />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_FILTER_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {tCategory(c.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.severity}
          onValueChange={(v) => onFilterChange("severity", v)}
          disabled={isFetching}
        >
          <SelectTrigger className="bg-background h-9 text-sm">
            <HelpCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("filterBySeverity")} />
          </SelectTrigger>
          <SelectContent>
            {SEVERITY_CHOICES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {tSeverity(s.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.recordTypeId}
          onValueChange={(v) => onFilterChange("recordTypeId", v)}
          disabled={isLoadingFilterData.isLoadingActiveTypes || isFetching}
        >
          <SelectTrigger className="bg-background h-9 text-sm">
            <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t("filterByType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            {filterData.activeRecordTypes?.map((rt) => (
              <SelectItem key={rt.id} value={String(rt.id)}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-muted-foreground"
          disabled={isFetching}
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-1" />
          {t("resetFilters")}
        </Button>
      </div>
    </div>
  );
});
RecordFiltersHeader.displayName = "RecordFiltersHeader";

const RecordsTable = React.memo((props: RecordsTableProps) => {
  const {
    recordsData,
    isLoading,
    isFetching,
    canEdit,
    recordToDelete,
    deleteRecordMutationIsLoading,
    onEdit,
    onDelete,
    getCategoryIcon,
    getSeverityIcon,
    t,
    tCommon,
    tSeverity,
  } = props;

  if (isLoading && recordsData.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[110px] px-3 py-2.5">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="w-[180px] px-3 py-2.5">
                <Skeleton className="h-4 w-32" />
              </TableHead>
              <TableHead className="w-[180px] px-3 py-2.5">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead className="w-[100px] px-3 py-2.5">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="px-3 py-2.5 min-w-[200px]">
                <Skeleton className="h-4 w-48" />
              </TableHead>
              <TableHead className="w-[150px] px-3 py-2.5">
                <Skeleton className="h-4 w-28" />
              </TableHead>
              <TableHead className="w-[80px] px-3 py-2.5">
                <Skeleton className="h-4 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={`skel-mng-${index}`} className="animate-pulse">
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (recordsData.length === 0 && !isFetching) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/30">
        <AlertOctagon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p>{t("noRecordsFoundFilters")}</p>
        <p className="text-xs mt-1">{t("noRecordsFiltersHint")}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="w-full min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/60 text-xs uppercase tracking-wider">
            <TableHead className="w-[110px] px-3 py-2">
              {t("tableDate")}
            </TableHead>
            <TableHead className="w-[180px] px-3 py-2">
              {t("tableStudent")}
            </TableHead>
            <TableHead className="w-[180px] px-3 py-2">
              {t("tableType")}
            </TableHead>
            <TableHead className="w-[100px] px-3 py-2">
              {t("tableSeverity")}
            </TableHead>
            <TableHead className="px-3 py-2 min-w-[200px]">
              {t("tableDescription")}
            </TableHead>
            <TableHead className="w-[150px] px-3 py-2">
              {t("tableReportedBy")}
            </TableHead>
            <TableHead className="w-[80px] text-center px-3 py-2">
              {tCommon("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recordsData.map((record) => (
            <TableRow key={record.id} className="text-sm hover:bg-muted/30">
              <TableCell className="px-3 py-2 whitespace-nowrap align-top">
                <div>{formatDate(record.date_occurred)}</div>
                {record.time_occurred && (
                  <div className="text-xs text-muted-foreground">
                    {formatTime(record.time_occurred)}
                  </div>
                )}
              </TableCell>
              <TableCell className="px-3 py-2 font-medium align-top">
                {record.student_name || `ID: ${record.student}`}
                {record.student_matricule && (
                  <div className="text-xs text-muted-foreground font-mono">
                    ({record.student_matricule})
                  </div>
                )}
              </TableCell>
              <TableCell className="px-3 py-2 align-top">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(record.record_category)}
                  <span className="font-medium">
                    {record.record_type_name || "N/A"}
                  </span>
                  {record.is_positive_record ? (
                    <ThumbsUp className="h-3.5 w-3.5 text-success opacity-80" />
                  ) : (
                    <ThumbsDown className="h-3.5 w-3.5 text-destructive opacity-70" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground capitalize ml-6">
                  {record.record_category_display ||
                    record.record_category ||
                    "N/A"}
                </div>
              </TableCell>
              <TableCell className="px-3 py-2 align-top">
                <Badge
                  variant={
                    record.severity === "high"
                      ? "destructive"
                      : record.severity === "medium"
                        ? "warning"
                        : "outline"
                  }
                  className={cn(
                    "capitalize text-xs flex items-center gap-1",
                    record.severity === "info" &&
                      "bg-blue-100 text-blue-800 border-blue-300"
                  )}
                  title={record.severity_display || tSeverity("unknown")}
                >
                  {getSeverityIcon(record.severity)}
                  {record.severity_display || tSeverity("unknown")}
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2 text-xs leading-relaxed align-top">
                <p
                  className="text-foreground font-medium line-clamp-3"
                  title={record.description}
                >
                  {record.description || (
                    <span className="text-muted-foreground italic">
                      {tCommon("none")}
                    </span>
                  )}
                </p>
                {record.action_taken && (
                  <div className="mt-1.5 pt-1.5 border-t border-dashed text-muted-foreground italic">
                    <p className="flex items-start gap-1.5">
                      <span className="font-semibold text-foreground">
                        {t("tableActionTaken")}:
                      </span>
                      <span
                        className="flex-1 line-clamp-2"
                        title={record.action_taken}
                      >
                        {record.action_taken}
                      </span>
                    </p>
                  </div>
                )}
              </TableCell>
              <TableCell className="px-3 py-2 text-muted-foreground text-xs align-top">
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  {record.reported_by_name || tCommon("system")}
                </div>
                <div
                  className="text-[11px] mt-0.5 opacity-80"
                  title={`${tCommon("recordedOn")} ${formatDate(
                    record.created_at,
                    true
                  )}`}
                >
                  {formatDate(record.created_at)}
                </div>
              </TableCell>
              <TableCell className="px-3 py-2 text-center align-top">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 mr-1"
                  onClick={() => onEdit(record)}
                  title={tCommon("edit")}
                  disabled={!canEdit}
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span className="sr-only">{tCommon("edit")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDelete(record)}
                  title={tCommon("delete")}
                  disabled={
                    (deleteRecordMutationIsLoading &&
                      recordToDelete?.id === record.id) ||
                    !canEdit
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">{tCommon("delete")}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
RecordsTable.displayName = "RecordsTable";

const TypeFiltersHeader = React.memo((props: TypeFiltersHeaderProps) => {
  const {
    filters,
    isFetching,
    onSearchChange,
    onAdd,
    onFilterChange,
    onReset,
    tTypes,
    tCategory,
    tCommon,
  } = props;

  return (
    <div className="p-4 border-b bg-muted/40 space-y-3 print:hidden">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={tTypes("searchPlaceholder")}
            className="pl-8 bg-background h-9"
            value={filters.searchTerm}
            onChange={onSearchChange}
            disabled={isFetching}
          />
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="w-full sm:w-auto h-9"
          disabled={isFetching}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> {tTypes("addType")}
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Select
          value={filters.category}
          onValueChange={(v) => onFilterChange("category", v)}
          disabled={isFetching}
        >
          <SelectTrigger className="bg-background h-9 text-sm w-full sm:w-[200px]">
            <ListFilter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={tTypes("filterByCategory")} />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_FILTER_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {tCategory(c.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.isActive}
          onValueChange={(v) => onFilterChange("isActive", v)}
          disabled={isFetching}
        >
          <SelectTrigger className="bg-background h-9 text-sm w-full sm:w-[180px]">
            <ListChecks className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={tTypes("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            {BOOLEAN_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {tCommon(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-muted-foreground sm:ml-auto"
          disabled={isFetching}
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-1" />
          {tTypes("resetFilters")}
        </Button>
      </div>
    </div>
  );
});
TypeFiltersHeader.displayName = "TypeFiltersHeader";

const RecordTypesTable = React.memo((props: RecordTypesTableProps) => {
  const {
    typesData,
    isLoading,
    isFetching,
    typeToDelete,
    deleteTypeMutationIsLoading,
    onEdit,
    onDelete,
    getCategoryIcon,
    getSeverityIcon,
    tTypes,
    tCommon,
  } = props;

  if (isLoading && typesData.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px] px-3 py-2.5">
                <Skeleton className="h-4 w-40" />
              </TableHead>
              <TableHead className="w-[150px] px-3 py-2.5">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead className="w-[150px] px-3 py-2.5">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead className="px-3 py-2.5">
                <Skeleton className="h-4 w-48" />
              </TableHead>
              <TableHead className="w-[100px] px-3 py-2.5">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[80px] px-3 py-2.5">
                <Skeleton className="h-4 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skel-type-${i}`} className="animate-pulse">
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Skeleton className="h-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  if (typesData.length === 0 && !isFetching) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/30">
        <Settings className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p>{tTypes("noTypesFound")}</p>
        <p className="text-xs mt-1">{tTypes("noTypesHint")}</p>
      </div>
    );
  }
  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table className="w-full min-w-[700px]">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/60 text-xs uppercase tracking-wider">
            <TableHead className="w-[250px] px-3 py-2">
              {tTypes("tableName")}
            </TableHead>
            <TableHead className="w-[150px] px-3 py-2">
              {tTypes("tableCategory")}
            </TableHead>
            <TableHead className="w-[150px] px-3 py-2">
              {tTypes("tableDefaultSeverity")}
            </TableHead>
            <TableHead className="px-3 py-2">
              {tTypes("tableDescription")}
            </TableHead>
            <TableHead className="w-[100px] px-3 py-2 text-center">
              {tTypes("tableIsActive")}
            </TableHead>
            <TableHead className="w-[80px] text-center px-3 py-2">
              {tCommon("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {typesData.map((type) => (
            <TableRow key={type.id} className="text-sm hover:bg-muted/30">
              <TableCell className="px-3 py-2 font-medium">
                {type.name}
              </TableCell>
              <TableCell className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(type.category)}
                  <span>{type.category_display || type.category}</span>
                </div>
              </TableCell>
              <TableCell className="px-3 py-2">
                {type.default_severity ? (
                  <Badge variant="outline" className="capitalize bg-background">
                    {getSeverityIcon(type.default_severity)}
                    {type.default_severity_display}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    {tCommon("none")}
                  </span>
                )}
              </TableCell>
              <TableCell
                className="px-3 py-2 text-xs text-muted-foreground line-clamp-2"
                title={type.description || ""}
              >
                {type.description || (
                  <span className="italic">{tCommon("none")}</span>
                )}
              </TableCell>
              <TableCell className="px-3 py-2 text-center">
                {type.is_active ? (
                  <CheckSquare className="h-5 w-5 text-success inline-block" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground inline-block" />
                )}
              </TableCell>
              <TableCell className="px-3 py-2 text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 mr-1"
                  onClick={() => onEdit(type)}
                  title={tCommon("edit")}
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span className="sr-only">{tCommon("edit")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDelete(type)}
                  title={tCommon("delete")}
                  disabled={
                    deleteTypeMutationIsLoading && typeToDelete?.id === type.id
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">{tCommon("delete")}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
RecordTypesTable.displayName = "RecordTypesTable";

// --- Main Page Component ---
const DisciplineManagementPage = () => {
  const t = useTranslations("Discipline.Management");
  const tTypes = useTranslations("Discipline.TypeManagement");
  const tCategory = useTranslations("Discipline.Category");
  const tSeverity = useTranslations("Discipline.Severity");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const { canEdit } = useCurrentUser();

  const defaultPageSize = 20;

  // --- State ---
  const [activeTab, setActiveTab] = useState<"records" | "types">("records");

  // State for Records Tab
  const [recordFilters, setRecordFilters] = useState<RecordFilters>({
    searchTerm: "",
    dateRange: undefined,
    category: "all",
    severity: "all",
    recordTypeId: "all",
    classId: "all",
    academicYearId: "all",
  });
  const [recordPagination, setRecordPagination] = useState({
    page: 1,
    pageSize: defaultPageSize,
  });
  const [recordModalState, setRecordModalState] = useState<{
    isOpen: boolean;
    recordId: number | null;
  }>({ isOpen: false, recordId: null });
  const [recordToDelete, setRecordToDelete] = useState<DisciplineRecord | null>(
    null
  );

  // State for Types Tab
  const [typeFilters, setTypeFilters] = useState<TypeFilters>({
    searchTerm: "",
    category: "all",
    isActive: "all",
  });
  const [typePagination, setTypePagination] = useState({
    page: 1,
    pageSize: defaultPageSize,
  });
  const [typeModalState, setTypeModalState] = useState<{
    isOpen: boolean;
    typeData: DisciplineRecordType | null;
  }>({ isOpen: false, typeData: null });
  const [typeToDelete, setTypeToDelete] = useState<DisciplineRecordType | null>(
    null
  );

  const debouncedRecordSearch = useDebounce(recordFilters.searchTerm, 500);
  const debouncedTypeSearch = useDebounce(typeFilters.searchTerm, 500);

  // --- Derived Filters for API Queries ---
  const recordFiltersForQuery = useMemo(
    () => ({
      student_name: debouncedRecordSearch || undefined,
      date_from: recordFilters.dateRange?.from
        ? format(recordFilters.dateRange.from, "yyyy-MM-dd")
        : undefined,
      date_to: recordFilters.dateRange?.to
        ? format(recordFilters.dateRange.to, "yyyy-MM-dd")
        : undefined,
      record_category:
        recordFilters.category === "all" ? undefined : recordFilters.category,
      severity:
        recordFilters.severity === "all" ? undefined : recordFilters.severity,
      record_type_id:
        recordFilters.recordTypeId === "all"
          ? undefined
          : recordFilters.recordTypeId,
      class_id:
        recordFilters.classId === "all" ? undefined : recordFilters.classId,
      academic_year_id:
        recordFilters.academicYearId === "all"
          ? undefined
          : recordFilters.academicYearId,
      ordering: "-date_occurred,-created_at",
    }),
    [debouncedRecordSearch, recordFilters]
  );

  const typeFiltersForQuery = useMemo(
    () => ({
      search: debouncedTypeSearch || undefined,
      category:
        typeFilters.category === "all" ? undefined : typeFilters.category,
      is_active:
        typeFilters.isActive === "all"
          ? undefined
          : typeFilters.isActive === "true",
      ordering: "category,name",
    }),
    [debouncedTypeSearch, typeFilters.category, typeFilters.isActive]
  );

  // --- Data Fetching ---
  const {
    data: disciplineResponse,
    isLoading: isLoadingRecords,
    error: errorRecords,
    isError: isErrorRecords,
    isFetching: isFetchingRecords,
    refetch: refetchRecords,
  } = useQuery<PaginatedDisciplineResponse, Error>({
    queryKey: [
      "disciplineRecords",
      recordFiltersForQuery,
      recordPagination.page,
      recordPagination.pageSize,
    ],
    queryFn: () =>
      fetchDisciplineRecords({
        page: recordPagination.page,
        pageSize: recordPagination.pageSize,
        ...recordFiltersForQuery,
      }),
    enabled: activeTab === "records",
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const {
    data: typesResponse,
    isLoading: isLoadingTypesData,
    error: errorTypes,
    isError: isErrorTypesData,
    isFetching: isFetchingTypes,
    refetch: refetchTypes,
  } = useQuery<PaginatedRecordTypesResponse, Error>({
    queryKey: [
      "disciplineRecordTypes",
      "paginated",
      typeFiltersForQuery,
      typePagination.page,
      typePagination.pageSize,
    ],
    queryFn: () =>
      fetchPaginatedRecordTypes({
        page: typePagination.page,
        pageSize: typePagination.pageSize,
        ...typeFiltersForQuery,
      }),
    enabled: activeTab === "types",
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const { data: academicYears, isLoading: isLoadingYears } = useQuery<
    AcademicYear[],
    Error
  >({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
    staleTime: 5 * 60 * 1000,
    select: (data) =>
      data.sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      ),
  });

  const { data: classes, isLoading: isLoadingClasses } = useQuery<
    Class[],
    Error
  >({
    queryKey: ["allClasses"],
    queryFn: () => fetchAllClasses(),
    staleTime: 5 * 60 * 1000,
    select: (data) =>
      data?.sort((a, b) => a.full_name.localeCompare(b.full_name)),
  });

  const { data: activeRecordTypes, isLoading: isLoadingActiveTypes } = useQuery<
    DisciplineRecordType[],
    Error
  >({
    queryKey: ["disciplineRecordTypes", "active"],
    queryFn: () => fetchActiveTypesForFilter({ is_active: true }),
    staleTime: 5 * 60 * 1000,
    select: (data) => data?.sort((a, b) => a.name.localeCompare(b.name)),
  });

  // --- Mutations ---
  const deleteRecordMutation = useMutation<void, Error, number>({
    mutationFn: deleteDisciplineRecord,
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      setRecordToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["disciplineRecords"] });
    },
    onError: (err) => {
      toast.error(getBackendErrorMessage(err) || t("deleteError"));
      setRecordToDelete(null);
    },
  });

  const deleteTypeMutation = useMutation<void, Error, number>({
    mutationFn: deleteRecordType,
    onSuccess: () => {
      toast.success(tTypes("deleteSuccess"));
      setTypeToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["disciplineRecordTypes"] });
      queryClient.invalidateQueries({
        queryKey: ["disciplineRecordTypes", "active"],
      });
    },
    onError: (err) => {
      toast.error(getBackendErrorMessage(err) || tTypes("deleteError"));
      setTypeToDelete(null);
    },
  });

  // --- Handlers ---
  const handleRecordFilterChange = useCallback(
    (name: keyof RecordFilters, value: any) => {
      setRecordFilters((prev) => ({ ...prev, [name]: value }));
      setRecordPagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const handleRecordSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRecordFilters((prev) => ({ ...prev, searchTerm: e.target.value }));
      setRecordPagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const handleResetRecordFilters = useCallback(() => {
    setRecordFilters({
      searchTerm: "",
      dateRange: undefined,
      category: "all",
      severity: "all",
      recordTypeId: "all",
      classId: "all",
      academicYearId: "all",
    });
    setRecordPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleRecordPageChange = useCallback(
    (newPage: number) =>
      setRecordPagination((prev) => ({ ...prev, page: newPage })),
    []
  );

  const handleAddRecord = useCallback(
    () => setRecordModalState({ isOpen: true, recordId: null }),
    []
  );

  const handleEditRecord = useCallback((record: DisciplineRecord) => {
    setRecordModalState({ isOpen: true, recordId: record.id });
  }, []);

  const handleRecordModalClose = useCallback(
    (refresh?: boolean) => {
      setRecordModalState({ isOpen: false, recordId: null });
      if (refresh)
        queryClient.invalidateQueries({ queryKey: ["disciplineRecords"] });
    },
    [queryClient]
  );

  const handleDeleteRecordClick = useCallback(
    (record: DisciplineRecord) => setRecordToDelete(record),
    []
  );

  const confirmDeleteRecord = useCallback(() => {
    if (recordToDelete) deleteRecordMutation.mutate(recordToDelete.id);
  }, [recordToDelete, deleteRecordMutation]);

  const handleTypeFilterChange = useCallback(
    (name: keyof TypeFilters, value: string) => {
      setTypeFilters((prev) => ({ ...prev, [name]: value }));
      setTypePagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const handleTypeSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTypeFilters((prev) => ({ ...prev, searchTerm: e.target.value }));
      setTypePagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const handleResetTypeFilters = useCallback(() => {
    setTypeFilters({ searchTerm: "", category: "all", isActive: "all" });
    setTypePagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleTypePageChange = useCallback(
    (newPage: number) =>
      setTypePagination((prev) => ({ ...prev, page: newPage })),
    []
  );

  const handleAddType = useCallback(
    () => setTypeModalState({ isOpen: true, typeData: null }),
    []
  );

  const handleEditType = useCallback((type: DisciplineRecordType) => {
    setTypeModalState({ isOpen: true, typeData: type });
  }, []);

  const handleTypeModalClose = useCallback(
    (refresh?: boolean) => {
      setTypeModalState({ isOpen: false, typeData: null });
      if (refresh) {
        queryClient.invalidateQueries({ queryKey: ["disciplineRecordTypes"] });
        queryClient.invalidateQueries({
          queryKey: ["disciplineRecordTypes", "active"],
        });
      }
    },
    [queryClient]
  );

  const handleDeleteTypeClick = useCallback(
    (type: DisciplineRecordType) => setTypeToDelete(type),
    []
  );

  const confirmDeleteType = useCallback(() => {
    if (typeToDelete) deleteTypeMutation.mutate(typeToDelete.id);
  }, [typeToDelete, deleteTypeMutation]);

  // --- Derived data ---
  const records = disciplineResponse?.results ?? [];
  const totalRecords = disciplineResponse?.count ?? 0;
  const totalRecordPages = Math.ceil(totalRecords / recordPagination.pageSize);
  const recordTypes = typesResponse?.results ?? [];
  const totalTypes = typesResponse?.count ?? 0;
  const totalTypePages = Math.ceil(totalTypes / typePagination.pageSize);

  // --- UI Helper Functions ---
  const getCategoryIcon = useCallback(
    (category?: DisciplineCategory): JSX.Element => {
      switch (category) {
        case "incident":
          return (
            <AlertOctagon
              className="h-4 w-4 text-destructive"
              aria-label={tCategory("incident")}
            />
          );
        case "merit":
          return (
            <Megaphone
              className="h-4 w-4 text-success"
              aria-label={tCategory("merit")}
            />
          );
        case "observation":
          return (
            <NotebookText
              className="h-4 w-4 text-blue-500"
              aria-label={tCategory("observation")}
            />
          );
        case "sanction":
          return (
            <Gavel
              className="h-4 w-4 text-orange-600"
              aria-label={tCategory("sanction")}
            />
          );
        default:
          return (
            <HelpCircle
              className="h-4 w-4 text-muted-foreground"
              aria-label={tCategory("other")}
            />
          );
      }
    },
    [tCategory]
  );

  const getSeverityIcon = useCallback(
    (severity?: DisciplineSeverity | null): JSX.Element => {
      switch (severity) {
        case "high":
          return (
            <SignalHigh
              className="h-4 w-4 text-destructive"
              aria-label={tSeverity("high")}
            />
          );
        case "medium":
          return (
            <SignalMedium
              className="h-4 w-4 text-orange-500"
              aria-label={tSeverity("medium")}
            />
          );
        case "low":
          return (
            <SignalLow
              className="h-4 w-4 text-yellow-500"
              aria-label={tSeverity("low")}
            />
          );
        case "info":
          return (
            <Info
              className="h-4 w-4 text-blue-500"
              aria-label={tSeverity("info")}
            />
          );
        default:
          return (
            <HelpCircle
              className="h-4 w-4 text-muted-foreground"
              aria-label={tSeverity("na")}
            />
          );
      }
    },
    [tSeverity]
  );

  // --- Global Error Handling ---
  const globalError = activeTab === "records" ? errorRecords : errorTypes;
  const globalLoading =
    activeTab === "records" ? isLoadingRecords : isLoadingTypesData;

  if (
    globalError &&
    !globalLoading &&
    (activeTab === "records" ? records.length === 0 : recordTypes.length === 0)
  ) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Card className="bg-destructive/5 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle /> {t("errorTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-center">
              {getBackendErrorMessage(globalError) || t("errorMessage")}
            </p>
            <Button
              variant="destructive"
              outline
              onClick={() =>
                activeTab === "records" ? refetchRecords() : refetchTypes()
              }
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> {tCommon("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Render with Tabs ---
  return (
    <TooltipProvider>
      <>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          <PageHeader title={t("pageTitle")} />
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "records" | "types")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="records">
                <ListChecks className="h-4 w-4 mr-2" />
                {t("recordsTab")}
              </TabsTrigger>
              <TabsTrigger value="types" disabled={!canEdit}>
                <Settings className="h-4 w-4 mr-2" />
                {t("typesTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="mt-4">
              <Card className="bg-background border shadow-sm overflow-hidden relative">
                {isFetchingRecords && !isLoadingRecords && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <RecordFiltersHeader
                  filters={recordFilters}
                  isFetching={isFetchingRecords}
                  canEdit={canEdit}
                  onSearchChange={handleRecordSearchChange}
                  onAdd={handleAddRecord}
                  onFilterChange={handleRecordFilterChange}
                  onReset={handleResetRecordFilters}
                  filterData={{
                    classes,
                    academicYears,
                    activeRecordTypes,
                  }}
                  isLoadingFilterData={{
                    isLoadingClasses,
                    isLoadingYears,
                    isLoadingActiveTypes,
                  }}
                  t={t}
                  tCategory={tCategory}
                  tSeverity={tSeverity}
                />
                <div className="p-0">
                  <RecordsTable
                    recordsData={records}
                    isLoading={isLoadingRecords}
                    isFetching={isFetchingRecords}
                    canEdit={canEdit}
                    recordToDelete={recordToDelete}
                    deleteRecordMutationIsLoading={
                      deleteRecordMutation.isLoading
                    }
                    onEdit={handleEditRecord}
                    onDelete={handleDeleteRecordClick}
                    getCategoryIcon={getCategoryIcon}
                    getSeverityIcon={getSeverityIcon}
                    t={t}
                    tCommon={tCommon}
                    tSeverity={tSeverity}
                  />
                </div>
              </Card>
              {totalRecordPages > 1 && !isLoadingRecords && (
                <div className="flex justify-center mt-6 print:hidden">
                  <PaginationControls
                    currentPage={recordPagination.page}
                    totalPages={totalRecordPages}
                    onPageChange={handleRecordPageChange}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="types" className="mt-4">
              <Card className="bg-background border shadow-sm overflow-hidden relative">
                {isFetchingTypes && !isLoadingTypesData && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <TypeFiltersHeader
                  filters={typeFilters}
                  isFetching={isFetchingTypes}
                  onSearchChange={handleTypeSearchChange}
                  onAdd={handleAddType}
                  onFilterChange={handleTypeFilterChange}
                  onReset={handleResetTypeFilters}
                  tTypes={tTypes}
                  tCategory={tCategory}
                  tCommon={tCommon}
                />
                <div className="p-0">
                  <RecordTypesTable
                    typesData={recordTypes}
                    isLoading={isLoadingTypesData}
                    isFetching={isFetchingTypes}
                    typeToDelete={typeToDelete}
                    deleteTypeMutationIsLoading={deleteTypeMutation.isLoading}
                    onEdit={handleEditType}
                    onDelete={handleDeleteTypeClick}
                    getCategoryIcon={getCategoryIcon}
                    getSeverityIcon={getSeverityIcon}
                    tTypes={tTypes}
                    tCommon={tCommon}
                  />
                </div>
              </Card>
              {totalTypePages > 1 && !isLoadingTypesData && (
                <div className="flex justify-center mt-6 print:hidden">
                  <PaginationControls
                    currentPage={typePagination.page}
                    totalPages={totalTypePages}
                    onPageChange={handleTypePageChange}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DisciplineRecordModal
          isOpen={recordModalState.isOpen}
          recordId={recordModalState.recordId}
          onClose={handleRecordModalClose}
        />
        <DisciplineTypeModal
          isOpen={typeModalState.isOpen}
          typeData={typeModalState.typeData}
          onClose={handleTypeModalClose}
        />

        <ConfirmationDialog
          isOpen={!!recordToDelete}
          onClose={() => setRecordToDelete(null)}
          onConfirm={confirmDeleteRecord}
          title={t("deleteConfirmTitle")}
          description={t("deleteConfirmDescription", {
            type: recordToDelete?.record_type_name ?? "N/A",
            student:
              recordToDelete?.student_name ?? `ID ${recordToDelete?.student}`,
            date: recordToDelete
              ? formatDate(recordToDelete.date_occurred)
              : "N/A",
          })}
          confirmText={tCommon("delete")}
          confirmVariant="destructive"
          isConfirming={deleteRecordMutation.isLoading}
        />
        <ConfirmationDialog
          isOpen={!!typeToDelete}
          onClose={() => setTypeToDelete(null)}
          onConfirm={confirmDeleteType}
          title={tTypes("deleteConfirmTitle")}
          description={tTypes("deleteConfirmDescription", {
            name: typeToDelete?.name ?? "N/A",
          })}
          confirmText={tCommon("delete")}
          confirmVariant="destructive"
          isConfirming={deleteTypeMutation.isLoading}
        />
      </>
    </TooltipProvider>
  );
};

export default DisciplineManagementPage;
