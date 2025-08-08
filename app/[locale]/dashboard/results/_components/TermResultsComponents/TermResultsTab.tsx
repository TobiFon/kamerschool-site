import { useQuery, useQueryClient } from "@tanstack/react-query"; // Added useQueryClient for completeness, direct refetch used
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Calculator,
  Check,
  Users,
  Loader2,
} from "lucide-react"; // Added Loader2
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateTermOverallResults,
  calculateTermResults,
  fetchTermOverallResults,
  fetchTermResults,
  publishTermOverallResults,
} from "@/queries/results";
import { toast } from "sonner";
import { fetchSchool } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TermResultsOverviewTab from "./TermOverviewTab";
import TermResultsStudentsTab from "./TermResultsStudentTab";
import { exportTermOverallResultsToPDF } from "@/lib/exportPdfs";
// import TermSubjectsResultsTab from "./TermSubjectsResultTab"; // Assuming TermSubjectTab is the correct one
import TermSubjectTab from "./TermSubjectsResultTab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const TermResultsTab = ({ termId, classId, termName }) => {
  const t = useTranslations("Results");
  const tp = useTranslations("pdfs");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState("rank");
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const { canEdit } = useCurrentUser(); // Assuming this is a custom hook to check user permissions

  // Calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationStep, setCalculationStep] = useState(0);
  const [calculationDialog, setCalculationDialog] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  // Check if term results exist (this query might not be strictly necessary if fetchTermOverallResults serves this purpose)
  // However, keeping it if it serves a distinct purpose like checking if ANY calculation has ever been done for the term.
  const {
    data: termResultsData,
    isLoading: termResultsLoading,
    refetch: refetchTermResultsCheck,
  } = useQuery({
    queryKey: ["termResultsExistCheck", termId, classId], // Renamed queryKey for clarity
    queryFn: () => fetchTermResults(Number(termId), Number(classId)), // Assuming this returns minimal data just for existence check
    enabled: !!termId && !!classId,
    staleTime: 0, // Consider a longer staleTime if this data changes infrequently
  });

  // Fetch paginated results for display
  const {
    data: responseData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "termOverallResultsPaginated", // Clarified queryKey
      termId,
      classId,
      page,
      pageSize,
      sortColumn,
      sortDirection,
    ],
    queryFn: () =>
      fetchTermOverallResults(Number(termId), Number(classId), {
        page,
        pageSize,
        sortBy: sortColumn,
        sortDirection,
      }),
    enabled: !!termId && !!classId,
    staleTime: 0,
  });

  // Fetch school data for PDF exports
  const { data: schoolData, isLoading: schoolIsLoading } = useQuery({
    queryKey: ["school"],
    queryFn: () => fetchSchool(),
  });

  // Fetch all results for statistics (top/worst, etc.)
  const {
    data: allResultsData,
    refetch: refetchAllTermResults, // <<<---- ADDED refetch function for allResultsData
  } = useQuery({
    queryKey: ["allTermResults", termId, classId],
    queryFn: () =>
      fetchTermOverallResults(Number(termId), Number(classId), {
        page: 1,
        pageSize: 9999, // Fetch all
        sortBy: "rank",
        sortDirection: "asc",
      }),
    enabled: !!termId && !!classId,
    staleTime: 0,
  });

  const overallResults = responseData?.results?.results || [];
  const totalStudents = responseData?.count || 0;
  const classStatistics = responseData?.results?.class_statistics || {
    total_students: 0,
    passed_students: 0,
    failed_students: 0,
    pass_percentage: 0,
    class_average: 0,
    highest_average: 0,
    lowest_average: 0,
    subject_statistics: [],
    // Ensure these are present for the memo, even if initially undefined/0 from backend
    excellent_count: 0,
    very_good_count: 0,
    good_count: 0,
    average_count: 0,
    needs_improvement_count: 0,
  };

  // Determine if term results exist (based on the specific check query)
  const hasTermResults = useMemo(() => {
    return (
      termResultsData &&
      termResultsData.results && // Adjust based on actual structure of termResultsData
      termResultsData.results.length > 0
    );
  }, [termResultsData]);

  // Enhanced class statistics with grade distribution
  const enhancedClassStatistics = useMemo(() => {
    const allResults = allResultsData?.results?.results || [];

    // If backend provides these counts in classStatistics and they are not all zero, prefer them.
    // Otherwise, calculate from allResultsData.
    if (
      classStatistics.excellent_count !== undefined &&
      classStatistics.very_good_count !== undefined &&
      classStatistics.good_count !== undefined &&
      classStatistics.average_count !== undefined &&
      classStatistics.needs_improvement_count !== undefined
    ) {
      const backendHasMeaningfulCounts =
        classStatistics.excellent_count > 0 ||
        classStatistics.very_good_count > 0 ||
        classStatistics.good_count > 0 ||
        classStatistics.average_count > 0 ||
        classStatistics.needs_improvement_count > 0;

      if (backendHasMeaningfulCounts || allResults.length === 0) {
        return classStatistics;
      }
    }

    if (allResults.length === 0 && classStatistics.total_students > 0) {
      // If allResults is empty but paginated data has students, return paginated stats
      // This can happen if allResultsData hasn't loaded yet, or if there's an issue with it
      return classStatistics;
    }

    const excellent = allResults.filter(
      (r) => parseFloat(r.average) >= 16
    ).length;
    const veryGood = allResults.filter(
      (r) => parseFloat(r.average) >= 14 && parseFloat(r.average) < 16
    ).length;
    const good = allResults.filter(
      (r) => parseFloat(r.average) >= 12 && parseFloat(r.average) < 14
    ).length;
    const averageScore = allResults.filter(
      // Renamed to avoid conflict with 'average_count'
      (r) => parseFloat(r.average) >= 10 && parseFloat(r.average) < 12
    ).length;
    const needsImprovement = allResults.filter(
      (r) => parseFloat(r.average) < 10
    ).length;

    return {
      ...classStatistics, // Keep other stats from paginated data like total_students, class_average etc.
      excellent_count: excellent,
      very_good_count: veryGood,
      good_count: good,
      average_count: averageScore,
      needs_improvement_count: needsImprovement,
    };
  }, [classStatistics, allResultsData]);

  // Filter results based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery) return overallResults;
    return overallResults.filter((result) =>
      result.student_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, overallResults]);

  // Get top 3 students
  const topStudents = useMemo(() => {
    const allResults = allResultsData?.results?.results || [];
    return [...allResults]
      .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
      .slice(0, 3);
  }, [allResultsData]);

  // Get bottom 3 students
  const worstStudents = useMemo(() => {
    const allResults = allResultsData?.results?.results || [];
    return [...allResults]
      .sort((a, b) => parseFloat(a.average) - parseFloat(b.average))
      .slice(0, 3);
  }, [allResultsData]);

  // Sorting handler
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const totalPages = Math.ceil(totalStudents / pageSize);

  // Color helpers for averages
  const getAverageColor = (average) => {
    const avg = parseFloat(average);
    if (avg < 6) return "text-red-500";
    if (avg < 10) return "text-amber-500";
    if (avg < 14) return "text-emerald-500";
    return "text-blue-500";
  };

  const getAverageBg = (average) => {
    const avg = parseFloat(average);
    if (avg < 6) return "bg-red-50 border-red-200 text-red-700";
    if (avg < 10) return "bg-amber-50 border-amber-200 text-amber-700";
    if (avg < 14) return "bg-emerald-50 border-emerald-200 text-emerald-700";
    return "bg-blue-50 border-blue-200 text-blue-700";
  };

  // Toggle expanded student view
  const toggleStudentExpand = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  // Publish/unpublish overall results
  const handlePublishOverall = async (publish = true) => {
    try {
      await publishTermOverallResults(Number(termId), Number(classId), publish);
      toast.success(
        publish ? t("overallPublishSuccess") : t("overallUnpublishSuccess")
      );
      await refetch();
      await refetchAllTermResults(); // <<<---- ADDED
    } catch (error) {
      toast.error(
        publish ? t("overallPublishError") : t("overallUnpublishError")
      );
    }
  };

  // Publish/unpublish for selected students
  const handlePublishSelected = async (publish = true) => {
    if (!selectedStudentIds.length) {
      toast.error(t("noStudentsSelected"));
      return;
    }

    try {
      await publishTermOverallResults(
        Number(termId),
        Number(classId),
        publish,
        { studentIds: selectedStudentIds }
      );
      toast.success(
        publish ? t("selectedPublishSuccess") : t("selectedUnpublishSuccess")
      );
      await refetch();
      await refetchAllTermResults(); // <<<---- ADDED
      setSelectedStudentIds([]);
    } catch (error) {
      toast.error(
        publish ? t("selectedPublishError") : t("selectedUnpublishError")
      );
    }
  };

  const handleSelectStudent = (studentId, isSelected) => {
    if (isSelected) {
      setSelectedStudentIds((prev) => [...prev, studentId]);
    } else {
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    }
  };

  const handleSelectAllStudents = (isSelected) => {
    if (isSelected) {
      const allIds = filteredResults.map((result) => result.student_id);
      setSelectedStudentIds(allIds);
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleExportTermOverallPDF = () => {
    const allResults = allResultsData?.results?.results || [];
    if (!allResults.length) return;

    let dataToExport = allResults;
    if (searchQuery) {
      dataToExport = allResults.filter((result) =>
        result.student_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    dataToExport = [...dataToExport].sort((a, b) => {
      if (sortColumn === "average") {
        return sortDirection === "asc"
          ? parseFloat(a.average) - parseFloat(b.average)
          : parseFloat(b.average) - parseFloat(a.average);
      } else if (sortColumn === "rank") {
        return sortDirection === "asc"
          ? parseInt(a.rank || 0) - parseInt(b.rank || 0)
          : parseInt(b.rank || 0) - parseInt(a.rank || 0);
      } else if (sortColumn === "student_name") {
        return sortDirection === "asc"
          ? a.student_name.localeCompare(b.student_name)
          : b.student_name.localeCompare(a.student_name);
      }
      return 0;
    });

    const exportData = dataToExport.map((result, index) => ({
      SN: index + 1,
      Name: result.student_name,
      Average: parseFloat(result.average),
      Rank: result.rank || "-",
      Status: parseFloat(result.average) >= 10 ? "Pass" : "Fail",
      Published: result.is_published ? "Yes" : "No",
    }));

    const schoolInfo = {
      name: schoolData?.name || "School Name",
      active_academic_year:
        schoolData?.active_academic_year || "Current Academic Year",
      email: schoolData?.email || "",
      city: schoolData?.city || "",
    };

    const className = allResults[0]?.class_name || "";
    const pdfTitle = `${className} - ${termName} Term Results`;

    exportTermOverallResultsToPDF(
      tp,
      exportData,
      `${termName}_Overall_Results_${className}`,
      pdfTitle,
      schoolInfo,
      10,
      enhancedClassStatistics // Use the memoized enhanced stats
    );
  };

  const handleCalculateResults = async () => {
    try {
      setIsCalculating(true);
      setCalculationDialog(true);
      setCalculationStep(1);
      setCalculationError(null);

      await calculateTermResults(Number(termId), Number(classId));
      setCalculationStep(2);

      await calculateTermOverallResults(Number(termId), Number(classId));
      setCalculationStep(3);

      await refetch(); // Refetch paginated data
      await refetchAllTermResults(); // <<<---- ADDED: Refetch all data for stats
      await refetchTermResultsCheck(); // <<<---- ADDED: Refetch the existence check if it's used for UI logic

      toast.success(
        t("resultsCalculatedSuccess") || "Results calculated successfully"
      );

      setTimeout(() => {
        setCalculationDialog(false);
        setIsCalculating(false);
      }, 1500);
    } catch (error) {
      console.error("Error calculating results:", error);
      setCalculationError(
        error.message || t("calculationError") || "Failed to calculate results"
      );
      toast.error(
        error.message || t("calculationError") || "Failed to calculate results"
      );
      setIsCalculating(false);
    }
  };

  const renderCalculationContent = () => {
    const steps = [
      {
        id: 1,
        label: t("calculatingSubjectResults") || "Calculating subject results",
      },
      {
        id: 2,
        label: t("calculatingOverallResults") || "Calculating overall results",
      },
      { id: 3, label: t("calculationComplete") || "Calculation complete" },
    ];
    const progressPercentage = (calculationStep / steps.length) * 100; // Use steps.length

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
              : t("calculationInProgress") ||
                "Please wait while we process the class results."}
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
                    ) : calculationStep === step.id && isCalculating ? ( // Added isCalculating check for spinner
                      <Loader2 className="h-4 w-4 animate-spin text-green-700" />
                    ) : calculationStep < step.id ? (
                      step.id
                    ) : (
                      <Check className="h-5 w-5" /> // Show check if step is complete but not necessarily the whole process
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
              onClick={() => {
                setCalculationDialog(false);
                setCalculationError(null); // Reset error on close
              }}
              variant="outline"
            >
              {t("close") || "Close"}
            </Button>
            <Button
              onClick={handleCalculateResults} // Retry calculation
              variant="primary"
              className="ml-2"
              disabled={isCalculating}
            >
              {isCalculating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("tryAgain") || "Try Again"}
            </Button>
          </div>
        )}
      </>
    );
  };

  // Combined loading state for initial data fetch
  const initialDataLoading = isLoading || termResultsLoading; // Add schoolIsLoading if it's critical for initial render

  if (initialDataLoading && page === 1 && !responseData) {
    // Show skeleton only on initial load
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border">
        <div className="max-w-md text-center p-8">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{t("errorLoadingResults")}</h3>
          <p className="text-gray-600 mb-6">
            {error?.message || t("unknownError")}
          </p>
          <Button
            onClick={() => {
              refetch();
              refetchAllTermResults();
              refetchTermResultsCheck();
            }}
            variant="primary"
            size="lg"
          >
            {" "}
            {/* Also refetch all results on error retry */}
            {t("tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {termName || t("termResults")}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center">
            <Users className="h-4 w-4 mr-1 inline" />
            {t("totalStudents")}:{" "}
            <span className="font-medium ml-1">
              {classStatistics.total_students}
            </span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Button
            onClick={handleCalculateResults}
            disabled={isCalculating || !canEdit}
            className="flex items-center"
            variant="default" // Or "primary"
          >
            {isCalculating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            {isCalculating
              ? t("calculating") || "Calculating..."
              : t("calculateTermResults") || "Calculate Results"}
          </Button>
        </div>
      </div>

      <Dialog
        open={calculationDialog}
        onOpenChange={(open) => {
          if (!open && !isCalculating) {
            setCalculationDialog(false);
            setCalculationError(null); // Reset error when dialog is closed by user
            // setCalculationStep(0); // Optionally reset step
          } else if (open) {
            setCalculationDialog(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {renderCalculationContent()}
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex rounded-none border-b border-gray-200 bg-gray-50 p-0">
            <TabsTrigger
              value="overview"
              className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary/90 data-[state=active]:text-primary data-[state=active]:bg-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-white"
            >
              <Users className="h-4 w-4 mr-2" />
              {t("termResults")}
            </TabsTrigger>
            <TabsTrigger
              value="subjects"
              className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-white"
            >
              {/* Consider a different icon for subjects, e.g., BookOpen from lucide-react */}
              <Users className="h-4 w-4 mr-2" />
              {t("termSubjectResults")}
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent
              value="overview"
              className="mt-0 bg-transparent border-none shadow-none p-0"
            >
              <TermResultsOverviewTab
                classStatistics={enhancedClassStatistics}
                topStudents={topStudents}
                worstStudents={worstStudents}
                getAverageColor={getAverageColor}
                getAverageBg={getAverageBg}
              />
            </TabsContent>

            <TabsContent
              value="students"
              className="mt-0 bg-transparent border-none shadow-none p-0"
            >
              <TermResultsStudentsTab
                filteredResults={filteredResults}
                totalStudents={totalStudents}
                page={page}
                totalPages={totalPages}
                handleSort={handleSort}
                toggleStudentExpand={toggleStudentExpand}
                expandedStudent={expandedStudent}
                getAverageBg={getAverageBg}
                setSearchQuery={setSearchQuery}
                setPage={setPage}
                handlePublishOverall={handlePublishOverall}
                handlePublishSelected={handlePublishSelected}
                selectedStudentIds={selectedStudentIds}
                handleSelectStudent={handleSelectStudent}
                handleSelectAllStudents={handleSelectAllStudents}
                responseData={responseData}
                handleExportTermOverallPDF={handleExportTermOverallPDF}
                termName={termName}
                className={responseData?.results?.class_name} // Ensure this is correct path
                schoolData={schoolData}
                isLoading={isLoading} // Pass loading state for student tab UI
              />
            </TabsContent>
            <TabsContent
              value="subjects"
              className="mt-0 bg-transparent border-none shadow-none p-0"
            >
              <TermSubjectTab
                termId={termId}
                classId={classId}
                schoolData={schoolData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default TermResultsTab;
