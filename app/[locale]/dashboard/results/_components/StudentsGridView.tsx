import React from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, Book, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Sub-component: StudentCard
const StudentCard = ({
  result,
  isSelected,
  onSelect,
  getAverageBg,
  getPerformanceText,
  handlePublishSelected,
  toggleStudentExpand,
  isExpanded,
  t,
}) => (
  <Card
    className={`shadow-sm hover:shadow-md transition-shadow relative ${
      isExpanded ? "ring-2 ring-blue-200" : ""
    }`}
  >
    <div className="absolute top-2 right-2 z-10">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={isSelected}
        onChange={(e) => onSelect(e.target.checked)}
      />
    </div>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{result.student}</p>
          <p className="text-sm text-gray-500">id: {result.student_id}</p>
        </div>
        <Badge variant={result.rank <= 3 ? "secondary" : "outline"}>
          #{result.rank}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-xs text-gray-500 mb-1">{t("average")}</p>
          <p className="text-xl font-bold">
            {parseFloat(result.average).toFixed(2)}/20
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-xs text-gray-500 mb-1">{t("totalPoints")}</p>
          <p className="text-xl font-bold">
            {parseFloat(result.total_points).toFixed(0)}{" "}
            <span className="text-xs text-gray-500 ml-1">
              /{result.total_coefficient * 20}
            </span>
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-1">{t("performance")}</p>
        <div className="flex items-center justify-between">
          <Progress
            value={parseFloat(result.average) * 5}
            className="h-2 w-full mr-3"
          />
          <Badge className={getAverageBg(result.average)}>
            {getPerformanceText(parseFloat(result.average))}
          </Badge>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t flex justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{t("status")}</p>
          {result.is_published ? (
            <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700">
              <CheckCircle2 className="h-3 w-3 mr-1" /> {t("published")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-600">
              <XCircle className="h-3 w-3 mr-1" /> {t("unpublished")}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePublishSelected(!result.is_published, [result.student_id]);
            }}
          >
            {result.is_published ? t("unpublish") : t("publish")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleStudentExpand(isExpanded ? null : result.id)}
          >
            {isExpanded ? t("close") : t("details")}
          </Button>
        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-800 flex items-center">
              <Book className="h-4 w-4 mr-2 text-blue-600" />{" "}
              {t("subjectScores")}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStudentExpand(null)}
            >
              <ChevronDown className="h-4 w-4 mr-1" /> {t("closeDetails")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-md">
            {result.subject_scores
              ?.sort((a, b) => b.weighted_score - a.weighted_score)
              .map((score) => (
                <div
                  key={score.subject_id}
                  className="bg-white p-4 rounded-md border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{score.subject_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("coefficient")}: {score.coefficient}
                      </p>
                    </div>
                    <Badge className={getAverageBg(score.score)}>
                      {score.score.toFixed(2)}/20
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {t("performance")}
                    </p>
                    <Progress value={score.score * 5} className="h-2 mb-2" />
                  </div>

                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
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
                        <p className="text-xs text-gray-500">{t("rank")}</p>
                        <p className="font-medium">
                          {score.rank_in_subject}/{score.out_of}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t">
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
      )}
    </CardContent>
  </Card>
);

const StudentsGridView = ({
  filteredResults,
  getAverageBg,
  getPerformanceText,
  selectedStudentIds,
  handleSelectStudent,
  handlePublishSelected,
  toggleStudentExpand,
  expandedStudent,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredResults.map((result) => (
        <StudentCard
          key={result.id}
          result={result}
          isSelected={selectedStudentIds.includes(result.student_id)}
          isExpanded={expandedStudent === result.id}
          onSelect={(checked) =>
            handleSelectStudent(result.student_id, checked)
          }
          getAverageBg={getAverageBg}
          getPerformanceText={getPerformanceText}
          handlePublishSelected={handlePublishSelected}
          toggleStudentExpand={toggleStudentExpand}
          t={t}
        />
      ))}
    </div>
  );
};

export default StudentsGridView;
