"use client";
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowActions } from "./WorkFlowActions";
import { updateEnrollmentWorkflow } from "@/queries/promotions";
import { Loader2 } from "lucide-react";

const SELECT_PLACEHOLDER_VALUE = "__placeholder__";

function WorkflowTable({
  workflows = [],
  isLoading,
  onActionClick,
  actionLoadingWorkflowId,
}) {
  const t = useTranslations("WorkflowTable");
  const queryClient = useQueryClient();
  const [inlineLoadingId, setInlineLoadingId] = React.useState(null);

  const updateClassMutation = useMutation({
    mutationFn: ({ workflowId, classId }) =>
      updateEnrollmentWorkflow(workflowId, {
        update_type: "select_class",
        class_id: classId,
        notes: t("inlineAssignNote"),
      }),
    onSuccess: (data) => {
      toast.success(
        t("toast.successAssign", {
          studentName: data.student?.full_name || t("common.student"),
        })
      );
      queryClient.invalidateQueries({ queryKey: ["enrollmentWorkflows"] });
      queryClient.invalidateQueries({ queryKey: ["enrollmentWorkflowsBulk"] });
      queryClient.invalidateQueries({ queryKey: ["academicYearEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollmentStatistics"] });
    },
    onError: (error) => {
      const description =
        error?.fieldErrors?.detail ||
        error?.message ||
        t("toast.errorDefaultDescription");
      toast.error(t("toast.errorAssignTitle"), { description });
    },
    onSettled: () => {
      setInlineLoadingId(null);
    },
  });

  const handleClassSelection = (workflowId, selectedClassId) => {
    if (
      !selectedClassId ||
      selectedClassId === SELECT_PLACEHOLDER_VALUE ||
      selectedClassId === "none" ||
      selectedClassId === "no-classes"
    ) {
      return;
    }
    setInlineLoadingId(workflowId);
    updateClassMutation.mutate({
      workflowId,
      classId: parseInt(selectedClassId),
    });
  };

  const renderSkeleton = () =>
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skel-wf-${index}`} className="animate-pulse">
        <TableCell>
          <Skeleton className="h-4 w-3/4 rounded" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-1/2 rounded" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-24 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-24 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-full rounded" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-20 rounded" />
        </TableCell>
      </TableRow>
    ));

  const renderNoData = () => (
    <TableRow>
      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
        {t("noData.message")}
        <br />
        <span className="text-xs">{t("noData.subtext")}</span>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>{t("headers.student")}</TableHead>
            <TableHead>{t("headers.prevClass")}</TableHead>
            <TableHead>{t("headers.promotion")}</TableHead>
            <TableHead>{t("headers.stage")}</TableHead>
            <TableHead>{t("headers.assignStatus")}</TableHead>
            <TableHead className="text-right">{t("headers.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? renderSkeleton()
            : workflows.length > 0
            ? workflows.map((wf) => {
                const isCurrentRowLoading =
                  actionLoadingWorkflowId === wf.id ||
                  inlineLoadingId === wf.id;
                const promotionStatus =
                  wf.promotion_decision?.promotion_status ||
                  t("common.notAvailableShort");
                const isReadyToEnroll =
                  wf.current_stage === "ready_for_enrollment";
                const isCompleted = wf.current_stage === "enrollment_complete";
                const targetClassOptions = wf.target_class_options || [];
                const displayClassOptions = targetClassOptions.length > 0;
                const suggestedClassOption = displayClassOptions
                  ? targetClassOptions[0]
                  : null;

                return (
                  <TableRow
                    key={wf.id}
                    data-state={isCurrentRowLoading ? "loading" : undefined}
                    className="text-sm hover:bg-slate-50"
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {wf.student?.full_name ||
                        `${wf.student?.first_name || ""} ${
                          wf.student?.last_name || ""
                        }`.trim() ||
                        t("common.notAvailableShort")}
                      <span className="block text-xs text-muted-foreground mt-1">
                        {wf.student?.matricule || t("common.noId")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {wf.previous_class_name || t("common.notAvailableShort")}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <StatusBadge status={promotionStatus} type="promotion" />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={wf.current_stage} type="workflow" />
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      {isCurrentRowLoading ? (
                        <div className="flex items-center text-muted-foreground text-xs">
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          {t("common.processing")}
                        </div>
                      ) : wf.selected_class ? (
                        <span className="font-semibold text-green-700 text-sm">
                          {wf.selected_class.full_name ||
                            wf.selected_class.name}{" "}
                          {t("status.enrolledSuffix")}
                        </span>
                      ) : isReadyToEnroll && displayClassOptions ? (
                        <Select
                          value={SELECT_PLACEHOLDER_VALUE}
                          onValueChange={(value) =>
                            handleClassSelection(wf.id, value)
                          }
                          disabled={isCurrentRowLoading}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue
                              placeholder={
                                suggestedClassOption
                                  ? t("select.suggestPlaceholder", {
                                      className: suggestedClassOption.name,
                                    })
                                  : t("select.defaultPlaceholder")
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value={SELECT_PLACEHOLDER_VALUE}
                              disabled
                            >
                              {suggestedClassOption
                                ? t("select.suggestPlaceholder", {
                                    className: suggestedClassOption.name,
                                  })
                                : t("select.defaultPlaceholder")}
                            </SelectItem>
                            {targetClassOptions.map((option) => (
                              <SelectItem
                                key={option.id}
                                value={String(option.id)}
                              >
                                {option.name ||
                                  `${t("common.classIdPrefix")} ${option.id}`}
                                {option.id === suggestedClassOption?.id
                                  ? ` ${t("select.suggestSuffix")}`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          {isCompleted
                            ? `${t("status.completed")} ${
                                promotionStatus === "graduated"
                                  ? t("status.graduatedSuffix")
                                  : ""
                              }`
                            : isReadyToEnroll && !displayClassOptions
                            ? t("status.noClasses")
                            : wf.current_stage === "awaiting_promotion_decision"
                            ? t("status.awaitingDecision")
                            : t("status.pendingAction")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <WorkflowActions
                        workflow={wf}
                        onActionClick={onActionClick}
                        isLoading={isCurrentRowLoading}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            : renderNoData()}
        </TableBody>
        {(isLoading || updateClassMutation.isLoading) && (
          <TableCaption>{t("captions.loading")}</TableCaption>
        )}
        {!isLoading && workflows.length === 0 && (
          <TableCaption>{t("captions.noWorkflows")}</TableCaption>
        )}
      </Table>
    </div>
  );
}

export default WorkflowTable;
