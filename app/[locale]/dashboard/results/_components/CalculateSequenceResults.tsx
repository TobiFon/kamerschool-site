import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

const SearchAndExportSequence = ({ handleCalculateResults, isCalculating }) => {
  const t = useTranslations("Results");

  return (
    <Button
      onClick={handleCalculateResults}
      disabled={isCalculating}
      className="flex items-center flex-1 md:flex-none md:ml-2"
      variant="default"
    >
      <Calculator className="h-4 w-4 mr-2" />
      {isCalculating
        ? t("calculating") || "Calculating..."
        : t("calculateResults") || "Calculate Results"}
    </Button>
  );
};

export default SearchAndExportSequence;
