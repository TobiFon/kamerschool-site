"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, FilterX, BookPlus } from "lucide-react";
import AvailableSubjectItem from "./AvailableSubject";

const AvailableSubjectsSelection = ({
  availableClassSubjects,
  filter,
  setFilter,
  addSubject,
  isLoading,
}) => {
  const t = useTranslations("Students");

  return (
    <Card className="shadow-sm border-gray-200 h-full flex flex-col">
      <CardHeader className="pb-4 border-b border-gray-100">
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center mb-3">
          <BookPlus className="mr-2 h-4 w-4 text-primary/70" />
          {t("availableSubjectsForClass")}
          <span className="ml-auto bg-gray-100 text-gray-600 text-xs rounded-full px-2.5 py-0.5 font-medium">
            {availableClassSubjects.length}
          </span>
        </CardTitle>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("searchAvailableSubjects")}
            className="pl-10 h-9 border-gray-300 bg-gray-50 focus-visible:ring-1 focus-visible:ring-primary/50"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setFilter("")}
              aria-label="Clear search"
            >
              <FilterX className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <span className="text-sm text-gray-500">{t("loading")}</span>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-350px)] pr-3">
            {availableClassSubjects.length === 0 ? (
              <div className="text-center py-12 px-4 h-full flex flex-col items-center justify-center">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-4 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200">
                  <FilterX className="h-6 w-6" />
                </div>
                <h3 className="text-base font-medium text-gray-700 mb-2">
                  {filter
                    ? t("noSubjectsMatchFilter")
                    : t("noAvailableSubjects")}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  {filter
                    ? t("tryAnotherSearchTerm")
                    : t("noSubjectsConfigured")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableClassSubjects.map((classSubject) => (
                  <AvailableSubjectItem
                    key={classSubject.id}
                    classSubject={classSubject}
                    onAdd={() => addSubject(classSubject)}
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

export default AvailableSubjectsSelection;
