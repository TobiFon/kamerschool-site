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
import { Loader2, Save, CheckCircle2, ClipboardList } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SelectedSubjectItem from "./SelectedSubjectItem";

const SelectedStudentSubjectsList = ({
  selectedSubjects,
  removeSubject,
  onSave,
  onCancel,
  isLoading,
}) => {
  const t = useTranslations("Students");

  // Count mandatory subjects
  const mandatoryCount = selectedSubjects.filter(
    (subj) => subj.mandatory
  ).length;

  return (
    <Card className="shadow-sm border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center">
          <ClipboardList className="mr-2 h-4 w-4 text-primary/70" />
          {t("enrolledSubjects")}
          <div className="ml-auto flex items-center space-x-2">
            <span className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-0.5 font-medium">
              {selectedSubjects.length}
            </span>
            {mandatoryCount > 0 && (
              <span className="bg-blue-100 text-blue-600 text-xs rounded-full px-2.5 py-0.5 font-medium">
                {mandatoryCount} {t("mandatory")}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 flex-grow">
        {selectedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <div className="mb-4 text-gray-300">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <p className="text-base font-medium text-gray-700 mb-2">
              {t("noSubjectsSelectedYet")}
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {t("addSubjectsFromAvailable")}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)] pr-3">
            <div className="space-y-2 pb-2">
              {selectedSubjects.map((subject) => (
                <SelectedSubjectItem
                  key={subject.id}
                  classSubject={subject}
                  onRemove={() => removeSubject(subject.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <CardFooter className="border-t bg-gray-50/80 py-3 px-4">
        <div className="flex justify-between w-full">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={onSave}
            disabled={isLoading || selectedSubjects.length === 0}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t("saveStudentSubjects")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SelectedStudentSubjectsList;
