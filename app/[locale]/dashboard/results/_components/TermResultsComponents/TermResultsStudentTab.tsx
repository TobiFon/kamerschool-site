"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  FileText,
  FileDown,
  Eye,
  Check,
  Ban,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

const TermResultsStudentsTab = ({
  filteredResults,
  totalStudents,
  page,
  totalPages,
  handleSort,
  sortColumn,
  sortDirection,
  toggleStudentExpand,
  expandedStudent,
  getAverageBg,
  setSearchQuery,
  setPage,
  handlePublishOverall,
  handlePublishSelected,
  selectedStudentIds,
  handleSelectStudent,
  handleSelectAllStudents,
  responseData,
  handleExportTermOverallPDF,
  termName,
  className,
  schoolData,
}) => {
  const t = useTranslations("Results");

  const getPerformanceText = (average) => {
    if (average >= 16) return t("excellent");
    if (average >= 14) return t("veryGood");
    if (average >= 12) return t("good");
    if (average >= 10) return t("average");
    return t("needsImprovement");
  };

  // Process the sorting request and pass it up to the parent component
  const onSortChange = (column) => {
    handleSort(column);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        {/* Header Section with Search and Actions */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t("searchStudents")}
              className="pl-8"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Export Button */}
            <Button
              variant="outline"
              className="flex items-center"
              onClick={handleExportTermOverallPDF}
            >
              <FileDown className="mr-2 h-4 w-4 text-blue-500" />
              {t("exportPDF")}
            </Button>

            {/* Publish Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Eye className="mr-2 h-4 w-4 text-green-500" />
                  {t("publishActions")}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePublishOverall(true)}>
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {t("publishAll")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePublishOverall(false)}>
                  <Ban className="mr-2 h-4 w-4 text-red-500" />
                  {t("unpublishAll")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePublishSelected(true)}
                  disabled={selectedStudentIds.length === 0}
                >
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {t("publishSelected")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePublishSelected(false)}
                  disabled={selectedStudentIds.length === 0}
                >
                  <Ban className="mr-2 h-4 w-4 text-red-500" />
                  {t("unpublishSelected")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Students List View Table */}
        {filteredResults.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
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
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => onSortChange("student_name")}
                  >
                    <div className="flex items-center">
                      {t("studentName")}
                      {sortColumn === "student_name" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right"
                    onClick={() => onSortChange("average")}
                  >
                    <div className="flex items-center justify-end">
                      {t("average")}
                      {sortColumn === "average" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => onSortChange("rank")}
                  >
                    <div className="flex items-center justify-center">
                      {t("rank")}
                      {sortColumn === "rank" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">{t("status")}</TableHead>
                  <TableHead className="text-center">
                    {t("published")}
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <React.Fragment key={result.student_id}>
                    <TableRow
                      className={
                        expandedStudent === result.student_id
                          ? "bg-gray-50"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedStudentIds.includes(
                            result.student_id
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectStudent(result.student_id, checked)
                          }
                          aria-label={`Select ${result.student_name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.student_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={getAverageBg(result.average)}>
                          {parseFloat(result.average).toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.rank || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            parseFloat(result.average) >= 10
                              ? "success"
                              : "destructive"
                          }
                        >
                          {parseFloat(result.average) >= 10
                            ? t("pass")
                            : t("fail")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            result.is_published ? "outline" : "secondary"
                          }
                        >
                          {result.is_published ? t("yes") : t("no")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStudentExpand(result.student_id)}
                        >
                          {expandedStudent === result.student_id ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details */}
                    {expandedStudent === result.student_id && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">
                                {t("studentDetails")}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("class")}
                                  </p>
                                  <p>{result.class_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("performance")}
                                  </p>
                                  <p>
                                    {getPerformanceText(
                                      parseFloat(result.average)
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {t("subjects")}
                                  </p>
                                  <p>{result.subject_scores?.length || 0}</p>
                                </div>
                              </div>
                            </div>

                            {result.subject_scores &&
                              result.subject_scores.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    {t("subjectScores")}
                                  </h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead>
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t("subject")}
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t("score")}
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t("rank")}
                                          </th>
                                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t("grade")}
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {result.subject_scores.map(
                                          (subject) => (
                                            <tr key={subject.subject_id}>
                                              <td className="px-4 py-2 whitespace-nowrap">
                                                {subject.subject_name}
                                              </td>
                                              <td className="px-4 py-2 text-right whitespace-nowrap">
                                                {parseFloat(
                                                  subject.score
                                                ).toFixed(1)}
                                              </td>
                                              <td className="px-4 py-2 text-right whitespace-nowrap">
                                                {subject.rank_in_subject}
                                              </td>
                                              <td className="px-4 py-2 text-center whitespace-nowrap">
                                                <Badge
                                                  className={getAverageBg(
                                                    subject.score
                                                  )}
                                                >
                                                  {subject.grade || "-"}
                                                </Badge>
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handlePublishSelected(!result.is_published, [
                                    result.student_id,
                                  ])
                                }
                              >
                                {result.is_published ? (
                                  <>
                                    <Ban className="mr-2 h-4 w-4 text-red-500" />
                                    {t("unpublish")}
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    {t("publish")}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-md p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">{t("noResultsFound")}</h3>
            <p className="text-gray-500 mt-2">
              {t("noResultsFoundDescription")}
            </p>
          </div>
        )}
      </CardContent>

      {/* Pagination Controls */}
      {filteredResults.length > 0 && (
        <CardFooter className="border-t">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
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
              <div className="text-sm text-gray-700">
                {t("page")} {page} {t("of")} {totalPages}
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
        </CardFooter>
      )}
    </Card>
  );
};

export default TermResultsStudentsTab;
