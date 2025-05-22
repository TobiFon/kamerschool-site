import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  filteredCount: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  totalPages,
  filteredCount,
  pageSize,
  onPageChange,
}) => {
  const t = useTranslations("Results");

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center py-2">
      <div className="text-sm text-gray-500">
        {t("showing")} {Math.min((page - 1) * pageSize + 1, filteredCount)}-
        {Math.min(page * pageSize, filteredCount)} {t("of")} {filteredCount}{" "}
        {t("results")}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;
