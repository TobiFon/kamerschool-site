"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  CalendarDays,
  GraduationCap,
  BarChart,
  LineChart,
  School,
  Filter,
  Calendar,
  Download,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchAcademicYears,
  fetchTerms,
  fetchSequences,
} from "@/queries/results";
import { fetchAllClasses } from "@/queries/class";
import { ClassesResponse } from "@/types/class";
import {
  fetchSchoolPerformance,
  fetchSchoolSubjectAnalysis,
  fetchSchoolClassComparison,
  fetchClassPerformance,
} from "@/queries/anaytics";
import SchoolOverview from "./_components/SchoolPerformanceOverview";
import ClassDetails from "./_components/ClassDetails";
import SubjectAnalysis from "./_components/SubjectAnalysis";
import ClassComparisonView from "./_components/ClassComp";

const AnalyticsComponent = () => {
  // Internationalization hook using the "Analytics" namespace
  const t = useTranslations("Analytics");

  // State for filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedSequence, setSelectedSequence] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("school");
  const [timeScope, setTimeScope] = useState<string>("term");

  // Fetch academic years
  const {
    data: academicYears,
    isLoading: isLoadingYears,
    error: yearsError,
  } = useQuery({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
  });

  // Fetch terms based on selected academic year
  const {
    data: terms,
    isLoading: isLoadingTerms,
    error: termsError,
  } = useQuery({
    queryKey: ["terms", selectedAcademicYear],
    queryFn: () => fetchTerms(Number(selectedAcademicYear)),
    enabled: !!selectedAcademicYear,
  });

  // Fetch sequences based on selected term
  const {
    data: sequences,
    isLoading: isLoadingSequences,
    error: sequencesError,
  } = useQuery({
    queryKey: ["sequences", selectedTerm],
    queryFn: () => fetchSequences(Number(selectedTerm)),
    enabled: !!selectedTerm && timeScope === "sequence",
  });

  // Fetch classes
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    error: classesError,
  } = useQuery<ClassesResponse>({
    queryKey: ["classes"],
    queryFn: fetchAllClasses,
  });

  // Get periodId based on the selected timeScope
  const getPeriodId = () => {
    switch (timeScope) {
      case "sequence":
        return selectedSequence;
      case "term":
        return selectedTerm;
      case "year":
        return selectedAcademicYear;
      default:
        return null;
    }
  };

  // Fetch analytics data based on selected tab and filters
  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
  } = useQuery({
    queryKey: [
      "analytics",
      selectedTab,
      timeScope,
      getPeriodId(),
      selectedClass,
    ],
    queryFn: () => {
      const options = {
        timeScope: timeScope,
        periodId: getPeriodId(),
        academicYearId: selectedAcademicYear,
      };

      switch (selectedTab) {
        case "school":
          return fetchSchoolPerformance(options);
        case "subjects":
          return fetchSchoolSubjectAnalysis(options);
        case "classes":
          return fetchSchoolClassComparison(options);
        case "class":
          return fetchClassPerformance(selectedClass, options);
        default:
          return Promise.reject("Invalid tab selected");
      }
    },
    enabled:
      (timeScope === "year" && !!selectedAcademicYear) ||
      (timeScope === "term" && !!selectedTerm) ||
      (timeScope === "sequence" && !!selectedSequence) ||
      (selectedTab === "class" && !!selectedClass),
  });

  // Load saved selections from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSelections = localStorage.getItem("analyticsPageSelections");
        if (savedSelections) {
          const { academicYear, term, sequence, classId, tab, scope } =
            JSON.parse(savedSelections);

          if (academicYear) setSelectedAcademicYear(academicYear);
          if (term) setSelectedTerm(term);
          if (sequence) setSelectedSequence(sequence);
          if (classId) setSelectedClass(classId);
          if (tab) setSelectedTab(tab);
          if (scope) setTimeScope(scope);
        }
      } catch (error) {
        console.error("Error loading saved selections:", error);
      }
    }
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && selectedAcademicYear) {
      const selectionsToSave = {
        academicYear: selectedAcademicYear,
        term: selectedTerm,
        sequence: selectedSequence,
        classId: selectedClass,
        tab: selectedTab,
        scope: timeScope,
      };
      localStorage.setItem(
        "analyticsPageSelections",
        JSON.stringify(selectionsToSave)
      );
    }
  }, [
    selectedAcademicYear,
    selectedTerm,
    selectedSequence,
    selectedClass,
    selectedTab,
    timeScope,
  ]);

  // Set defaults when data is loaded
  useEffect(() => {
    if (academicYears?.length && !selectedAcademicYear) {
      const currentYear =
        academicYears.find((year) => year.is_active) || academicYears[0];
      setSelectedAcademicYear(currentYear.id.toString());
    }
  }, [academicYears, selectedAcademicYear]);

  useEffect(() => {
    if (terms?.length && !selectedTerm) {
      const currentTerm = terms.find((term) => term.is_active) || terms[0];
      setSelectedTerm(currentTerm.id.toString());
    }
  }, [terms, selectedTerm]);

  useEffect(() => {
    if (sequences?.length && !selectedSequence && timeScope === "sequence") {
      setSelectedSequence(sequences[0].id.toString());
    }
  }, [sequences, selectedSequence, timeScope]);

  useEffect(() => {
    if (classesData?.length && !selectedClass && selectedTab === "class") {
      setSelectedClass(classesData[0]?.id.toString());
    }
  }, [classesData, selectedClass, selectedTab]);

  // Helper functions for display names
  const getSelectedTimeScopeName = () => {
    switch (timeScope) {
      case "sequence":
        if (!sequences) return "";
        const selectedSeq = sequences.find(
          (seq) => seq.id.toString() === selectedSequence
        );
        return selectedSeq ? selectedSeq.name : "";
      case "term":
        if (!terms) return "";
        const selectedTermObj = terms.find(
          (term) => term.id.toString() === selectedTerm
        );
        return selectedTermObj ? selectedTermObj.name : "";
      case "year":
        if (!academicYears) return "";
        const selectedYearObj = academicYears.find(
          (year) => year.id.toString() === selectedAcademicYear
        );
        return selectedYearObj ? selectedYearObj.name : "";
      default:
        return "";
    }
  };

  const getSelectedClassName = () => {
    if (!classesData) return "";
    const selectedClassObj = classesData.find(
      (cls) => cls.id.toString() === selectedClass
    );
    return selectedClassObj ? selectedClassObj.full_name : "";
  };

  // Reset filters function
  const resetFilters = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("analyticsPageSelections");
    }
    if (academicYears?.length) {
      const currentYear =
        academicYears.find((year) => year.is_active) || academicYears[0];
      setSelectedAcademicYear(currentYear.id.toString());
    } else {
      setSelectedAcademicYear("");
    }
    setSelectedTerm("");
    setSelectedSequence("");
    setSelectedClass("");
    setSelectedTab("school");
    setTimeScope("term");
  };

  const isAllFiltersSelected = () => {
    if (timeScope === "sequence") {
      return !!selectedSequence;
    } else if (timeScope === "term") {
      return !!selectedTerm;
    } else if (timeScope === "year") {
      return !!selectedAcademicYear;
    }
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Modern Header with gradient */}
      <div className="bg-gradient-to-r from-primary/90 to-primary rounded-xl shadow-lg mb-6 overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="mt-1 opacity-90 font-light">
                {getSelectedTimeScopeName()
                  ? t("subtitle", {
                      timeScope: timeScope,
                      timeScopeName: getSelectedTimeScopeName(),
                    })
                  : t("noFilters")}
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button className="bg-white text-primary hover:bg-white/90">
                <Download className="h-4 w-4 mr-2" />
                {t("export")}
              </Button>
            </div>
          </div>

          {/* View type tabs */}
          <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-lg p-1 text-sm font-medium">
            <button
              onClick={() => setSelectedTab("school")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                selectedTab === "school"
                  ? "bg-white text-primary shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <School className="h-4 w-4 mr-2" />
              {t("schoolStats")}
            </button>

            <button
              onClick={() => setSelectedTab("class")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                selectedTab === "class"
                  ? "bg-white text-primary shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <LineChart className="h-4 w-4 mr-2" />
              {t("classStats")}
            </button>

            <button
              onClick={() => setSelectedTab("subjects")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                selectedTab === "subjects"
                  ? "bg-white text-primary shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t("subjectAnalysis")}
            </button>

            <button
              onClick={() => setSelectedTab("classes")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                selectedTab === "classes"
                  ? "bg-white text-primary shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              {t("classComparison")}
            </button>
          </div>
        </div>
      </div>

      {/* Context badges */}
      {(selectedClass || getSelectedTimeScopeName()) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTab === "class" && selectedClass && (
            <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 py-1.5 pl-2 pr-3">
              <School className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              {getSelectedClassName()}
            </Badge>
          )}
          {getSelectedTimeScopeName() && (
            <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 py-1.5 pl-2 pr-3">
              {timeScope === "sequence" ? (
                <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              ) : timeScope === "term" ? (
                <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              ) : (
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              )}
              {getSelectedTimeScopeName()}
            </Badge>
          )}
        </div>
      )}

      {/* Filters Card */}
      <Card className="mb-6 shadow-md border-0 overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-700">{t("filters")}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs h-8 text-gray-500 hover:text-gray-700"
              onClick={resetFilters}
            >
              {t("resetFilters")}
            </Button>
          </div>

          <div className="p-5">
            <div className="space-y-5">
              {/* Time Scope Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="time-scope"
                  className="text-sm font-medium text-gray-700 flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2 text-primary/80" />
                  {t("timeScope")}
                </label>
                <Select value={timeScope} onValueChange={setTimeScope}>
                  <SelectTrigger
                    id="time-scope"
                    className="w-full bg-white border-gray-200 h-10 shadow-sm hover:border-primary/50 transition-colors"
                  >
                    <SelectValue placeholder={t("selectTimeScope")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    <SelectItem value="year">{t("academicYear")}</SelectItem>
                    <SelectItem value="term">{t("term")}</SelectItem>
                    <SelectItem value="sequence">{t("sequence")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time period selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Academic Year */}
                <div className="space-y-2">
                  <label
                    htmlFor="academic-year"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-primary/80" />
                    {t("academicYear")}
                  </label>
                  <Select
                    value={selectedAcademicYear}
                    onValueChange={setSelectedAcademicYear}
                    disabled={isLoadingYears}
                  >
                    <SelectTrigger
                      id="academic-year"
                      className="w-full bg-white border-gray-200 h-10 shadow-sm hover:border-primary/50 transition-colors"
                    >
                      {isLoadingYears ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("loading")}
                        </div>
                      ) : (
                        <SelectValue placeholder={t("selectAcademicYear")} />
                      )}
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      {academicYears?.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{year.name}</span>
                            {year.is_active && (
                              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                {t("current")}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Term */}
                <div className="space-y-2">
                  <label
                    htmlFor="term"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <CalendarDays className="h-4 w-4 mr-2 text-primary/80" />
                    {t("term")}
                  </label>
                  <Select
                    value={selectedTerm}
                    onValueChange={setSelectedTerm}
                    disabled={
                      isLoadingTerms ||
                      !selectedAcademicYear ||
                      timeScope === "year"
                    }
                  >
                    <SelectTrigger
                      id="term"
                      className="w-full bg-white border-gray-200 h-10 shadow-sm hover:border-primary/50 transition-colors"
                    >
                      {isLoadingTerms ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("loading")}
                        </div>
                      ) : (
                        <SelectValue placeholder={t("selectTerm")} />
                      )}
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      {terms?.map((term) => (
                        <SelectItem key={term.id} value={term.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{term.name}</span>
                            {term.is_active && (
                              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                                {t("current")}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sequence */}
                <div className="space-y-2">
                  <label
                    htmlFor="sequence"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <ClipboardList className="h-4 w-4 mr-2 text-primary/80" />
                    {t("sequence")}
                  </label>
                  <Select
                    value={selectedSequence}
                    onValueChange={setSelectedSequence}
                    disabled={
                      isLoadingSequences ||
                      !selectedTerm ||
                      timeScope !== "sequence"
                    }
                  >
                    <SelectTrigger
                      id="sequence"
                      className="w-full bg-white border-gray-200 h-10 shadow-sm hover:border-primary/50 transition-colors"
                    >
                      {isLoadingSequences ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("loading")}
                        </div>
                      ) : (
                        <SelectValue placeholder={t("selectSequence")} />
                      )}
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      {sequences?.map((sequence) => (
                        <SelectItem
                          key={sequence.id}
                          value={sequence.id.toString()}
                        >
                          {sequence.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Class selection - Only shown when class tab is selected */}
              {selectedTab === "class" && (
                <div className="border-t border-gray-100 pt-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="class"
                      className="text-sm font-medium text-gray-700 flex items-center"
                    >
                      <School className="h-4 w-4 mr-2 text-primary/80" />
                      {t("class")}
                    </label>
                    <Select
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                      disabled={isLoadingClasses}
                    >
                      <SelectTrigger
                        id="class"
                        className="w-full bg-white border-gray-200 h-10 shadow-sm hover:border-primary/50 transition-colors"
                      >
                        {isLoadingClasses ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("loading")}
                          </div>
                        ) : (
                          <SelectValue placeholder={t("selectClass")} />
                        )}
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg max-h-64">
                        {classesData?.map((classItem) => (
                          <SelectItem
                            key={classItem.id}
                            value={classItem.id.toString()}
                          >
                            <div className="flex flex-col">
                              <span>{classItem.full_name}</span>
                              <span className="text-xs text-gray-500">
                                {classItem.mandatory_subjects?.length || 0}{" "}
                                {t("subjectsCount")}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden min-h-80">
        {isLoadingAnalytics ? (
          <div className="flex justify-center items-center h-80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-4 text-lg font-medium">
              {t("loadingAnalytics")}
            </span>
          </div>
        ) : !isAllFiltersSelected() ? (
          <div className="p-12 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">{t("selectFilters")}</p>
              <p className="text-sm text-gray-400 mt-2">
                {t("pleaseSelect", {
                  filterType:
                    timeScope === "sequence"
                      ? t("sequence")
                      : timeScope === "term"
                      ? t("term")
                      : t("academicYear"),
                })}
              </p>
            </div>
          </div>
        ) : analyticsError ? (
          <div className="p-12 flex items-center justify-center text-red-500">
            <div className="text-center">
              <p className="text-lg font-medium">{t("errorAnalytics")}</p>
              <p className="text-sm mt-2">{analyticsError.toString()}</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {selectedTab === "school" && (
              <SchoolOverview data={analyticsData} />
            )}
            {selectedTab === "class" && <ClassDetails data={analyticsData} />}
            {selectedTab === "subjects" && (
              <SubjectAnalysis data={analyticsData} />
            )}
            {selectedTab === "classes" && (
              <ClassComparisonView data={analyticsData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsComponent;
