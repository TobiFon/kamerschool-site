import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Award,
  Users,
  TrendingUp,
  Clock,
  Briefcase,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { fetchTeacherPerformance } from "@/queries/teachers";

const TeacherOverviewTab = ({ teacherData }) => {
  const t = useTranslations("Teachers");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Fetch performance snippet for overview
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ["teacherPerformance", teacherData.id],
    queryFn: () => fetchTeacherPerformance(teacherData.id),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Contact and Teaching Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 border-b px-6 py-4">
            <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
              <Mail className="h-5 w-5 mr-2 text-primary" />
              {t("contactInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-5">
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("email")}</p>
                  <p className="text-gray-800 font-medium">
                    {teacherData.email || t("notProvided")}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {t("phoneNumber")}
                  </p>
                  <p className="text-gray-800 font-medium">
                    {teacherData.phone_number || t("notProvided")}
                  </p>
                </div>
              </div>
              {teacherData.address && (
                <div className="flex items-start">
                  <Briefcase className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t("address")}</p>
                    <p className="text-gray-800 font-medium">
                      {teacherData.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teaching Information */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 border-b px-6 py-4">
            <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              {t("teachingInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-5">
            <div className="space-y-4">
              <div className="flex items-start">
                <BookOpen className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {t("subjectsTaught")}
                  </p>
                  <p className="text-gray-800 font-medium">
                    {teacherData.class_subjects &&
                    teacherData.class_subjects.length > 0
                      ? `${teacherData.class_subjects.length} ${t("subjects")}`
                      : t("noSubjectsAssigned")}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t("joinedOn")}</p>
                  <p className="text-gray-800 font-medium">
                    {formatDate(teacherData.created_at)}
                  </p>
                </div>
              </div>

              {teacherData.department && (
                <div className="flex items-start">
                  <Briefcase className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {t("department")}
                    </p>
                    <p className="text-gray-800 font-medium">
                      {teacherData.department}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      {performanceLoading ? (
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50 border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              {t("performanceSummary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : performanceData ? (
        <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary" />
              {t("performanceSummary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Score */}
              <div className="bg-white rounded-lg border p-4 flex items-start">
                <div className="rounded-full bg-blue-100 p-3 mr-3">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("averageScore")}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {performanceData.overall_metrics.average_score.toFixed(1)}
                  </p>
                  {/* Could add comparison with last period */}
                  <p className="text-xs text-gray-500 mt-1">
                    {performanceData.overall_metrics.average_score > 80
                      ? t("excellentPerformance")
                      : performanceData.overall_metrics.average_score > 70
                      ? t("goodPerformance")
                      : t("averagePerformance")}
                  </p>
                </div>
              </div>

              {/* Pass Rate */}
              <div className="bg-white rounded-lg border p-4 flex items-start">
                <div className="rounded-full bg-green-100 p-3 mr-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("passRate")}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {performanceData.overall_metrics.pass_rate.toFixed(1)}%
                  </p>
                  {/* Could add comparison with school average */}
                  <p className="text-xs text-gray-500 mt-1">
                    {performanceData.overall_metrics.pass_rate > 90
                      ? t("highPassRate")
                      : performanceData.overall_metrics.pass_rate > 75
                      ? t("goodPassRate")
                      : t("improvablePassRate")}
                  </p>
                </div>
              </div>

              {/* Total Students */}
              <div className="bg-white rounded-lg border p-4 flex items-start">
                <div className="rounded-full bg-purple-100 p-3 mr-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("totalStudents")}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {performanceData.overall_metrics.total_students}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("acrossAllClasses")}
                  </p>
                </div>
              </div>
            </div>

            {/* Grade Distribution */}
            {performanceData.overall_metrics.grade_distribution && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-base font-medium text-gray-800 mb-4">
                  {t("gradeDistribution")}
                </h4>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div className="flex rounded-full h-2.5">
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${
                          (performanceData.overall_metrics.grade_distribution
                            .excellent /
                            performanceData.overall_metrics.total_students) *
                          100
                        }%`,
                      }}
                    ></div>
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${
                          (performanceData.overall_metrics.grade_distribution
                            .good /
                            performanceData.overall_metrics.total_students) *
                          100
                        }%`,
                      }}
                    ></div>
                    <div
                      className="bg-yellow-500"
                      style={{
                        width: `${
                          (performanceData.overall_metrics.grade_distribution
                            .average /
                            performanceData.overall_metrics.total_students) *
                          100
                        }%`,
                      }}
                    ></div>
                    <div
                      className="bg-red-500"
                      style={{
                        width: `${
                          (performanceData.overall_metrics.grade_distribution
                            .below_average /
                            performanceData.overall_metrics.total_students) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">{t("excellent")}: </span>
                    <span className="ml-1 font-medium">
                      {
                        performanceData.overall_metrics.grade_distribution
                          .excellent
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">{t("good")}: </span>
                    <span className="ml-1 font-medium">
                      {performanceData.overall_metrics.grade_distribution.good}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">{t("average")}: </span>
                    <span className="ml-1 font-medium">
                      {
                        performanceData.overall_metrics.grade_distribution
                          .average
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-gray-600">{t("belowAverage")}: </span>
                    <span className="ml-1 font-medium">
                      {
                        performanceData.overall_metrics.grade_distribution
                          .below_average
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default TeacherOverviewTab;
