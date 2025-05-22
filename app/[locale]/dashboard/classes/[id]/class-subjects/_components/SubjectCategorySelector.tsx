"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Loader2, FilterX } from "lucide-react";
import SubjectItem from "./SubjectItem";
import { Subject, ClassSubject } from "@/lib/subjectUtils";

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface SubjectSelectionProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  displayableSubjects: Subject[];
  selectedSubjects: ClassSubject[];
  addSubject: (subject: Subject) => void;
  addAllFilteredSubjects: () => void;
  isLoading: boolean;
  educationSystem: string;
}

const SubjectSelection: React.FC<SubjectSelectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  filter,
  setFilter,
  displayableSubjects,
  selectedSubjects,
  addSubject,
  addAllFilteredSubjects,
  isLoading,
  educationSystem,
}) => {
  const t = useTranslations("Classes");

  // Render custom centered tab navigation for categories
  const renderTabs = () => (
    <div className="flex justify-center space-x-4 border-b border-gray-200 mb-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`flex items-center gap-1 py-2 px-4 font-semibold transition-colors ${
            selectedCategory === category.id
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-primary"
          }`}
        >
          {category.icon}
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );

  const subjectsToAdd = displayableSubjects.filter(
    (subject) => !selectedSubjects.some((s) => s.subject_id === subject.id)
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">
          {t("selectSubjects")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Category Tabs */}
          {renderTabs()}

          {/* Search */}
          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("searchSubjects")}
              className="pl-10"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button
                className="absolute right-1 top-1.5 text-gray-500 hover:text-gray-700"
                onClick={() => setFilter("")}
              >
                <FilterX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Subject List Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {categories.find((c) => c.id === selectedCategory)?.icon}
              <span>
                {categories.find((c) => c.id === selectedCategory)?.name}
              </span>
              <span className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-sm">
                {displayableSubjects.length}
              </span>
            </div>
            {subjectsToAdd.length > 0 && (
              <button
                className="flex items-center gap-1 border border-primary text-primary rounded px-3 py-1 hover:bg-primary hover:text-white transition-colors"
                onClick={addAllFilteredSubjects}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("addAllSubjects")}
              </button>
            )}
          </div>

          {/* Subject List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)]">
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
                <div className="grid grid-cols-1 gap-3">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectSelection;
