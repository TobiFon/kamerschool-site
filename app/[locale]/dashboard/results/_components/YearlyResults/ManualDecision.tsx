"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Award,
  Save,
  RotateCw,
  AlertTriangle,
  Loader2,
  Check,
} from "lucide-react";
import {
  fetchClassStudentsPromotionData,
  manualPromotionDecision,
} from "@/queries/promotions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Refined status indicators with consistent icons
const statusConfig = {
  promoted: {
    color: "bg-emerald-500 text-white",
    icon: <Check className="h-3.5 w-3.5" />,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  conditional: {
    color: "bg-amber-500 text-white",
    icon: <Award className="h-3.5 w-3.5" />,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  repeated: {
    color: "bg-rose-500 text-white",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  pending: {
    color: "bg-slate-400 text-white",
    icon: <Loader2 className="h-3.5 w-3.5" />,
    badge: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

// Interface representing the state for each student in the dialog
interface StudentPromotionInput {
  student_id: number;
  full_name: string;
  matricule?: string | null;
  promotion_status: "promoted" | "conditional" | "repeated" | "pending";
  fetched_promotion_decision?: {
    id: number;
    status: "promoted" | "conditional" | "repeated" | "graduated";
    is_manual: boolean;
    remarks: string | null;
    decision_date: string | null;
  } | null;
  remarks: string;
}

interface ManualPromotionDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearName: string;
  onSuccess?: () => void;
}

const ManualPromotionDecisionDialog: React.FC<
  ManualPromotionDecisionDialogProps
> = ({
  open,
  onOpenChange,
  classId,
  className,
  academicYearId,
  academicYearName,
  onSuccess,
}) => {
  const t = useTranslations("Promotions");
  const queryClient = useQueryClient();
  const [promotionData, setPromotionData] = useState<StudentPromotionInput[]>(
    []
  );
  const [filterText, setFilterText] = useState("");
  const [isUsingLocalStorageDraft, setIsUsingLocalStorageDraft] =
    useState(false);

  const storageKey = `promotionDecisions_${classId}_${academicYearId}`;

  // --- Data Fetching ---
  const {
    data: apiStudentData,
    isLoading: isLoadingApiData,
    isFetching: isFetchingApiData,
    error: fetchError,
    refetch: refetchApiData,
  } = useQuery({
    queryKey: ["classPromotionData", classId, academicYearId],
    queryFn: () => fetchClassStudentsPromotionData(classId, academicYearId),
    enabled: open && !!classId && !!academicYearId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // --- Initialization Logic ---
  const initializeState = useCallback(
    (apiData: any[] | null | undefined) => {
      console.log("Attempting to initialize state...");
      // 1. Check Local Storage first
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft) as StudentPromotionInput[];
          if (Array.isArray(parsedDraft)) {
            console.log(
              `Found draft in localStorage for ${storageKey}, using it.`,
              parsedDraft
            );
            setPromotionData(parsedDraft);
            setIsUsingLocalStorageDraft(true);
            return;
          } else {
            console.warn(
              "Invalid data structure found in localStorage, ignoring."
            );
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error("Error parsing saved promotion data:", error);
          localStorage.removeItem(storageKey);
        }
      }

      // 2. If no valid draft, initialize from API data
      console.log(
        `No valid draft in localStorage, initializing from API data for ${storageKey}.`
      );
      if (!apiData || apiData.length === 0) {
        console.log("No API data available to initialize.");
        setPromotionData([]);
        setIsUsingLocalStorageDraft(false);
        return;
      }

      // Map API data to the state structure
      const initialData = [...apiData]
        .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))
        .map((studentApi) => {
          const decision = studentApi.promotion_decision;
          const initialStatus = decision?.status || "pending";
          const initialRemarks = decision?.remarks || "";

          return {
            student_id: studentApi.id,
            full_name: `${studentApi.first_name} ${studentApi.last_name}`,
            matricule: studentApi.matricule,
            promotion_status: initialStatus as any,
            fetched_promotion_decision: decision,
            remarks: initialRemarks,
          };
        });

      console.log("Initialized state from API data:", initialData);
      setPromotionData(initialData);
      setIsUsingLocalStorageDraft(false);
    },
    [storageKey]
  );

  // --- Effects ---
  useEffect(() => {
    if (open && apiStudentData !== undefined) {
      console.log("Dialog open and API data available/updated.");
      initializeState(apiStudentData);
    }
  }, [open, apiStudentData, initializeState]);

  // Save draft to local storage
  useEffect(() => {
    if (open && isUsingLocalStorageDraft && promotionData.length > 0) {
      console.log(
        `Saving draft to localStorage for ${storageKey}:`,
        promotionData
      );
      localStorage.setItem(storageKey, JSON.stringify(promotionData));
    }
  }, [promotionData, open, storageKey, isUsingLocalStorageDraft]);

  // --- Mutation ---
  const mutation = useMutation({
    mutationFn: (
      decisions: Array<{
        student_id: number;
        status: "promoted" | "conditional" | "repeated";
        remarks?: string;
      }>
    ) => manualPromotionDecision(academicYearId, classId, decisions),
    onSuccess: (data) => {
      console.log("Promotion decisions saved successfully:", data);
      localStorage.removeItem(storageKey);
      setIsUsingLocalStorageDraft(false);
      queryClient.invalidateQueries({
        queryKey: ["classPromotionData", classId, academicYearId],
      });
      queryClient.invalidateQueries({ queryKey: ["enrollmentWorkflows"] });
      queryClient.invalidateQueries({ queryKey: ["enrollmentStatistics"] });

      toast.success(t("promotionDecisionsRecorded"), {
        description: t("promotionDecisionsRecordedSuccess"),
      });
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Error saving promotion decisions:", error);
      toast.error(t("error"), {
        description: error.message || t("promotionDecisionsRecordedError"),
      });
    },
  });

  // --- Event Handlers ---
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  const updateStudentStatus = (
    studentId: number,
    status: "promoted" | "conditional" | "repeated" | "pending"
  ) => {
    setPromotionData((current) =>
      current.map((student) =>
        student.student_id === studentId
          ? { ...student, promotion_status: status }
          : student
      )
    );
    setIsUsingLocalStorageDraft(true);
  };

  const updateStudentRemarks = (studentId: number, remarks: string) => {
    setPromotionData((current) =>
      current.map((student) =>
        student.student_id === studentId ? { ...student, remarks } : student
      )
    );
    setIsUsingLocalStorageDraft(true);
  };

  const bulkUpdateStatus = (
    status: "promoted" | "conditional" | "repeated"
  ) => {
    const studentIdsToUpdate = filteredStudents.map((s) => s.student_id);
    if (studentIdsToUpdate.length === 0) return;

    setPromotionData((current) =>
      current.map((student) =>
        studentIdsToUpdate.includes(student.student_id)
          ? { ...student, promotion_status: status }
          : student
      )
    );
    setIsUsingLocalStorageDraft(true);
  };

  const handleSubmit = () => {
    const submitData = promotionData
      .filter((student) => student.promotion_status !== "pending")
      .map((student) => ({
        student_id: student.student_id,
        status: student.promotion_status as
          | "promoted"
          | "conditional"
          | "repeated",
        remarks: student.remarks,
      }));

    if (submitData.length === 0 && promotionData.length > 0) {
      toast.warning(t("warnings.noDecisionsMade"));
      return;
    }
    if (submitData.length < promotionData.length) {
      if (
        !window.confirm(
          t("confirmations.submitPartial", {
            pendingCount: promotionData.length - submitData.length,
          })
        )
      ) {
        return;
      }
    }

    console.log("Submitting filtered promotion decisions:", submitData);
    mutation.mutate(submitData);
  };

  const handleRefreshData = () => {
    if (
      isUsingLocalStorageDraft &&
      !window.confirm(t("confirmations.discardChanges"))
    ) {
      return;
    }
    console.log("Refreshing data from API...");
    localStorage.removeItem(storageKey);
    setIsUsingLocalStorageDraft(false);
    refetchApiData();
    toast.info(t("dataRefreshed"), {
      description: t("promotionDataRefreshedFromServer"),
    });
  };

  // --- Memoized Filtered Data ---
  const filteredStudents = useMemo(
    () =>
      promotionData.filter(
        (student) =>
          student.full_name?.toLowerCase().includes(filterText.toLowerCase()) ||
          student.matricule?.toLowerCase().includes(filterText.toLowerCase())
      ),
    [promotionData, filterText]
  );

  // --- Loading/Error States ---
  const isLoading = isLoadingApiData || mutation.isPending;
  const hasApiError = !!fetchError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-lg shadow-xl">
        <DialogHeader className="p-6 pb-0 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {t("manualPromotionDecisions")}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm flex items-center">
                <span className="font-medium text-gray-700">{className}</span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600">{academicYearName}</span>
                {isUsingLocalStorageDraft && (
                  <Badge
                    variant="outline"
                    className="ml-3 text-amber-700 border-amber-300 bg-amber-50 px-2 py-0.5 text-xs animate-pulse"
                  >
                    {t("unsavedChanges")}
                  </Badge>
                )}
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshData}
              disabled={isLoading || isFetchingApiData}
              className="h-9 whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              title={t("refreshDataTooltip")}
            >
              <RotateCw
                className={`h-4 w-4 mr-2 ${
                  isFetchingApiData ? "animate-spin" : ""
                }`}
              />
              {t("refreshData")}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search and Bulk Actions */}
          <div className="p-6 pb-4 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("searchStudents")}
                  value={filterText}
                  onChange={handleFilterChange}
                  className="pl-10 h-10 w-full bg-white border-gray-200"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                  {t("bulkActions")}:
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-10 ${statusConfig.promoted.badge}`}
                    onClick={() => bulkUpdateStatus("promoted")}
                    disabled={isLoading}
                  >
                    <span
                      className={`h-5 w-5 rounded-full mr-1.5 flex items-center justify-center ${statusConfig.promoted.color}`}
                    >
                      {statusConfig.promoted.icon}
                    </span>
                    {t("promoted")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-10 ${statusConfig.conditional.badge}`}
                    onClick={() => bulkUpdateStatus("conditional")}
                    disabled={isLoading}
                  >
                    <span
                      className={`h-5 w-5 rounded-full mr-1.5 flex items-center justify-center ${statusConfig.conditional.color}`}
                    >
                      {statusConfig.conditional.icon}
                    </span>
                    {t("conditional")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-10 ${statusConfig.repeated.badge}`}
                    onClick={() => bulkUpdateStatus("repeated")}
                    disabled={isLoading}
                  >
                    <span
                      className={`h-5 w-5 rounded-full mr-1.5 flex items-center justify-center ${statusConfig.repeated.color}`}
                    >
                      {statusConfig.repeated.icon}
                    </span>
                    {t("repeated")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {hasApiError && (
            <div className="px-6 pt-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t("errorLoadingTitle")}</AlertTitle>
                <AlertDescription>
                  {fetchError.message || t("errorLoadingDesc")}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Table Area */}
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
            {isLoadingApiData && !apiStudentData ? (
              <div className="flex justify-center items-center py-12 h-full">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="mt-4 text-gray-500 font-medium">
                    {t("loadingData")}...
                  </span>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="w-14 text-center font-medium text-gray-700 py-3">
                        #
                      </TableHead>
                      <TableHead className="w-[30%] font-medium text-gray-700 py-3">
                        {t("student")}
                      </TableHead>
                      <TableHead className="w-[30%] font-medium text-gray-700 py-3">
                        {t("promotionStatus")}
                      </TableHead>
                      <TableHead className="w-[40%] font-medium text-gray-700 py-3">
                        {t("remarks")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-16 text-gray-500 h-48"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-600">
                              {filterText
                                ? t("noStudentsFound")
                                : t("noStudents")}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {filterText
                                ? t("tryAnotherSearch")
                                : t("noStudentsInClass")}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <TableRow
                          key={student.student_id}
                          className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <TableCell className="font-medium text-center text-sm text-gray-500 align-middle py-3 pl-4">
                            {index + 1}
                          </TableCell>
                          <TableCell className="py-4 align-middle">
                            <div className="flex flex-col">
                              <div className="font-medium text-gray-900">
                                {student.full_name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {student.matricule || "N/A"}
                              </div>
                              {student.fetched_promotion_decision && (
                                <Badge
                                  variant="outline"
                                  className={`mt-2 text-xs px-2 py-0.5 ${
                                    student.promotion_status ===
                                    student.fetched_promotion_decision.status
                                      ? "bg-gray-50 text-gray-600 border-gray-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                  title={`Originally: ${t(
                                    student.fetched_promotion_decision.status
                                  )}`}
                                >
                                  {t("originalStatusShort")}:{" "}
                                  {t(student.fetched_promotion_decision.status)}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 align-middle">
                            <Select
                              value={student.promotion_status}
                              onValueChange={(value: any) =>
                                updateStudentStatus(student.student_id, value)
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger className="w-full h-10 bg-white border-gray-200">
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                        statusConfig[student.promotion_status]
                                          .color
                                      }`}
                                    >
                                      {
                                        statusConfig[student.promotion_status]
                                          .icon
                                      }
                                    </span>
                                    <span className="font-medium">
                                      {t(student.promotion_status)}
                                    </span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`h-6 w-6 rounded-full flex items-center justify-center ${statusConfig.pending.color}`}
                                    >
                                      {statusConfig.pending.icon}
                                    </span>
                                    <span>{t("pending")}</span>
                                  </div>
                                </SelectItem>
                                {(
                                  [
                                    "promoted",
                                    "conditional",
                                    "repeated",
                                  ] as const
                                ).map((statusKey) => (
                                  <SelectItem key={statusKey} value={statusKey}>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`h-6 w-6 rounded-full flex items-center justify-center ${statusConfig[statusKey].color}`}
                                      >
                                        {statusConfig[statusKey].icon}
                                      </span>
                                      <span>{t(statusKey)}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-4 align-middle pr-4">
                            <Textarea
                              placeholder={t("optionalRemarks")}
                              value={student.remarks || ""}
                              onChange={(e) =>
                                updateStudentRemarks(
                                  student.student_id,
                                  e.target.value
                                )
                              }
                              className="min-h-[40px] h-10 resize-y text-sm bg-white border-gray-200"
                              disabled={isLoading}
                              rows={2}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center w-full">
            <Badge
              variant="secondary"
              className="px-3 py-1.5 bg-white border-gray-200 text-gray-600"
            >
              {filteredStudents.length} {t("studentsShown")}
            </Badge>
            <div className="space-x-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  mutation.isPending ||
                  isLoadingApiData ||
                  hasApiError
                }
                className="h-10 px-4 gap-2 bg-primary hover:bg-primary/90"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("savePromotionDecisions")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPromotionDecisionDialog;
