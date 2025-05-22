"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import {
  Loader2,
  UserPlus,
  ArrowUpCircle,
  Users,
  Edit,
  Filter,
  ArrowLeftRight,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { fetchClasses } from "@/queries/class";
import { fetchAcademicYears } from "@/queries/results";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewStudentModal from "./_components/NewStudentModal";
import ClassAssignmentModal from "./_components/ClassAssignmentModal";
import EditEnrollmentModal from "./_components/EditEnrollmentModal";
import EnrollmentWorkflows from "./_components/EnrollmentWorkflows";
import BulkClassAssignment from "./_components/BulkClassAssignment";
import EnrollmentStatistics from "./_components/EnrollmentDashboard";
import PageHeader from "../_components/PageHeader";
import EnrolledStudentsList from "./_components/EnrolledStudentsList";
import {
  editStudentEnrollment,
  enrollNewStudent,
  initializeEnrollmentWorkflows,
  updateEnrollmentWorkflow,
} from "@/queries/promotions";
import TransfersTabContent from "./_components/TransfersTabContent";

const queryClient = new QueryClient();
const SELECT_PLACEHOLDER = "__placeholder__";

function EnrollmentManagementPage() {
  const t = useTranslations("EnrollmentManagement");
  const queryClientHook = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedToYearId, setSelectedToYearId] = useState(null);
  const [selectedFromYearId, setSelectedFromYearId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // --- Modal States ---
  const [isNewStudentModalOpen, setNewStudentModalOpen] = useState(false);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [isEditEnrollmentModalOpen, setEditEnrollmentModalOpen] =
    useState(false);
  const [currentWorkflowForModal, setCurrentWorkflowForModal] = useState(null);
  const [currentEnrollmentForEdit, setCurrentEnrollmentForEdit] =
    useState(null);

  // --- Data Fetching ---
  const { data: academicYearsData, isLoading: isLoadingYears } = useQuery({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const academicYears = academicYearsData || [];

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
    staleTime: 5 * 60 * 1000,
  });

  const sortedClasses = useMemo(() => {
    if (!classesData) return [];
    return [...classesData].sort((a, b) =>
      (a.full_name || "").localeCompare(b.full_name || "")
    );
  }, [classesData]);

  const currentSelectedClassName = useMemo(() => {
    if (
      selectedClassId === null ||
      !sortedClasses ||
      sortedClasses.length === 0
    )
      return t("classFilter.placeholder");
    return (
      sortedClasses.find((c) => c.id === selectedClassId)?.full_name ||
      t("classFilter.selectClass")
    );
  }, [selectedClassId, sortedClasses, t]);

  // --- Effects for Default Selection ---
  useEffect(() => {
    if (academicYears.length > 0) {
      const activeYear = academicYears.find((y) => y.is_active);
      const sortedYearsDesc = [...academicYears].sort(
        (a, b) => new Date(b.start_date) - new Date(a.start_date)
      );
      const latestYear = sortedYearsDesc[0];
      const currentToYear = activeYear || latestYear;

      if (currentToYear && !selectedToYearId) {
        setSelectedToYearId(currentToYear.id);
      }

      let previousYear = null;
      if (currentToYear) {
        const currentToIndex = sortedYearsDesc.findIndex(
          (y) => y.id === currentToYear.id
        );
        if (
          currentToIndex > -1 &&
          currentToIndex + 1 < sortedYearsDesc.length
        ) {
          previousYear = sortedYearsDesc[currentToIndex + 1];
        }
      }

      if (previousYear && !selectedFromYearId) {
        setSelectedFromYearId(previousYear.id);
      } else if (
        !previousYear &&
        sortedYearsDesc.length > 1 &&
        !selectedFromYearId
      ) {
        const otherYear = sortedYearsDesc.find(
          (y) => y.id !== currentToYear?.id
        );
        if (otherYear) setSelectedFromYearId(otherYear.id);
      } else if (sortedYearsDesc.length === 1 && !selectedFromYearId) {
        setSelectedFromYearId(sortedYearsDesc[0].id);
      }
    }
  }, [academicYears, selectedToYearId, selectedFromYearId]);

  useEffect(() => {
    if (
      selectedClassId &&
      sortedClasses.length > 0 &&
      !sortedClasses.find((c) => c.id === selectedClassId)
    ) {
      setSelectedClassId(null);
    }
    if (sortedClasses.length === 0) {
      setSelectedClassId(null);
    }
  }, [sortedClasses, selectedClassId]);

  // --- Mutations & Callbacks ---
  const handleApiError = useCallback(
    (error, contextKey) => {
      console.error(`${t(`errors.${contextKey}.context`)} Error:`, error);
      let description = error?.message || t("errors.unexpected");
      if (error?.fieldErrors && typeof error.fieldErrors === "object") {
        const fieldMessages = Object.entries(error.fieldErrors)
          .map(
            ([field, messages]) =>
              `${field}: ${
                Array.isArray(messages) ? messages.join(", ") : messages
              }`
          )
          .join("; ");
        if (fieldMessages) {
          description = error.fieldErrors.detail || fieldMessages;
        }
      }
      toast.error(
        t("errors.genericTitle", {
          context: t(`errors.${contextKey}.context`),
        }),
        { description }
      );
    },
    [t]
  );

  const invalidateQueries = useCallback(() => {
    const queryKeysToInvalidate = [
      "enrollmentWorkflows",
      "enrollmentWorkflowsBulk",
      "academicYearEnrollments",
      "enrollmentStatistics",
      "students",
    ];
    queryKeysToInvalidate.forEach((key) => {
      queryClientHook.invalidateQueries({ queryKey: [key] });
    });
    console.log("Invalidated enrollment related queries");
  }, [queryClientHook]);

  const handleApiSuccess = useCallback(
    (messageKey, params = {}, runInvalidation = true) => {
      toast.success(t(`success.${messageKey}`, params));
      if (runInvalidation) {
        invalidateQueries();
      }
    },
    [invalidateQueries, t]
  );

  // --- Specific Mutations ---
  const initWorkflowsMutation = useMutation({
    mutationFn: ({ fromYearId, toYearId }) =>
      initializeEnrollmentWorkflows(fromYearId, toYearId),
    onSuccess: (data) => {
      const {
        created = 0,
        updated = 0,
        errors = 0,
        skipped_missing_class = 0,
      } = data || {};
      handleApiSuccess("workflowsInitialized", {
        created,
        updated,
        errors,
        skipped: skipped_missing_class,
      });
    },
    onError: (error) => handleApiError(error, "initializingWorkflows"),
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, updateData }) =>
      updateEnrollmentWorkflow(workflowId, updateData),
    onSuccess: (data, variables) => {
      handleApiSuccess("classAssigned", {
        studentName: data?.student?.full_name || t("common.workflow"),
      });
      closeAllModals();
    },
    onError: (error) => handleApiError(error, "assigningClass"),
  });

  const newStudentMutation = useMutation({
    mutationFn: ({ classId, studentData }) =>
      enrollNewStudent(classId, studentData),
    onSuccess: (data) => {
      handleApiSuccess("studentEnrolled", {
        studentName: data.student?.full_name,
      });
      setNewStudentModalOpen(false);
    },
    onError: (error) => handleApiError(error, "enrollingNewStudent"),
  });

  const editEnrollmentMutation = useMutation({
    mutationFn: ({ enrollmentId, updateData }) =>
      editStudentEnrollment(enrollmentId, updateData),
    onSuccess: (data) => {
      handleApiSuccess("enrollmentUpdated", {
        studentName: data?.student?.full_name,
      });
      closeAllModals();
    },
    onError: (error) => handleApiError(error, "editingEnrollment"),
  });

  // --- Event Handlers ---
  const handleInitializeWorkflows = useCallback(() => {
    if (!selectedFromYearId || !selectedToYearId) {
      toast.warning(t("warnings.selectYears"));
      return;
    }
    if (selectedFromYearId === selectedToYearId) {
      toast.warning(t("warnings.differentYears"));
      return;
    }
    const fromYearName =
      academicYears.find((y) => y.id === selectedFromYearId)?.name || "?";
    const toYearName =
      academicYears.find((y) => y.id === selectedToYearId)?.name || "?";
    if (
      window.confirm(
        t("confirmations.initializeWorkflows", { fromYearName, toYearName })
      )
    ) {
      initWorkflowsMutation.mutate({
        fromYearId: selectedFromYearId,
        toYearId: selectedToYearId,
      });
    }
  }, [
    selectedFromYearId,
    selectedToYearId,
    academicYears,
    initWorkflowsMutation,
    t,
  ]);

  const handleWorkflowActionClick = useCallback((actionType, workflow) => {
    setCurrentWorkflowForModal(workflow);
    if (actionType === "select_class") {
      setAssignModalOpen(true);
    } else if (actionType === "edit") {
      console.warn(
        "Edit action clicked, need logic to find/fetch and open edit enrollment modal"
      );
    } else {
      console.warn("Unhandled workflow action:", actionType);
    }
  }, []);

  const handleEditEnrollmentClick = useCallback((enrollment) => {
    setCurrentEnrollmentForEdit(enrollment);
    setEditEnrollmentModalOpen(true);
  }, []);

  const closeAllModals = useCallback(() => {
    setNewStudentModalOpen(false);
    setAssignModalOpen(false);
    setEditEnrollmentModalOpen(false);
    setCurrentWorkflowForModal(null);
    setCurrentEnrollmentForEdit(null);
  }, []);

  const handleConfirmAssignment = useCallback(
    (classId, notes) => {
      if (!currentWorkflowForModal || !classId) return;
      updateWorkflowMutation.mutate({
        workflowId: currentWorkflowForModal.id,
        updateData: {
          update_type: "select_class",
          class_id: classId,
          notes: notes,
        },
      });
    },
    [currentWorkflowForModal, updateWorkflowMutation]
  );

  const handleSaveNewStudent = useCallback(
    ({ classId, studentData }) => {
      if (!classId) {
        toast.error(t("errors.selectClassForNewStudent"));
        return;
      }
      newStudentMutation.mutate({ classId, studentData });
    },
    [newStudentMutation, t]
  );

  const handleConfirmEditEnrollment = useCallback(
    (enrollmentId, updateData) => {
      if (!enrollmentId || !updateData) return;
      editEnrollmentMutation.mutate({ enrollmentId, updateData });
    },
    [editEnrollmentMutation]
  );

  const handleClassFilterChange = useCallback((value) => {
    const newClassId =
      value === SELECT_PLACEHOLDER ? null : parseInt(value, 10);
    setSelectedClassId(newClassId);
  }, []);

  // --- Render Logic ---
  if (isLoadingYears) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-3 text-xl">{t("loading.initialMessage")}</span>
      </div>
    );
  }

  const tabOptions = [
    {
      id: "overview",
      label: t("tabs.overview"),
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
    },
    {
      id: "workflows",
      label: t("tabs.workflows"),
      icon: <ArrowUpCircle className="h-4 w-4 mr-2" />,
    },
    {
      id: "bulk",
      label: t("tabs.bulk"),
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      id: "enrolled",
      label: t("tabs.enrolled"),
      icon: <Edit className="h-4 w-4 mr-2" />,
    },
    {
      id: "transfers",
      label: t("tabs.transfers"),
      icon: <ArrowLeftRight className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <>
      {/* Redesigned Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 md:top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <PageHeader
                title={t("pageHeader.title")}
                subtitle={t("pageHeader.subtitle")}
              />
            </div>

            {/* Header Actions Group - Moved to the right */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3 md:gap-4">
              {/* Action Buttons - Higher priority */}
              <div className="flex items-center gap-3">
                {/* New Student Button */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setNewStudentModalOpen(true)}
                  className="whitespace-nowrap h-10 px-4 shadow-sm font-medium bg-primary"
                >
                  <UserPlus className="mr-2 h-4 w-4" />{" "}
                  {t("buttons.newStudent")}
                </Button>

                {/* Initialize Workflows Button */}
                {activeTab === "workflows" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInitializeWorkflows}
                    disabled={
                      !selectedFromYearId ||
                      !selectedToYearId ||
                      initWorkflowsMutation.isLoading ||
                      selectedFromYearId === selectedToYearId
                    }
                    className="whitespace-nowrap h-10 px-4 border-slate-300 hover:bg-slate-50"
                    title={t("buttons.initializeWorkflowsTooltip")}
                  >
                    {initWorkflowsMutation.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                    )}
                    {t("buttons.initializeWorkflows")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-slate-50 border-b border-slate-200 py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Year Selectors */}
            <div className="flex items-center gap-2">
              <div className="min-w-[160px]">
                <Select
                  value={selectedFromYearId?.toString() || ""}
                  onValueChange={(v) =>
                    setSelectedFromYearId(v ? parseInt(v) : null)
                  }
                >
                  <SelectTrigger
                    className="h-10 bg-white border-slate-300 shadow-sm rounded-lg"
                    id="main-from-year"
                  >
                    <span className="text-xs text-slate-500 mr-1">
                      {t("yearSelector.fromPrefix")}
                    </span>
                    <SelectValue placeholder={t("yearSelector.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.length === 0 && (
                      <SelectItem value="none" disabled>
                        {t("yearSelector.loading")}
                      </SelectItem>
                    )}
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id.toString()}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-400" />

              <div className="min-w-[160px]">
                <Select
                  value={selectedToYearId?.toString() || ""}
                  onValueChange={(v) =>
                    setSelectedToYearId(v ? parseInt(v) : null)
                  }
                >
                  <SelectTrigger
                    className="h-10 bg-white border-slate-300 shadow-sm rounded-lg"
                    id="main-to-year"
                  >
                    <span className="text-xs text-slate-500 mr-1">
                      {t("yearSelector.toPrefix")}
                    </span>
                    <SelectValue placeholder={t("yearSelector.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.length === 0 && (
                      <SelectItem value="none" disabled>
                        {t("yearSelector.loading")}
                      </SelectItem>
                    )}
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id.toString()}>
                        {y.name} {y.is_active && t("yearSelector.activeSuffix")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Class Filter (Previous Class) */}
            <div className="min-w-[200px]">
              <Select
                value={selectedClassId?.toString() || SELECT_PLACEHOLDER}
                onValueChange={handleClassFilterChange}
                disabled={isLoadingClasses}
              >
                <SelectTrigger
                  className="h-10 bg-white border-slate-300 shadow-sm rounded-lg"
                  id="classFilterSelect"
                  aria-label={t("classFilter.ariaLabel")}
                >
                  <Filter className="h-4 w-4 text-slate-500 mr-2" />
                  <SelectValue>
                    {isLoadingClasses
                      ? t("classFilter.loading")
                      : currentSelectedClassName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value={SELECT_PLACEHOLDER} disabled>
                    {t("classFilter.placeholder")}
                  </SelectItem>
                  {sortedClasses.length === 0 && !isLoadingClasses && (
                    <SelectItem
                      value="none"
                      disabled
                      className="text-xs italic text-muted-foreground"
                    >
                      {t("classFilter.noClasses")}
                    </SelectItem>
                  )}
                  {sortedClasses.map((cls) => (
                    <SelectItem
                      key={cls.id}
                      value={cls.id.toString()}
                      className="text-sm"
                    >
                      {cls.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="container mx-auto px-4 py-6">
        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b border-slate-200">
              <TabsList className="h-14 p-0 bg-transparent w-full flex rounded-none">
                {tabOptions.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none text-slate-600 data-[state=active]:text-blue-700 px-4 font-medium text-sm"
                  >
                    <div className="flex items-center justify-center">
                      {React.cloneElement(tab.icon, {
                        className: "h-4 w-4 mr-2 flex-shrink-0",
                      })}
                      <span>{tab.label}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview Tab - Dashboard */}
            <TabsContent value="overview" className="p-6">
              {selectedToYearId ? (
                <div className="space-y-6">
                  <EnrollmentStatistics academicYearId={selectedToYearId} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <BarChart3 className="h-12 w-12 mb-4 opacity-40" />
                  <p>{t("dashboard.selectYear")}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="workflows" className="p-6">
              <EnrollmentWorkflows
                academicYears={academicYears}
                initialFromYear={selectedFromYearId}
                initialToYear={selectedToYearId}
                selectedClassId={selectedClassId}
                onActionClick={handleWorkflowActionClick}
                actionLoadingWorkflowId={
                  updateWorkflowMutation.isLoading
                    ? updateWorkflowMutation.variables?.workflowId
                    : null
                }
              />
            </TabsContent>

            <TabsContent value="bulk" className="p-6">
              <BulkClassAssignment
                academicYears={academicYears}
                initialFromYear={selectedFromYearId}
                initialToYear={selectedToYearId}
                selectedClassId={selectedClassId}
                allClasses={sortedClasses}
              />
            </TabsContent>

            <TabsContent value="enrolled" className="p-6">
              <EnrolledStudentsList
                academicYears={academicYears}
                initialToYear={selectedToYearId}
                selectedClassId={selectedClassId}
                onEditClick={handleEditEnrollmentClick}
                allClasses={sortedClasses}
              />
            </TabsContent>

            <TabsContent value="transfers" className="p-6">
              <TransfersTabContent
                academicYears={academicYears}
                defaultEffectiveYearId={selectedToYearId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <NewStudentModal
        isOpen={isNewStudentModalOpen}
        onClose={closeAllModals}
        onSubmit={handleSaveNewStudent}
        classes={sortedClasses}
        isLoading={newStudentMutation.isLoading || isLoadingClasses}
      />

      {currentWorkflowForModal && (
        <ClassAssignmentModal
          isOpen={isAssignModalOpen}
          onClose={closeAllModals}
          onSubmit={handleConfirmAssignment}
          workflow={currentWorkflowForModal}
          isLoading={
            updateWorkflowMutation.isLoading &&
            updateWorkflowMutation.variables?.workflowId ===
              currentWorkflowForModal.id
          }
        />
      )}

      {currentEnrollmentForEdit && (
        <EditEnrollmentModal
          isOpen={isEditEnrollmentModalOpen}
          onClose={closeAllModals}
          onSubmit={handleConfirmEditEnrollment}
          enrollment={currentEnrollmentForEdit}
          classes={sortedClasses}
          isLoading={editEnrollmentMutation.isLoading || isLoadingClasses}
        />
      )}

      <Toaster richColors position="top-right" />
    </>
  );
}

export default function EnrollmentsPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <EnrollmentManagementPage />
    </QueryClientProvider>
  );
}
