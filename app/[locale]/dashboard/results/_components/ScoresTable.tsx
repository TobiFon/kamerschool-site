import React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ScoresTableProps {
  processedResults: any[]; // assuming processedResults is an array of objects with student_id, student_name, score, rank, is_published, is_absent, etc.
  selectedStudentIds: number[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onSelectStudent: (studentId: number, isSelected: boolean) => void;
  onToggle: (studentId: number) => void;
  getAverageBg: (score: number) => string;
}

const ScoresTable: React.FC<ScoresTableProps> = ({
  processedResults,
  selectedStudentIds,
  sortColumn,
  sortDirection,
  onSort,
  onSelectStudent,
  onToggle,
  getAverageBg,
}) => {
  const t = useTranslations("Results");
  const { canEdit } = useCurrentUser();

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="p-4 w-10">{/* Checkbox */}</th>
              <th className="p-4 w-16">{t("rank")}</th>
              <th
                className="p-4 cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("student_name")}
              >
                <div className="flex items-center">
                  {t("student")}
                  {sortColumn === "student_name" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  )}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("score")}
              >
                <div className="flex items-center">
                  {t("score")}
                  {sortColumn === "score" ? (
                    sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
                  )}
                </div>
              </th>
              <th className="p-4">{t("grade")}</th>
              <th className="p-4">{t("published")}</th>
              <th className="p-4">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {processedResults?.map((result) => (
              <tr
                key={result?.student_id}
                className="bg-white border-b hover:bg-gray-50"
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedStudentIds.includes(result?.student_id)}
                    onCheckedChange={(checked) =>
                      onSelectStudent(result?.student_id, !!checked)
                    }
                  />
                </td>
                <td className="p-4 font-medium text-gray-900">
                  {result?.rank !== null ? (
                    <Badge className="bg-blue-50 text-blue-700">
                      {result?.rank}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">
                    {result?.student_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {result?.student_id}
                  </div>
                </td>
                <td className="p-4">
                  {result?.score !== null ? (
                    <div
                      className={`font-medium text-center rounded-full py-1 px-3 inline-block ${getAverageBg(
                        result.score
                      )}`}
                    >
                      {result.score.toFixed(2)}/20
                    </div>
                  ) : (
                    <div className="font-medium text-center rounded-full py-1 px-3 inline-block bg-gray-100">
                      n/a
                    </div>
                  )}
                </td>
                <td className="p-4">
                  {result?.score !== null ? (
                    <Badge
                      className={
                        result.score >= 10
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {result.score >= 10 ? t("pass") : t("fail")}
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">n/a</Badge>
                  )}
                </td>
                <td className="p-4">
                  <Badge
                    className={
                      result?.is_published
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {result?.is_published ? t("published") : t("unpublished")}
                  </Badge>
                  {result?.is_absent && (
                    <Badge className="ml-1 bg-gray-100 text-gray-800">
                      {t("absent")}
                    </Badge>
                  )}
                </td>
                <td className="p-4">
                  <Button
                    variant="outline"
                    disabled={!canEdit}
                    size="sm"
                    onClick={() => onToggle(result?.student_id)}
                  >
                    {result?.is_published ? t("unpublish") : t("publish")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoresTable;
