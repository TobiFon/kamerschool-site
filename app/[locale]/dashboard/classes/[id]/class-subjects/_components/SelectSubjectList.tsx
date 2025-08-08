"use client";
import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, CheckCircle, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import SelectedSubjectItem from "./SelectedSubjectItem";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Input } from "@/components/ui/input";

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
  const { canEdit } = useCurrentUser();
  const [searchFilter, setSearchFilter] = useState("");

  const filteredAndSortedSubjects = useMemo(() => {
    const sorted = [...selectedSubjects].sort((a, b) => {
      if (a.isNew === b.isNew) return 0;
      return a.isNew ? -1 : 1;
    });

    if (!searchFilter) {
      return sorted;
    }

    const lowerFilter = searchFilter.toLowerCase();
    return sorted.filter(
      (s) =>
        s.subject_name.toLowerCase().includes(lowerFilter) ||
        s.subject_code.toLowerCase().includes(lowerFilter)
    );
  }, [selectedSubjects, searchFilter]);

  return (
    <Card className="shadow-md border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
            {t("selectedSubjects")}
            <span className="ml-2 bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-sm font-medium">
              {selectedSubjects.length}
            </span>
          </CardTitle>
        </div>
        {selectedSubjects.length > 0 && (
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("searchSelectedPlaceholder")}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 h-10"
            />
            {searchFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchFilter("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent
        className="p-4 flex-grow"
        style={{ paddingBottom: selectedSubjects.length > 0 ? "0" : "1rem" }}
      >
        {selectedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
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
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div className="space-y-3 pb-2 pr-3">
              {filteredAndSortedSubjects.map((subject) => (
                <SelectedSubjectItem
                  key={subject.subject_id}
                  subject={subject}
                  updateSubject={updateSubject}
                  removeSubject={removeSubject}
                />
              ))}
            </div>
            {filteredAndSortedSubjects.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                <p>{t("noSubjectsMatchSearch")}</p>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
      {selectedSubjects.length > 0 && (
        <CardFooter className="border-t bg-gray-50 py-4 px-6 mt-auto">
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
              disabled={!canEdit || isLoading}
              onClick={onSave}
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
