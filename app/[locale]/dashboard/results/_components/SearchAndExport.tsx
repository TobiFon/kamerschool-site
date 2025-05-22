import React from "react";
import { useTranslations } from "next-intl";
import { Search, Download, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchAndExportProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  onEditScores: () => void;
  hasScores: boolean;
}

const SearchAndExport: React.FC<SearchAndExportProps> = ({
  searchQuery,
  onSearchChange,
  onExport,
  onEditScores,
  hasScores,
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
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex items-center"
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-2" />
          {t("exportSubjectScores")}
        </Button>
        <Button
          variant="default"
          className="flex items-center"
          onClick={onEditScores}
        >
          {hasScores ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              {t("editScores")}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {t("recordScores")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SearchAndExport;
