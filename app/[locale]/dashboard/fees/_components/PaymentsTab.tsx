// src/app/[locale]/dashboard/finance/_components/tabs/PaymentsTab.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Added mutation
import { useTranslations } from "next-intl";
import {
  PaginatedResponse,
  Payment,
  SimpleOption,
  FeeType, // For filter
  SimpleAcademicYearOption,
} from "@/types/fees"; // Corrected types
import { School } from "@/types/auth";
import {
  fetchFeeTypes,
  fetchPayments,
  deletePayment, // Import deletePayment
} from "@/queries/fees";
import { fetchAcademicYears } from "@/queries/results";
import { toast } from "sonner"; // For feedback
import { formatCurrency, formatDate } from "@/lib/utils"; // Import formatting utils
import { PaymentColumns } from "./PaymentColumns";
import LoadingErrorState from "./LoadingErrorState";
import { FilterControls } from "./FilterControls";
import { PaymentDataTable } from "./PaymentDataTable";
import ConfirmationDialog from "./ConfirmDailogue";

// Define payment method options (keys match backend choices)
const paymentMethodOptions: SimpleOption[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];

interface PaymentsTabProps {
  school: School; // Receive school prop
}

// *** Define Page Size ***
const DEFAULT_PAGE_SIZE = 20; // Or your preferred default

