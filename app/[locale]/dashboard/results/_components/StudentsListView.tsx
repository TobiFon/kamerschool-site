import React from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Book,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const SortHeader = ({
  label,
  column,
  currentSortColumn,
  currentSortDirection,
  onSort,
}) => {
  const isActive = currentSortColumn === column;

  return (
    <th
      className="px-4 py-3 text-left font-medium text-gray-600 text-sm cursor-pointer group"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <div className="flex items-center">
          {isActive ? (
            currentSortDirection === "asc" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : (
              <ArrowDown className="h-3 w-3 text-primary" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 transition-opacity" />
          )}
        </div>
      </div>
    </th>
  );
};

const StudentRow = ({
  result,
  isSelected,
  onSelect,
  onExpand,
  isExpanded,
  getAverageBg,
  getPerformanceText,
}) => {
  const t = useTranslations("Results");
  return (
    <>
      <tr
        className={`border-b hover:bg-gray-50 transition-colors ${
          isExpanded ? "bg-blue-50" : ""
        }`}
        onClick={onExpand}
      >
        <td
          className="px-4 py-4 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
          />
        </td>
        <td className="px-4 py-4 font-medium">
          {result.rank <= 3 ? (
            <Badge
              className={
                result.rank === 1
                  ? "bg-amber-100 text-amber-800"
                  : result.rank === 2
                  ? "bg-gray-100 text-gray-800"
                  : "bg-orange-100 text-orange-800"
              }
            >
              {result.rank}
            </Badge>
          ) : (
            result.rank
          )}
        </td>
        <td className="px-4 py-4">
          <div className="font-medium">{result.student}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            id: {result.student_id}
          </div>
        </td>
        <td className="px-4 py-4 text-right font-medium">
          {parseFloat(result.total_points).toFixed(2)}{" "}
          <span className="text-xs text-gray-500 ml-1">
            /{result.total_coefficient * 20}
          </span>
        </td>
        <td className="px-4 py-4 text-right">{result.total_coefficient}</td>
        <td className="px-4 py-4 text-right">
          <Progress
            value={parseFloat(result.average) * 5}
            className="h-1.5 mb-1"
          />
          <div className="text-sm font-medium">
            {parseFloat(result.average).toFixed(2)}/20
          </div>
        </td>
        <td className="px-4 py-4 text-right">
          <Badge className={getAverageBg(result.average)}>
            {getPerformanceText(parseFloat(result.average))}
          </Badge>
        </td>
        <td className="px-4 py-4 text-center">
          {result.is_published ? (
            <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700">
              <CheckCircle2 className="h-3 w-3 mr-1" /> {t("published")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600">
              <XCircle className="h-3 w-3 mr-1" /> {t("unpublished")}
            </Badge>
          )}
        </td>
        <td className="px-4 py-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full p-0 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} className="bg-gray-50 p-0">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-800 flex items-center">
                  <Book className="h-4 w-4 mr-2 text-blue-600" />{" "}
                  {t("subjectScores")}
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExpand()}
                  >
                    {t("closeDetails")}
                  </Button>
                </div>
              </div>
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
                  {result.subject_scores
                    .sort((a, b) => b.weighted_score - a.weighted_score)
                    .map((score) => (
                      <div key={score.subject_id} className="p-4 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{score.subject_name}</p>
                            <p className="text-xs text-gray-500 mt-1.5">
                              {t("coefficient")}: {score.coefficient}
                            </p>
                          </div>
                          <Badge className={getAverageBg(score.score)}>
                            {score.score.toFixed(2)}/20
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">
                            {t("performance")}
                          </p>
                          <Progress
                            value={score.score * 5}
                            className="h-2 mb-2"
                          />
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-500">
                              {t("weightedScore")}
                            </p>
                            <p className="font-medium">
                              {score.weighted_score.toFixed(2)}/
                              {score.coefficient * 20}
                            </p>
                          </div>
                          {score.rank_in_subject && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {t("rank")}
                              </p>
                              <p className="font-medium">
                                {score.rank_in_subject}/{score.out_of}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              {t("status")}
                            </p>
                            {score.is_published ? (
                              <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />{" "}
                                {t("published")}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-gray-600 text-xs"
                              >
                                <XCircle className="h-3 w-3 mr-1" />{" "}
                                {t("unpublished")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const StudentsListView = ({
  filteredResults,
  expandedStudent,
  toggleStudentExpand,
  getAverageBg,
  getPerformanceText,
  selectedStudentIds,
  handleSelectStudent,
  handleSelectAllStudents,
  sortColumn,
  sortDirection,
  handleSort,
}) => {
  const t = useTranslations("Results");
  const isAllSelected =
    filteredResults.length > 0 &&
    selectedStudentIds.length === filteredResults.length;

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-3 text-center w-10">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isAllSelected}
                onChange={(e) => handleSelectAllStudents(e.target.checked)}
              />
            </th>
            <SortHeader
              label={t("rank")}
              column="rank"
              currentSortColumn={sortColumn}
              currentSortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortHeader
              label={t("student")}
              column="student"
              currentSortColumn={sortColumn}
              currentSortDirection={sortDirection}
              onSort={handleSort}
            />
            <th className="px-4 py-3 text-right font-medium text-gray-600 text-sm">
              {t("totalPoints")}
            </th>
            <th className="px-4 py-3 text-right font-medium text-gray-600 text-sm">
              {t("coef")}
            </th>
            <SortHeader
              label={t("average")}
              column="average"
              currentSortColumn={sortColumn}
              currentSortDirection={sortDirection}
              onSort={handleSort}
              className="text-right w-32"
            />
            <th className="px-4 py-3 text-right font-medium text-gray-600 text-sm w-32">
              {t("performance")}
            </th>
            <SortHeader
              label={t("status")}
              column="is_published"
              currentSortColumn={sortColumn}
              currentSortDirection={sortDirection}
              onSort={handleSort}
              className="text-center w-28"
            />
            <th className="px-4 py-3 text-center font-medium text-gray-600 text-sm w-20">
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredResults.map((result) => (
            <StudentRow
              key={result.id}
              result={result}
              isSelected={selectedStudentIds.includes(result.student_id)}
              onSelect={(checked) =>
                handleSelectStudent(result.student_id, checked)
              }
              onExpand={() =>
                toggleStudentExpand(
                  expandedStudent === result.id ? null : result.id
                )
              }
              isExpanded={expandedStudent === result.id}
              getAverageBg={getAverageBg}
              getPerformanceText={getPerformanceText}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentsListView;
