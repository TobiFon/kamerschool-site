"use client";
import React, { useMemo } from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { adaptApiData } from "@/lib/utils";
import SchoolOverviewHeader from "./SchoolOverview/SchoolOverviewHeader";
import SchoolMetricsAndCharts from "./SchoolOverview/SchoolMetricsAndCharts";
import SchoolInsights from "./SchoolOverview/SchoolInsights";

const SchoolOverview = ({ data: rawData, timeScope }) => {
  const t = useTranslations("SchoolOverview");
  const data = useMemo(
    () => adaptApiData(rawData, timeScope),
    [rawData, timeScope]
  );

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg shadow-sm">
        <p>{t("noDataAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 bg-gray-100 rounded-xl shadow-inner">
      <SchoolOverviewHeader data={data} />
      <SchoolMetricsAndCharts data={data} />
      <SchoolInsights data={data} />
    </div>
  );
};

export default SchoolOverview;
