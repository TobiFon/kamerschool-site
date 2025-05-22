import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Info, BookText, Clock, ChevronRight } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import AttendanceSummary from "./AttendanceTab";

const formatLevel = (level: string): string =>
  level.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const getInitials = (firstName: string, lastName: string): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

// Function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;

  const birthDate = new Date(dateOfBirth);
  // Check if date is valid
  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  // Adjust age if birthday hasn't occurred yet this year
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

interface OverviewTabProps {
  classData: any;
  onViewAllStudents: () => void;
}

const StatusBadge = ({ status, t }: { status: string; t: any }) => {
  const variants: Record<string, string> = {
    active: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
    graduated: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
    inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
  };

  return (
    <Badge className={`font-medium ${variants[status]}`}>{t(status)}</Badge>
  );
};

const OverviewTab: React.FC<OverviewTabProps> = ({
  classData,
  onViewAllStudents,
}) => {
  const t = useTranslations("Classes");
  const router = useRouter();

  const sortedStudents = useMemo(() => {
    if (!classData?.students) return [];
    return [...classData.students].sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [classData.students]);

  const stats = useMemo(() => {
    if (!classData && !classData.students && classData.students.length === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        totalSubjects: 0,
        mandatorySubjects: 0,
        optionalSubjects: 0,
        averageStudentAge: 0,
      };
    }

    const activeStudents = classData.students.filter(
      (s) => s.status === "active"
    ).length;

    // Calculate ages correctly from date_of_birth
    const studentsWithValidDOB = classData.students.filter(
      (student) =>
        student.date_of_birth &&
        !isNaN(new Date(student.date_of_birth).getTime())
    );

    let averageAge = 0;
    if (studentsWithValidDOB.length > 0) {
      const totalAge = studentsWithValidDOB.reduce(
        (sum, student) => sum + calculateAge(student.date_of_birth),
        0
      );
      averageAge = Math.round(totalAge / studentsWithValidDOB.length);
    }

    return {
      totalStudents: classData.students.length,
      activeStudents,
      totalSubjects: classData.class_subjects?.length || 0,
      mandatorySubjects:
        classData.class_subjects?.filter((s) => s.mandatory)?.length || 0,
      optionalSubjects:
        classData.class_subjects?.filter((s) => !s.mandatory)?.length || 0,
      averageStudentAge: averageAge,
    };
  }, [classData]);

  const handleViewStudent = (studentId: string) =>
    router.push(`/dashboard/students/${studentId}`);

  return (
    <div className="space-y-6 mt-0">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("totalStudents")}
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.totalStudents}
                  </h3>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-gray-500">
                      {stats.activeStudents} {t("active")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <BookText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("totalSubjects")}
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.totalSubjects}
                  </h3>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    <span className="text-xs text-gray-500">
                      {stats.mandatorySubjects} {t("mandatory")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {t("avgAge")}
                </p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.averageStudentAge}
                  </h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary Section */}
      <AttendanceSummary classId={classData.id} />

      {/* Class Info and Recent Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 border-b px-6 py-4">
            <CardTitle className="flex items-center text-lg">
              <Info className="h-5 w-5 mr-2 text-primary" />
              {t("classInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {t("educationSystem")}
                </h3>
                <p className="text-gray-800 font-medium">
                  {t(classData.education_system?.name?.toLowerCase() || "")}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {t("level")}
                </h3>
                <p className="text-gray-800 font-medium">
                  {formatLevel(classData.level)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {t("section")}
                </h3>
                <p className="text-gray-800 font-medium">{classData.section}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  {t("subjects")}
                </h3>
                <p className="text-gray-800 font-medium">
                  {stats.mandatorySubjects} {t("mandatory")},{" "}
                  {stats.optionalSubjects} {t("optional")}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {t("description")}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {classData.description || t("noDescription")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 border-b px-6 py-4">
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2 text-primary" />
              {t("recentStudents")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {sortedStudents.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-gray-200">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                        {getInitials(student.first_name, student.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.matricule}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={student.status} t={t} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-400"
                      onClick={() => handleViewStudent(student.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t p-3 bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:text-primary/80 hover:bg-primary/5"
              onClick={onViewAllStudents}
            >
              {t("viewAllStudents")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
