// src/app/[locale]/dashboard/finance/_components/tabs/ClassFeesTab.tsx

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import {
  PaginatedResponse,
  ClassFee,
  FeeType,
  SimpleAcademicYearOption,
  SimpleClassOption,
} from "@/types/fees";
import { School } from "@/types/auth";
import { fetchClassFees, deleteClassFee, fetchFeeTypes } from "@/queries/fees";
import { fetchAcademicYears } from "@/queries/results";
import { fetchAllClasses } from "@/queries/class";
import { Button } from "@/components/ui/button";
import { ClassFeeColumns } from "./ClassFeeColumn";
import LoadingErrorState from "./LoadingErrorState";
import { FilterControls } from "./FilterControls";
import { ClassFeeDataTable } from "./ClassFeeDataTable";
import AddEditClassFeeDialog from "./AddEditClassFeeDailog";
import AssignFeesDialog from "./AssignFeeType";
import ConfirmationDialog from "./ConfirmDailogue";
// Corrected path

interface ClassFeesTabProps {
  school: School;
}

const DEFAULT_PAGE_SIZE = 20;

const ClassFeesTab: React.FC<ClassFeesTabProps> = ({ school }) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();

  const locale = "fr-CM";
  const currency = "XAF";

  // --- State --- (Keep state management as is)
  const [filters, setFilters] = useState({
    search: "",
    academic_year: undefined as number | undefined,
    class_instance: undefined as number | undefined,
    fee_type: undefined as number | undefined,
    page: 1,
  });
  const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClassFee, setSelectedClassFee] = useState<ClassFee | null>(
    null
  );

  // --- Data Fetching --- (Keep data fetching as is)
  const queryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      academic_year: filters.academic_year,
      class_instance: filters.class_instance,
      fee_type: filters.fee_type,
      page: filters.page,
      page_size: DEFAULT_PAGE_SIZE,
    }),
    [filters]
  );

  const { data, isLoading, error, isFetching } = useQuery<
    PaginatedResponse<ClassFee>,
    Error
  >({
    queryKey: ["classFees", queryParams],
    queryFn: () => fetchClassFees(queryParams),
    placeholderData: (previousData) => previousData,
    staleTime: 1 * 60 * 1000,
  });

  const { data: academicYears } = useQuery<SimpleAcademicYearOption[]>({
    queryKey: ["academicYearsSimple"],
    queryFn: () => fetchAcademicYears({ page_size: 1000 }),
  });
  const { data: classes } = useQuery<SimpleClassOption[]>({
    queryKey: ["classesSimple"],
    queryFn: () => fetchAllClasses(),
  });
  const { data: feeTypesPaginated } = useQuery<PaginatedResponse<FeeType>>({
    queryKey: ["feeTypesSimple"],
    queryFn: () => fetchFeeTypes({ is_active: true, page_size: 1000 }),
  });
  const feeTypes = feeTypesPaginated?.results ?? [];

  // --- Mutations --- (Keep mutations as is)
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteClassFee(id),
    onSuccess: () => {
      toast.success(tc("success"), {
        description: t("classFeeDeletedSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["classFees", queryParams] });
      setDeleteDialogOpen(false);
      setSelectedClassFee(null);
    },
    onError: (err: Error) => {
      toast.error(tc("error"), {
        description: err.message || t("classFeeDeletedError"),
      });
    },
  });

  // --- Action Handlers --- (Keep handlers as is)
  const handleAdd = useCallback(() => {
    setSelectedClassFee(null);
    setAddEditDialogOpen(true);
  }, []);
  const handleEdit = useCallback((classFee: ClassFee) => {
    setSelectedClassFee(classFee);
    setAddEditDialogOpen(true);
  }, []);
  const handleAssign = useCallback((classFee: ClassFee) => {
    setSelectedClassFee(classFee);
    setAssignDialogOpen(true);
  }, []);
  const handleDelete = useCallback((classFee: ClassFee) => {
    setSelectedClassFee(classFee);
    setDeleteDialogOpen(true);
  }, []);
  const confirmDelete = useCallback(() => {
    if (selectedClassFee) {
      deleteMutation.mutate(selectedClassFee.id);
    }
  }, [selectedClassFee, deleteMutation]);

  // --- *** MODIFIED SECTION: Column Definition *** ---
  const tableColumns = useMemo(() => {
    // Create the labels object using the translators
    const labels = {
      // Common labels
      yesLabel: tc("yes"),
      noLabel: tc("no"),
      openMenuLabel: tc("openMenu"),
      actionsLabel: tc("actions"),
      editLabel: tc("edit"),
      deleteLabel: tc("delete"),
      // Finance specific labels
      assignFeesLabel: t("assignFees"),
      academicYearHeader: t("academicYear"),
      classHeader: t("class"),
      feeTypeHeader: t("feeType"),
      amountHeader: t("amount"),
      dueDateHeader: t("dueDate"),
      installmentsHeader: t("installments"),
      maxNumHeader: t("maxNum"),
    };

    // Pass the labels object instead of t/tc functions
    return ClassFeeColumns({
      labels: labels, // Pass the created labels object
      onEdit: handleEdit,
      onAssign: handleAssign,
      onDelete: handleDelete,
      currency,
      locale,
    });
  }, [t, tc, handleEdit, handleAssign, handleDelete, currency, locale]); // Keep dependencies for t, tc, and handlers

  // --- Filter Configuration --- (Keep filter config as is)
  const filterConfig = useMemo(
    () => [
      {
        id: "search",
        label: tc("search"),
        type: "search",
        placeholder: t("searchClassFeePlaceholder"),
      },
      {
        id: "academic_year",
        label: t("academicYear"),
        type: "select",
        placeholder: tc("selectAll"),
        options:
          academicYears?.map((y) => ({ value: y.id, label: y.name })) || [],
      },
      {
        id: "class_instance",
        label: t("class"),
        type: "select",
        placeholder: tc("selectAll"),
        options:
          classes?.map((c) => ({ value: c.id, label: c.full_name })) || [],
      },
      {
        id: "fee_type",
        label: t("feeType"),
        type: "select",
        placeholder: tc("selectAll"),
        options:
          feeTypes?.map((ft) => ({ value: ft.id, label: ft.name })) || [],
      },
    ],
    [t, tc, academicYears, classes, feeTypes]
  );

  // --- Pagination Calculation --- (Keep pagination as is)
  const totalPages = data?.count
    ? Math.ceil(data.count / DEFAULT_PAGE_SIZE)
    : 1;
  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      totalPages: totalPages,
      hasNext: !!data?.next,
      hasPrev: !!data?.previous,
    }),
    [filters.page, totalPages, data?.next, data?.previous]
  );

  // --- Render Logic --- (Keep render logic as is)
  if (isLoading && filters.page === 1) {
    return <LoadingErrorState isLoading={true} />;
  }
  if (error && filters.page === 1) {
    return <LoadingErrorState error={error} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters and Add Button */}
      <div className="flex justify-between items-start mb-4 gap-4 flex-wrap">
        <FilterControls
          filters={filters}
          setFilters={setFilters}
          config={filterConfig}
        />
        <Button
          onClick={handleAdd}
          size="sm"
          className="ml-auto flex-shrink-0 mt-6"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("addClassFee")}
        </Button>
      </div>

      {/* Loading indicator */}
      {isFetching && !isLoading && (
        <LoadingErrorState
          isLoading={true}
          spinnerSize="small"
          message={tc("loading")}
        />
      )}
      {error && !isLoading && <LoadingErrorState error={error} />}

      {/* Data Table */}
      <ClassFeeDataTable
        columns={tableColumns}
        data={data?.results ?? []}
        pagination={pagination}
        onPageChange={(newPage) =>
          setFilters((prev) => ({ ...prev, page: newPage }))
        }
      />

      {/* Dialogs */}
      <AddEditClassFeeDialog
        isOpen={isAddEditDialogOpen}
        onClose={() => setAddEditDialogOpen(false)}
        classFee={selectedClassFee}
        schoolId={school.id}
      />
      <AssignFeesDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        classFee={selectedClassFee}
        schoolId={school.id}
      />
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t("deleteClassFeeTitle")}
        description={t("deleteClassFeeConfirmDesc", {
          feeName: selectedClassFee?.fee_type_name ?? "",
          className: selectedClassFee?.class_name ?? "",
        })}
        confirmText={tc("delete")}
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
};

export default ClassFeesTab;
