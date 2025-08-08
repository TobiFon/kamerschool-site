"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  PaginatedResponse,
  Payment,
  SimpleOption,
  FeeType,
  SimpleAcademicYearOption,
} from "@/types/fees";
import { School } from "@/types/auth";
import { fetchFeeTypes, fetchPayments, deletePayment } from "@/queries/fees";
import { fetchAcademicYears } from "@/queries/results";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser"; // Import the hook
import { PaymentColumns } from "./PaymentColumns";
import LoadingErrorState from "./LoadingErrorState";
import { FilterControls } from "./FilterControls";
import { PaymentDataTable } from "./PaymentDataTable";
import ConfirmationDialog from "./ConfirmDailogue";

// Define payment method options
const paymentMethodOptions: SimpleOption[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];

interface PaymentsTabProps {
  school: School;
}

const DEFAULT_PAGE_SIZE = 20;

const PaymentsTab: React.FC<PaymentsTabProps> = ({ school }) => {
  const tf = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();
  const { canEdit } = useCurrentUser(); // Get user permission status

  const locale = "fr-CM";
  const currency = "XAF";

  // --- State ---
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    academic_year_id: undefined as number | undefined,
    fee_type_id: undefined as number | undefined,
    payment_method: undefined as string | undefined,
    page: 1,
  });

  // --- Data Fetching ---
  const queryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      student_fee__class_fee__academic_year: filters.academic_year_id,
      student_fee__class_fee__fee_type: filters.fee_type_id,
      payment_method: filters.payment_method,
      page: filters.page,
      page_size: DEFAULT_PAGE_SIZE,
    }),
    [filters]
  );

  const { data, isLoading, error, isFetching } = useQuery<
    PaginatedResponse<Payment>,
    Error
  >({
    queryKey: ["payments", queryParams],
    queryFn: () => fetchPayments(queryParams),
    placeholderData: (previousData) => previousData,
    staleTime: 1 * 60 * 1000,
  });

  const { data: academicYears } = useQuery<SimpleAcademicYearOption[]>({
    queryKey: ["academicYearsSimple"],
    queryFn: () => fetchAcademicYears({ page_size: 1000 }),
  });

  const { data: feeTypesPaginated } = useQuery<PaginatedResponse<FeeType>>({
    queryKey: ["feeTypesSimple"],
    queryFn: () => fetchFeeTypes({ is_active: true, page_size: 1000 }),
  });
  const feeTypes = feeTypesPaginated?.results ?? [];

  // --- Delete Mutation ---
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePayment(id),
    onSuccess: (_, deletedPaymentId) => {
      toast.success(tc("success"), {
        description: tf("paymentDeletedSuccess"),
      });

      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["studentFees"] });
      queryClient.invalidateQueries({ queryKey: ["feeDashboard"] });

      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    },
    onError: (err: Error) => {
      toast.error(tc("error"), {
        description: err.message || tf("paymentDeletedError"),
      });
    },
  });

  // --- Action Handlers ---
  const handleDelete = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedPayment) {
      deleteMutation.mutate(selectedPayment.id);
    }
  }, [selectedPayment, deleteMutation]);

  // --- Column Definition ---
  const tableColumns = useMemo(
    () =>
      PaymentColumns({
        t: tc,
        tf: tf,
        currency,
        locale,
        onDelete: handleDelete,
        canEdit: canEdit, // Pass permission status down
      }),
    [tc, tf, currency, locale, handleDelete, canEdit] // Add canEdit to dependency array
  );

  // --- Filter Configuration ---
  const filterConfig = useMemo(
    () => [
      {
        id: "search",
        label: tc("search"),
        type: "search",
        placeholder: tf("searchPaymentsPlaceholder"),
      },
      {
        id: "academic_year_id",
        label: tf("academicYear"),
        type: "select",
        placeholder: tc("selectAll"),
        options:
          academicYears?.map((y) => ({ value: y.id, label: y.name })) || [],
      },
      {
        id: "fee_type_id",
        label: tf("feeType"),
        type: "select",
        placeholder: tc("selectAll"),
        options:
          feeTypes?.map((ft) => ({ value: ft.id, label: ft.name })) || [],
      },
      {
        id: "payment_method",
        label: tf("paymentMethod"),
        type: "select",
        placeholder: tc("selectAll"),
        options: paymentMethodOptions.map((m) => ({
          value: m.value,
          label: tf(m.label.replace(/\s+/g, ""), {}, { fallback: m.label }),
        })),
      },
    ],
    [tf, tc, academicYears, feeTypes]
  );

  // --- Pagination Calculation ---
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

  // --- Render Logic ---
  if (isLoading && filters.page === 1) {
    return <LoadingErrorState isLoading={true} />;
  }

  if (error && filters.page === 1) {
    return <LoadingErrorState error={error} />;
  }

  return (
    <div className="space-y-4">
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
      {error && !isLoading && <LoadingErrorState error={error} />}

      <PaymentDataTable
        columns={tableColumns}
        data={data?.results ?? []}
        pagination={pagination}
        onPageChange={(newPage) =>
          setFilters((prev) => ({ ...prev, page: newPage }))
        }
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={tf("deletePaymentTitle")}
        description={tf("deletePaymentConfirmDesc", {
          amount: formatCurrency(
            selectedPayment?.amount ?? "0",
            currency,
            locale
          ),
          studentName: selectedPayment?.student_name ?? tc("unknownStudent"),
          date: formatDate(selectedPayment?.payment_date ?? "", locale),
        })}
        confirmText={tc("delete")}
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
};

export default PaymentsTab;
