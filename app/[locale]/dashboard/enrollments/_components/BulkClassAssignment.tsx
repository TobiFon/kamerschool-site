"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl"; // Import useTranslations
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Info,
  CheckCheck,
  Loader2,
  AlertTriangle,
  Layers,
  Search,
  School,
  XCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { PaginationComponent } from "./PaginationComponent"; // Assumes Pagination handles own translation
import {
  getEnrollmentWorkflows,
  fetchAllFilteredWorkflowIds,
  performBulkClassAssignments,
} from "@/queries/promotions";
import BulkAssignmentTable from "./BulkAssignTable"; // Assumes Table handles own translation or receives t
import { useDebounce } from "@/hooks/useDebounce";

// --- Class Progression Logic (Example - adjust if needed) ---
// This logic remains internal and doesn't need translation
const LEVEL_PROGRESSION = {
  form_1: "form_2",
  form_2: "form_3",
  form_3: "form_4",
  form_4: "form_5",
  form_5: "lower_sixth",
  lower_sixth: "upper_sixth",
  upper_sixth: null,
  sixieme: "cinquieme",
  cinquieme: "quatrieme",
  quatrieme: "troisieme",
  troisieme: "seconde",
  seconde: "premiere",
  premiere: "terminale",
  terminale: null,
};

const DEFAULT_PAGE_SIZE = 20;
const SELECT_PLACEHOLDER = "__placeholder__";
const NO_CLASSES_PLACEHOLDER = "__no_classes__";

