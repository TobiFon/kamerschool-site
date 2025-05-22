import { useQuery, useQueryClient } from "@tanstack/react-query"; // Added useQueryClient in case it's needed for other things, but using direct refetch here
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  ChevronUp,
  Users,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateSequenceOverallResults,
  fetchSequenceOverallResults,
  publishClassSubjectScores,
  publishSequenceOverallResults,
  publishSequenceScores,
  publishStudentResults,
} from "@/queries/results";
import StudentsTab from "./StudentsTab";
import OverviewTab from "./OverviewTab";

// Fixed import for tabs - using proper UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Using local UI components instead of Radix directly
import { toast } from "sonner";

import { fetchSchool } from "@/lib/auth";
import {
  exportSequenceOverallResultsToPDF,
  exportSequenceSubjectScoresToPDF,
} from "@/lib/exportPdfs";
import SubjectTab from "./ClassSubjects";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import SearchAndExportSequence from "./CalculateSequenceResults";

const SequenceResultsTab = ({ sequenceId, classId, sequenceName }) => {
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
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculation dialog state
  const [calculationDialog, setCalculationDialog] = useState(false);
  const [calculationStep, setCalculationStep] = useState(0);
  const [calculationError, setCalculationError] = useState(null);

  // fetch paginated results for display
  const {
    data: responseData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "sequenceOverallResults",
      sequenceId,
      classId,
      page,
      pageSize,
      sortColumn,
      sortDirection,
    ],
    queryFn: () =>
      fetchSequenceOverallResults(
        Number(sequenceId),
        Number(classId),
        page,
        pageSize,
        sortColumn,
        sortDirection
      ),
    enabled: !!sequenceId && !!classId,
    staleTime: 0,
  });

  const {
    data: schoolData,
    isLoading: schoolIsLoading,
    error: schoolError,
  } = useQuery({
    queryKey: ["school"],
    queryFn: () => fetchSchool(),
  });

  // fetch all results for statistics (top/worst, etc.)
  const {
    data: allResultsData,
    refetch: refetchAllResults, // <<<---- ADDED refetch function for allResultsData
  } = useQuery({
    queryKey: ["allSequenceResults", sequenceId, classId],
    queryFn: () =>
      fetchSequenceOverallResults(
        Number(sequenceId),
        Number(classId),
        1,
        9999, // Fetch all
        "rank",
        "asc"
      ),
    enabled: !!sequenceId && !!classId,
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
    excellent_count: 0,
    very_good_count: 0,
    good_count: 0,
    average_count: 0,
    needs_improvement_count: 0,
  };

  const enhancedClassStatistics = useMemo(() => {
    const allResults = allResultsData?.results?.results || [];
    if (
      classStatistics.excellent_count !== undefined &&
      classStatistics.very_good_count !== undefined &&
      classStatistics.good_count !== undefined &&
      classStatistics.average_count !== undefined &&
      classStatistics.needs_improvement_count !== undefined
    ) {
      // If backend already provides these, use them
      if (
        allResults.length > 0 &&
        classStatistics.excellent_count === 0 &&
        classStatistics.very_good_count === 0 &&
        classStatistics.good_count === 0 &&
        classStatistics.average_count === 0 &&
        classStatistics.needs_improvement_count === 0
      ) {
        // Backend might provide 0s but we can calculate from allResults if available
      } else {
        return classStatistics;
      }
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
    const average = allResults.filter(
      (r) => parseFloat(r.average) >= 10 && parseFloat(r.average) < 12
    ).length;
    const needsImprovement = allResults.filter(
      (r) => parseFloat(r.average) < 10
    ).length;
    return {
      ...classStatistics,
      excellent_count: excellent,
      very_good_count: veryGood,
      good_count: good,
      average_count: average,
      needs_improvement_count: needsImprovement,
    };
  }, [classStatistics, allResultsData]);

  const filteredResults = useMemo(() => {
    if (!searchQuery) return overallResults;
    return overallResults.filter((result) =>
      result.student.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, overallResults]);

  const topStudents = useMemo(() => {
    const allResults = allResultsData?.results?.results || [];
    return [...allResults]
      .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
      .slice(0, 3);
  }, [allResultsData]);

  const worstStudents = useMemo(() => {
    const allResults = allResultsData?.results?.results || [];
    return [...allResults]
      .sort((a, b) => parseFloat(a.average) - parseFloat(b.average))
      .slice(0, 3);
  }, [allResultsData]);

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

  const toggleStudentExpand = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const handlePublishOverall = async (publish = true) => {
    try {
      await publishSequenceOverallResults(
        Number(sequenceId),
        Number(classId),
        publish
      );
      toast.success(
        publish ? t("overallPublishSuccess") : t("overallUnpublishSuccess")
      );
      refetch();
      refetchAllResults(); // Also refetch all results in case publish status affects them
    } catch (error) {
      toast.error(
        publish ? t("overallPublishError") : t("overallUnpublishError")
      );
    }
  };

  const handlePublishScores = async (publish = true) => {
    try {
      await publishSequenceScores(Number(sequenceId), Number(classId), publish);
      toast.success(
        publish ? t("scoresPublishSuccess") : t("scoresUnpublishSuccess")
      );
      refetch();
      refetchAllResults(); // Also refetch all results
    } catch (error) {
      toast.error(
        publish ? t("scoresPublishError") : t("scoresUnpublishError")
      );
    }
  };

  const handlePublishSelected = async (publish = true) => {
    if (!selectedStudentIds.length) {
      toast.error(t("noStudentsSelected"));
      return;
    }

    try {
      await publishStudentResults(
        Number(sequenceId),
        Number(classId),
        selectedStudentIds,
        publish
      );
      toast.success(
        publish ? t("selectedPublishSuccess") : t("selectedUnpublishSuccess")
      );
      refetch();
      refetchAllResults(); // Also refetch all results
      setSelectedStudentIds([]);
    } catch (error) {
      toast.error(
        publish ? t("selectedPublishError") : t("selectedUnpublishError")
      );
    }
  };

  const handleToggleSubjectPublish = async (
    classSubjectId,
    studentIds = [],
    publish = true
  ) => {
    try {
      await publishClassSubjectScores(
        Number(sequenceId),
        Number(classId),
        classSubjectId,
        publish,
        studentIds.length > 0 ? studentIds : undefined
      );
      toast.success(
        publish ? t("subjectPublishSuccess") : t("subjectUnpublishSuccess")
      );
      refetch();
      refetchAllResults(); // Also refetch all results
    } catch (error) {
      toast.error(
        publish ? t("subjectPublishError") : t("subjectUnpublishError")
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

  const handleExportSequenceOverallPDF = () => {
    const allResults = allResultsData?.results?.results || [];
    if (!allResults.length) return;

    let dataToExport = allResults;
    if (searchQuery) {
      dataToExport = allResults.filter((result) =>
        result.student.toLowerCase().includes(searchQuery.toLowerCase())
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
      } else if (sortColumn === "student") {
        return sortDirection === "asc"
          ? a.student.localeCompare(b.student)
          : b.student.localeCompare(a.student);
      }
      return 0;
    });

    const exportData = dataToExport.map((result, index) => ({
      SN: index + 1,
      Name: result.student,
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

    const className = allResults[0]?.class_name;
    const pdfTitle = `${className} - ${sequenceName} Overall Results`;

    exportSequenceOverallResultsToPDF(
      tp,
      exportData,
      `${sequenceName}_Overall_Results_${className}`,
      pdfTitle,
      schoolInfo,
      10,
      enhancedClassStatistics // Use the memoized enhanced stats
    );
  };

  const handleExportSequenceSubjectsPDF = () => {
    const allResults = allResultsData?.results?.results || [];
    const firstStudent = allResults[0] || {};
    const subjectList =
      firstStudent.subject_scores?.map((subject) => ({
        id: subject.subject_id,
        name: subject.subject_name_abbreviation,
      })) || [];

    if (!allResults.length || !subjectList.length) return;

    let dataToExport = allResults;
    if (searchQuery) {
      dataToExport = allResults.filter((result) =>
        result.student.toLowerCase().includes(searchQuery.toLowerCase())
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
      } else if (sortColumn === "student") {
        return sortDirection === "asc"
          ? a.student.localeCompare(b.student)
          : b.student.localeCompare(a.student);
      }
      return 0;
    });

    const subjectNames = subjectList.map((subject) => subject.name);

    const exportData = dataToExport.map((result, index) => {
      const subjectScores = {};
      subjectList.forEach((subject) => {
        const subjectData = result.subject_scores?.find(
          (score) => score.subject_id === subject.id
        );
        if (subjectData) {
          subjectScores[subject.name] = {
            score: subjectData.score,
            rank: subjectData.rank_in_subject || "-",
          };
        } else {
          subjectScores[subject.name] = { score: "-", rank: "-" };
        }
      });
      return {
        SN: index + 1,
        Name: result.student,
        SubjectScores: subjectScores,
      };
    });

    const schoolInfo = {
      name: schoolData?.name || "School Name",
      active_academic_year:
        schoolData?.active_academic_year || "Current Academic Year",
      email: schoolData?.email || "",
      city: schoolData?.city || "",
    };

    const className = allResults[0]?.class_name;
    const pdfTitle = `${className} - ${sequenceName} Subject Scores`;

    exportSequenceSubjectScoresToPDF(
      tp,
      exportData,
      subjectNames,
      `${sequenceName}_Subject_Scores_${className}`,
      pdfTitle,
      schoolInfo,
      10
    );
  };

  const handleCalculateResults = async () => {
    try {
      setIsCalculating(true);
      setCalculationDialog(true);
      setCalculationStep(1);
      setCalculationError(null);

      // First step: Calculate results
      await calculateSequenceOverallResults(
        Number(sequenceId),
        Number(classId)
      );

      // Move to next step
      setCalculationStep(2);

      // Refetch to show the updated results
      await refetch(); // For paginated results and base classStatistics
      await refetchAllResults(); // <<<---- ADDED: For all results used in enhancedClassStatistics, top/worst

      // Success notification
      toast.success(
        t("resultsCalculatedSuccess") || "Results calculated successfully"
      );

      // Keep dialog open briefly to show completion
      setTimeout(() => {
        setCalculationDialog(false);
        setIsCalculating(false);
      }, 1500);
    } catch (error) {
      setCalculationError(
        error.message || t("calculationError") || "Failed to calculate results"
      );
      toast.error(
        error.message || t("calculationError") || "Failed to calculate results"
      );
      setIsCalculating(false); // Ensure this is also set in the catch block
    }
  };

  const renderCalculationContent = () => {
    const steps = [
      {
        id: 1,
        label: t("calculatingResults") || "Calculating results",
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
              : t("calculationInProgress") ||
                "Please wait while we process the sequence results."}
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
              onClick={() => handleCalculateResults()} // Allow retry
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

  if (isLoading) {
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
              refetchAllResults();
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
            {sequenceName || t("sequenceResults")}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center">
            <Users className="h-4 w-4 mr-1 inline" />
            {t("totalStudents")}:{" "}
            <span className="font-medium ml-1">
              {classStatistics.total_students}
            </span>
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center">
          <SearchAndExportSequence
            handleCalculateResults={handleCalculateResults}
            isCalculating={isCalculating}
          />
        </div>
      </div>

      <Dialog
        open={calculationDialog}
        onOpenChange={(open) => {
          if (!open && !isCalculating) {
            // Only allow closing if not actively calculating (or after timeout)
            setCalculationDialog(false);
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
              {t("sequenceOverallScores")}
            </TabsTrigger>
            <TabsTrigger
              value="subject"
              className="flex-1 rounded-none py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-white"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t("individualSubjectScores")}
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent
              value="overview"
              className="mt-0 bg-transparent border-none shadow-none p-0"
            >
              <OverviewTab
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
              <StudentsTab
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
                handlePublishScores={handlePublishScores}
                handlePublishOverall={handlePublishOverall}
                handlePublishSelected={handlePublishSelected}
                handleToggleSubjectPublish={handleToggleSubjectPublish}
                selectedStudentIds={selectedStudentIds}
                handleSelectStudent={handleSelectStudent}
                handleSelectAllStudents={handleSelectAllStudents}
                responseData={responseData}
                handleExportSequenceOverallPDF={handleExportSequenceOverallPDF}
                handleExportSequenceSubjectsPDF={
                  handleExportSequenceSubjectsPDF
                }
                sequenceName={sequenceName}
                className={responseData?.results?.class_name}
                schoolData={schoolData}
              />
            </TabsContent>

            <TabsContent
              value="subject"
              className="mt-0 bg-transparent border-none shadow-none p-0"
            >
              <SubjectTab
                sequenceId={sequenceId}
                classId={classId}
                getAverageBg={getAverageBg}
                handlePublishSelected={handlePublishSelected}
                handleToggleSubjectPublish={handleToggleSubjectPublish}
                schoolData={schoolData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default SequenceResultsTab;
