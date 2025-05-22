import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const PaginationControls = ({
  page,
  totalPages,
  setPage,
  totalStudents,
  filteredResults,
  selectedStudentIds,
  handleSelectAllStudents,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="flex justify-between items-center py-4">
      <div className="text-sm text-gray-500">
        {selectedStudentIds.length > 0 && (
          <span className="mr-4">
            {selectedStudentIds.length} {t("studentsSelected")}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 px-2"
              onClick={() => handleSelectAllStudents(false)}
            >
              {t("clearSelection")}
            </Button>
          </span>
        )}
        {t("showing")} {filteredResults.length > 0 ? (page - 1) * 50 + 1 : 0} -{" "}
        {Math.min(page * 50, totalStudents)} {t("of")} {totalStudents}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage(Math.max(1, page - 1))}
        >
          {t("prev")}
        </Button>
        <span className="text-gray-500">
          {page}/{totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;
