"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, Calculator, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchTermResults,
  publishTermResults,
  calculateTermResults,
} from "@/queries/results";
import { fetchClassSubjects } from "@/queries/subjects";
import SearchAndExportTerm from "./SearchExportTerm";
import SubjectSelector from "../SubjectSelector";
import TermSubjectDashboard from "./TermSubjectsDashboard";
import BulkActions from "../BulkActions";
import TermScoresTable from "./TermScoreTable";
import PaginationControls from "../Pagination";
import { toast } from "sonner";
import { exportTermSubjectScoresToPDF } from "@/lib/exportPdfs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface TermSubjectTabProps {
  termId: number;
  classId: number;
  schoolData: any;
}

const TermSubjectTab: React.FC<TermSubjectTabProps> = ({
  termId,
  classId,
  schoolData,
}) => {
  const t = useTranslations("Results");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string>("average_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  // const tp = useTranslations("pdfs");

  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationStep, setCalculationStep] = useState(0);
  const [calculationDialog, setCalculationDialog] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  // Fetch class subjects
  const { data: classSubjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["classSubjects", classId],
    queryFn: () => fetchClassSubjects(classId),
    enabled: !!classId,
  });

  // Fetch term results for the selected subject
  const {
    data: termResults,
    isLoading: isLoadingResults,
    error: resultsError,
    refetch,
  } = useQuery({
    queryKey: [
      "termResults",
      termId,
      classId,
      selectedSubject,
      sortColumn,
      sortDirection,
    ],
    queryFn: () =>
      fetchTermResults(termId, classId, {
        classSubjectId: Number(selectedSubject),
        sortColumn,
        sortDirection,
      }),
    enabled: !!termId && !!classId && !!selectedSubject,
  });

  // Set default subject
  useEffect(() => {
    if (classSubjects?.length && !selectedSubject) {
      setSelectedSubject(classSubjects[0]?.id.toString());
    }
  }, [classSubjects, selectedSubject]);

  // Filter results client-side for search on current page
  const processedResults = React.useMemo(() => {
    if (!termResults) return [];

    // Filter by search query
    const filtered = searchQuery
      ? termResults.filter((r) =>
          r.student_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : termResults;

    // Calculate total pages
    const totalPages = Math.ceil(filtered.length / pageSize);
    // Apply client-side pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filtered.slice(startIndex, endIndex);
  }, [termResults, searchQuery, page, pageSize]);

  // Handle the calculation process for a single subject
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

      // Calculate subject term results
      await calculateTermResults(
        Number(termId),
        Number(classId),
        Number(selectedSubject)
      );

      setCalculationStep(2);

      // Refresh data
      await refetch();

      // Success notification
      toast.success(
        t("subjectResultsCalculatedSuccess") ||
          "Subject results calculated successfully"
      );

      // Keep the dialog open briefly to show completion
      setTimeout(() => {
        setCalculationDialog(false);
        setIsCalculating(false);
      }, 1500);
    } catch (error) {
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

  // Content for calculation dialog
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
                    className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 
                    ${
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
              onClick={() => handleCalculateSubjectResults()}
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

  // Get the total count for pagination
  const totalFiltered = termResults
    ? searchQuery
      ? termResults.filter((r) =>
          r.student_name.toLowerCase().includes(searchQuery.toLowerCase())
        ).length
      : termResults.length
    : 0;

  const totalPages = Math.ceil(totalFiltered / pageSize);

  const handleToggleTermPublish = async (subjectId, studentIds, publish) => {
    try {
      await publishTermResults(Number(termId), Number(classId), publish, {
        studentIds,
        subjectId,
      });
      toast.success(
        publish ? t("selectedPublishSuccess") : t("selectedUnpublishSuccess")
      );
      refetch();
    } catch (error) {
      toast.error(
        publish ? t("selectedPublishError") : t("selectedUnpublishError")
      );
    }
  };

  // Dashboard stats
  const stats = React.useMemo(() => {
    if (!termResults?.length)
      return { avgScore: 0, passRate: 0, highestScore: 0, lowestScore: 0 };

    // Use the full results array, not just the paginated/filtered results
    const allResults = termResults;
    const scores = allResults
      .map((r) => parseFloat(r.average_score))
      .filter((s) => !isNaN(s));

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
    const passRate =
      (scores.filter((s) => s >= 10).length / allResults.length) * 100 || 0;
    const highestScore = Math.max(...scores) || 0;
    const lowestScore = Math.min(...scores) || 0;

    return { avgScore, passRate, highestScore, lowestScore };
  }, [termResults]);

  const getSelectedSubjectInfo = () => {
    if (!classSubjects?.length || !selectedSubject) return null;

    return classSubjects.find(
      (subject) => subject.id.toString() === selectedSubject
    );
  };

  // Export handler
  const handleExportSubjectPDF = () => {
    const selectedSubjectInfo = getSelectedSubjectInfo();
    if (!termResults?.length || !selectedSubjectInfo) return;

    const sortedResults = [...termResults].sort((a, b) =>
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

    const pdfTitle = `${termResults[0]?.class_name || ""} - ${
      selectedSubjectInfo.subject_name
    } Scores`;

    exportTermSubjectScoresToPDF(
      tp,
      exportData,
      `${selectedSubjectInfo.subject_name}_Scores_${
        termResults[0]?.class_name || "Class"
      }`,
      pdfTitle,
      schoolData,
      10
    );
  };

  if (isLoadingSubjects) {
    return <Skeleton className="h-10 w-64" />;
  }

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
        <SearchAndExportTerm
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExport={handleExportSubjectPDF}
          handleCalculateSubjectResults={handleCalculateSubjectResults}
          isCalculating={isCalculating}
          selectedSubject={selectedSubject}
        />
      </div>

      {/* Results calculation dialog */}
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
      ) : !termResults?.length ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p>{t("noScoresFound")}</p>
        </div>
      ) : (
        <>
          <TermSubjectDashboard
            stats={stats}
            totalStudents={termResults.length}
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
              handleToggleTermPublish(
                Number(selectedSubject),
                selectedStudentIds,
                true
              )
            }
            onUnpublish={() =>
              handleToggleTermPublish(
                Number(selectedSubject),
                selectedStudentIds,
                false
              )
            }
          />
          <TermScoresTable
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
              handleToggleTermPublish(
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

export default TermSubjectTab;
