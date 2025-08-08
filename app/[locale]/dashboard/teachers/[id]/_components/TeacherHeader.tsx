import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "@/i18n/routing";

interface TeacherData {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  picture?: string;
}

interface SchoolData {
  name: string;
}

interface TeacherHeaderProps {
  teacherData: TeacherData;
  onGoBack: () => void;
  schoolData?: SchoolData;
  canEdit: boolean;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  teacherData,
  onGoBack,
  schoolData,
  canEdit,
}) => {
  const t = useTranslations("Teachers");
  const router = useRouter();

  const handleEditTeacher = () => {
    router.push(`/dashboard/teachers/${teacherData.id}/edit/`);
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          <Button
            variant="ghost"
            onClick={onGoBack}
            className="w-fit px-0 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToTeachers")}
          </Button>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center">
              <div className="mr-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={teacherData.picture}
                    alt={teacherData.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(teacherData.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {teacherData.name}
                </h1>
                <p className="text-gray-500 mt-1">
                  {teacherData.email}
                  {teacherData.phone_number
                    ? ` • ${teacherData.phone_number}`
                    : ""}
                </p>
                {schoolData && (
                  <p className="text-gray-600 text-sm mt-1">
                    {schoolData.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleEditTeacher}
                className="gap-2"
                disabled={!canEdit}
              >
                <Edit className="h-4 w-4" />
                {t("editTeacher")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHeader;
