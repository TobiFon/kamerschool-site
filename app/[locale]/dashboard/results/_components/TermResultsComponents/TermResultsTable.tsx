import React from "react";
import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TermResult {
  id: number;
  student_id: number;
  student_name: string;
  average_score: number;
  total_points: number;
  rank_in_subject: number | null;
  is_published: boolean;
  subject_name?: string;
  class_subject_id?: number;
}

interface TermResultsTableProps {
  processedResults: TermResult[];
  selectedStudentIds: number[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onSelectStudent: (studentId: number, isSelected: boolean) => void;
  onToggle: (studentId: number) => void;
  getAverageBg: (score: number) => string;
  showSubjectName?: boolean;
}

const TermResultsTable: React.FC<TermResultsTableProps> = ({
  processedResults,
  selectedStudentIds,
  sortColumn,
  sortDirection,
  onSort,
  onSelectStudent,
  onToggle,
  getAverageBg,
  showSubjectName = false,
}) => {
  const t = useTranslations("Results");

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableCell className="w-10 text-center">
              <Checkbox
                checked={
                  processedResults.length > 0 &&
                  selectedStudentIds.length === processedResults.length
                }
                onCheckedChange={
                  (checked) =>
                    onSelectStudent(
                      0,
                      false
                    ) /* This is just to trigger the handler, the actual logic is in the parent */
                }
                onClick={(e) => {
                  // Prevent default to handle in parent
                  e.preventDefault();
                  const isAllSelected =
                    processedResults.length > 0 &&
                    selectedStudentIds.length === processedResults.length;
                  // Use parent handler
                  if (processedResults.length > 0) {
                    if (isAllSelected) {
                      // Unselect all
                      processedResults.forEach((result) =>
                        onSelectStudent(result.student_id, false)
                      );
                    } else {
                      // Select all
                      processedResults.forEach((result) =>
                        onSelectStudent(result.student_id, true)
                      );
                    }
                  }
                }}
              />
            </TableCell>
            <TableCell
              className="cursor-pointer font-medium"
              onClick={() => onSort("student_name")}
            >
              <div className="flex items-center">
                {t("student")}
                {renderSortIcon("student_name")}
              </div>
            </TableCell>
            {showSubjectName && (
              <TableCell className="font-medium">{t("subject")}</TableCell>
            )}
            <TableCell
              className="cursor-pointer font-medium text-center"
              onClick={() => onSort("average_score")}
            >
              <div className="flex items-center justify-center">
                {t("score")}
                {renderSortIcon("average_score")}
              </div>
            </TableCell>
            <TableCell
              className="cursor-pointer font-medium text-center"
              onClick={() => onSort("rank_in_subject")}
            >
              <div className="flex items-center justify-center">
                {t("rank")}
                {renderSortIcon("rank_in_subject")}
              </div>
            </TableCell>
            <TableCell className="font-medium text-center">
              {t("points")}
            </TableCell>
            <TableCell
              className="cursor-pointer font-medium text-center"
              onClick={() => onSort("is_published")}
            >
              <div className="flex items-center justify-center">
                {t("published")}
                {renderSortIcon("is_published")}
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedResults.map((result) => (
            <TableRow key={`${result.student_id}-${result.id}`}>
              <TableCell className="text-center">
                <Checkbox
                  checked={selectedStudentIds.includes(result.student_id)}
                  onCheckedChange={(checked) =>
                    onSelectStudent(result.student_id, !!checked)
                  }
                />
              </TableCell>
              <TableCell className="font-medium">
                {result.student_name}
              </TableCell>
              {showSubjectName && (
                <TableCell>{result.subject_name || "-"}</TableCell>
              )}
              <TableCell
                className={`text-center font-medium ${getAverageBg(
                  result.average_score
                )}`}
              >
                {result.average_score !== null
                  ? result.average_score.toFixed(2)
                  : "-"}
              </TableCell>
              <TableCell className="text-center">
                {result.rank_in_subject !== null ? result.rank_in_subject : "-"}
              </TableCell>
              <TableCell className="text-center">
                {result.total_points !== null
                  ? result.total_points.toFixed(2)
                  : "-"}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={result.is_published}
                  onCheckedChange={() => onToggle(result.student_id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TermResultsTable;
