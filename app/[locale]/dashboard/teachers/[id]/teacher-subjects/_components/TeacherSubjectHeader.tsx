"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, X, Save, Loader2, User } from "lucide-react";

interface TeacherSubjectsHeaderProps {
  teacher: any;
  teacherId: string;
  isLoading: boolean;
  hasPendingChanges: boolean;
  handleSave: () => void;
  t: (key: string) => string;
  router: ReturnType<typeof useRouter>;
  assignedCount: number;
  canEdit: boolean;
}

const TeacherSubjectsHeader: React.FC<TeacherSubjectsHeaderProps> = ({
  teacher,
  teacherId,
  isLoading,
  hasPendingChanges,
  handleSave,
  t,
  router,
  assignedCount,
  canEdit,
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/teachers/${teacherId}`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToTeacherProfile")}
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <User className="h-6 w-6 mr-2 text-primary" />
            {teacher?.name} - {t("assignSubjects")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("currentlyAssigned")}: {assignedCount} {t("subjects")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/teachers/${teacherId}`)}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasPendingChanges || !canEdit}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t("saveChanges")}
          </Button>
        </div>
      </div>
      <Separator className="my-4" />
    </div>
  );
};

export default TeacherSubjectsHeader;
