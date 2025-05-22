import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";

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
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-2">
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
        <span className="text-sm text-gray-500">
          {selectedStudentIds.length > 0
            ? `${selectedStudentIds.length} ${t("selected")}`
            : t("selectAll")}
        </span>
      </div>

      <div className="flex items-center justify-between w-full md:w-auto md:justify-end">
        <div className="text-sm text-gray-500 mr-4">
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
          <div className="text-sm text-gray-700 px-2">
            {t("page")} {page} {t("of")} {totalPages || 1}
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
    </div>
  );
};

export default PaginationControls;
