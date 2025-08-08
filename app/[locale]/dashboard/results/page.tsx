"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Loader2,
  CalendarDays,
  GraduationCap,
  ClipboardList,
  School,
  Filter,
  Calendar,
  PlusCircle,
  HardDriveDownload,
  Settings,
  Bell,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  createBulkReportJob,
  BulkJobPayload,
} from "@/queries/results";
import { fetchAllClasses } from "@/queries/class";
import { ClassesResponse } from "@/types/class";
import { Badge } from "@/components/ui/badge";
import SequenceResultsTab from "./_components/SequenceTab";
import SequenceModal from "./_components/CreateSequenceModal";
import TermResultsTab from "./_components/TermResultsComponents/TermResultsTab";
import YearlyResultsTab from "./_components/YearlyResults/YearlyResultsTab";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ExportsSheetContent from "./_components/ExportSheetContent";

const ResultsComponent: React.FC = () => {
  const t = useTranslations("Results");
  const tBulk = useTranslations("BulkExport");
  const tActions = useTranslations("Actions");
  const router = useRouter();
  const { canEdit } = useCurrentUser();

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
  const { data: academicYears, isLoading: isLoadingYears } = useQuery({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
  });

  // Fetch terms based on selected academic year
  const { data: terms, isLoading: isLoadingTerms } = useQuery({
    queryKey: ["terms", selectedAcademicYear],
    queryFn: () => fetchTerms(Number(selectedAcademicYear)),
    enabled: !!selectedAcademicYear,
  });

  // Fetch classes
  const { data: classesData, isLoading: isLoadingClasses } =
    useQuery<ClassesResponse>({
      queryKey: ["classes"],
      queryFn: fetchAllClasses,
    });

  // Fetch sequences based on selected term
  const { data: sequences, isLoading: isLoadingSequences } = useQuery({
    queryKey: ["sequences", selectedTerm],
    queryFn: () => fetchSequences(Number(selectedTerm)),
    enabled: !!selectedTerm,
  });

  // Mutation for starting the bulk export job
  const bulkExportMutation = useMutation({
    mutationFn: (payload: BulkJobPayload) => createBulkReportJob(payload),
    onSuccess: (data) => {
      toast.success(tBulk("jobStartedSuccess"), {
        description: tBulk("jobStartedDescription", { jobId: data.id }),
        action: {
          label: tBulk("trackProgress"),
          onClick: () => {
            // This would now open the Sheet, but a toast action can't directly do that.
            // The user is guided to click the Bell icon.
            // A more advanced solution could involve global state management.
          },
        },
      });
    },
    onError: (error: Error) => {
      toast.error(tBulk("jobStartFailed"), {
        description: error.message,
      });
    },
  });

  // --- State and Data Management Hooks ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSelections = localStorage.getItem("resultsPageSelections");
        if (savedSelections) {
          const { academicYear, term, classId, tab, sequence } =
            JSON.parse(savedSelections);
          if (academicYear) setSelectedAcademicYear(academicYear);
          if (term) setSelectedTerm(term);
          if (classId) setSelectedClass(classId);
          if (tab) setSelectedTab(tab);
          if (sequence) setSelectedSequence(sequence);
        }
      } catch (error) {
        console.error("Error loading saved selections:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && selectedAcademicYear) {
      localStorage.setItem(
        "resultsPageSelections",
        JSON.stringify({
          academicYear: selectedAcademicYear,
          term: selectedTerm,
          classId: selectedClass,
          tab: selectedTab,
          sequence: selectedSequence,
        })
      );
    }
  }, [
    selectedAcademicYear,
    selectedTerm,
    selectedClass,
    selectedTab,
    selectedSequence,
  ]);

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

  useEffect(() => {
    if (
      sequences?.length &&
      !sequences.find((seq) => seq.id.toString() === selectedSequence)
    ) {
      setSelectedSequence(sequences[sequences.length - 1].id.toString());
    }
  }, [sequences, selectedTerm, selectedSequence]);

  // --- Helper Functions ---
  const getSelectedTermName = () =>
    terms?.find((t) => t.id.toString() === selectedTerm)?.name || "";
  const getSelectedAcademicYearName = () =>
    academicYears?.find((y) => y.id.toString() === selectedAcademicYear)
      ?.name || "";
  const getSelectedSequenceName = () =>
    sequences?.find((s) => s.id.toString() === selectedSequence)?.name || "";
  const getSelectedClassName = () =>
    classesData?.find((c) => c.id.toString() === selectedClass)?.full_name ||
    "";
  const getSelectedClassLevel = () =>
    classesData?.find((c) => c.id.toString() === selectedClass)?.level || "";
  const getSelectedClassEducationSystem = () =>
    classesData?.find((c) => c.id.toString() === selectedClass)
      ?.education_system || "";

  const openCreateSequenceModal = ({ currentTerm, eligibleTerms }) => {
    setModalData({
      currentTerm,
      eligibleTerms: eligibleTerms || [],
      selectedSequence: null,
    });
    setIsSequenceModalOpen(true);
  };

  const openEditSequenceModal = (sequenceId) => {
    const sequenceToEdit = sequences?.find(
      (s) => s.id.toString() === sequenceId
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
    if (selectedTab === "sequence")
      return (
        !!selectedAcademicYear &&
        !!selectedTerm &&
        !!selectedClass &&
        !!selectedSequence
      );
    if (selectedTab === "term")
      return !!selectedAcademicYear && !!selectedTerm && !!selectedClass;
    return !!selectedAcademicYear && !!selectedClass;
  };

  const handleBulkExport = () => {
    if (!isAllFiltersSelected()) {
      toast.error(tBulk("selectionRequired"));
      return;
    }
    const payload: BulkJobPayload = {
      school_class: selectedClass,
      academic_year: selectedAcademicYear,
      term:
        selectedTab === "term" || selectedTab === "sequence"
          ? selectedTerm
          : null,
      sequence: selectedTab === "sequence" ? selectedSequence : null,
    };
    bulkExportMutation.mutate(payload);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-gradient-to-r from-primary/90 to-primary rounded-xl shadow-lg mb-6 overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t("resultsTitle")}</h1>
              <p className="mt-1 opacity-90 font-light">
                {getSelectedAcademicYearName()}
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-2 h-auto relative"
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] p-0">
                  <ExportsSheetContent />
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {tActions("title")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {tActions("resultsActions")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleBulkExport}
                    disabled={
                      !isAllFiltersSelected() || bulkExportMutation.isLoading
                    }
                  >
                    {bulkExportMutation.isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <HardDriveDownload className="mr-2 h-4 w-4" />
                    )}
                    <span>{tBulk("generateButtonText")}</span>
                  </DropdownMenuItem>
                  {selectedTab === "sequence" && (
                    <DropdownMenuItem
                      disabled={!canEdit}
                      onClick={() =>
                        openCreateSequenceModal({
                          currentTerm: selectedTerm,
                          eligibleTerms: terms,
                        })
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>{t("createSequence")}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-lg p-1 text-sm font-medium">
            <button
              onClick={() => setSelectedTab("sequence")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${selectedTab === "sequence" ? "bg-white text-primary shadow-sm" : "text-white hover:bg-white/10"}`}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              {t("sequenceResults")}
            </button>
            <button
              onClick={() => setSelectedTab("term")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${selectedTab === "term" ? "bg-white text-primary shadow-sm" : "text-white hover:bg-white/10"}`}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              {t("termResults")}
            </button>
            <button
              onClick={() => setSelectedTab("yearly")}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${selectedTab === "yearly" ? "bg-white text-primary shadow-sm" : "text-white hover:bg-white/10"}`}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              {t("yearlyResults")}
            </button>
          </div>
        </div>
      </div>

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
          {selectedTerm && selectedTab !== "yearly" && (
            <Badge className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 py-1.5 pl-2 pr-3">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-primary/80" />
              {getSelectedTermName()}
            </Badge>
          )}
        </div>
      )}

      <Card className="mb-6 shadow-md border-0 overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-700">{t("filters")}</span>
          </div>
          <div className="p-5">
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {selectedTab !== "yearly" && (
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
                )}
              </div>
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
                          disabled={!canEdit}
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
                          {classItem.full_name}
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

      <div className="bg-white rounded-lg shadow-md border-0 overflow-hidden min-h-80">
        {isAllFiltersSelected() ? (
          <>
            {selectedTab === "sequence" && (
              <SequenceResultsTab
                sequenceId={selectedSequence}
                classId={selectedClass}
                sequenceName={getSelectedSequenceName()}
              />
            )}
            {selectedTab === "term" && (
              <TermResultsTab
                termId={selectedTerm}
                classId={selectedClass}
                termName={getSelectedTermName()}
              />
            )}
            {selectedTab === "yearly" && (
              <YearlyResultsTab
                classId={selectedClass}
                academicYearId={selectedAcademicYear}
                academicYearName={getSelectedAcademicYearName()}
                classLevel={getSelectedClassLevel()}
                classEducationSystem={getSelectedClassEducationSystem()}
              />
            )}
          </>
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
