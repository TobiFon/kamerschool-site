"use client";
import React, { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const BulkAssignmentTable = ({
  workflows = [],
  isLoading = false,
  selectedIds = [],
  onSelectionChange,
  onSelectAllChange,
  isAllOnPageSelected,
  isPartiallyOnPageSelected,
}) => {
  const t = useTranslations("BulkAssignmentTable");
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const formatStudentName = useCallback(
    (student) =>
      student?.full_name ||
      `${student?.first_name || ""} ${student?.last_name || ""}`.trim() ||
      t("common.unnamed"),
    [t]
  );
  const formatStudentId = useCallback(
    (student) => student?.matricule || t("common.noId"),
    [t]
  );

  const handleSelectAll = useCallback(
    (checked) => onSelectAllChange(Boolean(checked)),
    [onSelectAllChange]
  );
  const handleSelectOne = useCallback(
    (id, checked) => onSelectionChange(id, Boolean(checked)),
    [onSelectionChange]
  );

  const renderSkeleton = useCallback(
    () =>
      Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`skel-bulk-${index}`} className="animate-pulse">
          <TableCell className="w-[50px] p-2">
            <Skeleton className="h-5 w-5 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-3/4 mb-1 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-1/2 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24 rounded-full" />
          </TableCell>
        </TableRow>
      )),
    []
  );

  const renderNoData = useCallback(
    () => (
      <TableRow>
        <TableCell colSpan={5} className="h-32 text-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <p className="mb-2 text-sm">{t("noData.message")}</p>
            <Badge variant="outline" className="text-xs font-normal">
              {t("noData.suggestion")}
            </Badge>
          </div>
        </TableCell>
      </TableRow>
    ),
    [t]
  );

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[50px] p-2">
              <Checkbox
                checked={isAllOnPageSelected}
                data-state={
                  isPartiallyOnPageSelected
                    ? "indeterminate"
                    : isAllOnPageSelected
                    ? "checked"
                    : "unchecked"
                }
                onCheckedChange={handleSelectAll}
                aria-label={t("checkboxes.selectAllAriaLabel")}
                disabled={isLoading || workflows.length === 0}
                className={workflows.length === 0 ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider">
              {t("headers.student")}
            </TableHead>
            <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider">
              {t("headers.previousClass")}
            </TableHead>
            <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider">
              {t("headers.promotionStatus")}
            </TableHead>
            <TableHead className="font-medium text-slate-600 text-xs uppercase tracking-wider">
              {t("headers.currentStage")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? renderSkeleton()
            : workflows.length > 0
            ? workflows.map((wf) => (
                <TableRow
                  key={wf.id}
                  data-state={selectedIdSet.has(wf.id) ? "selected" : undefined}
                  className={
                    selectedIdSet.has(wf.id)
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-slate-50/70"
                  }
                >
                  <TableCell className="p-2">
                    <Checkbox
                      checked={selectedIdSet.has(wf.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(wf.id, checked)
                      }
                      aria-label={t("checkboxes.selectOneAriaLabel", {
                        studentName: formatStudentName(wf.student),
                      })}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {formatStudentName(wf.student)}
                    <span className="block text-xs text-muted-foreground mt-1">
                      {formatStudentId(wf.student)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {wf.previous_class_name || t("common.notApplicable")}
                  </TableCell>
                  <TableCell>
                    {wf.promotion_decision?.promotion_status ? (
                      <StatusBadge
                        status={wf.promotion_decision.promotion_status}
                        type="promotion"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("common.notApplicable")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={wf.current_stage} type="workflow" />
                  </TableCell>
                </TableRow>
              ))
            : renderNoData()}
        </TableBody>

        {isLoading && (
          <TableCaption className="py-2 text-sm">
            {t("captions.loading")}
          </TableCaption>
        )}
        {!isLoading && workflows.length > 0 && (
          <TableCaption className="py-2 text-sm">
            {t("captions.showing", {
              count: workflows.length,
              selectedCount: selectedIdSet.size,
            })}
          </TableCaption>
        )}
        {!isLoading && workflows.length === 0 && (
          <TableCaption className="py-2 text-sm">
            {t("captions.noStudents")}
          </TableCaption>
        )}
      </Table>
    </div>
  );
};

BulkAssignmentTable.displayName = "BulkAssignmentTable";
export default BulkAssignmentTable;
