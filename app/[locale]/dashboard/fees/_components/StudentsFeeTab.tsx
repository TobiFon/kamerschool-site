// src/app/[locale]/dashboard/finance/_components/tabs/StudentsFeeTab.tsx
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
} from "@/types/fees"; // Assuming these types are correctly defined
import { School } from "@/types/auth"; // Assuming this type is correctly defined
import { fetchFeeTypes, fetchStudentFees } from "@/queries/fees"; // Ensure these functions exist and match signatures
import { fetchAcademicYears } from "@/queries/results"; // Ensure this function exists
import { fetchAllClasses } from "@/queries/class"; // Ensure this function exists
import { toast } from "sonner";
import { StudentFeeColumns } from "./StudentsFeeColumn"; // Ensure this component exists
import LoadingErrorState from "./LoadingErrorState"; // Ensure this component exists
import { FilterControls } from "./FilterControls"; // Ensure this component exists
import { StudentFeeDataTable } from "./StudentsFeeDataTable"; // Ensure this component exists
import WaiveFeeDialog from "./WaiveFeeDailogue"; // Ensure this component exists
import MakePaymentDialog from "./MakePaymentsDailog"; // Ensure this component exists
import StudentFeeDetailDialog from "./StudentFeeDetailDialog"; // Ensure this component exists

// Define status options for filter dropdown
// Use the EXACT keys that will be used in the translation file
const statusOptions: SimpleOption[] = [
  { value: "pending", label: "Pending" }, // Label is display text / potential translation key base
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "waived", label: "Waived" },
];

interface StudentFeesTabProps {
  school: School; // Assuming School type includes id
}

// Define Page Size
const DEFAULT_PAGE_SIZE = 20; // Or your preferred default

