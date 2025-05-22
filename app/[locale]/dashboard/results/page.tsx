"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  CalendarDays,
  GraduationCap,
  ClipboardList,
  School,
  Filter,
  Calendar,
  Plus,
  Download,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchAcademicYears,
  fetchTerms,
  fetchSequences,
} from "@/queries/results";
import { fetchAllClasses } from "@/queries/class";
import { ClassesResponse } from "@/types/class";
import { Badge } from "@/components/ui/badge";
import SequenceResultsTab from "./_components/SequenceTab";
import SequenceModal from "./_components/CreateSequenceModal";
import TermResultsTab from "./_components/TermResultsComponents/TermResultsTab";
import YearlyResultsTab from "./_components/YearlyResults/YearlyResultsTab";

const ResultsComponent: React.FC = () => {
  const t = useTranslations("Results");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("sequence");
  const [selectedSequence, setSelectedSequence] = useState<string>("");
  const [isSequenceModalOpen, setIsSequenceModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    currentTerm: "",
    eligibleTerms: [],
    selectedSequence: null,
  });

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

  // Fetch classes
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    error: classesError,
  } = useQuery<ClassesResponse>({
    queryKey: ["classes"],
    queryFn: fetchAllClasses,
  });

  // Fetch sequences based on selected term
  const {
    data: sequences,
    isLoading: isLoadingSequences,
    error: sequencesError,
  } = useQuery({
    queryKey: ["sequences", selectedTerm],
    queryFn: () => fetchSequences(Number(selectedTerm)),
    enabled: !!selectedTerm,
  });

  // Load saved selections from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSelections = localStorage.getItem("resultsPageSelections");
        if (savedSelections) {
          const { academicYear, term, classId, tab, sequence } =
            JSON.parse(savedSelections);

          // Set the values from localStorage
          if (academicYear) setSelectedAcademicYear(academicYear);
          if (term) setSelectedTerm(term);
          if (classId) setSelectedClass(classId);
          if (tab) setSelectedTab(tab);
          if (sequence) setSelectedSequence(sequence);
        }
      } catch (error) {
        console.error("Error loading saved selections:", error);
        // If there's an error, fall back to defaults
      }
    }
  }, []);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && selectedAcademicYear) {
      const selectionsToSave = {
        academicYear: selectedAcademicYear,
        term: selectedTerm,
        classId: selectedClass,
        tab: selectedTab,
        sequence: selectedSequence,
      };
      localStorage.setItem(
        "resultsPageSelections",
        JSON.stringify(selectionsToSave)
      );
    }
  }, [
    selectedAcademicYear,
    selectedTerm,
    selectedClass,
    selectedTab,
    selectedSequence,
  ]);

  // Set defaults when data is loaded (only if no saved selections exist)
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
    if (classesData?.length && !selectedClass) {
      setSelectedClass(classesData[0]?.id.toString());
    }
  }, [classesData, selectedClass]);

  // Updated logic to select the last sequence when term changes
  // Only set if no sequence is already selected for this term
  useEffect(() => {
    if (
      sequences?.length &&
      !sequences.find((seq) => seq.id.toString() === selectedSequence)
    ) {
      const termObject = terms?.find(
        (term) => term.id.toString() === selectedTerm
      );

      if (termObject?.is_active) {
        // If active term, select first sequence as default
        setSelectedSequence(sequences[0].id.toString());
      } else {
        // If not active term, select last sequence
        setSelectedSequence(sequences[sequences.length - 1].id.toString());
      }
    }
  }, [sequences, selectedTerm, terms, selectedSequence]);

  const getActiveTermName = () => {
    if (!terms) return "";
    const activeTerm = terms.find((term) => term.is_active);
    return activeTerm ? activeTerm.name : "";
  };

  const getActiveYearName = () => {
    if (!academicYears) return "";
    const activeYear = academicYears.find((year) => year.is_active);
    return activeYear ? activeYear.name : "";
  };

  const getSelectedTermName = () => {
    if (!terms) return "";
    const selectedTermObj = terms.find(
      (term) => term.id.toString() === selectedTerm
    );
    return selectedTermObj ? selectedTermObj.name : "";
  };

  const getSelectedSequenceName = () => {
    if (!sequences) return "";
    const selectedSeq = sequences.find(
      (seq) => seq.id.toString() === selectedSequence
    );
    return selectedSeq ? selectedSeq.name : "";
  };

  const getSelectedClassName = () => {
    if (!classesData) return "";
    const selectedClassObj = classesData.find(
      (cls) => cls.id.toString() === selectedClass
    );
    return selectedClassObj ? selectedClassObj.full_name : "";
  };
  const getSelectedClassLevel = () => {
    if (!classesData) return "";
    const selectedClassObj = classesData.find(
      (cls) => cls.id.toString() === selectedClass
    );
    return selectedClassObj ? selectedClassObj.level : "";
  };
  const getSelectedClassEducationSystem = () => {
    if (!classesData) return "";
    const selectedClassObj = classesData.find(
      (cls) => cls.id.toString() === selectedClass
    );
    return selectedClassObj ? selectedClassObj.education_system : "";
  };

  const openCreateSequenceModal = ({ currentTerm, eligibleTerms }) => {
    setModalData({
      currentTerm,
      eligibleTerms: eligibleTerms || [],
      selectedSequence: null, // null means creating new sequence
    });
    setIsSequenceModalOpen(true);
  };

  const openEditSequenceModal = (sequenceId) => {
    const sequenceToEdit = sequences?.find(
      (seq) => seq.id.toString() === sequenceId
    );

    if (sequenceToEdit) {
      setModalData({
        currentTerm: selectedTerm,
        eligibleTerms: terms || [],
        selectedSequence: sequenceToEdit,
      });
      setIsSequenceModalOpen(true);
    }
  };

  const isAllFiltersSelected = () => {
    if (selectedTab === "sequence") {
      return (
        !!selectedAcademicYear &&
        !!selectedTerm &&
        !!selectedClass &&
        !!selectedSequence
      );
    } else if (selectedTab === "term") {
      return !!selectedAcademicYear && !!selectedTerm && !!selectedClass;
    } else {
      return !!selectedAcademicYear && !!selectedClass;
    }
  };

  // Reset filters function
  const resetFilters = () => {
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("resultsPageSelections");
    }

    // Reset to default selections
    if (academicYears?.length) {
      const currentYear =
        academicYears.find((year) => year.is_active) || academicYears[0];
      setSelectedAcademicYear(currentYear.id.toString());
    } else {
      setSelectedAcademicYear("");
    }

    setSelectedTerm("");
    setSelectedClass("");
    setSelectedSequence("");
    setSelectedTab("sequence");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Modern Header with gradient */}
      <div className="bg-gradient-to-r from-primary/90 to-primary rounded-xl shadow-lg mb-6 overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t("resultsTitle")}</h1>
              <p className="mt-1 opacity-90 font-light">
                {getActiveYearName() && getActiveTermName()
                  ? `${getActiveYearName()} · ${getSelectedTermName()}`
                  : t("selectFilters")}
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-4 md:mt-0 flex space-x-3">
              {selectedTab === "sequence" && (
                <Button
                  onClick={() =>
                    openCreateSequenceModal({
                      currentTerm: selectedTerm,
                      eligibleTerms: terms,
                    })
                  }
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createSequence")}
                </Button>
              )}
            </div>
          </div>

          {/* View type tabs */}
          <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-lg p-1 text-sm font-medium">
            <button
              onClick={() => setSelectedTab("sequence")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                selectedTab === "sequence"
                  ? "bg-white text-primary shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              {t("sequenceResults")}
            </button>

            <button
              onClick={() => setSelectedTab("term")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                selectedTab === "term"
                  ? "bg-white text-primary shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              {t("termResults")}
            </button>

            <button
              onClick={() => setSelectedTab("yearly")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                selectedTab === "yearly"
                  ? "bg-white text-primary shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              {t("yearlyResults")}
            </button>
          </div>
        </div>
      </div>

      {/* Context badges - showing current selections */}
      {(selectedClass || selectedSequence) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedClass && (
            <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 py-1.5 pl-2 pr-3">
              <School className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              {getSelectedClassName()}
            </Badge>
          )}
          {selectedSequence && selectedTab === "sequence" && (
            <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 py-1.5 pl-2 pr-3">
              <ClipboardList className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              {getSelectedSequenceName()}
            </Badge>
          )}
          {selectedTerm && (
            <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 py-1.5 pl-2 pr-3">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              {getSelectedTermName()}
            </Badge>
          )}
        </div>
      )}

      {/* Filters Card - Hierarchical organization */}
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
              {/* Time period selection (Academic Year > Term) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    disabled={isLoadingTerms || !selectedAcademicYear}
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
              </div>

              {/* Sequence - Only shown when sequence tab is selected */}
              {selectedTab === "sequence" && (
                <div className="border-t border-gray-100 pt-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="sequence"
                        className="text-sm font-medium text-gray-700 flex items-center"
                      >
                        <ClipboardList className="h-4 w-4 mr-2 text-primary/80" />
                        {t("sequence")}
                      </label>
                      {selectedSequence && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-primary hover:bg-primary/10"
                          onClick={() =>
                            openEditSequenceModal(selectedSequence)
                          }
                        >
                          {t("edit")}
                        </Button>
                      )}
                    </div>
                    <Select
                      value={selectedSequence}
                      onValueChange={setSelectedSequence}
                      disabled={isLoadingSequences || !selectedTerm}
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
              )}

              {/* Class selection */}
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
                              {t("subjects")}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isSequenceModalOpen && (
        <SequenceModal
          terms={modalData.eligibleTerms || []}
          sequence={modalData.selectedSequence}
          onClose={() => setIsSequenceModalOpen(false)}
        />
      )}

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden min-h-80">
        {selectedTab === "sequence" && selectedSequence && selectedClass ? (
          <SequenceResultsTab
            sequenceId={selectedSequence}
            classId={selectedClass}
            sequenceName={getSelectedSequenceName()}
          />
        ) : selectedTab === "term" && selectedTerm && selectedClass ? (
          <TermResultsTab
            termId={selectedTerm}
            classId={selectedClass}
            termName={getSelectedTermName()}
          />
        ) : selectedTab === "yearly" &&
          selectedAcademicYear &&
          selectedClass ? (
          <YearlyResultsTab
            classId={selectedClass}
            academicYearId={selectedAcademicYear}
            academicYearName={getActiveYearName()}
            classLevel={getSelectedClassLevel()}
            classEducationSystem={getSelectedClassEducationSystem()}
          />
        ) : (
          <div className="p-12 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">
                {t("selectFiltersToViewResults")}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {t("pleaseSelectAllRequiredFilters")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsComponent;