const PaymentsTab: React.FC<PaymentsTabProps> = ({ school }) => {
  const tf = useTranslations("Finance"); // Finance specific translations
  const tc = useTranslations("Common"); // Common translations
  const queryClient = useQueryClient();

  const locale = "fr-CM"; // TODO: Get from context
  const currency = "XAF"; // TODO: Get from context

  // --- State ---
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false); // State for delete dialog
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null); // State for payment to delete
  const [filters, setFilters] = useState({
    search: "", // Student name/matricule, reference_number
    academic_year_id: undefined as number | undefined,
    fee_type_id: undefined as number | undefined,
    payment_method: undefined as string | undefined,
    // Add date range filters if needed (e.g., payment_date_after, payment_date_before)
    page: 1,
  });

  // --- Data Fetching ---
  const queryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      // Corrected filter keys based on API structure (via student_fee relation)
      student_fee__class_fee__academic_year: filters.academic_year_id,
      student_fee__class_fee__fee_type: filters.fee_type_id,
      payment_method: filters.payment_method,
      page: filters.page,
      // *** Ensure Page Size is Requested ***
      page_size: DEFAULT_PAGE_SIZE,
      // Add date filters here if implemented
      // school_id: school.id // Only if needed for superuser
    }),
    [filters] // Dependencies
  );

  const { data, isLoading, error, isFetching } = useQuery<
    PaginatedResponse<Payment>, // Ensure type includes `count`
    Error
  >({
    queryKey: ["payments", queryParams], // Use queryParams in key
    queryFn: () => fetchPayments(queryParams),
    placeholderData: (previousData) => previousData,
    staleTime: 1 * 60 * 1000, // 1 minute stale time
  });

  // Data for filters
  const { data: academicYears } = useQuery<SimpleAcademicYearOption[]>({
    queryKey: ["academicYearsSimple"],
    queryFn: () => fetchAcademicYears({ page_size: 1000 }), // Assuming non-paginated ok
  });

  // Assuming fetchFeeTypes returns PaginatedResponse
  const { data: feeTypesPaginated } = useQuery<PaginatedResponse<FeeType>>({
    queryKey: ["feeTypesSimple"],
    queryFn: () => fetchFeeTypes({ is_active: true, page_size: 1000 }), // Fetch many for dropdown
  });
  const feeTypes = feeTypesPaginated?.results ?? []; // Use results array

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePayment(id), // Use the imported deletePayment query
    onSuccess: (_, deletedPaymentId) => {
      // `deletedPaymentId` is the variable passed to mutate()
      toast.success(tc("success"), {
        description: tf("paymentDeletedSuccess"),
      }); // Use Finance translation

      // Invalidate queries after deletion
      queryClient.invalidateQueries({ queryKey: ["payments"] }); // Refetch payments list

      // Invalidate potentially affected student fees and dashboard
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({ queryKey: ["feeDashboard"] });

      // Invalidate specific student summary if available
      const deletedPayment = selectedPayment; // Use the payment stored in state before closing dialog
      if (deletedPayment?.student_fee) {
        // Need student_id, fetch studentFee detail or modify payment serializer if needed
        // For now, we'll just invalidate the generic student fees list
        // queryClient.invalidateQueries({ queryKey: ["studentFeeSummary", studentId] });
      }

      setDeleteDialogOpen(false); // Close dialog
      setSelectedPayment(null); // Clear selected payment
    },
    onError: (err: Error) => {
      toast.error(tc("error"), {
        description: err.message || tf("paymentDeletedError"),
      }); // Use Finance translation
    },
  });

  // --- Action Handlers ---
  const handleDelete = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true); // Open the delete confirmation dialog
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedPayment) {
      deleteMutation.mutate(selectedPayment.id); // Call the mutation with the ID
    }
  }, [selectedPayment, deleteMutation]); // Dependencies

  // --- Column Definition ---
  const tableColumns = useMemo(
    () =>
      PaymentColumns({
        t: tc, // Common translations for actions
        tf: tf, // Finance translations for headers/specific text
        currency,
        locale,
        onDelete: handleDelete, // Pass delete handler
        // onViewReceipt: handleViewReceipt, // Add if receipt viewing is implemented
      }),
    [tc, tf, currency, locale, handleDelete] // Dependencies
  );

  // --- Filter Configuration ---
  const filterConfig = useMemo(
    () => [
      {
        id: "search",
        label: tc("search"),
        type: "search",
        placeholder: tf("searchPaymentsPlaceholder"), // Specific placeholder
      },
      {
        id: "academic_year_id",
        label: tf("academicYear"),
        type: "select",
        placeholder: tc("selectAll"), // Added placeholder
        options:
          academicYears?.map((y) => ({ value: y.id, label: y.name })) || [],
      },
      {
        id: "fee_type_id",
        label: tf("feeType"),
        type: "select",
        placeholder: tc("selectAll"), // Added placeholder
        options:
          feeTypes?.map((ft) => ({ value: ft.id, label: ft.name })) || [], // Use feeTypes array
      },
      {
        id: "payment_method",
        label: tf("paymentMethod"),
        type: "select",
        placeholder: tc("selectAll"), // Added placeholder
        options: paymentMethodOptions.map((m) => ({
          value: m.value,
          // Translate payment method labels using Finance namespace
          label: tf(m.label.replace(/\s+/g, ""), {}, { fallback: m.label }),
        })),
      },
      // Add Date Range Filters here if needed
    ],
    [tf, tc, academicYears, feeTypes] // feeTypes added dependency
  );

  // --- Pagination Calculation ---
  const totalPages = data?.count
    ? Math.ceil(data.count / DEFAULT_PAGE_SIZE) // Calculate pages
    : 1; // Default to 1 if no count

  const pagination = useMemo(
    () => ({
      // Wrap in useMemo
      currentPage: filters.page,
      totalPages: totalPages, // Use the calculated value
      hasNext: !!data?.next,
      hasPrev: !!data?.previous,
      // totalCount: data?.count ?? 0, // Optional
    }),
    [filters.page, totalPages, data?.next, data?.previous]
  ); // Dependencies

  // --- Render Logic ---
  if (isLoading && filters.page === 1) {
    // Show loading only on initial load
    return <LoadingErrorState isLoading={true} />;
  }

  if (error && filters.page === 1) {
    // Show error only on initial load
    return <LoadingErrorState error={error} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <FilterControls
        filters={filters}
        setFilters={setFilters}
        config={filterConfig}
      />
      {/* Loading/Error states for subsequent fetches */}
      {isFetching && !isLoading && (
        <LoadingErrorState
          isLoading={true}
          spinnerSize="small"
          message={tc("loading")}
        />
      )}
      {error && !isLoading && <LoadingErrorState error={error} />}

      {/* Data Table */}
      <PaymentDataTable
        columns={tableColumns}
        data={data?.results ?? []}
        pagination={pagination}
        onPageChange={(newPage) =>
          setFilters((prev) => ({ ...prev, page: newPage }))
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={tf("deletePaymentTitle")}
        description={tf("deletePaymentConfirmDesc", {
          // Format details into the description
          amount: formatCurrency(
            selectedPayment?.amount ?? "0",
            currency,
            locale
          ),
          studentName: selectedPayment?.student_name ?? tc("unknownStudent"),
          date: formatDate(selectedPayment?.payment_date ?? "", locale),
        })}
        confirmText={tc("delete")}
        isConfirming={deleteMutation.isPending} // Pass loading state
      />
    </div>
  );
};

export default PaymentsTab;
