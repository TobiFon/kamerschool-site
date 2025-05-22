"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Plus,
  Loader2,
  FilterX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (tabsContainerRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } =
          tabsContainerRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
        setShowLeftScroll(scrollLeft > 0);
        setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
      }
    };

    // Check on mount and when categories change
    checkScroll();
    window.addEventListener("resize", checkScroll);

    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      const newScrollPosition =
        direction === "left"
          ? tabsContainerRef.current.scrollLeft - scrollAmount
          : tabsContainerRef.current.scrollLeft + scrollAmount;

      tabsContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });

      // Update scroll buttons after scrolling
      setTimeout(() => {
        if (tabsContainerRef.current) {
          const { scrollWidth, clientWidth, scrollLeft } =
            tabsContainerRef.current;
          setShowLeftScroll(scrollLeft > 0);
          setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
        }
      }, 300);
    }
  };

  // Custom Tab Component for Category Selector with horizontal scrolling
  const renderTabs = () => (
    <div className="relative mb-6">
      {showScrollButtons && showLeftScroll && (
        <button
          onClick={() => scrollTabs("left")}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        className="overflow-x-auto scrollbar-hide"
        ref={tabsContainerRef}
        onScroll={() => {
          if (tabsContainerRef.current) {
            const { scrollWidth, clientWidth, scrollLeft } =
              tabsContainerRef.current;
            setShowLeftScroll(scrollLeft > 0);
            setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
          }
        }}
      >
        <div className="flex space-x-1 border-b border-gray-200 min-w-min">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`flex items-center gap-2 py-3 px-4 font-medium transition-all whitespace-nowrap ${
                selectedCategory === category.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {showScrollButtons && showRightScroll && (
        <button
          onClick={() => scrollTabs("right")}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  const subjectsToAdd = displayableSubjects.filter(
    (subject) => !selectedSubjects.some((s) => s.subject_id === subject.id)
  );

  return (
    <Card className="shadow-md border-gray-200">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-xl font-semibold text-center text-gray-800">
          {t("selectSubjects")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-5">
          {/* Category Tabs */}
          {renderTabs()}

          {/* Search */}
          <div className="relative mx-auto max-w-md mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("searchSubjects")}
              className="pl-10 h-12 border-gray-300 focus:ring-primary focus:border-primary"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setFilter("")}
                aria-label="Clear search"
              >
                <FilterX className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Subject List Header */}
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-600">
                {categories.find((c) => c.id === selectedCategory)?.icon}
              </span>
              <span className="font-medium text-gray-700">
                {categories.find((c) => c.id === selectedCategory)?.name}
              </span>
              <span className="bg-gray-200 text-gray-700 rounded-full px-2.5 py-0.5 text-sm font-medium">
                {displayableSubjects.length}
              </span>
            </div>
            {subjectsToAdd.length > 0 && (
              <button
                className="flex items-center gap-1 bg-white border border-primary text-primary rounded-md px-4 py-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                onClick={addAllFilteredSubjects}
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">{t("addAllSubjects")}</span>
              </button>
            )}
          </div>

          {/* Subject List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <span className="text-gray-500 font-medium">{t("loading")}</span>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-450px)]">
              {displayableSubjects.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="mx-auto h-14 w-14 text-gray-300 mb-4 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200">
                    <FilterX className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
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
                <div className="grid grid-cols-1 gap-3 pb-2">
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
