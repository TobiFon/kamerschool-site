import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Award,
  Users,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";

export function TeacherPerformanceCard({ teacherEffectiveness }) {
  const t = useTranslations("TeacherPerformance");
  const [currentTeacherIndex, setCurrentTeacherIndex] = useState(0);

  // Sort teachers by avg_class_score
  const sortedTeachers = useMemo(() => {
    if (!teacherEffectiveness || !teacherEffectiveness.length) return [];
    return [...teacherEffectiveness].sort(
      (a, b) => b.avg_class_score - a.avg_class_score
    );
  }, [teacherEffectiveness]);

  // Navigation handlers
  const handleNextTeacher = () => {
    if (sortedTeachers.length <= 1) return;
    setCurrentTeacherIndex((prev) => (prev + 1) % sortedTeachers.length);
  };

  const handlePrevTeacher = () => {
    if (sortedTeachers.length <= 1) return;
    setCurrentTeacherIndex(
      (prev) => (prev - 1 + sortedTeachers.length) % sortedTeachers.length
    );
  };

  // Handle empty data case
  const hasData = teacherEffectiveness && teacherEffectiveness.length > 0;
  const currentTeacher = hasData ? sortedTeachers[currentTeacherIndex] : null;
  const isLoading = !teacherEffectiveness; // If prop hasn't been passed yet

  return (
    <Card className="bg-white shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex justify-between items-center">
          <span>{t("title")}</span>
          {hasData && (
            <div className="text-sm font-normal">
              {t("pagination", {
                current: currentTeacherIndex + 1,
                total: sortedTeachers.length,
              })}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">{t("loading")}</div>
        ) : !hasData ? (
          <div className="text-center text-gray-500 py-8">{t("noData")}</div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    currentTeacher.teacher_name
                  )}&background=random&size=64`}
                  alt={currentTeacher.teacher_name}
                />
                <AvatarFallback className="text-lg">
                  {currentTeacher.teacher_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="text-xl font-medium text-gray-900">
                  {currentTeacher.teacher_name}
                </h4>
                <div className="mt-1 text-sm flex items-center">
                  <Award className="h-4 w-4 text-amber-500 mr-1" />
                  <span className="text-amber-700 font-medium">
                    {t("classesTaught", {
                      count: currentTeacher.classes_taught,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h5 className="text-blue-800 font-medium">
                    {t("averageScore")}
                  </h5>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-blue-700">
                    {currentTeacher.avg_class_score.toFixed(1)}
                  </span>
                  <Progress
                    value={currentTeacher.avg_class_score * 10} // Assuming scores are out of 10
                    className="h-2 mt-2"
                  />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <h5 className="text-green-800 font-medium">
                    {t("consistency")}
                  </h5>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-green-700">
                    {currentTeacher.std_dev.toFixed(1)}
                  </span>
                  <Progress
                    value={(10 - currentTeacher.std_dev) * 10} // Lower std_dev is better, max 10
                    className="h-2 mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                {t("classes", { count: currentTeacher.classes_taught })}
              </h5>
              <div className="text-sm text-gray-600">
                <div className="bg-gray-100 px-2 py-1 rounded">
                  {t("classesTaught", { count: currentTeacher.classes_taught })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <Button
                onClick={handlePrevTeacher}
                variant="outline"
                size="sm"
                disabled={sortedTeachers.length <= 1}
                className="w-24"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("previous")}
              </Button>
              <Button
                onClick={handleNextTeacher}
                variant="outline"
                size="sm"
                disabled={sortedTeachers.length <= 1}
                className="w-24"
              >
                {t("next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
