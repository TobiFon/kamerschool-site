"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  UserPlus,
  Users,
  ArrowRightLeft,
  Filter,
  Search,
  FileText,
  ArrowRight,
  Check,
  X,
  ExternalLink,
  Edit,
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchAcademicYears } from "@/queries/results";
import { fetchAllClasses } from "@/queries/class";
import {
  initializeEnrollmentWorkflows,
  getEnrollmentWorkflows,
  updateEnrollmentWorkflow,
  performBulkClassAssignments,
  processClassTransitions,
  enrollNewStudent,
  editStudentEnrollment,
} from "@/queries/promotions";
import { toast } from "sonner";

const EnrollmentTab = ({ schoolId }) => {
  const t = useTranslations("Enrollment");
  const queryClient = useQueryClient();
  const [selectedFromYear, setSelectedFromYear] = useState("");
  const [selectedToYear, setSelectedToYear] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedCurrentClass, setSelectedCurrentClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkflows, setSelectedWorkflows] = useState([]);
  const [isInitializingModal, setIsInitializingModal] = useState(false);
  const [isAssignClassModal, setIsAssignClassModal] = useState(false);
  const [selectedClassForAssignment, setSelectedClassForAssignment] =
    useState("");
  const [isNewStudentModal, setIsNewStudentModal] = useState(false);
  const [isEditEnrollmentModal, setIsEditEnrollmentModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [newStudentData, setNewStudentData] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch academic years
  const { data: academicYears, isLoading: isLoadingYears } = useQuery({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
  });

  // Fetch classes
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchAllClasses,
  });

  // Fetch enrollment workflows
  const {
    data: workflowsData,
    isLoading: isLoadingWorkflows,
    refetch: refetchWorkflows,
  } = useQuery({
    queryKey: [
      "enrollmentWorkflows",
      selectedFromYear,
      selectedToYear,
      selectedStage,
      selectedCurrentClass,
      page,
      pageSize,
      schoolId,
    ],
    queryFn: () =>
      getEnrollmentWorkflows({
        fromYearId: selectedFromYear || undefined,
        toYearId: selectedToYear || undefined,
        stage: selectedStage !== "all" ? selectedStage : undefined,
        currentClassId: selectedCurrentClass || undefined,
        schoolId,
        page,
        pageSize,
      }),
    enabled: !!schoolId,
  });

  // Initialize enrollment workflows mutation
  const initializeWorkflowsMutation = useMutation({
    mutationFn: ({ fromYear, toYear }) =>
      initializeEnrollmentWorkflows(fromYear, toYear, schoolId),
    onSuccess: () => {
      toast.success(t("workflowsInitialized"), {
        description: t("enrollmentWorkflowsInitializedSuccess"),
      });
      setIsInitializingModal(false);
      queryClient.invalidateQueries(["enrollmentWorkflows"]);
    },
    onError: (error) => {
      toast.error(t("error"), {
        description: t("failedToInitializeWorkflows"),
      });
    },
  });

  // Bulk class assignments mutation
  const bulkAssignMutation = useMutation({
    mutationFn: ({ assignments }) =>
      performBulkClassAssignments(assignments, schoolId),
    onSuccess: () => {
      toast.success(t("success"), {
        description: t("studentsAssignedToClassSuccess"),
      });
      setIsAssignClassModal(false);
      setSelectedWorkflows([]);
      queryClient.invalidateQueries(["enrollmentWorkflows"]);
    },
    onError: (error) => {
      toast.error(t("error"), {
        description: t("failedToAssignStudents"),
      });
    },
  });

  // Update workflow stage mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: ({ workflowId, updateData }) =>
      updateEnrollmentWorkflow(workflowId, updateData, schoolId),
    onSuccess: () => {
      toast.success(t("success"), {
        description: t("workflowUpdatedSuccess"),
      });
      queryClient.invalidateQueries(["enrollmentWorkflows"]);
    },
    onError: (error) => {
      toast.error(t("error"), {
        description: t("failedToUpdateWorkflow"),
      });
    },
  });

  // Process class transitions mutation
  const processTransitionsMutation = useMutation({
    mutationFn: ({ fromYear, toYear }) =>
      processClassTransitions(fromYear, toYear, schoolId),
    onSuccess: () => {
      toast.success(t("success"), {
        description: t("classTransitionsProcessedSuccess"),
      });
      queryClient.invalidateQueries(["enrollmentWorkflows"]);
    },
    onError: (error) => {
      toast.error(t("error"), {
        description: error.message || t("failedToProcessTransitions"),
      });
    },
  });

  // Enroll new student mutation
  const enrollNewStudentMutation = useMutation({
    mutationFn: ({ classId, studentData, academicYearId }) =>
      enrollNewStudent(classId, studentData, academicYearId, schoolId),
    onSuccess: () => {
      toast.success(t("success"), {
        description: t("newStudentEnrolledSuccess"),
      });
      setIsNewStudentModal(false);
      setNewStudentData({
        first_name: "",
        last_name: "",
        dob: "",
        gender: "",
        email: "",
        phone: "",
        address: "",
      });
      queryClient.invalidateQueries(["enrollmentWorkflows"]);
    },
    onError: (error) => {
      toast.error(t("error"), {
        description: error.message || t("failedToEnrollNewStudent"),
      });
    },
  });

  // Edit student enrollment mutation
  const editEnrollmentMutation = useMutation({
    mutationFn: ({ enrollmentId, updateData }) =>
      editStudentEnrollment(enrollmentId, updateData, schoolId),
    onSuccess: () => {
      toast.success(t("success"), {
        description: t("enrollmentUpdatedSuccess"),
      });
      setIsEditEnrollmentModal(false);
      setSelectedEnrollment(null);
      queryClient.invalidateQueries(["enrollmentWorkflows"]);
    },
    onError: (error) => {
      toast.error(t("error"), {
        description: error.message || t("failedToUpdateEnrollment"),
      });
    },
  });

  useEffect(() => {
    // Set default years when data is loaded
    if (academicYears?.length) {
      const currentYear = academicYears.find((year) => year.is_active);
      if (currentYear) {
        setSelectedFromYear(currentYear.id.toString());

        const nextYear = academicYears.find((year) =>
          year.name.includes(
            (parseInt(currentYear.name.split("-")[0]) + 1).toString()
          )
        );
        if (nextYear) {
          setSelectedToYear(nextYear.id.toString());
        }
      }
    }
  }, [academicYears]);

  // Filter workflows by search query
  const filteredWorkflows = workflowsData?.results?.filter((workflow) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      workflow.student?.first_name?.toLowerCase().includes(searchLower) ||
      workflow.student?.last_name?.toLowerCase().includes(searchLower) ||
      workflow.student?.matricule?.toLowerCase().includes(searchLower) ||
      workflow.current_class?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectAllWorkflows = (e) => {
    if (e.target.checked) {
      setSelectedWorkflows(filteredWorkflows?.map((w) => w.id) || []);
    } else {
      setSelectedWorkflows([]);
    }
  };

  const toggleWorkflowSelection = (workflowId) => {
    setSelectedWorkflows((prev) =>
      prev.includes(workflowId)
        ? prev.filter((id) => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const handleInitializeWorkflows = () => {
    if (!selectedFromYear || !selectedToYear) {
      toast.error(t("missingInformation"), {
        description: t("pleaseSelectBothYears"),
      });
      return;
    }

    initializeWorkflowsMutation.mutate({
      fromYear: selectedFromYear,
      toYear: selectedToYear,
    });
  };

  const handleAssignClass = () => {
    if (!selectedClassForAssignment || selectedWorkflows.length === 0) {
      toast.error(t("missingInformation"), {
        description: t("pleaseSelectClassAndStudents"),
      });
      return;
    }

    const assignments = selectedWorkflows.map((workflowId) => ({
      workflow_id: workflowId,
      class_id: parseInt(selectedClassForAssignment),
    }));

    bulkAssignMutation.mutate({ assignments });
  };

  const handleProcessTransitions = () => {
    if (!selectedFromYear || !selectedToYear) {
      toast.error(t("missingInformation"), {
        description: t("pleaseSelectBothYears"),
      });
      return;
    }

    processTransitionsMutation.mutate({
      fromYear: selectedFromYear,
      toYear: selectedToYear,
    });
  };

  const handleApproveWorkflow = (workflowId) => {
    updateWorkflowMutation.mutate({
      workflowId,
      updateData: {
        stage: "approved",
      },
    });
  };

  const handleRejectWorkflow = (workflowId) => {
    updateWorkflowMutation.mutate({
      workflowId,
      updateData: {
        stage: "rejected",
      },
    });
  };

  const handleEditEnrollment = (workflow) => {
    setSelectedEnrollment({
      id: workflow.id,
      studentName: `${workflow.student?.first_name} ${workflow.student?.last_name}`,
      currentClass: workflow.current_class?.id,
      targetClass: workflow.target_class?.id,
      stage: workflow.stage,
      notes: workflow.notes || "",
    });
    setIsEditEnrollmentModal(true);
  };

  const handleEnrollNewStudent = () => {
    const selectedClassId = selectedClassForAssignment;
    const academicYearId = selectedToYear;

    if (!selectedClassId || !academicYearId) {
      toast.error(t("missingInformation"), {
        description: t("pleaseSelectClassAndAcademicYear"),
      });
      return;
    }

    enrollNewStudentMutation.mutate({
      classId: parseInt(selectedClassId),
      studentData: newStudentData,
      academicYearId: parseInt(academicYearId),
    });
  };

  const handleSubmitEditEnrollment = () => {
    if (!selectedEnrollment?.id) {
      return;
    }

    editEnrollmentMutation.mutate({
      enrollmentId: selectedEnrollment.id,
      updateData: {
        class_id: parseInt(selectedEnrollment.targetClass),
        stage: selectedEnrollment.stage,
        notes: selectedEnrollment.notes,
      },
    });
  };

  const getStageColor = (stage) => {
    const stageColors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-purple-100 text-purple-800",
    };
    return stageColors[stage] || "bg-gray-100 text-gray-800";
  };

  const getStageLabel = (stage) => {
    const stageLabels = {
      pending: t("pending"),
      in_progress: t("inProgress"),
      approved: t("approved"),
      rejected: t("rejected"),
      completed: t("completed"),
    };
    return stageLabels[stage] || stage;
  };

  const totalPages = workflowsData?.total_pages || 1;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="shadow-md border-0">
        <CardHeader className="bg-primary/5 pb-3">
          <CardTitle className="text-lg flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            {t("studentEnrollment")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-3 flex-1">
              <Select
                value={selectedFromYear}
                onValueChange={setSelectedFromYear}
                disabled={isLoadingYears}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t("fromYear")} />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem
                      key={`from-${year.id}`}
                      value={year.id.toString()}
                    >
                      {year.name}
                      {year.is_active && ` (${t("current")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedToYear}
                onValueChange={setSelectedToYear}
                disabled={isLoadingYears}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t("toYear")} />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem
                      key={`to-${year.id}`}
                      value={year.id.toString()}
                    >
                      {year.name}
                      {year.is_active && ` (${t("current")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t("stage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStages")}</SelectItem>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                  <SelectItem value="approved">{t("approved")}</SelectItem>
                  <SelectItem value="rejected">{t("rejected")}</SelectItem>
                  <SelectItem value="completed">{t("completed")}</SelectItem>
                </SelectContent>
              </Select>

              {/* New Current Class Filter */}
              <Select
                value={selectedCurrentClass}
                onValueChange={setSelectedCurrentClass}
                disabled={isLoadingClasses}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder={t("currentClass")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("allClasses")}</SelectItem>
                  {classesData?.map((classItem) => (
                    <SelectItem
                      key={`class-${classItem.id}`}
                      value={classItem.id.toString()}
                    >
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setIsNewStudentModal(true)}
                variant="outline"
                className="whitespace-nowrap"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t("newStudent")}
              </Button>

              <Button
                onClick={() => setIsInitializingModal(true)}
                variant="outline"
                className="whitespace-nowrap"
              >
                <FileText className="h-4 w-4 mr-2" />
                {t("initialize")}
              </Button>

              <Button
                onClick={handleProcessTransitions}
                variant="default"
                className="whitespace-nowrap"
                disabled={processTransitionsMutation.isLoading}
              >
                {processTransitionsMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                )}
                {t("processTransitions")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t("searchStudents")}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {selectedWorkflows.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  {selectedWorkflows.length} {t("selected")}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAssignClassModal(true)}
                >
                  {t("assignToClass")}
                </Button>
              </div>
            )}
          </div>

          {/* Workflows Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      id="select-all"
                      onCheckedChange={handleSelectAllWorkflows}
                      checked={
                        selectedWorkflows.length > 0 &&
                        selectedWorkflows.length === filteredWorkflows?.length
                      }
                    />
                  </TableHead>
                  <TableHead>{t("student")}</TableHead>
                  <TableHead>{t("currentClass")}</TableHead>
                  <TableHead>{t("targetClass")}</TableHead>
                  <TableHead>{t("stage")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingWorkflows ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {t("loadingWorkflows")}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : filteredWorkflows?.length ? (
                  filteredWorkflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedWorkflows.includes(workflow.id)}
                          onCheckedChange={() =>
                            toggleWorkflowSelection(workflow.id)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>
                            {workflow.student?.first_name}{" "}
                            {workflow.student?.last_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {workflow.student?.matricule}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {workflow.current_class?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {workflow.target_class?.name || t("notAssigned")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStageColor(workflow.stage)}>
                          {getStageLabel(workflow.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {workflow.stage === "pending" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600"
                                onClick={() =>
                                  handleApproveWorkflow(workflow.id)
                                }
                                title={t("approve")}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600"
                                onClick={() =>
                                  handleRejectWorkflow(workflow.id)
                                }
                                title={t("reject")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => handleEditEnrollment(workflow)}
                            title={t("edit")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title={t("viewDetails")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <p className="text-gray-500">{t("noWorkflowsFound")}</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setIsInitializingModal(true)}
                      >
                        {t("initializeEnrollmentWorkflows")}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-500">
                  {t("showing")} {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, workflowsData?.count || 0)}{" "}
                  {t("of")} {workflowsData?.count || 0}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    {t("previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    {t("next")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Initialize Workflows Modal */}
      <Dialog open={isInitializingModal} onOpenChange={setIsInitializingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("initializeEnrollmentWorkflows")}</DialogTitle>
            <DialogDescription>
              {t("initializeWorkflowsDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("fromAcademicYear")}
              </label>
              <Select
                value={selectedFromYear}
                onValueChange={setSelectedFromYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectYear")} />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem
                      key={`init-from-${year.id}`}
                      value={year.id.toString()}
                    >
                      {year.name}
                      {year.is_active && ` (${t("current")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("toAcademicYear")}
              </label>
              <Select value={selectedToYear} onValueChange={setSelectedToYear}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectYear")} />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year) => (
                    <SelectItem
                      key={`init-to-${year.id}`}
                      value={year.id.toString()}
                    >
                      {year.name}
                      {year.is_active && ` (${t("current")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInitializingModal(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleInitializeWorkflows}
              disabled={initializeWorkflowsMutation.isLoading}
            >
              {initializeWorkflowsMutation.isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t("initialize")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Class Modal */}
      <Dialog open={isAssignClassModal} onOpenChange={setIsAssignClassModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("assignStudentsToClass")}</DialogTitle>
            <DialogDescription>
              {t("assignClassDescription", { count: selectedWorkflows.length })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("targetClass")}
              </label>
              <Select
                value={selectedClassForAssignment}
                onValueChange={setSelectedClassForAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectClass")} />
                </SelectTrigger>
                <SelectContent>
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignClassModal(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleAssignClass}
              disabled={bulkAssignMutation.isLoading}
            >
              {bulkAssignMutation.isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t("assignStudents")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Student Enrollment Modal */}
      <Dialog open={isNewStudentModal} onOpenChange={setIsNewStudentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("enrollNewStudent")}</DialogTitle>
            <DialogDescription>{t("enterNewStudentDetails")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t("firstName")}
                </label>
                <Input
                  value={newStudentData.first_name}
                  onChange={(e) =>
                    setNewStudentData((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  placeholder={t("enterFirstName")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t("lastName")}
                </label>
                <Input
                  value={newStudentData.last_name}
                  onChange={(e) =>
                    setNewStudentData((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  placeholder={t("enterLastName")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("dateOfBirth")}
              </label>
              <Input
                type="date"
                value={newStudentData.dob}
                onChange={(e) =>
                  setNewStudentData((prev) => ({
                    ...prev,
                    dob: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("gender")}
              </label>
              <Select
                value={newStudentData.gender}
                onValueChange={(value) =>
                  setNewStudentData((prev) => ({ ...prev, gender: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectGender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("male")}</SelectItem>
                  <SelectItem value="female">{t("female")}</SelectItem>
                  <SelectItem value="other">{t("other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("email")}
              </label>
              <Input
                type="email"
                value={newStudentData.email}
                onChange={(e) =>
                  setNewStudentData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder={t("enterEmail")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("phone")}
              </label>
              <Input
                value={newStudentData.phone}
                onChange={(e) =>
                  setNewStudentData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder={t("enterPhone")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("address")}
              </label>
              <Input
                value={newStudentData.address}
                onChange={(e) =>
                  setNewStudentData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder={t("enterAddress")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("assignToClass")}
              </label>
              <Select
                value={selectedClassForAssignment}
                onValueChange={setSelectedClassForAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectClass")} />
                </SelectTrigger>
                <SelectContent>
                  {classesData?.map((classItem) => (
                    <SelectItem
                      key={`new-student-class-${classItem.id}`}
                      value={classItem.id.toString()}
                    >
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewStudentModal(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleEnrollNewStudent}
              disabled={enrollNewStudentMutation.isLoading}
            >
              {enrollNewStudentMutation.isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t("enrollStudent")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Enrollment Modal */}
      <Dialog
        open={isEditEnrollmentModal}
        onOpenChange={setIsEditEnrollmentModal}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editEnrollment")}</DialogTitle>
            <DialogDescription>
              {t("editEnrollmentFor", {
                name: selectedEnrollment?.studentName,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("targetClass")}
              </label>
              <Select
                value={selectedEnrollment?.targetClass?.toString()}
                onValueChange={(value) =>
                  setSelectedEnrollment((prev) => ({
                    ...prev,
                    targetClass: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectClass")} />
                </SelectTrigger>
                <SelectContent>
                  {classesData?.map((classItem) => (
                    <SelectItem
                      key={`edit-class-${classItem.id}`}
                      value={classItem.id.toString()}
                    >
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("enrollmentStage")}
              </label>
              <Select
                value={selectedEnrollment?.stage}
                onValueChange={(value) =>
                  setSelectedEnrollment((prev) => ({ ...prev, stage: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                  <SelectItem value="approved">{t("approved")}</SelectItem>
                  <SelectItem value="rejected">{t("rejected")}</SelectItem>
                  <SelectItem value="completed">{t("completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {t("notes")}
              </label>
              <Input
                value={selectedEnrollment?.notes}
                onChange={(e) =>
                  setSelectedEnrollment((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder={t("enterNotes")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditEnrollmentModal(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmitEditEnrollment}
              disabled={editEnrollmentMutation.isLoading}
            >
              {editEnrollmentMutation.isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnrollmentTab;
