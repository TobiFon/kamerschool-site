// components/SubjectList.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Loader2, FilterX } from "lucide-react";
import SubjectItem from "./SubjectItem";
import { Subject, ClassSubject } from "@/lib/subjectUtils";

interface SubjectListProps {
  displayableSubjects: Subject[];
  filter: string;
  setFilter: (filter: string) => void;
  selectedSubjects: ClassSubject[];
  addSubject: (subject: Subject) => void;
  addAllFilteredSubjects: () => void;
  isLoading: boolean;
  educationSystem: string;
  categoryIcon: React.ReactNode;
  categoryName: string;
}

const SubjectList: React.FC<SubjectListProps> = ({
  displayableSubjects,
  filter,
  setFilter,
  selectedSubjects,
  addSubject,
  addAllFilteredSubjects,
  isLoading,
  educationSystem,
  categoryIcon,
  categoryName,
}) => {
  const t = useTranslations("Classes");
  const subjectsToAdd = displayableSubjects.filter(
    (subject) => !selectedSubjects.some((s) => s.subject_id === subject.id)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            {categoryIcon}
            <span className="ml-2">{categoryName}</span>
            <Badge variant="outline" className="ml-3">
              {displayableSubjects.length}
            </Badge>
          </CardTitle>
          {subjectsToAdd.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addAllFilteredSubjects}
              className="whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("addAllSubjects")}
            </Button>
          )}
        </div>
        <div className="w-full mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("searchSubjects")}
              className="pl-10"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5"
                onClick={() => setFilter("")}
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-380px)]">
            {displayableSubjects.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-4 flex items-center justify-center rounded-full bg-gray-50">
                  <FilterX className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {filter
                    ? t("noSubjectsMatchFilter")
                    : t("noSubjectsInCategory")}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {filter
                    ? t("tryAnotherSearchTerm")
                    : t("selectAnotherCategory")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
                {displayableSubjects.map((subject) => (
                  <SubjectItem
                    key={subject.id}
                    subject={subject}
                    isSelected={selectedSubjects.some(
                      (s) => s.subject_id === subject.id
                    )}
                    onAdd={addSubject}
                    educationSystem={educationSystem}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectList;
