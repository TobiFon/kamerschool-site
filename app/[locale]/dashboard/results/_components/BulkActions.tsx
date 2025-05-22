import React from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BulkActionsProps {
  selectedStudentIds: number[];
  processedResultsLength: number;
  onSelectAllChange: (checked: boolean) => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedStudentIds,
  processedResultsLength,
  onSelectAllChange,
  onPublish,
  onUnpublish,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
      <div className="flex items-center">
        <Checkbox
          checked={
            selectedStudentIds.length === processedResultsLength &&
            processedResultsLength > 0
          }
          onCheckedChange={onSelectAllChange}
          id="select-all"
          className="mr-2"
        />
        <label
          htmlFor="select-all"
          className="text-sm font-medium text-gray-700"
        >
          {t("selectAll")}
        </label>
        <Badge className="ml-2 bg-gray-200 text-gray-800">
          {selectedStudentIds.length} / {processedResultsLength}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={selectedStudentIds.length === 0}
          onClick={onPublish}
        >
          {t("publish")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={selectedStudentIds.length === 0}
          onClick={onUnpublish}
        >
          {t("unpublish")}
        </Button>
      </div>
    </div>
  );
};

export default BulkActions;
