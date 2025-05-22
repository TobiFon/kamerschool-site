import React from "react";
import { useTranslations } from "next-intl";
import { Award, Percent, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TermSubjectDashboardProps {
  stats: {
    avgScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
  };
  totalStudents: number;
}

const TermSubjectDashboard: React.FC<TermSubjectDashboardProps> = ({
  stats,
  totalStudents,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="p-2 bg-blue-50 rounded-lg mr-4">
              <Award className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("classAverage")}</p>
              <h3 className="text-xl font-semibold">
                {stats.avgScore.toFixed(2)}/20
              </h3>
              <p className="text-xs text-gray-500">
                Highest: {stats.highestScore.toFixed(2)}, Lowest:{" "}
                {stats.lowestScore.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="p-2 bg-green-50 rounded-lg mr-4">
              <Percent className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("passRate")}</p>
              <h3 className="text-xl font-semibold">
                {stats.passRate.toFixed(1)}%
              </h3>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(100, stats.passRate)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="p-2 bg-purple-50 rounded-lg mr-4">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("studentsEnrolled")}</p>
              <h3 className="text-xl font-semibold">{totalStudents}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermSubjectDashboard;