const StudentFeesTab: React.FC<StudentFeesTabProps> = ({ school }) => {
  const t = useTranslations("Finance"); // Namespace for finance-specific translations
  const tc = useTranslations("Common"); // Namespace for common translations
  const queryClient = useQueryClient();

  // TODO: Get locale and currency dynamically (e.g., from context, user settings)
  const locale = "fr-CM";
  const currency = "XAF";

  // --- State ---
  const [isWaiveDialogOpen, setWaiveDialogOpen] = useState(false);
  const [isMakePaymentDialogOpen, setMakePaymentDialogOpen] = useState(false);
  const [isDetailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStudentFee, setSelectedStudentFee] =
    useState<StudentFee | null>(null);

  // State for filters - keys match the 'id' in filterConfig
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

  // Memoize query parameters, mapping state keys to backend expected keys
  const queryParams = useMemo(
    () => ({
      search: filters.search || undefined, // Send undefined if empty string
      class_fee__academic_year: filters.academic_year, // Use Django ORM lookup format
      class_fee__class_instance: filters.class_instance, // Use Django ORM lookup format
      class_fee__fee_type: filters.fee_type, // Use Django ORM lookup format
      status: filters.status, // Status is a direct field on StudentFee
      page: filters.page,
      page_size: DEFAULT_PAGE_SIZE,
      // school_id: school.id, // Add if needed and handled by backend filter/queryset scoping
    }),
    [filters] // Recompute only when filters change
  );

  // Fetch paginated student fees based on queryParams
  const { data, isLoading, error, isFetching } = useQuery<
    PaginatedResponse<StudentFee>,
    Error
  >({
    queryKey: ["studentFees", queryParams], // Include queryParams in the key for caching
    queryFn: () => fetchStudentFees(queryParams), // Pass the correctly formatted params
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
    staleTime: 1 * 60 * 1000, // Data is considered fresh for 1 minute
  });

  // Fetch data for filter dropdowns - assuming they return simple lists or PaginatedResponse
  const { data: academicYears } = useQuery<SimpleAcademicYearOption[]>({
    queryKey: ["academicYearsSimple"],
    queryFn: () => fetchAcademicYears({ page_size: 1000 }), // Fetch many years, assuming SimpleAcademicYearOption {id, name}
    staleTime: Infinity, // Academic years change infrequently
  });

  const { data: classes } = useQuery<SimpleClassOption[]>({
    queryKey: ["classesSimple"],
    queryFn: () => fetchAllClasses(), // Assuming SimpleClassOption {id, full_name}
    staleTime: 5 * 60 * 1000, // Classes might change, refetch every 5 mins
  });

  const { data: feeTypesPaginated } = useQuery<PaginatedResponse<FeeType>>({
    queryKey: ["feeTypesSimple", school.id], // Include school ID if fee types are school-specific
    queryFn: () =>
      fetchFeeTypes({
        is_active: true,
        page_size: 1000 /* school_id: school.id */,
      }), // Fetch active types
    staleTime: 5 * 60 * 1000, // Fee types might change
  });
  const feeTypes = feeTypesPaginated?.results ?? []; // Extract results if paginated

  // --- Action Handlers (useCallback for stable references) ---
  const handleViewDetails = useCallback((fee: StudentFee) => {
    setSelectedStudentFee(fee);
    setDetailDialogOpen(true);
  }, []);

  const handleMakePayment = useCallback(
    (fee: StudentFee) => {
      if (fee.status === "paid" || fee.status === "waived") {
        toast.warning(tc("warning"), {
          description: t("cannotPayPaidOrWaived"), // Use translation
        });
        return;
      }
      setSelectedStudentFee(fee);
      setMakePaymentDialogOpen(true);
    },
    [t, tc] // Dependencies for translations
  );

  const handleWaive = useCallback(
    (fee: StudentFee) => {
      if (fee.status === "paid" || fee.status === "waived") {
        toast.warning(tc("warning"), {
          description: t("cannotWaivePaidOrWaived"), // Use translation
        });
        return;
      }
      setSelectedStudentFee(fee);
      setWaiveDialogOpen(true);
    },
    [t, tc] // Dependencies for translations
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
      }),
    [t, tc, handleViewDetails, handleMakePayment, handleWaive, currency, locale] // Add locale/currency if column formatting depends on them
  );

  // --- Filter Configuration (Memoized) ---
  // Define the structure and options for the FilterControls component
  const filterConfig = useMemo(
    () => [
      {
        id: "search", // Matches filters state key
        label: tc("searchStudent"), // Common translation
        type: "search" as const, // Type for FilterControls logic
        placeholder: tc("enterNameMatricule"), // Common translation
      },
      {
        id: "academic_year", // Matches filters state key
        label: t("academicYear"), // Finance translation
        type: "select" as const,
        placeholder: tc("selectAll"), // Common translation
        options:
          academicYears?.map((y) => ({ value: y.id, label: y.name })) || [], // Map fetched data
      },
      {
        id: "class_instance", // Matches filters state key
        label: t("class"), // Finance translation
        type: "select" as const,
        placeholder: tc("selectAll"), // Common translation
        options:
          classes?.map((c) => ({ value: c.id, label: c.full_name })) || [], // Map fetched data
      },
      {
        id: "fee_type", // Matches filters state key
        label: t("feeType"), // Finance translation
        type: "select" as const,
        placeholder: tc("selectAll"), // Common translation
        options:
          feeTypes?.map((ft) => ({ value: ft.id, label: ft.name })) || [], // Map fetched data
      },
      {
        id: "status", // Matches filters state key
        label: t("status"), // Finance translation
        type: "select" as const,
        placeholder: t("selectStatus"), // Finance translation
        options: statusOptions.map((s) => ({
          value: s.value,
          // Use translation function `t` with the `label` from statusOptions as the key
          label: t(s.label.replace(/\s+/g, "")), // Assuming keys are like 'Pending', 'PartiallyPaid'
        })),
      },
    ],
    [t, tc, academicYears, classes, feeTypes] // Dependencies include data and translations
  );

  // --- Pagination Calculation (Memoized) ---
  const totalItems = data?.count ?? 0;
  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);

  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      totalPages: totalPages > 0 ? totalPages : 1, // Ensure totalPages is at least 1
      hasNext: !!data?.next,
      hasPrev: !!data?.previous,
      totalItems: totalItems, // Optional: Pass total items if needed by DataTable
    }),
    [filters.page, totalPages, data?.next, data?.previous, totalItems]
  );

  // --- Render Logic ---

  // Handle initial loading and error states before filters are interactive
  if (isLoading && filters.page === 1) {
    return <LoadingErrorState isLoading={true} />;
  }
  if (error && filters.page === 1) {
    return <LoadingErrorState error={error} />;
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {" "}
      {/* Add some padding */}
      {/* Filter Controls */}
      <FilterControls
        filters={filters}
        setFilters={setFilters} // Pass the state setter
        config={filterConfig} // Pass the configuration array
      />
      {/* Loading/Error indicators during refetching */}
      {isFetching && !isLoading && (
        <LoadingErrorState
          isLoading={true}
          spinnerSize="small"
          message={tc("loading")} // Common translation
        />
      )}
      {error &&
        !isLoading &&
        !data?.results?.length && ( // Show error if refetch fails and no data shown
          <LoadingErrorState error={error} />
        )}
      {/* Data Table */}
      <StudentFeeDataTable
        columns={tableColumns}
        data={data?.results ?? []} // Provide data or empty array
        pagination={pagination} // Provide pagination state
        onPageChange={
          (newPage) => setFilters((prev) => ({ ...prev, page: newPage })) // Handle page changes
        }
      />
      {/* Dialogs */}
      {selectedStudentFee && ( // Conditionally render dialogs only when a fee is selected
        <>
          <WaiveFeeDialog
            isOpen={isWaiveDialogOpen}
            onClose={() => setWaiveDialogOpen(false)}
            studentFee={selectedStudentFee}
            schoolId={school.id} // Pass necessary props
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
            studentFeeId={selectedStudentFee.id} // Pass ID directly
            currency={currency}
            locale={locale}
          />
        </>
      )}
    </div>
  );
};

export default StudentFeesTab;
