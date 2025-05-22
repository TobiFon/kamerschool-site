"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl"; // Import useTranslations
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Search,
  AlertTriangle,
  Edit,
  Users,
  UserCheck,
  Filter,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationComponent } from "./PaginationComponent"; // Handles own translation
import { StatusBadge } from "./StatusBadge"; // Handles own translation
import { getAcademicYearEnrollments } from "@/queries/promotions";

const DEFAULT_PAGE_SIZE = 20;
const SELECT_PLACEHOLDER = "__placeholder__";

function EnrolledStudentsList({
  academicYears = [],
  initialToYear = null,
  selectedClassId,
  onEditClick,
}) {
  const t = useTranslations("EnrolledStudentsList"); // Initialize useTranslations

  // Translate ENROLLMENT_STATUSES using useMemo
  const ENROLLMENT_STATUSES = useMemo(
    () => [
      { value: "all", label: t("filters.statusOptions.all") },
      { value: "confirmed", label: t("filters.statusOptions.confirmed") },
      { value: "pending", label: t("filters.statusOptions.pending") },
      {
        value: "transferred_in",
        label: t("filters.statusOptions.transferred_in"),
      },
      {
        value: "transferred_out",
        label: t("filters.statusOptions.transferred_out"),
      },
      { value: "withdrawn", label: t("filters.statusOptions.withdrawn") },
    ],
    [t]
  );

  const [targetYearId, setTargetYearId] = useState(initialToYear);

  const [filters, setFilters] = useState({
    status: "confirmed",
    search: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    setTargetYearId(initialToYear);
  }, [initialToYear]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      status: "confirmed",
      search: "",
    }));
  }, [selectedClassId, targetYearId]);

  const queryParams = useMemo(
    () => ({
      academicYearId: targetYearId,
      assignedClassId: selectedClassId,
      status: filters.status === "all" ? undefined : filters.status,
      search: debouncedSearch || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [
      targetYearId,
      selectedClassId,
      filters.status,
      debouncedSearch,
      filters.page,
      filters.pageSize,
    ]
  );

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["academicYearEnrollments", queryParams],
    queryFn: () => getAcademicYearEnrollments(queryParams),
    keepPreviousData: true,
    enabled:
      Boolean(targetYearId) &&
      selectedClassId !== null &&
      selectedClassId !== undefined,
  });

  const enrollments = useMemo(() => data?.results || [], [data?.results]);
  const totalEnrollmentCount = data?.count || 0;
  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      totalPages:
        data?.totalPages || Math.ceil(totalEnrollmentCount / filters.pageSize),
      hasNextPage: Boolean(data?.next),
      hasPreviousPage: Boolean(data?.previous),
      totalCount: totalEnrollmentCount,
      pageSize: filters.pageSize,
    }),
    [data, totalEnrollmentCount, filters.page, filters.pageSize]
  );

  const handleFilterChange = useCallback((key, value) => {
    const isPageChange = key === "page";
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: isPageChange ? value : 1,
    }));
  }, []);

  const handleSearchChange = useCallback(
    (e) => handleFilterChange("search", e.target.value),
    [handleFilterChange]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage > 0 && newPage <= pagination.totalPages) {
        handleFilterChange("page", newPage);
      }
    },
    [handleFilterChange, pagination.totalPages]
  );

  const handleYearChange = useCallback((value) => {
    setTargetYearId(value === SELECT_PLACEHOLDER ? null : parseInt(value, 10));
  }, []);

  const renderSkeleton = useCallback(
    () =>
      Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={`skel-enroll-${index}`} className="animate-pulse">
          <TableCell className="py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24 rounded-full" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-16 rounded inline-block" />
          </TableCell>
        </TableRow>
      )),
    []
  );

  const validAcademicYears = useMemo(
    () => academicYears.filter((y) => y?.id != null),
    [academicYears]
  );

  const yearsSelected = Boolean(targetYearId);
  const classSelected =
    selectedClassId !== null && selectedClassId !== undefined;
  const isLoadingAny = isLoading || isFetching;

  const currentYearName = useMemo(() => {
    const year = validAcademicYears.find((y) => y.id === targetYearId);
    return year?.name || null;
  }, [validAcademicYears, targetYearId]);

  const getInitials = (firstName, lastName) => {
    return `${(firstName?.[0] || "").toUpperCase()}${(
      lastName?.[0] || ""
    ).toUpperCase()}`;
  };

  return (
    <Card className="shadow-lg border-slate-200 overflow-hidden">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-primary/10 p-1.5 rounded-full">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-800">
                {t("header.title")}
              </CardTitle>
              {classSelected && yearsSelected && !isError && !isLoadingAny && (
                <Badge
                  variant="outline"
                  className="ml-3 font-normal bg-white border-primary/20 text-primary"
                >
                  {t("header.countBadge", { count: totalEnrollmentCount })}
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm text-slate-600 ml-9">
              {t("header.description")}
            </CardDescription>
          </div>

          {yearsSelected && classSelected && currentYearName && (
            <Badge
              variant="secondary"
              className="h-7 px-3 bg-slate-100 gap-1.5 text-slate-700 border border-slate-200"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>{currentYearName}</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-5 border border-slate-200 rounded-lg bg-slate-50 shadow-sm">
          <div>
            <Label
              htmlFor="enrollmentYearSelect"
              className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5"
            >
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              {t("filters.labels.academicYear")}
            </Label>
            <Select
              value={targetYearId?.toString() || SELECT_PLACEHOLDER}
              onValueChange={handleYearChange}
            >
              <SelectTrigger
                id="enrollmentYearSelect"
                className="h-10 bg-white text-sm border-slate-200 focus:ring-primary/40"
              >
                <SelectValue
                  placeholder={t("filters.placeholders.yearSelect")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_PLACEHOLDER} disabled>
                  {t("filters.placeholders.yearSelectDisabled")}
                </SelectItem>
                {validAcademicYears.map((y) => (
                  <SelectItem
                    key={y.id}
                    value={y.id.toString()}
                    className="text-sm"
                  >
                    {y.name}{" "}
                    {y.is_active && (
                      <span className="ml-1 text-primary/85 font-medium">
                        {t("filters.activeYearSuffix")}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor="enrollmentStatusFilter"
              className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5"
            >
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              {t("filters.labels.status")}
            </Label>
            <Select
              value={filters.status}
              onValueChange={(v) => handleFilterChange("status", v)}
              disabled={isLoadingAny || !classSelected || !yearsSelected}
            >
              <SelectTrigger
                id="enrollmentStatusFilter"
                className="h-10 bg-white text-sm border-slate-200 focus:ring-primary/70"
              >
                <SelectValue
                  placeholder={t("filters.placeholders.statusFilter")}
                />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_STATUSES.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-sm"
                  >
                    {opt.label} {/* Already translated via useMemo */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label
              htmlFor="enrollmentSearch"
              className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5 text-slate-500" />
              {t("filters.labels.searchStudents")}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="enrollmentSearch"
                type="search"
                placeholder={t("filters.placeholders.search")}
                value={filters.search}
                onChange={handleSearchChange}
                className="pl-9 h-10 bg-white text-sm w-full border-slate-200 focus:ring-primary/80"
                disabled={isLoadingAny || !classSelected || !yearsSelected}
              />
            </div>
          </div>
        </div>

        {!classSelected && yearsSelected && (
          <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800 flex gap-3 items-start">
            <div className="bg-amber-100 p-1 rounded-full mt-0.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <AlertTitle className="font-semibold text-amber-800">
                {t("alerts.classRequired.title")}
              </AlertTitle>
              <AlertDescription className="text-sm text-amber-700">
                {t("alerts.classRequired.description")}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {!yearsSelected && (
          <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800 flex gap-3 items-start">
            <div className="bg-blue-100 p-1 rounded-full mt-0.5">
              <Filter className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <AlertTitle className="font-semibold text-blue-800">
                {t("alerts.yearRequired.title")}
              </AlertTitle>
              <AlertDescription className="text-sm text-blue-700">
                {t("alerts.yearRequired.description")}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {isError && yearsSelected && classSelected && (
          <Alert className="mb-6 bg-red-50 border-red-200 text-red-800 flex gap-3 items-start">
            <div className="bg-red-100 p-1 rounded-full mt-0.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <AlertTitle className="font-semibold text-red-800">
                {t("alerts.errorLoading.title")}
              </AlertTitle>
              <AlertDescription className="text-sm text-red-700">
                {error?.message || t("alerts.errorLoading.defaultMessage")}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {yearsSelected && classSelected && (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <ScrollArea className="h-[480px]">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                  <TableRow>
                    <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider py-3 pl-6">
                      {t("table.headers.student")}
                    </TableHead>
                    <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider py-3">
                      {t("table.headers.matricule")}
                    </TableHead>
                    <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider py-3">
                      {t("table.headers.assignedClass")}
                    </TableHead>
                    <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider py-3">
                      {t("table.headers.status")}
                    </TableHead>
                    <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider py-3 pr-6 text-right">
                      {t("table.headers.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAny ? (
                    renderSkeleton()
                  ) : enrollments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-64 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="bg-slate-100 p-3 rounded-full">
                            <Users className="h-6 w-6 text-slate-400" />
                          </div>
                          <div className="max-w-sm">
                            <h3 className="font-medium text-slate-700 mb-1">
                              {t("table.emptyState.title")}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {filters.status !== "all"
                                ? t("table.emptyState.descriptionFiltered", {
                                    status: filters.status,
                                  })
                                : t("table.emptyState.description")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrollments.map((enrollment) => (
                      <TableRow
                        key={enrollment.id}
                        className="hover:bg-slate-50/70 border-b border-slate-100 last:border-0"
                      >
                        <TableCell className="py-3.5 pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 bg-gradient-to-br from-primary/70 to-blue-500 text-white">
                              <AvatarFallback>
                                {getInitials(
                                  enrollment.student?.first_name,
                                  enrollment.student?.last_name
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-slate-800">
                                {`${enrollment.student?.first_name || ""} ${
                                  enrollment.student?.last_name || ""
                                }`.trim() || t("common.notAvailableShort")}
                              </div>
                              <div className="text-xs text-slate-500">
                                {enrollment.student?.email ||
                                  t("common.noEmail")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 py-3.5">
                          {enrollment.student?.matricule ||
                            t("common.notAvailableShort")}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 py-3.5">
                          {enrollment.assigned_class?.full_name ||
                            t("common.notAvailableShort")}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <StatusBadge
                            status={enrollment.status}
                            type="enrollment"
                          />
                        </TableCell>
                        <TableCell className="text-right py-3.5 pr-6">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 border-slate-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                            onClick={() => onEditClick(enrollment)}
                            disabled={isLoadingAny}
                            title={t("table.editButtonTooltip")}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />{" "}
                            {t("table.editButton")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
              {isLoadingAny ? (
                <div className="flex items-center">
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2 text-slate-400" />
                  {t("table.footerLoading")}
                </div>
              ) : enrollments.length === 0 ? (
                <span>{t("table.footerEmpty")}</span>
              ) : (
                <span>
                  {filters.status !== "all"
                    ? t("table.footerShowingFiltered", {
                        count: enrollments.length,
                        total: totalEnrollmentCount,
                        status: filters.status,
                      })
                    : t("table.footerShowing", {
                        count: enrollments.length,
                        total: totalEnrollmentCount,
                      })}
                </span>
              )}
            </div>
          </div>
        )}

        {yearsSelected && !classSelected && !isError && (
          <div className="text-center p-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="bg-white p-3 rounded-full shadow-sm border border-slate-200 mb-4">
              <Filter className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-medium mb-1">
              {t("prompts.classRequired.title")}
            </h3>
            <p className="text-sm max-w-md mx-auto">
              {t("prompts.classRequired.description")}
            </p>
          </div>
        )}
      </CardContent>

      {yearsSelected &&
        classSelected &&
        pagination.totalCount > 0 &&
        !isError && (
          <CardFooter className="border-t border-slate-200 bg-slate-50 py-4 px-6">
            <PaginationComponent
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              totalCount={pagination.totalCount}
              pageSize={pagination.pageSize}
            />
          </CardFooter>
        )}
    </Card>
  );
}

export default EnrolledStudentsList;
