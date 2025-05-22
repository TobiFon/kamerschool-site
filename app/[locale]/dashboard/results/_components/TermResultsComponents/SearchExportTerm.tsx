import React from "react";
import { useTranslations } from "next-intl";
import { Search, Download, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SearchAndExportTerm: React.FC = ({
  searchQuery,
  onSearchChange,
  onExport,
  handleCalculateSubjectResults,
  isCalculating,
  selectedSubject,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4 md:ml-auto w-full md:w-auto">
      <div className="relative w-full md:w-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t("searchStudents")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full md:w-60"
        />
      </div>
      <Button
        variant="outline"
        className="flex items-center"
        onClick={onExport}
      >
        <Download className="h-4 w-4 mr-2" />
        {t("exportSubjectScores")}
      </Button>
      <Button
        onClick={handleCalculateSubjectResults}
        disabled={isCalculating || !selectedSubject}
        className="flex items-center md:ml-2"
        variant="default"
      >
        <Calculator className="h-4 w-4 mr-2" />
        {isCalculating
          ? t("calculating") || "Calculating..."
          : t("calculateSubjectResults") || "Calculate Subject Results"}
      </Button>
    </div>
  );
};

export default SearchAndExportTerm;
