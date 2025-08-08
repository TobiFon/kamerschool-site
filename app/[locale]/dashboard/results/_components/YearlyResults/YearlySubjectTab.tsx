"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, Calculator, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchYearlySubjectResults,
  publishYearlySubjectResults,
  calculateYearlySubjectResults,
} from "@/queries/results";
import { fetchClassSubjects } from "@/queries/subjects";
import SubjectSelector from "../SubjectSelector";
import BulkActions from "../BulkActions";
import PaginationControls from "../Pagination";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import SearchAndExportYearly from "./YearlySearchExport";
import YearlySubjectDashboard from "./YearlyResultsDasbhoard";
import YearlyScoresTable from "./YearlyScoresTable";
import { exportYearlySubjectScoresToPDF } from "@/lib/exportPdfs";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface YearlySubjectsResultsTabProps {
  academicYearId: number;
  classId: number;
  schoolData: any;
}

const YearlySubjectsResultsTab: React.FC<YearlySubjectsResultsTabProps> = ({
  academicYearId,
  classId,
  schoolData,
}) => {
  const t = useTranslations("YearlyResults");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("average_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const tp = useTranslations("pdfs");
  const { canEdit } = useCurrentUser();

  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationStep, setCalculationStep] = useState(0);
  const [calculationDialog, setCalculationDialog] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Fetch class subjects
  const { data: classSubjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["classSubjects", classId],
    queryFn: () => fetchClassSubjects(classId),
    enabled: !!classId,
  });

  // Fetch yearly subject results
  const {
    data: yearlySubjectResults,
    isLoading: isLoadingResults,
    error: resultsError,
    refetch,
  } = useQuery({
    queryKey: [
      "yearlySubjectResults",
      academicYearId,
      classId,
      selectedSubject,
      sortColumn,
      sortDirection,
    ],
    queryFn: () =>
      fetchYearlySubjectResults(Number(academicYearId), Number(classId), {
        classSubjectId: Number(selectedSubject),
        sortColumn,
        sortDirection,
      }),
    enabled: !!academicYearId && !!classId && !!selectedSubject,
  });

  // Set default subject
  useEffect(() => {
    if (classSubjects?.length && !selectedSubject) {
      setSelectedSubject(classSubjects[0]?.id.toString());
    }
  }, [classSubjects, selectedSubject]);

  // Process results for search and pagination
  const processedResults = React.useMemo(() => {
    if (!yearlySubjectResults) return [];
    const filtered = searchQuery
      ? yearlySubjectResults.filter((r) =>
          r.student_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : yearlySubjectResults;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  }, [yearlySubjectResults, searchQuery, page, pageSize]);

  // Handle calculation of yearly subject results
  const handleCalculateSubjectResults = async () => {
    if (!selectedSubject) {
      toast.error(t("noSubjectSelected") || "Please select a subject first");
      return;
    }
    try {
      setIsCalculating(true);
      setCalculationDialog(true);
      setCalculationStep(1);
      setCalculationError(null);

      await calculateYearlySubjectResults(
        Number(academicYearId),
        Number(classId),
        Number(selectedSubject)
      );
      setCalculationStep(2);
      await refetch();

      toast.success(
        t("subjectResultsCalculatedSuccess") ||
          "Subject results calculated successfully"
      );
      setTimeout(() => {
        setCalculationDialog(false);
        setIsCalculating(false);
      }, 1500);
    } catch (error: any) {
      console.error("Error calculating subject results:", error);
      setCalculationError(
        error.message ||
          t("calculationError") ||
          "Failed to calculate subject results"
      );
      toast.error(
        error.message ||
          t("calculationError") ||
          "Failed to calculate subject results"
      );
      setIsCalculating(false);
    }
  };

  // Render calculation dialog content
  const renderCalculationContent = () => {
    const steps = [
      {
        id: 1,
        label: t("calculatingSubjectResults") || "Calculating subject results",
      },
      { id: 2, label: t("calculationComplete") || "Calculation complete" },
    ];
    const progressPercentage = (calculationStep / 2) * 100;

    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {calculationError
              ? t("calculationFailed") || "Calculation Failed"
              : t("calculatingResults") || "Calculating Results"}
          </DialogTitle>
          <DialogDescription>
            {calculationError
              ? t("calculationErrorDesc") ||
                "An error occurred during calculation."
              : t("subjectCalculationInProgress") ||
                "Please wait while we process the subject results."}
          </DialogDescription>
        </DialogHeader>
        {!calculationError ? (
          <div className="space-y-6 py-4">
            <Progress value={progressPercentage} className="h-2" />
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                      calculationStep >= step.id
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {calculationStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : calculationStep === step.id ? (
                      <div className="h-4 w-4 rounded-full border-2 border-green-700 border-t-transparent animate-spin" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={
                      calculationStep >= step.id
                        ? "text-black font-medium"
                        : "text-gray-500"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 text-red-500 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{calculationError}</p>
          </div>
        )}
        {calculationError && (
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setCalculationDialog(false)}
              variant="outline"
            >
              {t("close") || "Close"}
            </Button>
            <Button
              onClick={handleCalculateSubjectResults}
              variant="primary"
              className="ml-2"
            >
              {t("tryAgain") || "Try Again"}
            </Button>
          </div>
        )}
      </>
    );
  };

  // Pagination totals
  const totalFiltered = yearlySubjectResults
    ? searchQuery
      ? yearlySubjectResults.filter((r) =>
          r.student_name.toLowerCase().includes(searchQuery.toLowerCase())
        ).length
      : yearlySubjectResults.length
    : 0;
  const totalPages = Math.ceil(totalFiltered / pageSize);

  // Handle publishing/unpublishing
  const handleToggleYearlyPublish = async (
    subjectId: number,
    studentIds: number[],
    publish: boolean
  ) => {
    try {
      await publishYearlySubjectResults(
        Number(academicYearId),
        Number(classId),
        publish,
        {
          studentIds,
          subjectId,
        }
      );
      toast.success(
        publish ? t("selectedPublishSuccess") : t("selectedUnpublishSuccess")
      );
      refetch();
    } catch (error: any) {
      toast.error(
        publish ? t("selectedPublishError") : t("selectedUnpublishError")
      );
    }
  };

  // Calculate dashboard stats
  const stats = React.useMemo(() => {
    if (!yearlySubjectResults?.length)
      return { avgScore: 0, passRate: 0, highestScore: 0, lowestScore: 0 };
    const scores = yearlySubjectResults
      .map((r) => parseFloat(r.average_score))
      .filter((s) => !isNaN(s));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
    const passRate =
      (scores.filter((s) => s >= 10).length / yearlySubjectResults.length) *
        100 || 0;
    const highestScore = Math.max(...scores) || 0;
    const lowestScore = Math.min(...scores) || 0;
    return { avgScore, passRate, highestScore, lowestScore };
  }, [yearlySubjectResults]);

  // Get selected subject info for export
  const getSelectedSubjectInfo = () => {
    if (!classSubjects?.length || !selectedSubject) return null;
    return classSubjects.find(
      (subject) => subject.id.toString() === selectedSubject
    );
  };

  // Handle PDF export
  const handleExportSubjectPDF = () => {
    const selectedSubjectInfo = getSelectedSubjectInfo();
    if (!yearlySubjectResults?.length || !selectedSubjectInfo) return;
    const sortedResults = [...yearlySubjectResults].sort((a, b) =>
      a.student_name.localeCompare(b.student_name)
    );
    const exportData = sortedResults.map((result, index) => ({
      SN: index + 1,
      Name: result.student_name,
      Score: result.average_score,
      Rank: result.rank_in_subject || "-",
      Status: parseFloat(result.average_score) >= 10 ? "Pass" : "Fail",
      Published: result.is_published ? "Yes" : "No",
      Absent: result.is_absent,
    }));
    const pdfTitle = `${yearlySubjectResults[0]?.class_name || ""} - ${
      selectedSubjectInfo.subject_name
    } Yearly Scores`;
    exportYearlySubjectScoresToPDF(
      tp,
      exportData,
      `${selectedSubjectInfo.subject_name}_Yearly_Scores_${
        yearlySubjectResults[0]?.class_name || "Class"
      }`,
      pdfTitle,
      schoolData,
      10
    );
  };

  // Loading and error states
  if (isLoadingSubjects) return <Skeleton className="h-10 w-64" />;
  if (!classSubjects?.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p>{t("noSubjectsFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <SubjectSelector
            classSubjects={classSubjects}
            selectedSubject={selectedSubject}
            onValueChange={(value) => {
              setSelectedSubject(value);
              setPage(1);
              setSelectedStudentIds([]);
            }}
          />
        </div>
        <SearchAndExportYearly
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExport={handleExportSubjectPDF}
          handleCalculateSubjectResults={handleCalculateSubjectResults}
          isCalculating={isCalculating}
          selectedSubject={selectedSubject}
        />
      </div>

      <Dialog open={calculationDialog} onOpenChange={setCalculationDialog}>
        <DialogContent className="sm:max-w-md">
          {renderCalculationContent()}
        </DialogContent>
      </Dialog>

      {isLoadingResults ? (
        <div className="text-center p-8">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p>{t("loadingScores")}</p>
        </div>
      ) : resultsError ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p>{(resultsError as Error).message || t("unknownError")}</p>
        </div>
      ) : !yearlySubjectResults?.length ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p>{t("noScoresFound")}</p>
        </div>
      ) : (
        <>
          <YearlySubjectDashboard
            stats={stats}
            totalStudents={yearlySubjectResults.length}
          />
          <BulkActions
            selectedStudentIds={selectedStudentIds}
            processedResultsLength={processedResults.length}
            onSelectAllChange={(checked) =>
              setSelectedStudentIds(
                checked ? processedResults.map((r) => r.student_id) : []
              )
            }
            onPublish={() =>
              handleToggleYearlyPublish(
                Number(selectedSubject),
                selectedStudentIds,
                true
              )
            }
            onUnpublish={() =>
              handleToggleYearlyPublish(
                Number(selectedSubject),
                selectedStudentIds,
                false
              )
            }
          />
          <YearlyScoresTable
            processedResults={processedResults}
            selectedStudentIds={selectedStudentIds}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={(column) => {
              setSortColumn(column);
              setSortDirection(
                sortColumn === column && sortDirection === "asc"
                  ? "desc"
                  : "asc"
              );
              setPage(1);
            }}
            onSelectStudent={(id, checked) =>
              setSelectedStudentIds((prev) =>
                checked ? [...prev, id] : prev.filter((x) => x !== id)
              )
            }
            onToggle={(id) => {
              const result = processedResults.find((r) => r.student_id === id);
              handleToggleYearlyPublish(
                Number(selectedSubject),
                [id],
                !result?.is_published
              );
            }}
          />
          <PaginationControls
            page={page}
            totalPages={totalPages}
            filteredCount={totalFiltered}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}
    </div>
  );
};

export default YearlySubjectsResultsTab;
