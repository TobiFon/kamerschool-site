"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Users,
  Target,
  BarChartBig,
  Hash,
  Info,
  CheckCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { OverallPerformanceDetail, PeriodInfo } from "@/types/students";
import { cn } from "@/lib/utils";

interface PeriodSummaryCardProps {
  periodInfo: PeriodInfo | null;
  overallPerformance: OverallPerformanceDetail | null;
  periodType: "sequence" | "term" | "year" | null;
}

// Helper Component for Info Items within the card
interface SummaryInfoItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClass?: string;
}
const SummaryInfoItem: React.FC<SummaryInfoItemProps> = ({
  label,
  value,
  icon,
  valueClass,
}) => {
  const tCommon = useTranslations("Common");
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0">
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm flex-shrink-0 pr-2">
        {" "}
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "font-semibold text-right text-foreground text-sm",
          valueClass
        )}
      >
        {value !== null && value !== undefined && value !== "" ? (
          value
        ) : (
          <span className="text-muted-foreground italic text-xs font-normal">
            {tCommon("notAvailableShort")}
          </span>
        )}
      </span>
    </div>
  );
};

const PeriodSummaryCard: React.FC<PeriodSummaryCardProps> = ({
  periodInfo,
  overallPerformance,
  periodType,
}) => {
  const t = useTranslations("Results.Summary");
  const tStatus = useTranslations("Status"); // For pass/fail

  const getPerformanceIndicator = (avg: number | null | undefined) => {
    if (avg === null || avg === undefined)
      return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
    if (avg >= 10) return <CheckCircle className="h-4 w-4 text-success" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getRankDisplay = (
    rank: number | null | undefined,
    size: number | null | undefined
  ) => {
    if (rank && size) return `${rank} / ${size}`;
    if (rank) return `${rank}`;
    return null; // Render N/A via SummaryInfoItem
  };

  return (
    <Card className="shadow-sm border bg-card mb-6">
      <CardHeader className="py-3 px-4 border-b bg-muted/40">
        <CardTitle className="text-base font-semibold text-card-foreground flex items-center gap-2">
          <BarChartBig className="h-5 w-5 text-primary" />
          {t("overallTitle", { period: periodInfo?.name ?? t("loading") })}
        </CardTitle>
        {periodType !== "year" && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {periodInfo?.academic_year_name}
          </p>
        )}
        {periodType === "sequence" && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("termLabel")}: {periodInfo?.term_name}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-1">
        {!overallPerformance ? (
          <div className="text-center py-6 text-muted-foreground">
            {t("noOverallData")}
          </div>
        ) : (
          <>
            <SummaryInfoItem
              label={t("averageScore")}
              value={overallPerformance.average?.toFixed(2)}
              icon={getPerformanceIndicator(overallPerformance.average)}
              valueClass={
                overallPerformance.average !== null
                  ? overallPerformance.average >= 10
                    ? "text-success"
                    : "text-destructive"
                  : ""
              }
            />
            <SummaryInfoItem
              label={t("classRank")}
              value={getRankDisplay(
                overallPerformance.rank,
                overallPerformance.class_size
              )}
              icon={<Award className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryInfoItem
              label={t("classAverage")}
              value={overallPerformance.class_average_overall?.toFixed(2)}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryInfoItem
              label={t("totalPoints")}
              value={overallPerformance.total_points?.toFixed(2)}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryInfoItem
              label={t("totalCoefficient")}
              value={overallPerformance.total_coefficient}
              icon={<Hash className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryInfoItem
              label={t("status")}
              value={
                <Badge
                  variant={
                    overallPerformance.average !== null
                      ? overallPerformance.average >= 10
                        ? "success"
                        : "destructive"
                      : "secondary"
                  }
                >
                  {overallPerformance.average !== null
                    ? overallPerformance.average >= 10
                      ? tStatus("passed")
                      : tStatus("failed")
                    : tStatus("unknown")}
                </Badge>
              }
              icon={<Info className="h-4 w-4 text-muted-foreground" />}
            />
            {overallPerformance.remarks && (
              <SummaryInfoItem
                label={t("remarks")}
                value={
                  <span className="text-xs italic text-muted-foreground">
                    {overallPerformance.remarks}
                  </span>
                }
                icon={<Info className="h-4 w-4 text-muted-foreground" />}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PeriodSummaryCard;
