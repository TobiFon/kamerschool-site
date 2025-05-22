"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft } from "lucide-react";

interface ClassSubjectsHeaderProps {
  classData: any;
  onBack: () => void;
}

const ClassSubjectsHeader: React.FC<ClassSubjectsHeaderProps> = ({
  classData,
  onBack,
}) => {
  const t = useTranslations("Classes");

  return (
    <div className="mb-8 space-y-4">
      {/* Back button flush left */}
      <Button variant="outline" onClick={onBack} className="mb-2 px-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("backToClass")}
      </Button>
      <div className="flex flex-col items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center text-gray-900">
            <BookOpen className="mr-3 h-6 w-6 text-primary" />
            {t("manageClassSubjects")}
          </h1>
          <p className="text-gray-500 mt-1 text-lg">
            {classData?.full_name || classData?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1 border-2">
            {classData?.education_system?.name} {t("system")}
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1 border-2">
            {classData?.level}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ClassSubjectsHeader;
