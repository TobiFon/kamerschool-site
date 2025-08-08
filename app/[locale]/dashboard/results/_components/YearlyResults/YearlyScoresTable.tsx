"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface YearlyScoresTableProps {
  processedResults: any[];
  selectedStudentIds: number[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onSelectStudent: (studentId: number, isSelected: boolean) => void;
  onToggle: (studentId: number) => void;
}

const YearlyScoresTable: React.FC<YearlyScoresTableProps> = ({
  processedResults,
  selectedStudentIds,
  sortColumn,
  sortDirection,
  onSort,
  onSelectStudent,
  onToggle,
}) => {
  const t = useTranslations("Results");
  const { canEdit } = useCurrentUser();
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="p-4 w-10" />
              <th
                className="p-4 w-16"
                onClick={() => onSort("rank_in_subject")}
              >
                <div className="flex items-center cursor-pointer hover:bg-gray-100">
                  {t("rank")}
                  {sortColumn === "rank_in_subject" ? (
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
              <th className="p-4" onClick={() => onSort("student_name")}>
                <div className="flex items-center cursor-pointer hover:bg-gray-100">
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
              <th className="p-4" onClick={() => onSort("average_score")}>
                <div className="flex items-center cursor-pointer hover:bg-gray-100">
                  {t("averageScore")}
                  {sortColumn === "average_score" ? (
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
              <th className="p-4">{t("totalPoints")}</th>
              <th className="p-4">{t("grade")}</th>
              <th className="p-4">{t("published")}</th>
              <th className="p-4">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {processedResults.map((result) => {
              const avgScore = parseFloat(result.average_score);
              return (
                <tr
                  key={result.student_id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="p-4">
                    <Checkbox
                      checked={selectedStudentIds.includes(result.student_id)}
                      onCheckedChange={(checked) =>
                        onSelectStudent(result.student_id, !!checked)
                      }
                    />
                  </td>
                  <td className="p-4">
                    <Badge className="bg-blue-50 text-blue-700">
                      {result.rank_in_subject || "-"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{result.student_name}</div>
                    <div className="text-xs text-gray-500">
                      ID: {result.student_id}
                    </div>
                  </td>
                  <td className="p-4">
                    <div
                      className={`font-medium text-center rounded-full py-1 px-3 inline-block ${
                        avgScore >= 15
                          ? "bg-green-100"
                          : avgScore >= 10
                            ? "bg-blue-100"
                            : "bg-red-100"
                      }`}
                    >
                      {result.average_score}/20
                    </div>
                  </td>
                  <td className="p-4">{result.total_points}</td>
                  <td className="p-4">
                    <Badge
                      className={
                        avgScore >= 10
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {avgScore >= 10 ? t("pass") : t("fail")}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge
                      className={
                        result.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {result.is_published ? t("published") : t("unpublished")}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggle(result.student_id)}
                      disabled={!canEdit}
                    >
                      {result.is_published ? t("unpublish") : t("publish")}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearlyScoresTable;
