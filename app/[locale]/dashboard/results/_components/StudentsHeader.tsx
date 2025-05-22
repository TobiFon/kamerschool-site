import React from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Filter,
  UploadCloud,
  Download,
  ChevronDown,
  Book,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const StudentsHeader = ({
  setSearchQuery,
  handleSort,
  handleExportSequenceOverallPDF,
  handleExportSequenceSubjectsPDF,
  handlePublishScores,
  handlePublishOverall,
  handlePublishSelected,
  selectedStudentIds,
  viewMode,
  setViewMode,
  filteredResults,
  totalStudents,
  page,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <CardTitle className="text-2xl">{t("studentResults")}</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          {t("showing")} {filteredResults?.length > 0 ? (page - 1) * 50 + 1 : 0}{" "}
          - {Math.min(page * 50, totalStudents)} {t("of")} {totalStudents}{" "}
          {t("students")}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("searchStudents")}
            className="pl-10 h-10 min-w-64"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <UploadCloud className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">{t("publish")}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1.5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-72 p-1.5 rounded-lg border border-gray-200 shadow-lg"
            >
              {/* Publish section with header */}
              <div className="px-3 py-1.5 mb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t("publishActions")}
                </h3>
              </div>

              <DropdownMenuItem
                onClick={() => handlePublishScores(true)}
                className="px-3 py-2.5 flex items-center text-sm rounded-md hover:bg-blue-50 cursor-pointer group transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 mr-2.5 text-emerald-500 group-hover:text-emerald-600" />
                <div>
                  <div className="font-medium">{t("publishAllScores")}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("allSubjectScoresVisible")}
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handlePublishOverall(true)}
                className="px-3 py-2.5 flex items-center text-sm rounded-md hover:bg-blue-50 cursor-pointer group transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 mr-2.5 text-emerald-500 group-hover:text-emerald-600" />
                <div>
                  <div className="font-medium">
                    {t("publishSequenceOverall")}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("overallResultsVisible")}
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handlePublishSelected(true)}
                disabled={selectedStudentIds.length === 0}
                className={`px-3 py-2.5 flex items-center text-sm rounded-md cursor-pointer group transition-colors ${
                  selectedStudentIds.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-50"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 mr-2.5 text-emerald-500 group-hover:text-emerald-600" />
                <div>
                  <div className="font-medium">
                    {t("publishSelectedSequenceOverall")}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {selectedStudentIds.length > 0
                      ? `${selectedStudentIds.length} ${t("studentsSelected")}`
                      : t("noStudentsSelected")}
                  </div>
                </div>
              </DropdownMenuItem>

              <div className="h-px bg-gray-200 my-1.5 mx-3"></div>

              {/* Unpublish section with header */}
              <div className="px-3 py-1.5 mb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t("unpublishActions")}
                </h3>
              </div>

              <DropdownMenuItem
                onClick={() => handlePublishScores(false)}
                className="px-3 py-2.5 flex items-center text-sm rounded-md hover:bg-blue-50 cursor-pointer group transition-colors"
              >
                <XCircle className="h-4 w-4 mr-2.5 text-gray-500 group-hover:text-gray-700" />
                <div>
                  <div className="font-medium">{t("unpublishAllScores")}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("allSubjectScoresHidden")}
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handlePublishOverall(false)}
                className="px-3 py-2.5 flex items-center text-sm rounded-md hover:bg-blue-50 cursor-pointer group transition-colors"
              >
                <XCircle className="h-4 w-4 mr-2.5 text-gray-500 group-hover:text-gray-700" />
                <div>
                  <div className="font-medium">
                    {t("unpublishSequenceOverall")}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("overallResultsHidden")}
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handlePublishSelected(false)}
                disabled={selectedStudentIds.length === 0}
                className={`px-3 py-2.5 flex items-center text-sm rounded-md cursor-pointer group transition-colors ${
                  selectedStudentIds.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-50"
                }`}
              >
                <XCircle className="h-4 w-4 mr-2.5 text-gray-500 group-hover:text-gray-700" />
                <div>
                  <div className="font-medium">
                    {t("unpublishSelectedSequenceOverall")}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {selectedStudentIds.length > 0
                      ? `${selectedStudentIds.length} ${t("studentsSelected")}`
                      : t("noStudentsSelected")}
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <Download className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">{t("export")}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1.5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-72 p-1.5 rounded-lg border border-gray-200 shadow-lg"
            >
              <div className="px-3 py-1.5 mb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t("exportOptions")}
                </h3>
              </div>

              <DropdownMenuItem
                onClick={handleExportSequenceOverallPDF}
                className="px-3 py-2.5 flex items-center text-sm rounded-md hover:bg-blue-50 cursor-pointer group transition-colors"
              >
                <Download className="h-4 w-4 mr-2.5 text-blue-500 group-hover:text-blue-600" />
                <div>
                  <div className="font-medium">{t("exportOverallResults")}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("exportOverallResultsDesc")}
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleExportSequenceSubjectsPDF}
                className="px-3 py-2.5 flex items-center text-sm rounded-md hover:bg-blue-50 cursor-pointer group transition-colors"
              >
                <Download className="h-4 w-4 mr-2.5 text-blue-500 group-hover:text-blue-600" />
                <div>
                  <div className="font-medium">{t("exportSubjectScores")}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("exportSubjectScoresDesc")}
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="hidden md:flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <ChevronDown className="h-4 w-4 mr-1" /> {t("list")}
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Book className="h-4 w-4 mr-1" /> {t("grid")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsHeader;
