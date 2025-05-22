"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen } from "lucide-react";

const StudentSubjectsHeader = ({ studentData, onBack }) => {
  const t = useTranslations("Students");

  return (
    <div className="mb-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("backToStudentProfile")}
      </Button>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BookOpen className="mr-3 h-6 w-6 text-primary/80" />
            {t("manageStudentSubjects")}
          </h1>
          <p className="text-gray-500 max-w-xl">
            {t("manageSubjectsDescription", { name: studentData.full_name })}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-lg font-medium text-gray-800">
            {studentData.full_name}
          </span>
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
            {studentData.class_name}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default StudentSubjectsHeader;
