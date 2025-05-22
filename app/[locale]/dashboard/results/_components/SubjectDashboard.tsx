import React from "react";
import { useTranslations } from "next-intl";
import { FileText, Award, Percent, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SubjectDashboardProps {
  subjectScores: any; // Assuming subjectScores has class_name, coefficient, base_score, weight, results
  selectedSubjectInfo: any; // Assuming selectedSubjectInfo has subject_name, subject_code
  stats: {
    avgScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
    absentCount: number;
  };
  totalStudents: number;
}

const SubjectDashboard: React.FC<SubjectDashboardProps> = ({
  subjectScores,
  selectedSubjectInfo,
  stats,
  totalStudents,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="p-2 bg-primary/10 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("subjectInfo")}</p>
              <h3 className="text-xl font-semibold">
                {selectedSubjectInfo.subject_name}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedSubjectInfo.subject_code}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{t("coefficient")}</p>
              <p className="font-medium">{subjectScores.coefficient}x</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("baseScore")}</p>
              <p className="font-medium">{subjectScores.base_score}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("weight")}</p>
              <p className="font-medium">{subjectScores.weight}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="p-2 bg-blue-50 rounded-lg mr-4">
              <Award className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("performance")}</p>
              <h3 className="text-xl font-semibold">
                {stats.avgScore.toFixed(2)}/20
              </h3>
              <p className="text-xs text-gray-500">{t("classAverage")}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{t("highest")}</p>
              <p className="font-medium">{stats.highestScore.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("lowest")}</p>
              <p className="font-medium">{stats.lowestScore.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="p-2 bg-green-50 rounded-lg mr-4">
              <Percent className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("passRate")}</p>
              <h3 className="text-xl font-semibold">
                {stats?.passRate.toFixed(1)}%
              </h3>
              <p className="text-xs text-gray-500">
                {t("studentsPassingSubject")}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, stats.passRate)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="p-2 bg-purple-50 rounded-lg mr-4">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("studentsEnrolled")}</p>
              <h3 className="text-xl font-semibold">{totalStudents}</h3>
              <p className="text-xs text-gray-500">
                {stats.absentCount > 0
                  ? `${stats.absentCount} ${t("absent")}`
                  : t("allPresent")}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">{t("classDetails")}</p>
            <p className="text-sm truncate" title={subjectScores.class_name}>
              {subjectScores.class_name}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectDashboard;
