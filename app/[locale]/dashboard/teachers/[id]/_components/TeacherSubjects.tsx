import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  PenLine,
  GraduationCap,
  Users,
  Check,
  Clock,
  Search,
} from "lucide-react";

const TeacherSubjectsTab = ({ teacherData }) => {
  const t = useTranslations("Teachers");
  const router = useRouter();

  const hasSubjects =
    teacherData.class_subjects && teacherData.class_subjects.length > 0;

  const handleEditSubjects = () => {
    router.push(`/dashboard/teachers/${teacherData.id}/teacher-subjects`);
  };

  // Group subjects by category for better organization
  const groupedSubjects = React.useMemo(() => {
    if (!hasSubjects) return {};

    return teacherData.class_subjects.reduce((acc, subject) => {
      if (!acc[subject.subject]) {
        acc[subject.subject] = [];
      }
      acc[subject.subject].push(subject);
      return acc;
    }, {});
  }, [teacherData.class_subjects, hasSubjects]);

  // Count students taught by this teacher across all subjects
  const totalStudentsTaught = React.useMemo(() => {
    if (!hasSubjects) return 0;

    // This assumes each class has a student_count property
    // If it doesn't exist, modify this calculation accordingly
    const uniqueClasses = new Set();
    teacherData.class_subjects.forEach((subject) => {
      uniqueClasses.add(subject.school_class);
    });

    return uniqueClasses.size;
  }, [teacherData.class_subjects, hasSubjects]);

  // Count mandatory vs optional subjects
  const subjectStats = React.useMemo(() => {
    if (!hasSubjects) return { mandatory: 0, optional: 0 };

    return teacherData.class_subjects.reduce(
      (acc, subject) => {
        if (subject.mandatory) {
          acc.mandatory += 1;
        } else {
          acc.optional += 1;
        }
        return acc;
      },
      { mandatory: 0, optional: 0 }
    );
  }, [teacherData.class_subjects, hasSubjects]);

  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredSubjects = React.useMemo(() => {
    if (!hasSubjects) return [];

    return teacherData.class_subjects.filter((subject) => {
      return (
        subject.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.school_class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [teacherData.class_subjects, searchTerm, hasSubjects]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {hasSubjects && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  {t("totalSubjects")}
                </h3>
                <div className="rounded-full p-2 bg-purple-100">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {teacherData.class_subjects.length}
              </div>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Badge
                  variant="outline"
                  className="mr-2 bg-green-50 text-green-700 border-green-200"
                >
                  {subjectStats.mandatory} {t("mandatory")}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {subjectStats.optional} {t("optional")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  {t("classes")}
                </h3>
                <div className="rounded-full p-2 bg-indigo-100">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-indigo-600">
                {
                  new Set(teacherData.class_subjects.map((s) => s.school_class))
                    .size
                }
              </div>
              <p className="text-xs text-gray-500 mt-2">{t("uniqueClasses")}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  {t("studentsReached")}
                </h3>
                <div className="rounded-full p-2 bg-green-100">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {totalStudentsTaught > 0
                  ? totalStudentsTaught + "+"
                  : t("unknown")}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t("estimatedStudents")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Subjects Card */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center text-lg text-gray-800">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              {t("assignedSubjects")}
              {hasSubjects && (
                <Badge variant="secondary" className="ml-2">
                  {teacherData.class_subjects.length}
                </Badge>
              )}
            </CardTitle>
            {hasSubjects && (
              <CardDescription className="mt-1 text-gray-500">
                {t("managingXSubjects", {
                  count: teacherData.class_subjects.length,
                })}
              </CardDescription>
            )}
          </div>
          <Button
            onClick={handleEditSubjects}
            variant={hasSubjects ? "outline" : "default"}
            className="shadow-sm"
          >
            <PenLine className="h-4 w-4 mr-2" />
            {hasSubjects ? t("editSubjects") : t("assignSubject")}
          </Button>
        </CardHeader>

        {hasSubjects && (
          <div className="bg-gray-50 px-6 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchSubjectsOrClasses")}
                className="pl-9 pr-4 py-2 w-full rounded-md border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {hasSubjects ? (
            filteredSubjects.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>{t("subject")}</TableHead>
                      <TableHead>{t("class")}</TableHead>
                      <TableHead>{t("coefficient")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map((subject, index) => (
                      <TableRow
                        key={subject.id}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <TableCell className="text-center font-medium text-gray-500 bg-gray-50">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-gray-800">
                          {subject.subject}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {subject.school_class}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-700 font-semibold">
                            {subject.coefficient}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              subject.mandatory ? "default" : "secondary"
                            }
                            className={
                              subject.mandatory
                                ? "bg-green-100 hover:bg-green-200 text-green-800 border-0"
                                : "bg-blue-100 hover:bg-blue-200 text-blue-800 border-0"
                            }
                          >
                            {subject.mandatory ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {subject.mandatory ? t("mandatory") : t("optional")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50">
                <div className="rounded-full bg-gray-100 p-3 mb-3">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {t("noSubjectsFound")}
                </h3>
                <p className="text-gray-500 max-w-md mb-4">
                  {t("tryDifferentSearch")}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    {t("clearSearch")}
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gradient-to-b from-white to-gray-50">
              <div className="rounded-full bg-blue-50 p-4 mb-3">
                <BookOpen className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {t("noSubjectsAssigned")}
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                {t("noSubjectsDescription")}
              </p>
              <Button
                variant="default"
                onClick={handleEditSubjects}
                className="shadow-md hover:shadow-lg transition-all"
              >
                <PenLine className="h-4 w-4 mr-2" />
                {t("assignSubject")}
              </Button>
            </div>
          )}
        </CardContent>

        {hasSubjects && filteredSubjects.length > 0 && (
          <CardFooter className="border-t p-4 bg-gray-50 flex justify-end items-center">
            <p className="text-sm text-gray-500 mr-auto">
              {t("showingXofY", {
                showing: filteredSubjects.length,
                total: teacherData.class_subjects.length,
              })}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default TeacherSubjectsTab;
