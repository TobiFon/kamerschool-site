// pages/dashboard/students/[id]/_components/SubjectResultsTable.tsx
"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"; // For internal breakdowns if needed
import {
  ArrowUpDown,
  BookOpen,
  Hash,
  UserSquare,
  Target,
  Award,
  BarChartHorizontalBig,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  ListChecks,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SubjectResultDetail,
  SequenceDetail,
  TermDetail,
} from "@/types/students"; // Import types
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubjectResultsTableProps {
  subjects: SubjectResultDetail[];
  periodType: "sequence" | "term" | "year" | null; // Need period type to decide breakdown
}

type SortableColumn =
  | "subject_name"
  | "score"
  | "coefficient"
  | "rank"
  | "class_average_subject";
type SortDirection = "asc" | "desc";

const SubjectResultsTable: React.FC<SubjectResultsTableProps> = ({
  subjects,
  periodType,
}) => {
  const t = useTranslations("Results.Subjects");
  const tCommon = useTranslations("Common");
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(
    "subject_name"
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedSubjectId, setExpandedSubjectId] = useState<number | null>(
    null
  ); // Track expanded row

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const toggleExpand = (subjectId: number) => {
    setExpandedSubjectId((prev) => (prev === subjectId ? null : subjectId));
  };

  const sortedSubjects = React.useMemo(() => {
    if (!subjects) return []; // Handle null/undefined subjects array
    if (!sortColumn) return subjects;
    return [...subjects].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (
        sortColumn === "rank" ||
        sortColumn === "class_average_subject" ||
        sortColumn === "score" ||
        sortColumn === "coefficient"
      ) {
        valA =
          valA === null || valA === undefined || valA === "-"
            ? sortDirection === "asc"
              ? Infinity
              : -Infinity
            : Number(valA);
        valB =
          valB === null || valB === undefined || valB === "-"
            ? sortDirection === "asc"
              ? Infinity
              : -Infinity
            : Number(valB);
      } else if (sortColumn === "subject_name") {
        // Ensure case-insensitive sorting for names
        valA = String(valA ?? "").toLowerCase();
        valB = String(valB ?? "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [subjects, sortColumn, sortDirection]);

  const SortIndicator = ({ column }: { column: SortableColumn }) => {
    if (sortColumn !== column)
      return (
        <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50 group-hover:text-muted-foreground" />
      );
    return sortDirection === "asc" ? (
      <TrendingUp className="h-3.5 w-3.5 ml-1 text-primary" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5 ml-1 text-primary" />
    );
  };

  const getScoreColor = (score: number | string | null | undefined): string => {
    if (score === null || score === undefined || score === "-")
      return "text-muted-foreground";
    const numScore = Number(score);
    if (numScore >= 16) return "text-blue-600 dark:text-blue-400";
    if (numScore >= 14) return "text-cyan-600 dark:text-cyan-400";
    if (numScore >= 10) return "text-success";
    if (numScore >= 8) return "text-warning"; // Use warning color
    return "text-destructive";
  };

  return (
    <Card className="shadow-sm border bg-card overflow-hidden">
      <CardHeader className="py-3 px-4 border-b bg-muted/40">
        <CardTitle className="text-base font-semibold text-card-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!subjects || subjects.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {t("noSubjectData")}
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/60 border-b">
                {/* Add expand column only if there's a breakdown */}
                {(periodType === "term" || periodType === "year") && (
                  <TableHead className="w-10 px-2"></TableHead> // Empty header for expand button
                )}
                <TableHead
                  className="cursor-pointer group px-3 py-2.5"
                  onClick={() => handleSort("subject_name")}
                >
                  <div className="flex items-center">
                    {t("subject")} <SortIndicator column="subject_name" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer group px-3 py-2.5"
                  onClick={() => handleSort("coefficient")}
                >
                  <div className="flex items-center justify-center">
                    {t("coef")} <SortIndicator column="coefficient" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer group px-3 py-2.5"
                  onClick={() => handleSort("score")}
                >
                  <div className="flex items-center justify-end">
                    {t("score")}{" "}
                    <span className="text-xs text-muted-foreground ml-0.5">
                      /20
                    </span>{" "}
                    <SortIndicator column="score" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer group px-3 py-2.5"
                  onClick={() => handleSort("rank")}
                >
                  <div className="flex items-center justify-end">
                    {t("rank")} <SortIndicator column="rank" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer group px-3 py-2.5"
                  onClick={() => handleSort("class_average_subject")}
                >
                  <div className="flex items-center justify-end">
                    {t("classAvg")}{" "}
                    <SortIndicator column="class_average_subject" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubjects.map((subj) => (
                <React.Fragment key={subj.subject_id}>
                  <TableRow
                    className="text-sm hover:bg-muted/30 data-[state=open]:bg-muted/50"
                    data-state={
                      expandedSubjectId === subj.subject_id ? "open" : "closed"
                    }
                  >
                    {/* Expand Button Cell */}
                    {(periodType === "term" || periodType === "year") && (
                      <TableCell className="px-2 py-2 align-top">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full data-[state=open]:bg-accent"
                          data-state={
                            expandedSubjectId === subj.subject_id
                              ? "open"
                              : "closed"
                          }
                          onClick={() => toggleExpand(subj.subject_id)}
                          aria-label={
                            expandedSubjectId === subj.subject_id
                              ? tCommon("collapse")
                              : tCommon("expand")
                          }
                          disabled={periodType === "sequence"} // Disable if no breakdown
                        >
                          {expandedSubjectId === subj.subject_id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                    {/* Other Cells */}
                    <TableCell className="font-medium text-foreground px-3 py-2 align-top">
                      <div>{subj.subject_name}</div>
                      {subj.teacher_name && (
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <UserSquare className="h-3 w-3" />
                          {subj.teacher_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground font-mono px-3 py-2 align-top">
                      {subj.coefficient}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold px-3 py-2 align-top",
                        getScoreColor(subj.score)
                      )}
                    >
                      {subj.score !== null
                        ? subj.score.toFixed(2)
                        : tCommon("notAvailableShort")}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground px-3 py-2 align-top">
                      {subj.rank ?? tCommon("notAvailableShort")}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground px-3 py-2 align-top">
                      {subj.class_average_subject?.toFixed(2) ??
                        tCommon("notAvailableShort")}
                    </TableCell>
                  </TableRow>

                  {/* --- Expanded Row for Breakdowns --- */}
                  {expandedSubjectId === subj.subject_id &&
                    (periodType === "term" || periodType === "year") && (
                      <TableRow className="bg-accent/30 hover:bg-accent/40">
                        {/* Offset cell for expand button */}
                        <TableCell className="px-2 py-0"></TableCell>
                        {/* Colspan to cover remaining columns */}
                        <TableCell colSpan={5} className="p-0">
                          <div className="px-4 py-3 space-y-3">
                            {/* Conditional rendering based on periodType */}
                            {periodType === "term" &&
                              subj.sequence_details &&
                              subj.sequence_details.length > 0 && (
                                <>
                                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                    <ListChecks className="h-3.5 w-3.5" />
                                    {t("sequenceBreakdown")}
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs pl-2 border-l-2 border-primary/50">
                                    {subj.sequence_details.map((seq) => (
                                      <div
                                        key={seq.sequence_id}
                                        className="border-b pb-1 mb-1"
                                      >
                                        <span className="font-medium text-foreground">
                                          {seq.sequence_name}:{" "}
                                        </span>
                                        <span
                                          className={cn(
                                            "font-semibold",
                                            getScoreColor(seq.normalized_score)
                                          )}
                                        >
                                          {seq.normalized_score?.toFixed(2) ??
                                            (seq.is_absent
                                              ? t("absentShort")
                                              : tCommon("notAvailableShort"))}
                                        </span>
                                        <span className="text-muted-foreground text-[11px]">
                                          {" "}
                                          (W: {seq.weight}%, Base:{" "}
                                          {seq.base_score})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            {periodType === "year" &&
                              subj.term_details &&
                              subj.term_details.length > 0 && (
                                <>
                                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                    <Activity className="h-3.5 w-3.5" />
                                    {t("termBreakdown")}
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs pl-2 border-l-2 border-primary/50">
                                    {subj.term_details.map((termDet) => (
                                      <div
                                        key={termDet.term_id}
                                        className="border-b pb-1 mb-1"
                                      >
                                        <span className="font-medium text-foreground">
                                          {termDet.term_name}:{" "}
                                        </span>
                                        <span
                                          className={cn(
                                            "font-semibold",
                                            getScoreColor(
                                              termDet.term_average_score
                                            )
                                          )}
                                        >
                                          {termDet.term_average_score?.toFixed(
                                            2
                                          ) ?? tCommon("notAvailableShort")}
                                        </span>
                                        {termDet.term_rank && (
                                          <span className="text-muted-foreground text-[11px]">
                                            {" "}
                                            (Rank: {termDet.term_rank})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectResultsTable;
