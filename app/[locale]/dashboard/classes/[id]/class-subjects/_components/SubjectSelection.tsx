"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Loader2, FilterX } from "lucide-react";
import SubjectItem from "./SubjectItem";
import { Subject } from "@/lib/subjectUtils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";

interface SubjectSelectionProps {
  filter: string;
  setFilter: (filter: string) => void;
  displayableSubjects: Subject[];
  addSubject: (subject: Subject) => void;
  addAllFilteredSubjects: () => void;
  isLoading: boolean;
  educationSystem: string;
}

const SubjectSelection: React.FC<SubjectSelectionProps> = ({
  filter,
  setFilter,
  displayableSubjects,
  addSubject,
  addAllFilteredSubjects,
  isLoading,
  educationSystem,
}) => {
  const t = useTranslations("Classes");
  const { canEdit } = useCurrentUser();

  return (
    <Card className="shadow-md border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-4 border-b border-gray-100">
        <CardTitle className="text-xl font-semibold text-center text-gray-800">
          {t("availableSubjects")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="space-y-4 flex-grow flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("searchByNameCode")}
              className="pl-10 h-11 border-gray-300 focus:ring-primary focus:border-primary"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                onClick={() => setFilter("")}
                aria-label="Clear search"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <span className="font-medium text-gray-700">
              {t("subjectsFound", { count: displayableSubjects.length })}
            </span>
            {displayableSubjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={!canEdit || isLoading}
                className="flex items-center gap-1 bg-white border-primary text-primary hover:bg-primary/5"
                onClick={addAllFilteredSubjects}
              >
                <Plus className="h-4 w-4" />
                <span>
                  {t("addAll", { count: displayableSubjects.length })}
                </span>
              </Button>
            )}
          </div>

          <div className="flex-grow">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <span className="text-gray-500 font-medium">
                  {t("loadingSubjects")}
                </span>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-450px)] pr-3">
                {displayableSubjects.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="mx-auto h-14 w-14 text-gray-300 mb-4 flex items-center justify-center rounded-full bg-gray-100 border border-gray-200">
                      <Search className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      {t("noSubjectsMatchFilter")}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {t("tryAnotherSearchTermOrClear")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {displayableSubjects.map((subject) => (
                      <SubjectItem
                        key={subject.id}
                        subject={subject}
                        isSelected={false} // This component no longer knows about selected subjects
                        onAdd={addSubject}
                        educationSystem={educationSystem}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectSelection;
