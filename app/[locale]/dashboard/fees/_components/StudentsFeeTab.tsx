"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  PaginatedResponse,
  SimpleOption,
  StudentFee,
  FeeType,
  SimpleAcademicYearOption,
  SimpleClassOption,
} from "@/types/fees";
import { School } from "@/types/auth";
import { fetchFeeTypes, fetchStudentFees } from "@/queries/fees";
import { fetchAcademicYears } from "@/queries/results";
import { fetchAllClasses } from "@/queries/class";
import { toast } from "sonner";

import { useCurrentUser } from "@/hooks/useCurrentUser"; // Import the hook
import { StudentFeeColumns } from "./StudentsFeeColumn";
import LoadingErrorState from "./LoadingErrorState";
import { FilterControls } from "./FilterControls";
import { StudentFeeDataTable } from "./StudentsFeeDataTable";
import WaiveFeeDialog from "./WaiveFeeDailogue";
import MakePaymentDialog from "./MakePaymentsDailog";
import StudentFeeDetailDialog from "./StudentFeeDetailDialog";

// Define status options for filter dropdown
const statusOptions: SimpleOption[] = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "waived", label: "Waived" },
];

interface StudentFeesTabProps {
  school: School;
}

const DEFAULT_PAGE_SIZE = 20;

const StudentFeesTab: React.FC<StudentFeesTabProps> = ({ school }) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();
  const { canEdit } = useCurrentUser(); // Get user permission status

  const locale = "fr-CM";
  const currency = "XAF";

  // --- State ---
  const [isWaiveDialogOpen, setWaiveDialogOpen] = useState(false);
  const [isMakePaymentDialogOpen, setMakePaymentDialogOpen] = useState(false);
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStudentFee, setSelectedStudentFee] =
    useState<StudentFee | null>(null);

  const [filters, setFilters] = useState<{
    search: string;
    academic_year?: number;
    class_instance?: number;
    fee_type?: number;
    status?: string;
    page: number;
  }>({
    search: "",
    academic_year: undefined,
    class_instance: undefined,
    fee_type: undefined,
    status: undefined,
    page: 1,
  });

  // --- Data Fetching ---
  const queryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      class_fee__academic_year: filters.academic_year,
      class_fee__class_instance: filters.class_instance,
      class_fee__fee_type: filters.fee_type,
      status: filters.status,
      page: filters.page,
      page_size: DEFAULT_PAGE_SIZE,
    }),
    [filters]
  );

  const { data, isLoading, error, isFetching } = useQuery<
    PaginatedResponse<StudentFee>,
    Error
  >({
    queryKey: ["studentFees", queryParams],
    queryFn: () => fetchStudentFees(queryParams),
    placeholderData: (previousData) => previousData,
    staleTime: 1 * 60 * 1000,
  });

  const { data: academicYears } = useQuery<SimpleAcademicYearOption[]>({
    queryKey: ["academicYearsSimple"],
    queryFn: () => fetchAcademicYears({ page_size: 1000 }),
    staleTime: Infinity,
  });

  const { data: classes } = useQuery<SimpleClassOption[]>({
    queryKey: ["classesSimple"],
    queryFn: () => fetchAllClasses(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: feeTypesPaginated } = useQuery<PaginatedResponse<FeeType>>({
    queryKey: ["feeTypesSimple", school.id],
    queryFn: () =>
      fetchFeeTypes({
        is_active: true,
        page_size: 1000,
      }),
    staleTime: 5 * 60 * 1000,
  });
  const feeTypes = feeTypesPaginated?.results ?? [];

  // --- Action Handlers ---
  const handleViewDetails = useCallback((fee: StudentFee) => {
    setSelectedStudentFee(fee);
    setDetailDialogOpen(true);
  }, []);

  const handleMakePayment = useCallback(
    (fee: StudentFee) => {
      if (fee.status === "paid" || fee.status === "waived") {
        toast.warning(tc("warning"), {
          description: t("cannotPayPaidOrWaived"),
        });
        return;
      }
      setSelectedStudentFee(fee);
      setMakePaymentDialogOpen(true);
    },
    [t, tc]
  );

  const handleWaive = useCallback(
    (fee: StudentFee) => {
      if (fee.status === "paid" || fee.status === "waived") {
        toast.warning(tc("warning"), {
          description: t("cannotWaivePaidOrWaived"),
        });
        return;
      }
      setSelectedStudentFee(fee);
      setWaiveDialogOpen(true);
    },
    [t, tc]
  );

  // --- Column Definition (Memoized) ---
  const tableColumns = useMemo(
    () =>
      StudentFeeColumns({
        t: t,
        tc: tc,
        onViewDetails: handleViewDetails,
        onMakePayment: handleMakePayment,
        onWaive: handleWaive,
        currency,
        locale,
        canEdit: canEdit, // Pass permission status down
      }),
    [
      t,
      tc,
      handleViewDetails,
      handleMakePayment,
      handleWaive,
      currency,
      locale,
      canEdit, // Add canEdit to dependency array
    ]
  );

  // --- Filter Configuration ---
  const filterConfig = useMemo(
    () => [
      {
        id: "search",
        label: tc("searchStudent"),
        type: "search" as const,
        placeholder: tc("enterNameMatricule"),
      },
      {
        id: "academic_year",
        label: t("academicYear"),
        type: "select" as const,
        placeholder: tc("selectAll"),
        options:
          academicYears?.map((y) => ({ value: y.id, label: y.name })) || [],
      },
      {
        id: "class_instance",
        label: t("class"),
        type: "select" as const,
        placeholder: tc("selectAll"),
        options:
          classes?.map((c) => ({ value: c.id, label: c.full_name })) || [],
      },
      {
        id: "fee_type",
        label: t("feeType"),
        type: "select" as const,
        placeholder: tc("selectAll"),
        options:
          feeTypes?.map((ft) => ({ value: ft.id, label: ft.name })) || [],
      },
      {
        id: "status",
        label: t("status"),
        type: "select" as const,
        placeholder: t("selectStatus"),
        options: statusOptions.map((s) => ({
          value: s.value,
          label: t(s.label.replace(/\s+/g, "")),
        })),
      },
    ],
    [t, tc, academicYears, classes, feeTypes]
  );

  // --- Pagination Calculation ---
  const totalItems = data?.count ?? 0;
  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      totalPages: totalPages > 0 ? totalPages : 1,
      hasNext: !!data?.next,
      hasPrev: !!data?.previous,
      totalItems: totalItems,
    }),
    [filters.page, totalPages, data?.next, data?.previous, totalItems]
  );

  // --- Render Logic ---
  if (isLoading && filters.page === 1) {
    return <LoadingErrorState isLoading={true} />;
  }
  if (error && filters.page === 1) {
    return <LoadingErrorState error={error} />;
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <FilterControls
        filters={filters}
        setFilters={setFilters}
        config={filterConfig}
      />
      {isFetching && !isLoading && (
        <LoadingErrorState
          isLoading={true}
          spinnerSize="small"
          message={tc("loading")}
        />
      )}
      {error && !isLoading && !data?.results?.length && (
        <LoadingErrorState error={error} />
      )}
      <StudentFeeDataTable
        columns={tableColumns}
        data={data?.results ?? []}
        pagination={pagination}
        onPageChange={(newPage) =>
          setFilters((prev) => ({ ...prev, page: newPage }))
        }
      />
      {selectedStudentFee && (
        <>
          <WaiveFeeDialog
            isOpen={isWaiveDialogOpen}
            onClose={() => setWaiveDialogOpen(false)}
            studentFee={selectedStudentFee}
            schoolId={school.id}
            currency={currency}
            locale={locale}
          />
          <MakePaymentDialog
            isOpen={isMakePaymentDialogOpen}
            onClose={() => setMakePaymentDialogOpen(false)}
            studentFee={selectedStudentFee}
            currency={currency}
            locale={locale}
          />
          <StudentFeeDetailDialog
            isOpen={isDetailDialogOpen}
            onClose={() => setDetailDialogOpen(false)}
            studentFeeId={selectedStudentFee.id}
            currency={currency}
            locale={locale}
          />
        </>
      )}
    </div>
  );
};

export default StudentFeesTab;
