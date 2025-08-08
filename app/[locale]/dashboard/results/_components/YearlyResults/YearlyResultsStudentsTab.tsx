"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  FileText,
  FileDown,
  Eye,
  Check,
  Ban,
  ChevronDown,
  ChevronUp,
  Settings,
  PlusCircle,
  Edit,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PromotionRuleModal from "./PromotionRulesModal";

import { managePromotionRules } from "@/queries/promotions";
import { createPromotionDecisions } from "@/queries/promotions";
import { toast } from "sonner";
import ManualPromotionDecisionDialog from "./ManualDecision";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const YearlyResultsStudentsTab = ({
  filteredResults,
  totalStudents,
  AcademicYearId,
  page,
  totalPages,
  handleSort,
  sortColumn,
  sortDirection,
  toggleStudentExpand,
  expandedStudent,
  getAverageBg,
  setSearchQuery,
  setPage,
  academicYearId,
  classId,
  handlePublishOverall,
  handlePublishSelected,
  selectedStudentIds,
  handleSelectStudent,
  handleSelectAllStudents,
  handleExportYearlyOverallPDF,
  academicYearName,
  className,
  schoolData,
  classEducationSystem,
  classLevel,
  educationSystems,
}) => {
  const t = useTranslations("YearlyResults");
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualPromotionDialogOpen, setIsManualPromotionDialogOpen] =
    useState(false);

  // fetch promotion rules to check if decisions can be created
  const { data: promotionRules, isLoading: isPromotionRulesLoading } = useQuery(
    {
      queryKey: ["promotionRules"],
      queryFn: () => managePromotionRules(),
    }
  );
  const { canEdit } = useCurrentUser();

  // find if a matching promotion rule exists for this class
  const existingPromotionRule = promotionRules?.find(
    (rule) =>
      rule.level === classLevel &&
      rule.education_system === classEducationSystem.id &&
      !rule.stream
  );

  const createPromotionDecisionsMutation = useMutation({
    mutationFn: () => createPromotionDecisions(academicYearId, classId),
    onSuccess: () => {
      toast.success(t("promotionDecisionsCreated"), {
        description: t("promotionDecisionsCreatedDescription"),
      });

      // Invalidate the specific queries related to this academic year and class
      queryClient.invalidateQueries({
        queryKey: ["yearlyOverallResults", academicYearId, classId],
      });

      // Also invalidate the all results query to ensure any overview stats are updated
      queryClient.invalidateQueries({
        queryKey: ["allYearlyOverallResults", academicYearId, classId],
      });
    },
    onError: (error) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  const handleCreateDecisions = () => {
    if (!existingPromotionRule) {
      toast.error(t("error"), {
        description: t("promotionDecisionsErrorNoRules"),
      });
      return;
    }
    createPromotionDecisionsMutation.mutate();
  };

  const getPerformanceText = (average) => {
    if (average >= 16) return t("excellent");
    if (average >= 14) return t("veryGood");
    if (average >= 12) return t("good");
    if (average >= 10) return t("average");
    return t("needsImprovement");
  };

  const getPromotionBadgeVariant = (promotionStatus) => {
    switch (promotionStatus) {
      case "promoted":
        return "success";
      case "conditional":
        return "warning";
      case "repeated":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return "-";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const getTranslatedPromotionStatus = (promotionDecision) => {
    if (!promotionDecision) return t("promotionStatuss.pending");
    return t(`promotionStatuss.${promotionDecision.promotion_status}`);
  };

  const getPromotionText = (promotionDecision, yearlyAverage) => {
    if (!promotionDecision) return t("promotionStatuss.pending");
    switch (promotionDecision.promotion_status) {
      case "promoted":
        return t("promotionRemarks.promoted");
      case "conditional":
        return t("promotionRemarks.conditional", {
          subjects: promotionDecision.subjectsPassed || "",
          average: parseFloat(yearlyAverage).toFixed(2),
        });
      case "repeated":
        return t("promotionRemarks.repeated", {
          subjects: promotionDecision.subjectsPassed || "",
          average: parseFloat(yearlyAverage).toFixed(2),
        });
      default:
        return promotionDecision.remarks;
    }
  };

  const onSortChange = (column) => {
    handleSort(column);
  };

  // callback to refresh data after rule update
  const handleRuleUpdated = () => {
    queryClient.invalidateQueries({
      queryKey: [
        "yearlyResults",
        "yearlyOverallResults",
        schoolData.id,
        academicYearName,
        className,
      ],
    });
  };

  const handleManualPromotionSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["yearlyOverallResults", academicYearId, classId],
    });
    toast.success(t("manualPromotionSuccess"), {
      description: t("manualPromotionSuccessDescription"),
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("searchStudents")}
              className="pl-8"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={handleExportYearlyOverallPDF}
            >
              <FileDown className="mr-2 h-4 w-4 text-blue-500" />
              {t("exportPDF")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center"
                  disabled={!canEdit}
                >
                  <Eye className="mr-2 h-4 w-4 text-green-500" />
                  {t("publishActions")}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handlePublishOverall(true)}
                  disabled={!canEdit}
                >
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {t("publishAll")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePublishOverall(false)}
                  disabled={!canEdit}
                >
                  <Ban className="mr-2 h-4 w-4 text-red-500" />
                  {t("unpublishAll")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePublishSelected(true)}
                  disabled={selectedStudentIds.length === 0 || !canEdit}
                >
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {t("publishSelected")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePublishSelected(false)}
                  disabled={selectedStudentIds.length === 0 || !canEdit}
                >
                  <Ban className="mr-2 h-4 w-4 text-red-500" />
                  {t("unpublishSelected")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Manage Promotion Rules Button with colorful icon */}
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1"
              disabled={!canEdit}
            >
              <Settings className="h-5 w-5 text-purple-500" />
              {t("managePromotionRules")}
            </Button>

            {/* Create Promotion Decisions Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleCreateDecisions}
                    disabled={
                      isPromotionRulesLoading ||
                      !existingPromotionRule ||
                      createPromotionDecisionsMutation.isLoading ||
                      !canEdit
                    }
                    className="flex items-center gap-1"
                  >
                    <PlusCircle className="h-5 w-5 text-orange-500" />
                    {t("createPromotionDecisions")}
                  </Button>
                </TooltipTrigger>
                {!existingPromotionRule && (
                  <TooltipContent>
                    <p>{t("noPromotionRulesTooltip")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Manual Promotion Decisions Button */}
            <Button
              variant="outline"
              onClick={() => setIsManualPromotionDialogOpen(true)}
              className="flex items-center gap-1"
              disabled={!canEdit}
            >
              <Edit className="h-5 w-5 text-indigo-500" />
              {t("manualPromotionDecisions")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredResults.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedStudentIds.length === filteredResults.length &&
                        filteredResults.length > 0
                      }
                      indeterminate={
                        selectedStudentIds.length > 0 &&
                        selectedStudentIds.length < filteredResults.length
                      }
                      onCheckedChange={handleSelectAllStudents}
                      aria-label="Select all students"
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => onSortChange("student_name")}
                  >
                    <div className="flex items-center">
                      {t("studentName")}
                      {sortColumn === "student_name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => onSortChange("yearly_average")}
                  >
                    <div className="flex items-center justify-end">
                      {t("average")}
                      {sortColumn === "yearly_average" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => onSortChange("class_rank")}
                  >
                    <div className="flex items-center justify-center">
                      {t("rank")}
                      {sortColumn === "class_rank" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">{t("status")}</TableHead>
                  <TableHead className="text-center">
                    {t("promotionStatus")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("published")}
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <React.Fragment key={result.student_id}>
                    <TableRow
                      className={
                        expandedStudent === result.student_id
                          ? "bg-gray-50"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedStudentIds.includes(
                            result.student_id
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectStudent(result.student_id, checked)
                          }
                          aria-label={`Select ${result.student_name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.student_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={getAverageBg(result.yearly_average)}>
                          {parseFloat(result.yearly_average).toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.class_rank || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            parseFloat(result.yearly_average) >= 10
                              ? "success"
                              : "destructive"
                          }
                        >
                          {parseFloat(result.yearly_average) >= 10
                            ? t("pass")
                            : t("fail")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant={getPromotionBadgeVariant(
                                  result.promotion_decision?.promotion_status
                                )}
                                className="cursor-help"
                              >
                                {result.promotion_decision
                                  ? truncateText(
                                      getTranslatedPromotionStatus(
                                        result.promotion_decision
                                      ),
                                      20
                                    )
                                  : t("promotionStatuss.pending")}
                              </Badge>
                            </TooltipTrigger>
                            {result.promotion_decision && (
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p>
                                    <strong>{t("decidedBy")}:</strong>{" "}
                                    {result.promotion_decision.decided_by}
                                  </p>
                                  <p>
                                    <strong>{t("decisionDate")}:</strong>{" "}
                                    {result.promotion_decision.decision_date}
                                  </p>
                                  <p>
                                    <strong>{t("remarks")}:</strong>{" "}
                                    {truncateText(
                                      getPromotionText(
                                        result.promotion_decision,
                                        result.yearly_average
                                      ),
                                      50
                                    )}
                                  </p>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            result.is_published ? "outline" : "secondary"
                          }
                        >
                          {result.is_published ? t("yes") : t("no")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStudentExpand(result.student_id)}
                        >
                          {expandedStudent === result.student_id ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedStudent === result.student_id && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={8} className="p-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">
                                {t("studentDetails")}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("class")}
                                  </p>
                                  <p>{result.class_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("performance")}
                                  </p>
                                  <p>
                                    {getPerformanceText(
                                      parseFloat(result.yearly_average)
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("subjects")}
                                  </p>
                                  <p>{result.subject_scores?.length || 0}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">
                                {t("promotionDetails")}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("promotionStatus")}
                                  </p>
                                  <Badge
                                    variant={getPromotionBadgeVariant(
                                      result.promotion_decision
                                        ?.promotion_status
                                    )}
                                  >
                                    {result.promotion_decision
                                      ? truncateText(
                                          getTranslatedPromotionStatus(
                                            result.promotion_decision
                                          ),
                                          20
                                        )
                                      : t("promotionStatuss.pending")}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("decidedBy")}
                                  </p>
                                  <p>
                                    {result.promotion_decision?.decided_by ||
                                      "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("decisionDate")}
                                  </p>
                                  <p>
                                    {result.promotion_decision?.decision_date ||
                                      "-"}
                                  </p>
                                </div>
                              </div>
                              {result.promotion_decision && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-500">
                                    {t("remarks")}
                                  </p>
                                  <p className="text-sm">
                                    {getPromotionText(
                                      result.promotion_decision,
                                      result.yearly_average
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                            {result.subject_scores &&
                              result.subject_scores.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    {t("subjectScores")}
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead>
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t("subject")}
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t("score")}
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t("rank")}
                                          </th>
                                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t("grade")}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {result.subject_scores.map(
                                          (subject) => (
                                            <tr key={subject.subject_id}>
                                              <td className="px-4 py-2 whitespace-nowrap">
                                                {subject.subject_name}
                                              </td>
                                              <td className="px-4 py-2 text-right whitespace-nowrap">
                                                {parseFloat(
                                                  subject.score
                                                ).toFixed(1)}
                                              </td>
                                              <td className="px-4 py-2 text-right whitespace-nowrap">
                                                {subject.rank_in_subject}
                                              </td>
                                              <td className="px-4 py-2 text-center whitespace-nowrap">
                                                <Badge
                                                  className={getAverageBg(
                                                    subject.score
                                                  )}
                                                >
                                                  {subject.grade || "-"}
                                                </Badge>
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!canEdit}
                                onClick={() =>
                                  handlePublishSelected(!result.is_published, [
                                    result.student_id,
                                  ])
                                }
                              >
                                {result.is_published ? (
                                  <>
                                    <Ban className="mr-2 h-4 w-4 text-red-500" />
                                    {t("unpublish")}
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    {t("publish")}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-md p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">{t("noResultsFound")}</h3>
            <p className="text-gray-500 mt-2">
              {t("noResultsFoundDescription")}
            </p>
          </div>
        )}
      </CardContent>

      {filteredResults.length > 0 && (
        <CardFooter className="border-t">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {t("showing")} {(page - 1) * 50 + 1} {t("to")}{" "}
              {Math.min(page * 50, totalStudents)} {t("of")} {totalStudents}{" "}
              {t("students")}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                {t("previous")}
              </Button>
              <div className="text-sm text-gray-700">
                {t("page")} {page} {t("of")} {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        </CardFooter>
      )}

      {/* Promotion Rules Modal */}
      {isModalOpen && (
        <PromotionRuleModal
          classEducationSystem={classEducationSystem}
          classLevel={classLevel}
          educationSystems={educationSystems}
          onClose={() => setIsModalOpen(false)}
          onRuleUpdated={handleRuleUpdated}
        />
      )}

      {/* Manual Promotion Decision Dialog */}
      <ManualPromotionDecisionDialog
        open={isManualPromotionDialogOpen}
        onOpenChange={setIsManualPromotionDialogOpen}
        classId={classId}
        className={className}
        academicYearId={AcademicYearId}
        academicYearName={academicYearName}
        onSuccess={handleManualPromotionSuccess}
      />
    </Card>
  );
};

export default YearlyResultsStudentsTab;
