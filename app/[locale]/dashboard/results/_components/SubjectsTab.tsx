"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Download, CheckCircle2, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

const SubjectsTab = ({ classStatistics, getAverageColor }) => {
  const t = useTranslations("Results");
  return (
    <Card className="shadow-sm">
      <div className="border-b p-4 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold">{t("subjectAnalysis")}</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t("exportReport")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {classStatistics.subject_statistics.map((subject) => (
          <Card
            key={subject.subject_id}
            className="border shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div className="font-medium">{subject.subject_name}</div>
              <Badge variant="outline" className="text-gray-600">
                {t("coefficient")}: {subject.coefficient}
              </Badge>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">{t("averageScore")}</div>
                <div
                  className={`text-xl font-bold ${getAverageColor(
                    subject.average
                  )}`}
                >
                  {subject.average.toFixed(2)}/20
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">{t("passRate")}</div>
                <div className="text-xl font-bold flex items-center">
                  <span>{subject.pass_percentage.toFixed(1)}%</span>
                  <Percent className="h-4 w-4 ml-1 text-gray-400" />
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">{t("highestScore")}</div>
                <div className="text-xl font-bold text-blue-600">
                  {subject.highest_score
                    ? subject.highest_score.toFixed(2)
                    : "-"}
                  /20
                </div>
              </div>
            </div>

            <div className="p-4 border-t">
              <h4 className="font-medium mb-3">{t("scoreDistribution")}</h4>
              <div className="flex h-6 rounded-lg overflow-hidden">
                {subject.distribution && (
                  <>
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${subject.distribution["0-5"] || 0}%` }}
                    ></div>
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${subject.distribution["5-10"] || 0}%` }}
                    ></div>
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${subject.distribution["10-15"] || 0}%`,
                      }}
                    ></div>
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                        width: `${subject.distribution["15-20"] || 0}%`,
                      }}
                    ></div>
                  </>
                )}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <div>0-5</div>
                <div>5-10</div>
                <div>10-15</div>
                <div>15-20</div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{t("publishStatus")}</p>
                {subject.is_published ? (
                  <Badge className="bg-emerald-50 border-emerald-200 text-emerald-700 mt-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {t("published")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 mt-1">
                    {t("unpublished")}
                  </Badge>
                )}
              </div>
              <Button size="sm">{t("viewDetails")}</Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default SubjectsTab;
