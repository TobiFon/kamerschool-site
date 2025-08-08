import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { BookOpen, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface SubjectsTabProps {
  classData: any;
}

const SubjectsTab: React.FC<SubjectsTabProps> = ({ classData }) => {
  const t = useTranslations("Classes");
  const router = useRouter();
  const { canEdit } = useCurrentUser();

  const hasSubjects =
    classData.class_subjects && classData.class_subjects.length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 border-b px-6 py-4 flex flex-row items-center justify-between">
        <h3 className="flex items-center text-lg">
          <BookOpen className="h-5 w-5 mr-2 text-primary" />
          {t("classSubjects")} ({classData.class_subjects?.length || 0})
        </h3>
        <Button
          size="sm"
          disabled={!canEdit}
          onClick={() =>
            router.push(`/dashboard/classes/${classData.id}/class-subjects`)
          }
          variant={hasSubjects ? "outline" : "default"}
        >
          <PenLine className="h-4 w-4 mr-2" />
          {hasSubjects ? t("editSubjects") : t("addSubjects")}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {hasSubjects ? (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>{t("subjectName")}</TableHead>
                  <TableHead>{t("subjectCode")}</TableHead>
                  <TableHead>{t("teacher")}</TableHead>
                  <TableHead>{t("coefficient")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.class_subjects.map((subject, index) => (
                  <TableRow key={subject.id} className="hover:bg-gray-50">
                    <TableCell className="text-center font-medium text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {subject.subject_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {subject.subject_code}
                    </TableCell>
                    <TableCell>
                      {subject.teacher_name ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-gray-200">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {subject.teacher_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {subject.teacher_name}
                        </div>
                      ) : (
                        <span className="text-gray-400">{t("noTeacher")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {subject.coefficient}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={subject.mandatory ? "default" : "outline"}
                        className={
                          subject.mandatory
                            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"
                            : "text-gray-600 border-gray-300"
                        }
                      >
                        {subject.mandatory ? t("mandatory") : t("optional")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {t("noSubjects")}
              </h3>
              <p className="text-gray-500 max-w-md mb-4">
                {t("noSubjectsDescription")}
              </p>
              <Button
                variant="default"
                onClick={() =>
                  router.push(
                    `/dashboard/classes/${classData.id}/class-subjects`
                  )
                }
              >
                {t("addSubjects")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectsTab;
