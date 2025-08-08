import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  FileText,
  UserPlus,
  Download,
} from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCSV, exportToPDF } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const getInitials = (firstName: string, lastName: string): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

interface StudentsTabProps {
  classData: any;
  schoolData?: any;
}

const StudentsTab: React.FC<StudentsTabProps> = ({ classData, schoolData }) => {
  const t = useTranslations("Classes");
  const tp = useTranslations("pdfs");
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });
  const { canEdit } = useCurrentUser();
  const handleSort = (key: string) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedStudents = useMemo(() => {
    if (!classData?.students) return [];

    // First apply filters
    let results = [...classData.students].filter((student) => {
      const matchesSearch =
        searchTerm === "" ||
        `${student.first_name} ${student.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.matricule.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGender =
        genderFilter === "all" ||
        (genderFilter === "male" && student.sex === "m") ||
        (genderFilter === "female" && student.sex === "f");

      return matchesSearch && matchesGender;
    });

    // Then sort
    results.sort((a, b) => {
      let firstValue;
      let secondValue;

      switch (sortConfig.key) {
        case "name":
          firstValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          secondValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case "matricule":
          firstValue = a.matricule.toLowerCase();
          secondValue = b.matricule.toLowerCase();
          break;
        case "enrollment":
          firstValue = new Date(a.date_of_enrollment).getTime();
          secondValue = new Date(b.date_of_enrollment).getTime();
          break;
        case "age":
          firstValue = parseInt(a.age) || 0;
          secondValue = parseInt(b.age) || 0;
          break;
        default:
          firstValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          secondValue = `${b.first_name} ${b.last_name}`.toLowerCase();
      }

      if (firstValue < secondValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (firstValue > secondValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

    return results;
  }, [classData.students, searchTerm, genderFilter, sortConfig]);

  // Prepare export data from filtered and sorted students
  const exportData = useMemo(() => {
    return filteredAndSortedStudents.map((student, index) => ({
      SN: index + 1,
      Name: `${student.first_name} ${student.last_name}`,
      "Student ID": student.matricule,
      Gender: student.sex === "m" ? t("male") : t("female"),
      "Enrollment Date": new Date(
        student.date_of_enrollment
      ).toLocaleDateString(),
      Age: student.age,
    }));
  }, [filteredAndSortedStudents, t]);

  // Handle exports
  const handleExportCSV = () => {
    exportToCSV(exportData, `${classData.level}-ClassList.csv`);
  };

  const handleExportPDF = () => {
    const schoolInfo = {
      name: schoolData?.name || "",
      active_academic_year: schoolData?.active_academic_year || "",
      email: schoolData?.email || "",
      city: schoolData?.city || "",
      logo: schoolData?.logo || "",
    };

    const classFullDetails = `${classData.full_name}`;

    exportToPDF(
      exportData,
      `${classData.level}-ClassList`,
      classFullDetails,
      schoolInfo,
      tp
    );
  };

  const handleViewStudent = (studentId: string) =>
    router.push(`/dashboard/students/${studentId}`);

  const handleAddStudent = () =>
    router.push(`/dashboard/classes/${classData.id}/add-student`);

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const totalStudents = classData?.students?.length || 0;
  const maleStudents =
    classData?.students?.filter((s: any) => s.sex === "m").length || 0;
  const femaleStudents =
    classData?.students?.filter((s: any) => s.sex === "f").length || 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 border-b px-6 py-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2 text-primary" />
              {t("classStudents")}
              <Badge variant="secondary" className="ml-2">
                {filteredAndSortedStudents.length}
              </Badge>
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={t("searchStudents")}
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Tabs
                value={genderFilter}
                onValueChange={setGenderFilter}
                className="w-auto"
              >
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="all">
                    {t("all")} ({totalStudents})
                  </TabsTrigger>
                  <TabsTrigger value="male">
                    {t("male")} ({maleStudents})
                  </TabsTrigger>
                  <TabsTrigger value="female">
                    {t("female")} ({femaleStudents})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="lg:col-span-7 flex flex-row justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ChevronDown className="h-4 w-4" />
                    {t("export")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="grid grid-cols-1 gap-1 p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start px-2 w-full"
                      onClick={handleExportCSV}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {t("exportCSV")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start px-2 w-full"
                      onClick={handleExportPDF}
                    >
                      <FileText className="h-4 w-4 mr-2 text-red-500" />
                      {t("exportPDF")}
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchTerm || genderFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setGenderFilter("all");
                  }}
                >
                  {t("resetFilters")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="hover:bg-transparent p-0 h-auto font-medium flex items-center"
                    onClick={() => handleSort("name")}
                  >
                    {t("name")}
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="hover:bg-transparent p-0 h-auto font-medium flex items-center"
                    onClick={() => handleSort("matricule")}
                  >
                    {t("matricule")}
                    {getSortIcon("matricule")}
                  </Button>
                </TableHead>
                <TableHead>{t("gender")}</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="hover:bg-transparent p-0 h-auto font-medium flex items-center"
                    onClick={() => handleSort("enrollment")}
                  >
                    {t("enrollmentDate")}
                    {getSortIcon("enrollment")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="hover:bg-transparent p-0 h-auto font-medium flex items-center"
                    onClick={() => handleSort("age")}
                  >
                    {t("age")}
                    {getSortIcon("age")}
                  </Button>
                </TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStudents.map((student, index) => (
                <TableRow key={student.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium text-gray-500">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-gray-200">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {getInitials(student.first_name, student.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {student.first_name} {student.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {student.matricule}
                  </TableCell>
                  <TableCell>
                    {t(student.sex === "m" ? "male" : "female")}
                  </TableCell>
                  <TableCell>
                    {formatDate(student.date_of_enrollment)}
                  </TableCell>
                  <TableCell className="text-center">{student.age}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleViewStudent(student.id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredAndSortedStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchTerm || genderFilter !== "all"
                ? t("noStudentsFound")
                : t("noStudents")}
            </h3>
            <p className="text-gray-500 max-w-md mb-4">
              {searchTerm || genderFilter !== "all"
                ? t("noStudentsFoundDescription")
                : t("noStudentsDescription")}
            </p>
            {searchTerm || genderFilter !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setGenderFilter("all");
                }}
              >
                {t("resetFilters")}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleAddStudent}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {t("addStudent")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentsTab;
