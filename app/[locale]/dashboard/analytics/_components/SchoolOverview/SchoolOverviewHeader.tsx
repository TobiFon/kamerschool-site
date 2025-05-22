"use client";
import React from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { School, Users, AlertTriangle, TrendingDown } from "lucide-react";
import { formatCount } from "@/lib/utils";

const SchoolOverviewHeader = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {data.school_name} {t("overview")}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{data.period_name}</p>
        </div>
        <div className="flex flex-wrap space-x-3 mt-4 md:mt-0">
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            {formatCount(data.total_students)} {t("students")}
          </div>
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm flex items-center shadow-sm">
            <School className="h-4 w-4 mr-2" />
            {formatCount(data.total_classes)} {t("classes")}
          </div>
          <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm flex items-center shadow-sm">
            <TrendingDown className="h-4 w-4 mr-2" />
            {t("lowestAvg")}: {data.lowest_average.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Intervention Banner */}
      {data.intervention_needed && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t("interventionNeeded")}</p>
              <p className="text-sm mt-1">{t("interventionDescription")}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchoolOverviewHeader;
