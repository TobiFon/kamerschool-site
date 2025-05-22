"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";

const InsightCard = ({
  title,
  items,
  type = "improvement",
  icon,
  maxInitialItems = 10,
}) => {
  const t = useTranslations("SchoolOverview");
  const [visibleItems, setVisibleItems] = useState(maxInitialItems);

  if (!items || items.length === 0) return null;

  const Icon = icon || (type === "improvement" ? TrendingDown : TrendingUp);
  const ItemIcon = type === "improvement" ? ChevronDown : ChevronUp;
  const borderColor =
    type === "improvement" ? "border-red-500/70" : "border-green-500/70";
  const textColor = type === "improvement" ? "text-red-700" : "text-green-700";
  const iconColor = type === "improvement" ? "text-red-500" : "text-green-500";

  const displayedItems = items.slice(0, visibleItems);
  const hasMoreItems = items.length > visibleItems;

  const renderItemContent = (item) => {
    if (typeof item === "string") return item; // Assuming item is a translation key

    const name = item.name || item.class_name || "";
    const avgText = item.average
      ? `(${t("avg")}: ${item.average.toFixed(1)})`
      : item.avg_score
      ? `(${t("avg")}: ${item.avg_score.toFixed(1)})`
      : "";
    const passRateText = item.pass_rate
      ? `, ${t("passRate")}: ${item.pass_rate.toFixed(1)}%`
      : "";

    return `${name} ${avgText}${passRateText}`;
  };

  return (
    <Card
      className={`
        shadow-lg 
        bg-white 
        rounded-xl 
        border-l-4 
        hover:shadow-xl 
        transition-all 
        duration-300 
        ease-in-out
        ${borderColor}
      `}
    >
      <CardHeader className="pb-2 px-6 pt-4">
        <CardTitle
          className={`
            text-lg 
            font-bold 
            flex 
            items-center 
            ${textColor}
          `}
        >
          <Icon className={`h-6 w-6 mr-3 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ul className="space-y-3">
          {displayedItems.map((item, index) => (
            <li
              key={index}
              className="
                flex 
                items-start 
                hover:bg-gray-50 
                p-2 
                -mx-2 
                rounded 
                transition 
                duration-200
              "
            >
              <ItemIcon
                className={`
                  h-5 
                  w-5 
                  mr-2 
                  ${iconColor} 
                  flex-shrink-0 
                  mt-0.5
                `}
              />
              <span className="text-gray-700 text-sm">
                {renderItemContent(item)}
              </span>
            </li>
          ))}
        </ul>
        {hasMoreItems && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setVisibleItems((prev) =>
                  prev + 10 > items.length ? items.length : prev + 10
                )
              }
              className="
                text-gray-600 
                hover:bg-gray-100 
                border-gray-300
              "
            >
              <MoreHorizontal className="mr-2 h-4 w-4" />
              {t("loadMore")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SchoolInsights = ({ data }) => {
  const t = useTranslations("SchoolOverview");
  if (!data) return null;

  const improvementCards = (
    <>
      <InsightCard
        title="areasForImprovement"
        items={data.areas_for_improvement}
        type="improvement"
        icon={AlertCircle}
      />
      <InsightCard
        title="concerningClasses"
        items={data.concerning_classes}
        type="improvement"
      />
      <InsightCard
        title="atRiskStudents"
        items={data.at_risk_students}
        type="improvement"
        icon={AlertCircle}
        maxInitialItems={10}
      />
    </>
  );

  const strengthCards = (
    <>
      <InsightCard
        title="keyStrengths"
        items={data.strengths}
        type="strength"
        icon={CheckCircle2}
      />
      <InsightCard
        title="topPerformingClasses"
        items={data.top_classes}
        type="strength"
      />
      <InsightCard
        title="outstandingClasses"
        items={data.outstanding_classes}
        type="strength"
      />
    </>
  );

  return (
    <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
      <h3
        className="
        text-2xl 
        font-extrabold 
        text-gray-800 
        mb-6 
        border-b 
        pb-3 
        border-gray-200
      "
      >
        {t("insightsAndRecommendations")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">{improvementCards}</div>
        <div className="space-y-8">{strengthCards}</div>
      </div>
    </div>
  );
};

export default SchoolInsights;
