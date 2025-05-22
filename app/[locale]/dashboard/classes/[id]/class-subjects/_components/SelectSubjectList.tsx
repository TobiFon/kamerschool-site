"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SelectedSubjectItem from "./SelectedSubjectItem";

interface SelectedSubjectsListProps {
  selectedSubjects: any[];
  updateSubject: (subjectId: string, field: keyof any, value: any) => void;
  removeSubject: (subjectId: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const SelectedSubjectsList: React.FC<SelectedSubjectsListProps> = ({
  selectedSubjects,
  updateSubject,
  removeSubject,
  onSave,
  onCancel,
  isLoading,
}) => {
  const t = useTranslations("Classes");

  // Sort subjects so that new ones appear at the top
  const sortedSubjects = [...selectedSubjects].sort((a, b) => {
    if (a.isNew === b.isNew) return 0;
    return a.isNew ? -1 : 1;
  });

  return (
    <Card className="shadow-md border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
          {t("selectedSubjects")}
          <span className="ml-2 bg-gray-200 text-gray-700 rounded-full px-2.5 py-0.5 text-sm font-medium">
            {selectedSubjects.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex-grow">
        {selectedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <div className="mb-4 text-gray-300">
              <CheckCircle className="h-12 w-12" />
            </div>
            <p className="text-lg font-medium text-gray-800 mb-2">
              {t("noSubjectsSelected")}
            </p>
            <p className="text-gray-500 max-w-md mx-auto">
              {t("selectSubjectsFromList")}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4 pb-2">
              {sortedSubjects.map((subject) => (
                <SelectedSubjectItem
                  key={subject.subject_id}
                  subject={subject}
                  updateSubject={updateSubject}
                  removeSubject={removeSubject}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      {selectedSubjects.length > 0 && (
        <CardFooter className="border-t bg-gray-50 py-4 px-6">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-800"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={onSave}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("saveSubjects")}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default SelectedSubjectsList;
