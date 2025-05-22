"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import StudentsHeader from "./StudentsHeader";
import StudentsListView from "./StudentsListView";
import StudentsGridView from "./StudentsGridView";
import PaginationControls from "./PaginationControls";
import { useTranslations } from "next-intl";

const StudentsTab = ({
  filteredResults,
  totalStudents,
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
  handlePublishScores,
  handlePublishOverall,
  handlePublishSelected,
  handleToggleSubjectPublish,
  selectedStudentIds,
  handleSelectStudent,
  handleSelectAllStudents,
  responseData,
  handleExportSequenceSubjectsPDF,
  handleExportSequenceOverallPDF,
}) => {
  const [viewMode, setViewMode] = useState("list");
  const t = useTranslations("Results");

  const getPerformanceText = (average) => {
    if (average >= 16) return t("excellent");
    if (average >= 14) return t("veryGood");
    if (average >= 12) return t("good");
    if (average >= 10) return t("average");
    return t("needsImprovement");
  };

  // Process the sorting request and pass it up to the parent component
  const onSortChange = (column) => {
    handleSort(column);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <StudentsHeader
          handleExportSequenceSubjectsPDF={handleExportSequenceSubjectsPDF}
          handleExportSequenceOverallPDF={handleExportSequenceOverallPDF}
          setSearchQuery={setSearchQuery}
          handleSort={handleSort}
          handlePublishScores={handlePublishScores}
          handlePublishOverall={handlePublishOverall}
          handlePublishSelected={handlePublishSelected}
          selectedStudentIds={selectedStudentIds}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filteredResults={filteredResults}
          totalStudents={totalStudents}
          page={page}
        />
      </CardHeader>
      <CardContent>
        {viewMode === "list" ? (
          <StudentsListView
            filteredResults={filteredResults}
            expandedStudent={expandedStudent}
            toggleStudentExpand={toggleStudentExpand}
            getAverageBg={getAverageBg}
            getPerformanceText={getPerformanceText}
            selectedStudentIds={selectedStudentIds}
            handleSelectStudent={handleSelectStudent}
            handleSelectAllStudents={handleSelectAllStudents}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            handleSort={onSortChange}
          />
        ) : (
          <StudentsGridView
            filteredResults={filteredResults}
            expandedStudent={expandedStudent}
            getAverageBg={getAverageBg}
            getPerformanceText={getPerformanceText}
            selectedStudentIds={selectedStudentIds}
            handleSelectStudent={handleSelectStudent}
            handlePublishSelected={handlePublishSelected}
            toggleStudentExpand={toggleStudentExpand}
          />
        )}
      </CardContent>
      {filteredResults?.length > 0 && (
        <CardFooter className="border-t">
          <PaginationControls
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            totalStudents={totalStudents}
            filteredResults={filteredResults}
            selectedStudentIds={selectedStudentIds}
            handleSelectAllStudents={handleSelectAllStudents}
          />
        </CardFooter>
      )}
    </Card>
  );
};

export default StudentsTab;