function BulkClassAssignment({
  academicYears = [],
  initialFromYear = null,
  initialToYear = null,
  selectedClassId,
  allClasses = [],
}) {
  const t = useTranslations("BulkClassAssignment"); // Initialize hook
  const queryClient = useQueryClient();

  // Define promotion status options using translations
  const PROMOTION_STATUS_OPTIONS = useMemo(
    () => [
      { value: "all", label: t("filters.statusOptions.all") },
      { value: "promoted", label: t("filters.statusOptions.promoted") },
      { value: "conditional", label: t("filters.statusOptions.conditional") },
      { value: "repeated", label: t("filters.statusOptions.repeated") },
    ],
    [t]
  );

  const fromYearId = initialFromYear;
  const toYearId = initialToYear;

  const [filters, setFilters] = useState({
    destinationClassId: "",
    promotionStatus: "all",
    search: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState(new Set());
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [bulkResultDetails, setBulkResultDetails] = useState(null);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      destinationClassId: "",
      promotionStatus: "all",
      search: "",
    }));
    setSelectedWorkflowIds(new Set());
    setIsSelectingAll(false);
    setBulkResultDetails(null);
  }, [selectedClassId, fromYearId, toYearId]);

  // Destination class logic remains the same
  const destinationClasses = useMemo(() => {
    if (!allClasses || allClasses.length === 0 || selectedClassId === null)
      return [];
    const prevClass = allClasses.find((c) => c.id === selectedClassId);
    if (!prevClass || !prevClass.level || !prevClass.education_system)
      return [];
    const currentLevel = prevClass.level;
    const nextLevel = LEVEL_PROGRESSION[currentLevel];
    const allowedLevels = new Set([currentLevel]);
    if (nextLevel) allowedLevels.add(nextLevel);
    return allClasses
      .filter(
        (cls) =>
          cls.education_system?.id === prevClass.education_system?.id &&
          allowedLevels.has(cls.level) &&
          cls.is_active
      )
      .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
  }, [allClasses, selectedClassId]);

  const queryParams = useMemo(
    () => ({
      fromYearId,
      toYearId,
      previousClassId: selectedClassId,
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
      filters.promotionStatus,
      debouncedSearch,
      filters.page,
      filters.pageSize,
    ]
  );

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["enrollmentWorkflowsBulk", queryParams],
    queryFn: () => getEnrollmentWorkflows(queryParams),
    keepPreviousData: true,
    enabled:
      Boolean(fromYearId) && Boolean(toYearId) && Boolean(selectedClassId),
  });

  const workflowsToDisplay = useMemo(
    () => data?.results || [],
    [data?.results]
  );
  const totalFilteredCount = data?.count || 0;
  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      totalPages:
        data?.totalPages ||
        Math.ceil(totalFilteredCount / filters.pageSize) ||
        1,
      hasNextPage: Boolean(data?.next),
      hasPreviousPage: Boolean(data?.previous),
      totalCount: totalFilteredCount,
      pageSize: filters.pageSize,
    }),
    [data, totalFilteredCount, filters.page, filters.pageSize]
  );

  const bulkAssignMutation = useMutation({
    mutationFn: ({ ids, classId, notes }) =>
      performBulkClassAssignments(ids, classId, notes),
    onSuccess: (result) => {
      console.log("Bulk assignment response:", result);
      setBulkResultDetails(result);

      const successCount = result?.success?.length || 0;
      const alreadyEnrolledCount = result?.already_enrolled?.length || 0;
      const failedCount = result?.failed?.length || 0;
      const notFoundCount = result?.not_found_or_ineligible?.length || 0;

      let summaryMessage = t("toast.summary.base");
      if (successCount > 0)
        summaryMessage += ` ${t("toast.summary.success", {
          count: successCount,
        })}`;
      if (alreadyEnrolledCount > 0)
        summaryMessage += ` ${t("toast.summary.alreadyEnrolled", {
          count: alreadyEnrolledCount,
        })}`;
      if (failedCount > 0)
        summaryMessage += ` ${t("toast.summary.failed", {
          count: failedCount,
        })}`;
      if (notFoundCount > 0)
        summaryMessage += ` ${t("toast.summary.notFound", {
          count: notFoundCount,
        })}`;

      if (failedCount > 0 || notFoundCount > 0) {
        toast.warning(summaryMessage, { duration: 8000 });
      } else if (successCount > 0 || alreadyEnrolledCount > 0) {
        toast.success(summaryMessage, { duration: 5000 });
      } else {
        toast.info(t("toast.summary.noChanges"), { duration: 3000 });
      }

      setSelectedWorkflowIds(new Set());
      setIsSelectingAll(false);
      queryClient.invalidateQueries({
        queryKey: ["enrollmentWorkflowsBulk", queryParams],
      });
      queryClient.invalidateQueries({ queryKey: ["enrollmentWorkflows"] });
      queryClient.invalidateQueries({ queryKey: ["academicYearEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollmentStatistics"] });
      refetch();
    },
    onError: (err) => {
      setBulkResultDetails(null);
      console.error("Bulk Assignment Mutation Error:", err);
      const message = err.fieldErrors
        ? Object.values(err.fieldErrors).flat().join(" ")
        : err.message;
      toast.error(t("toast.error.title"), {
        description: message || t("toast.error.defaultDescription"),
        duration: 6000,
      });
    },
  });

  const handleFilterChange = useCallback((key, value) => {
    const isPageChange = key === "page";
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: isPageChange ? value : 1,
    }));
    if (!isPageChange) {
      setSelectedWorkflowIds(new Set());
      setIsSelectingAll(false);
      setBulkResultDetails(null);
    }
  }, []);

  const handleSearchChange = useCallback(
    (e) => handleFilterChange("search", e.target.value),
    [handleFilterChange]
  );
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage > 0 && newPage <= pagination.totalPages)
        handleFilterChange("page", newPage);
    },
    [handleFilterChange, pagination.totalPages]
  );

  const handleSelectionChange = useCallback((id, isSelected) => {
    setSelectedWorkflowIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
    setIsSelectingAll(false);
    setBulkResultDetails(null);
  }, []);

  const handleSelectAllOnPageChange = useCallback(
    (isSelected) => {
      const currentPageIds = workflowsToDisplay.map((wf) => wf.id);
      setSelectedWorkflowIds((prev) => {
        const newSet = new Set(prev);
        if (isSelected) currentPageIds.forEach((id) => newSet.add(id));
        else currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
      setBulkResultDetails(null);
    },
    [workflowsToDisplay]
  );

  const handleSelectAllFiltered = useCallback(async () => {
    if (!fromYearId || !toYearId || !selectedClassId) {
      toast.warning(t("toast.warning.missingGlobalFilters"));
      return;
    }
    setIsSelectingAll(true);
    setBulkResultDetails(null);
    try {
      const allIds = await fetchAllFilteredWorkflowIds({
        fromYearId,
        toYearId,
        previousClassId: selectedClassId,
        promotionStatus:
          filters.promotionStatus === "all"
            ? undefined
            : filters.promotionStatus,
        search: debouncedSearch || undefined,
      });
      setSelectedWorkflowIds(new Set(allIds));
      if (allIds.length > 0) {
        toast.info(t("toast.info.selectedAll", { count: allIds.length }));
      } else {
        toast.info(t("toast.info.noStudentsFound"));
      }
    } catch (err) {
      toast.error(t("toast.error.fetchFailed"), { description: err?.message });
      setSelectedWorkflowIds(new Set());
    } finally {
      setIsSelectingAll(false);
    }
  }, [
    fromYearId,
    toYearId,
    selectedClassId,
    filters.promotionStatus,
    debouncedSearch,
    t,
  ]);

  const handleAssignClick = useCallback(() => {
    if (
      !filters.destinationClassId ||
      filters.destinationClassId === SELECT_PLACEHOLDER ||
      filters.destinationClassId === NO_CLASSES_PLACEHOLDER
    ) {
      toast.warning(t("toast.warning.selectDestination"));
      return;
    }
    if (selectedWorkflowIds.size === 0) {
      toast.warning(t("toast.warning.selectStudents"));
      return;
    }
    setBulkResultDetails(null);

    const destinationClassIdNum = parseInt(filters.destinationClassId, 10);
    const destClassName =
      allClasses.find((c) => c.id === destinationClassIdNum)?.full_name ||
      `${t("common.classIdPrefix")} ${destinationClassIdNum}`;

    if (
      window.confirm(
        t("confirm.assign", {
          count: selectedWorkflowIds.size,
          className: destClassName,
        })
      )
    ) {
      bulkAssignMutation.mutate({
        ids: Array.from(selectedWorkflowIds),
        classId: destinationClassIdNum,
        notes: t("internalNote", { prevClassId: selectedClassId }),
      });
    }
  }, [
    filters.destinationClassId,
    selectedWorkflowIds,
    bulkAssignMutation,
    allClasses,
    selectedClassId,
    t,
  ]);

  const yearsSelected = Boolean(fromYearId) && Boolean(toYearId);
  const classSelected = Boolean(selectedClassId);
  const destinationSelected =
    Boolean(filters.destinationClassId) &&
    filters.destinationClassId !== SELECT_PLACEHOLDER &&
    filters.destinationClassId !== NO_CLASSES_PLACEHOLDER;
  const selectionMade = selectedWorkflowIds.size > 0;
  const canAssign =
    yearsSelected && classSelected && destinationSelected && selectionMade;
  const isLoadingAny =
    isLoading || isFetching || bulkAssignMutation.isLoading || isSelectingAll;

  const isAllOnPageSelected = useMemo(
    () =>
      workflowsToDisplay.length > 0 &&
      workflowsToDisplay.every((wf) => selectedWorkflowIds.has(wf.id)),
    [workflowsToDisplay, selectedWorkflowIds]
  );
  const isPartiallyOnPageSelected = useMemo(
    () =>
      workflowsToDisplay.some((wf) => selectedWorkflowIds.has(wf.id)) &&
      !isAllOnPageSelected,
    [workflowsToDisplay, selectedWorkflowIds, isAllOnPageSelected]
  );

  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <School className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg font-semibold text-slate-800">
            {t("header.title")}
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-slate-600">
          {t("header.description")}
          <br />
          <span className="font-medium text-indigo-700">
            {t("header.notePrefix")}
          </span>{" "}
          {t("header.noteBody")}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 px-6">
        <Alert className="mb-6 bg-blue-50 border border-blue-200 text-blue-800">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="font-semibold">
            {t("infoAlert.title")}
          </AlertTitle>
          <AlertDescription className="text-sm text-blue-700 leading-relaxed mt-1">
            <ol className="list-decimal pl-5 space-y-1">
              <li>{t("infoAlert.step1")}</li>
              <li>{t("infoAlert.step2")}</li>
              <li>{t("infoAlert.step3")}</li>
              <li>{t("infoAlert.step4", { count: totalFilteredCount })}</li>
              <li>{t("infoAlert.step5")}</li>
              <li>{t("infoAlert.step6")}</li>
            </ol>
          </AlertDescription>
        </Alert>

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

        {yearsSelected && classSelected && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="space-y-1.5">
                <Label
                  htmlFor="bulkPromoStatusFilter"
                  className="text-xs font-medium text-slate-700 block"
                >
                  {t("filters.labels.promotionStatus")}
                </Label>
                <Select
                  value={filters.promotionStatus}
                  onValueChange={(v) =>
                    handleFilterChange("promotionStatus", v)
                  }
                  disabled={isLoadingAny}
                >
                  <SelectTrigger
                    id="bulkPromoStatusFilter"
                    className="h-10 bg-white text-sm w-full"
                  >
                    <SelectValue
                      placeholder={t("filters.placeholders.statusFilter")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMOTION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-sm"
                      >
                        {opt.label} {/* Already translated */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="bulkSearchStudent"
                  className="text-xs font-medium text-slate-700 block"
                >
                  {t("filters.labels.searchStudents")}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="bulkSearchStudent"
                    type="search"
                    placeholder={t("filters.placeholders.search")}
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="pl-9 h-10 bg-white text-sm w-full"
                    disabled={isLoadingAny}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="bulkToClassSelect"
                  className="text-xs font-medium text-slate-700 block"
                >
                  {t("filters.labels.destinationClass")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={filters.destinationClassId || SELECT_PLACEHOLDER}
                  onValueChange={(v) =>
                    handleFilterChange("destinationClassId", v)
                  }
                  disabled={isLoadingAny || destinationClasses.length === 0}
                >
                  <SelectTrigger
                    id="bulkToClassSelect"
                    className="h-10 bg-white text-sm w-full"
                  >
                    <SelectValue
                      placeholder={t("filters.placeholders.destinationSelect")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_PLACEHOLDER} disabled>
                      {t("filters.placeholders.destinationSelectDisabled")}
                    </SelectItem>
                    {destinationClasses.length === 0 && !isLoadingAny && (
                      <SelectItem
                        value={NO_CLASSES_PLACEHOLDER}
                        disabled
                        className="text-sm text-muted-foreground italic"
                      >
                        {t("filters.noCompatibleClasses")}
                      </SelectItem>
                    )}
                    {destinationClasses.map((cls) => (
                      <SelectItem
                        key={cls.id}
                        value={String(cls.id)}
                        className="text-sm"
                      >
                        {cls.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3 bg-slate-50 p-3 border border-slate-200 rounded-lg">
              <div className="text-sm text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-medium">
                  {t("actionBar.selectedCount", {
                    count: selectedWorkflowIds.size,
                  })}
                </span>
                {totalFilteredCount > 0 && (
                  <span className="text-xs">
                    {t("actionBar.ofTotal", { total: totalFilteredCount })}
                  </span>
                )}
                {totalFilteredCount > 0 &&
                  selectedWorkflowIds.size === totalFilteredCount && (
                    <span className="text-green-600 font-medium flex items-center gap-1 text-xs">
                      <CheckCheck className="h-4 w-4" />{" "}
                      {t("actionBar.allSelected")}
                    </span>
                  )}
              </div>
              <div className="flex flex-wrap gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFiltered}
                  disabled={isLoadingAny || totalFilteredCount === 0}
                  className="h-9 text-sm bg-white"
                  title={t("buttons.selectAllTooltip", {
                    count: totalFilteredCount,
                  })}
                >
                  {isSelectingAll ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Layers className="mr-2 h-4 w-4" />
                  )}{" "}
                  {t("buttons.selectAll", { count: totalFilteredCount })}
                </Button>
                <Button
                  onClick={handleAssignClick}
                  disabled={!canAssign || isLoadingAny}
                  className="h-9 text-sm"
                  variant={canAssign ? "default" : "secondary"}
                  title={
                    canAssign
                      ? t("buttons.assignTooltip", {
                          count: selectedWorkflowIds.size,
                        })
                      : t("buttons.assignDisabledTooltip")
                  }
                >
                  {bulkAssignMutation.isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-2 h-4 w-4" />
                  )}{" "}
                  {t("buttons.assign", { count: selectedWorkflowIds.size })}
                </Button>
              </div>
            </div>

            {bulkResultDetails && (
              <Card className="mb-6 border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-base font-semibold text-blue-900">
                    {t("results.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 text-sm space-y-2">
                  {bulkResultDetails.success?.length > 0 && (
                    <div className="flex items-start gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {t("results.success", {
                          count: bulkResultDetails.success.length,
                        })}
                      </span>
                    </div>
                  )}
                  {bulkResultDetails.already_enrolled?.length > 0 && (
                    <div className="flex items-start gap-2 text-orange-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {t("results.alreadyEnrolled", {
                          count: bulkResultDetails.already_enrolled.length,
                        })}
                      </span>
                    </div>
                  )}
                  {bulkResultDetails.failed?.length > 0 && (
                    <div className="flex items-start gap-2 text-red-700">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span>
                          {t("results.failed", {
                            count: bulkResultDetails.failed.length,
                          })}
                        </span>
                        <ul className="text-xs list-disc pl-5 mt-1">
                          {bulkResultDetails.failed.slice(0, 5).map((item) => (
                            <li key={item.workflow_id}>
                              {item.student_name}:{" "}
                              {item.error || t("results.unknownReason")}
                            </li>
                          ))}
                          {bulkResultDetails.failed.length > 5 && (
                            <li>{t("results.andMore")}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                  {bulkResultDetails.not_found_or_ineligible?.length > 0 && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {t("results.notFound", {
                          count:
                            bulkResultDetails.not_found_or_ineligible.length,
                        })}
                      </span>
                    </div>
                  )}
                  {bulkResultDetails.success?.length === 0 &&
                    bulkResultDetails.already_enrolled?.length === 0 &&
                    bulkResultDetails.failed?.length === 0 &&
                    bulkResultDetails.not_found_or_ineligible?.length === 0 && (
                      <p className="text-slate-600 italic">
                        {t("results.noActions")}
                      </p>
                    )}
                </CardContent>
              </Card>
            )}

            {isError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>{t("alerts.errorLoading.title")}</AlertTitle>
                <AlertDescription>
                  {error?.message || t("alerts.errorLoading.defaultMessage")}
                </AlertDescription>
              </Alert>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <BulkAssignmentTable
                workflows={workflowsToDisplay}
                isLoading={isLoadingAny}
                selectedIds={Array.from(selectedWorkflowIds)}
                onSelectionChange={handleSelectionChange}
                onSelectAllChange={handleSelectAllOnPageChange}
                isAllOnPageSelected={isAllOnPageSelected}
                isPartiallyOnPageSelected={isPartiallyOnPageSelected}
                // Pass t or specific translated texts if BulkAssignmentTable needs them
              />
            </div>
          </>
        )}
        {yearsSelected && !classSelected && isLoadingAny && (
          <div className="text-center p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
            {t("prompts.loadingClassData")}
          </div>
        )}
        {yearsSelected && !classSelected && !isLoadingAny && (
          <div className="text-center p-6 text-muted-foreground">
            {t("prompts.selectClassFilter")}
          </div>
        )}
      </CardContent>

      {yearsSelected &&
        classSelected &&
        pagination.totalCount > 0 &&
        !isError && (
          <CardFooter className="border-t border-slate-200 bg-slate-50 py-4 px-6">
            <PaginationComponent
              {...pagination}
              onPageChange={handlePageChange}
            />
          </CardFooter>
        )}
    </Card>
  );
}

export default BulkClassAssignment;
