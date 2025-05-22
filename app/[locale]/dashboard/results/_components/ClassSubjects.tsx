import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectTabProps } from "@/types/results";
import { fetchSubjectSequenceScores } from "@/queries/results";
import { fetchClassSubjects } from "@/queries/subjects";
import { exportSubjectScoresToPDF } from "@/lib/exportPdfs";
import SubjectSelector from "./SubjectSelector";
import SearchAndExport from "./SearchAndExport";
import SubjectDashboard from "./SubjectDashboard";
import BulkActions from "./BulkActions";
import ScoresTable from "./ScoresTable";
import PaginationControls from "./Pagination";
import ScoresEditModal from "./ScoreEditModal";

const SubjectTab: React.FC<SubjectTabProps> = ({
  sequenceId,
  classId,
  getAverageBg,
  handleToggleSubjectPublish,
  schoolData,
}) => {
  const t = useTranslations("Results");
  const tp = useTranslations("pdfs");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [sortColumn, setSortColumn] = useState<string>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Fetch class subjects
  const { data: classSubjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["classSubjects", classId],
    queryFn: () => fetchClassSubjects(Number(classId)),
    enabled: !!classId,
  });

  // Set default subject when data is loaded
  useEffect(() => {
    if (classSubjects?.length && !selectedSubject) {
      setSelectedSubject(classSubjects[0]?.id.toString());
    }
  }, [classSubjects, selectedSubject]);

  // Fetch subject scores
  const {
    data: subjectScores,
    isLoading: isLoadingScores,
    error: scoresError,
    refetch,
  } = useQuery({
    queryKey: [
      "subjectSequenceScores",
      sequenceId,
      classId,
      selectedSubject,
      page,
      pageSize,
      sortColumn,
      sortDirection,
    ],
    queryFn: () =>
      fetchSubjectSequenceScores(
        Number(sequenceId),
        Number(classId),
        Number(selectedSubject)
      ),
    enabled: !!sequenceId && !!classId && !!selectedSubject,
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const handleSelectStudent = (studentId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedStudentIds((prev) => [...prev, studentId]);
    } else {
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    }
  };

  const handleSelectAllStudents = (isSelected: boolean) => {
    if (isSelected && subjectScores?.results) {
      const allIds = subjectScores.results.map((result) => result.student_id);
      setSelectedStudentIds(allIds);
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggle = async (
    subjectId: number,
    studentIds: number[],
    publish: boolean
  ) => {
    await handleToggleSubjectPublish(subjectId, studentIds, publish);
    refetch();
  };

  const calculateStats = () => {
    if (!subjectScores?.results || subjectScores.results.length === 0) {
      return {
        avgScore: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 0,
        absentCount: 0,
      };
    }

    const scores = subjectScores.results.map((r) => r.score);
    const passCount = subjectScores.results.filter((r) => r.score >= 10).length;
    const absentCount = subjectScores.results.filter((r) => r.is_absent).length;

    return {
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      passRate: (passCount / subjectScores.results.length) * 100,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      absentCount,
    };
  };

  const stats = calculateStats();

  const processedResults = React.useMemo(() => {
    if (!subjectScores?.results) return [];

    let filtered = subjectScores.results;
    if (searchQuery) {
      filtered = filtered.filter((result) =>
        result.student_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortColumn === "student_name") {
        return sortDirection === "asc"
          ? a.student_name.localeCompare(b.student_name)
          : b.student_name.localeCompare(a.student_name);
      } else if (sortColumn === "score") {
        return sortDirection === "asc" ? a.score - b.score : b.score - a.score;
      } else if (sortColumn === "rank") {
        if (a.rank === null && b.rank === null) return 0;
        if (a.rank === null) return sortDirection === "asc" ? 1 : -1;
        if (b.rank === null) return sortDirection === "asc" ? -1 : 1;
        return sortDirection === "asc" ? a.rank - b.rank : b.rank - a.rank;
      }
      return 0;
    });

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sorted.slice(start, Math.min(end, sorted.length));
  }, [subjectScores, searchQuery, sortColumn, sortDirection, page, pageSize]);

  const totalStudents = subjectScores?.results?.length || 0;
  const filteredCount = subjectScores?.results
    ? subjectScores.results.filter((r) =>
        searchQuery
          ? r.student_name.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      ).length
    : 0;
  const totalPages = Math.ceil(filteredCount / pageSize);

  const getSelectedSubjectInfo = () => {
    if (!classSubjects || !selectedSubject) return null;
    const subject = classSubjects.find(
      (subject) => subject.id.toString() === selectedSubject
    );
    return subject;
  };

  const handleExportSubjectPDF = () => {
    const selectedSubjectInfo = getSelectedSubjectInfo();
    if (!subjectScores?.results || !selectedSubjectInfo) return;

    // Use the processedResults ordering
    const exportData = processedResults.map((result, index) => ({
      SN: index + 1,
      Name: result.student_name,
      Score: result.score.toFixed(2),
      Rank: result.rank || "-",
      Status: result.score >= 10 ? "Pass" : "Fail",
      Published: result.is_published ? "Yes" : "No",
      Absent: result.is_absent,
    }));

    const schoolInfo = {
      name: schoolData?.name || "School Name",
      active_academic_year:
        schoolData?.active_academic_year || "Current Academic Year",
      email: schoolData?.email || "",
      city: schoolData?.city || "",
    };

    const pdfTitle = `${subjectScores.class_name} - ${selectedSubjectInfo.subject_name} Scores`;

    exportSubjectScoresToPDF(
      tp,
      exportData,
      `${selectedSubjectInfo.subject_name}_Scores_${subjectScores.class_name}`,
      pdfTitle,
      schoolInfo,
      10
    );
  };

  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const hasScores = !!subjectScores?.results?.some(
    (r) => r.score !== null && r.score !== undefined && !r.is_absent
  );

  if (isLoadingSubjects) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!classSubjects?.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">{t("noSubjectsFound")}</h3>
          <p className="text-gray-600 mb-4">
            {t("noSubjectsFoundDescription")}
          </p>
        </div>
      </div>
    );
  }

  const selectedSubjectInfo = getSelectedSubjectInfo();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <SubjectSelector
          classSubjects={classSubjects}
          selectedSubject={selectedSubject}
          onValueChange={setSelectedSubject}
        />
        <SearchAndExport
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExport={handleExportSubjectPDF}
          onEditScores={handleOpenEditModal}
          hasScores={hasScores}
        />
      </div>

      {isLoadingScores ? (
        <div className="text-center p-8">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="mt-2 text-gray-600">{t("loadingScores")}</p>
        </div>
      ) : scoresError ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {t("errorLoadingScores")}
            </h3>
            <p className="text-gray-600 mb-4">
              {(scoresError as Error)?.message || t("unknownError")}
            </p>
            <Button onClick={() => refetch()} variant="primary">
              {t("tryAgain")}
            </Button>
          </div>
        </div>
      ) : !processedResults?.length ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">{t("noScoresFound")}</h3>
            <p className="text-gray-600 mb-4">
              {t("noScoresFoundDescription")}
            </p>
            <Button onClick={handleOpenEditModal} variant="primary">
              {t("recordScores")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {subjectScores && selectedSubjectInfo && (
            <SubjectDashboard
              subjectScores={subjectScores}
              selectedSubjectInfo={selectedSubjectInfo}
              stats={stats}
              totalStudents={totalStudents}
            />
          )}
          <BulkActions
            selectedStudentIds={selectedStudentIds}
            processedResultsLength={processedResults.length}
            onSelectAllChange={handleSelectAllStudents}
            onPublish={() =>
              handleToggle(Number(selectedSubject), selectedStudentIds, true)
            }
            onUnpublish={() =>
              handleToggle(Number(selectedSubject), selectedStudentIds, false)
            }
          />
          <ScoresTable
            processedResults={processedResults}
            selectedStudentIds={selectedStudentIds}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSelectStudent={handleSelectStudent}
            onToggle={(studentId) =>
              handleToggle(
                Number(selectedSubject),
                [studentId],
                !processedResults.find((r) => r.student_id === studentId)
                  ?.is_published
              )
            }
            getAverageBg={getAverageBg}
          />
          <PaginationControls
            page={page}
            totalPages={totalPages}
            filteredCount={filteredCount}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
      )}
      {selectedSubjectInfo && (
        <ScoresEditModal
          sequenceId={Number(sequenceId)}
          classId={Number(classId)}
          classSubjectId={Number(selectedSubject)}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={() => refetch()}
          studentResults={subjectScores?.results || []}
        />
      )}
    </div>
  );
};

export default SubjectTab;
