import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Award, ArrowDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { fetchClassPerformance } from "@/queries/anaytics";
import { fetchClasses } from "@/queries/class";

interface ClassPerformanceCardProps {
  timeScope: string;
}

const safeToFixed = (value: any, digits = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "-";
  }
  try {
    return Number(value).toFixed(digits);
  } catch (error) {
    console.error("error in safeToFixed:", error);
    return "-";
  }
};

export function ClassPerformanceCard({ timeScope }: ClassPerformanceCardProps) {
  const t = useTranslations("ClassPerformance");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const periodId = undefined;

  const {
    data: classesListData,
    isLoading: isLoadingClasses,
    error: classesError,
  } = useQuery({
    queryKey: ["classList"],
    queryFn: fetchClasses,
  });

  useEffect(() => {
    if (classesListData && classesListData.length > 0 && !selectedClassId) {
      setSelectedClassId(String(classesListData[0].id));
    }
  }, [classesListData, selectedClassId]);

  const {
    data: classPerformanceData,
    isLoading: isLoadingPerformance,
    error: performanceError,
  } = useQuery({
    queryKey: ["classPerformance", selectedClassId, timeScope],
    queryFn: async () => {
      if (!selectedClassId) return null;
      return await fetchClassPerformance(selectedClassId, {
        timeScope: timeScope,
        periodId: periodId,
      });
    },
    enabled: !!selectedClassId,
  });

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
  };

  const getGradePercentage = (gradeCount: number, totalStudents: number) => {
    if (
      gradeCount === null ||
      gradeCount === undefined ||
      totalStudents === null ||
      totalStudents === undefined ||
      totalStudents === 0
    ) {
      return 0;
    }
    return (gradeCount / totalStudents) * 100;
  };

  const isLoading = isLoadingClasses || isLoadingPerformance;
  const hasClasses = classesListData && classesListData.length > 0;
  const hasPerformanceData =
    !isLoading && !performanceError && classPerformanceData;

  const renderNoDataMessage = () => {
    if (!hasClasses) return t("noClasses");

    switch (timeScope) {
      case "sequence":
        return t("noSequenceData");
      case "term":
        return t("noTermData");
      case "year":
        return t("noYearData");
      default:
        return t("noData");
    }
  };

  // New function to render period information dynamically
  const renderPeriodInfo = () => {
    if (!classPerformanceData || !classPerformanceData.period_info) {
      return null;
    }

    const { type, details } = classPerformanceData.period_info;

    switch (type) {
      case "sequence":
        return (
          <p className="text-sm text-gray-600">
            {details.year_name} • {t("term", { term: details.term_name })} •{" "}
            {t("sequence", { sequence: details.name })}
          </p>
        );
      case "term":
        return (
          <p className="text-sm text-gray-600">
            {details.year_name} • {t("term", { term: details.name })}
          </p>
        );
      case "year":
        return <p className="text-sm text-gray-600">{details.name}</p>;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-white shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
        <CardTitle className="flex justify-between items-center">
          <span>{t("title")}</span>
          <div className="flex gap-2">
            {hasClasses && (
              <Select
                value={selectedClassId || ""}
                onValueChange={handleClassChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("selectClass")} />
                </SelectTrigger>
                <SelectContent>
                  {classesListData.map((classItem: any) => (
                    <SelectItem key={classItem.id} value={String(classItem.id)}>
                      {classItem.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">{t("loading")}</div>
        ) : performanceError ? (
          <div className="text-center text-red-500 py-8">
            {t("error", { message: (performanceError as Error).message })}
          </div>
        ) : !hasPerformanceData ? (
          <div className="text-center text-gray-500 py-8">
            {renderNoDataMessage()}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium text-gray-900">
                {classPerformanceData.class_info.name}
              </h3>
              {renderPeriodInfo()}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-emerald-50 p-3 rounded-lg">
                <div className="flex flex-col items-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600 mb-1" />
                  <span className="text-2xl font-bold text-emerald-700">
                    {safeToFixed(
                      classPerformanceData.overall_performance.class_average
                    )}
                  </span>
                  <span className="text-xs text-emerald-600 mt-1">
                    {t("average")}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex flex-col items-center">
                  <Users className="h-5 w-5 text-blue-600 mb-1" />
                  <span className="text-2xl font-bold text-blue-700">
                    {safeToFixed(
                      classPerformanceData.overall_performance.pass_rate
                    )}
                    {classPerformanceData.overall_performance.pass_rate != null
                      ? "%"
                      : ""}
                  </span>
                  <span className="text-xs text-blue-600 mt-1">
                    {t("passRate")}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="flex flex-col items-center">
                  <Award className="h-5 w-5 text-amber-600 mb-1" />
                  <span className="text-2xl font-bold text-amber-700">
                    {safeToFixed(
                      classPerformanceData.overall_performance.highest_average
                    )}
                  </span>
                  <span className="text-xs text-amber-600 mt-1">
                    {t("highest")}
                  </span>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex flex-col items-center">
                  <ArrowDown className="h-5 w-5 text-red-600 mb-1" />
                  <span className="text-2xl font-bold text-red-700">
                    {safeToFixed(
                      classPerformanceData.overall_performance.lowest_average
                    )}
                  </span>
                  <span className="text-xs text-red-600 mt-1">
                    {t("lowest")}
                  </span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="subjects" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="subjects">{t("tabs.subjects")}</TabsTrigger>
                <TabsTrigger value="topStudents">
                  {t("tabs.topStudents")}
                </TabsTrigger>
                <TabsTrigger value="gradeDistribution">
                  {t("tabs.grades")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subjects" className="pt-4">
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {classPerformanceData.subject_performance
                    .slice(0, 5)
                    .map((subject, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span
                            className="text-sm font-medium truncate"
                            title={subject.subject_name}
                          >
                            {subject.subject_name}
                          </span>
                          <span className="text-sm font-medium">
                            {safeToFixed(subject.avg_score)}
                          </span>
                        </div>
                        <Progress
                          value={
                            subject.avg_score != null
                              ? (subject.avg_score / 20) * 100
                              : 0
                          }
                          className="h-1.5"
                        />
                        <div className="text-xs text-gray-500 text-right">
                          {t("passRateLabel")}: {safeToFixed(subject.pass_rate)}
                          {subject.pass_rate != null ? "%" : ""}
                        </div>
                      </div>
                    ))}
                  {classPerformanceData.subject_performance.length > 5 && (
                    <div className="text-center text-sm text-gray-500 mt-2">
                      {t("moreSubjects", {
                        count:
                          classPerformanceData.subject_performance.length - 5,
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="topStudents" className="pt-4">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {classPerformanceData.top_students
                    .slice(0, 5)
                    .map((student: any) => (
                      <div
                        key={student.student_id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center">
                          <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-medium mr-2">
                            {student.rank}
                          </div>
                          <span className="font-medium text-sm">
                            {student.name}{" "}
                          </span>
                        </div>
                        <span className="text-emerald-600 font-medium text-sm">
                          {safeToFixed(student.average)}
                        </span>
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="gradeDistribution" className="pt-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("grades.excellent")}</span>
                      <span>
                        {t("studentCount", {
                          count:
                            classPerformanceData.grade_distribution.excellent ||
                            0,
                        })}
                      </span>
                    </div>
                    <Progress
                      value={getGradePercentage(
                        classPerformanceData.grade_distribution.excellent,
                        classPerformanceData.overall_performance.total_students
                      )}
                      className="h-2 bg-gray-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("grades.good")}</span>
                      <span>
                        {t("studentCount", {
                          count:
                            classPerformanceData.grade_distribution.good || 0,
                        })}
                      </span>
                    </div>
                    <Progress
                      value={getGradePercentage(
                        classPerformanceData.grade_distribution.good,
                        classPerformanceData.overall_performance.total_students
                      )}
                      className="h-2 bg-gray-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("grades.average")}</span>
                      <span>
                        {t("studentCount", {
                          count:
                            classPerformanceData.grade_distribution.average ||
                            0,
                        })}
                      </span>
                    </div>
                    <Progress
                      value={getGradePercentage(
                        classPerformanceData.grade_distribution.average,
                        classPerformanceData.overall_performance.total_students
                      )}
                      className="h-2 bg-gray-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("grades.belowAverage")}</span>
                      <span>
                        {t("studentCount", {
                          count:
                            classPerformanceData.grade_distribution
                              .below_average || 0,
                        })}
                      </span>
                    </div>
                    <Progress
                      value={getGradePercentage(
                        classPerformanceData.grade_distribution.below_average,
                        classPerformanceData.overall_performance.total_students
                      )}
                      className="h-2 bg-gray-100"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
