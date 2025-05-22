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
import { Loader2, Search, AlertTriangle, RotateCw } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { getEnrollmentWorkflows } from "@/queries/promotions";
import { PaginationComponent } from "./PaginationComponent"; // Adjust path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import WorkflowTable from "./WorkFlowTable";

const DEFAULT_PAGE_SIZE = 20;

function EnrollmentWorkflows({
  academicYears = [],
  initialFromYear = null,
  initialToYear = null,
  selectedClassId,
  onActionClick,
  actionLoadingWorkflowId = null,
}) {
  const t = useTranslations("EnrollmentWorkflows"); // Initialize useTranslations

  // Define filter options using translation function
  const WORKFLOW_STAGES = useMemo(
    () => [
      { value: "all", label: t("filters.stages.all") },
      {
        value: "awaiting_promotion_decision",
        label: t("filters.stages.awaiting_decision"),
      },
      {
        value: "ready_for_enrollment",
        label: t("filters.stages.ready_to_enroll"),
      },
    ],
    [t]
  );

  const PROMOTION_STATUSES = useMemo(
    () => [
      { value: "all", label: t("filters.statuses.all") },
      { value: "promoted", label: t("filters.statuses.promoted") },
      { value: "conditional", label: t("filters.statuses.conditional") },
      { value: "repeated", label: t("filters.statuses.repeated") },
    ],
    [t]
  );

  const fromYearId = initialFromYear;
  const toYearId = initialToYear;

  const [filters, setFilters] = useState({
    stage: "all",
    promotionStatus: "all",
    search: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      stage: "all",
      promotionStatus: "all",
      search: "",
    }));
  }, [selectedClassId, fromYearId, toYearId]);

  const queryParams = useMemo(
    () => ({
      fromYearId,
      toYearId,
      previousClassId: selectedClassId,
      stage: filters.stage === "all" ? undefined : filters.stage,
      promotionStatus:
        filters.promotionStatus === "all" ? undefined : filters.promotionStatus,
      search: debouncedSearch || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [
      fromYearId,
      toYearId,
      selectedClassId,
      filters.stage,
      filters.promotionStatus,
      debouncedSearch,
      filters.page,
      filters.pageSize,
    ]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["enrollmentWorkflows", queryParams],
    queryFn: () => getEnrollmentWorkflows(queryParams),
    keepPreviousData: true,
    enabled:
      Boolean(fromYearId) && Boolean(toYearId) && Boolean(selectedClassId),
  });

  const handleFilterChange = useCallback((key, value) => {
    const isPageChange = key === "page";
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: isPageChange ? value : 1,
    }));
  }, []);

  const handleSearchInputChange = useCallback(
    (e) => {
      handleFilterChange("search", e.target.value);
    },
    [handleFilterChange]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage > 0 && newPage <= (data?.totalPages ?? 1)) {
        handleFilterChange("page", newPage);
      }
    },
    [handleFilterChange, data?.totalPages]
  );

  const workflows = data?.results || [];
  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      totalPages:
        data?.totalPages ||
        Math.ceil((data?.count || 0) / filters.pageSize) ||
        1,
      hasNextPage: Boolean(data?.next),
      hasPreviousPage: Boolean(data?.previous),
      totalCount: data?.count || 0,
      pageSize: filters.pageSize,
    }),
    [data, filters.page, filters.pageSize]
  );

  const yearsSelected = Boolean(fromYearId) && Boolean(toYearId);
  const classSelected = Boolean(selectedClassId);
  const isLoadingAny = isLoading || isFetching;

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-lg font-medium">{t("cardTitle")}</CardTitle>
      </CardHeader>

      <CardContent className="pt-5 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50/60">
          <div>
            <Label
              htmlFor="stageFilterWf"
              className="text-xs font-medium text-slate-700 mb-1 block"
            >
              {t("filters.labels.workflowStage")}
            </Label>
            <Select
              value={filters.stage}
              onValueChange={(value) => handleFilterChange("stage", value)}
              disabled={isLoadingAny || !classSelected || !yearsSelected}
            >
              <SelectTrigger
                id="stageFilterWf"
                className="h-9 bg-white text-sm"
              >
                <SelectValue placeholder={t("filters.placeholders.stage")} />
              </SelectTrigger>
              <SelectContent>
                {WORKFLOW_STAGES.map((stage) => (
                  <SelectItem
                    key={stage.value}
                    value={stage.value}
                    className="text-sm"
                  >
                    {stage.label}{" "}
                    {/* Label is already translated via useMemo */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="promoStatusFilterWf"
              className="text-xs font-medium text-slate-700 mb-1 block"
            >
              {t("filters.labels.promotionStatus")}
            </Label>
            <Select
              value={filters.promotionStatus}
              onValueChange={(value) =>
                handleFilterChange("promotionStatus", value)
              }
              disabled={isLoadingAny || !classSelected || !yearsSelected}
            >
              <SelectTrigger
                id="promoStatusFilterWf"
                className="h-9 bg-white text-sm"
              >
                <SelectValue placeholder={t("filters.placeholders.status")} />
              </SelectTrigger>
              <SelectContent>
                {PROMOTION_STATUSES.map((status) => (
                  <SelectItem
                    key={status.value}
                    value={status.value}
                    className="text-sm"
                  >
                    {status.label}{" "}
                    {/* Label is already translated via useMemo */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="searchStudentsWf"
              className="text-xs font-medium text-slate-700 mb-1 block"
            >
              {t("filters.labels.searchStudents")}
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchStudentsWf"
                type="search"
                placeholder={t("filters.placeholders.search")}
                value={filters.search}
                onChange={handleSearchInputChange}
                className="pl-8 h-9 bg-white text-sm"
                disabled={isLoadingAny || !classSelected || !yearsSelected}
              />
            </div>
          </div>
        </div>

        {(!classSelected || !yearsSelected) && (
          <Alert
            variant="warning"
            className="mb-6 bg-amber-50 border-amber-200 text-amber-800"
          >
            <AlertTriangle className="h-5 w-5 !text-amber-600" />
            <AlertTitle className="font-semibold">
              {t("alerts.filtersRequired.title")}
            </AlertTitle>
            <AlertDescription className="text-sm text-amber-700/90">
              {t("alerts.filtersRequired.description")}
            </AlertDescription>
          </Alert>
        )}

        {isError && yearsSelected && classSelected && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle />
            <AlertTitle>{t("alerts.errorLoading.title")}</AlertTitle>
            <AlertDescription>
              {error?.message || t("alerts.errorLoading.unknownError")}
            </AlertDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCw className="h-4 w-4 mr-2" />
              )}
              {t("alerts.errorLoading.retryButton")}
            </Button>
          </Alert>
        )}

        {yearsSelected && classSelected && (
          <WorkflowTable
            workflows={workflows}
            isLoading={isLoadingAny}
            onActionClick={onActionClick}
            actionLoadingWorkflowId={actionLoadingWorkflowId}
          />
        )}
        {yearsSelected && classSelected && isLoadingAny && !isError && (
          <div className="text-center p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
            {t("loadingMessage")}
          </div>
        )}
      </CardContent>

      {yearsSelected &&
        classSelected &&
        pagination.totalCount > 0 &&
        !isError && (
          <CardFooter className="border-t border-slate-200 bg-slate-50/30 py-3 px-4">
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
export default EnrollmentWorkflows;
