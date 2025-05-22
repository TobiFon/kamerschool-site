import React from "react";
import { useTranslations } from "next-intl";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale);

interface TermResultsDashboardProps {
  termResults: any;
  selectedSubjectInfo: {
    subject_name: string;
    coefficient?: number;
  };
  stats: {
    avgScore: number;
    passRate: number;
    highestScore: number;
    lowestScore: number;
    publishedCount: number;
  };
  totalStudents: number;
}

const TermResultsDashboard: React.FC<TermResultsDashboardProps> = ({
  termResults,
  selectedSubjectInfo,
  stats,
  totalStudents,
}) => {
  const t = useTranslations("Results");

  // Chart data for pass/fail rate
  const chartData = {
    labels: [t("passed"), t("failed")],
    datasets: [
      {
        data: [stats.passRate, 100 - stats.passRate],
        backgroundColor: ["#10b981", "#ef4444"],
        borderColor: ["#10b981", "#ef4444"],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
      },
    },
    cutout: "65%",
  };

  // Calculate publish rate
  const publishRate = (stats.publishedCount / totalStudents) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="col-span-1 md:col-span-2 bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-2">
            {termResults?.class_name || ""} -{" "}
            {selectedSubjectInfo?.subject_name}
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 mt-3">
            <div className="flex-1">
              <div className="text-sm text-gray-600">{t("term")}</div>
              <div className="text-lg font-medium">
                {termResults?.term_name || "-"}
              </div>
            </div>
            {selectedSubjectInfo?.coefficient && (
              <div className="flex-1">
                <div className="text-sm text-gray-600">{t("coefficient")}</div>
                <div className="text-lg font-medium">
                  {selectedSubjectInfo.coefficient}
                </div>
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm text-gray-600">{t("students")}</div>
              <div className="text-lg font-medium">{totalStudents}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-2">{t("publishStatus")}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("published")}</span>
              <span className="font-medium">
                {stats.publishedCount} / {totalStudents}
              </span>
            </div>
            <Progress value={publishRate} className="h-2" />
            <div className="text-sm text-gray-600">
              {stats.publishedCount === totalStudents
                ? t("allResultsPublished")
                : t("someResultsNotPublished")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-2">{t("scoreAnalysis")}</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t("average")}</span>
              <span className="font-medium">
                {stats.avgScore.toFixed(2)}/20
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t("highestScore")}</span>
              <span className="font-medium">
                {stats.highestScore.toFixed(2)}/20
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t("lowestScore")}</span>
              <span className="font-medium">
                {stats.lowestScore.toFixed(2)}/20
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t("passRate")}</span>
              <span className="font-medium">{stats.passRate.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-2 bg-white shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-lg font-medium mb-2">{t("passFailRate")}</h3>
          <div className="h-48 flex items-center justify-center">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermResultsDashboard;
