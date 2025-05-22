// "use client";

// import React, { useState, useMemo } from "react";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { useTranslations } from "next-intl";
// import { Button } from "@/components/ui/button";
// import { PlusCircle } from "lucide-react";
// import { PaginatedResponse, School } from "@/types/auth";
// import { ClassFee } from "@/types/fees";
// import { deleteClassFee, fetchClassFees, fetchFeeTypes } from "@/queries/fees";
// import { toast } from "sonner";
// import LoadingErrorState from "./LoadingErrorState";
// import { FilterControls } from "./FilterControls";
// import { ClassFeeDataTable } from "./ClassFeeDataTable";
// import AddEditClassFeeDialog from "./AddEditClassFeeDailog";
// import ConfirmationDialog from "./ConfirmDailogue";
// import { fetchAcademicYears } from "@/queries/results";
// import { fetchAllClasses, fetchClasses } from "@/queries/class";
// import AssignFeesDialog from "./AssignFeeType";
// import { ClassFeeColumns } from "./ClassFeeColumn";

// interface ClassFeesTabProps {
//   school: School;
// }

// const ClassFeesTab: React.FC<ClassFeesTabProps> = ({ school }) => {
//   const t = useTranslations("Finance");
//   const tc = useTranslations("Common");
//   const queryClient = useQueryClient();
//   const locale = "fr-CM";
//   const currency = "XAF";

//   // State for Dialogs
//   const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
//   const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
//   const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [selectedClassFee, setSelectedClassFee] = useState<ClassFee | null>(
//     null
//   );

//   // State for Filters and Pagination
//   const [filters, setFilters] = useState({
//     search: "",
//     academic_year: "",
//     class_instance: "",
//     fee_type: "",
//     page: 1,
//   });

//   const queryParams = useMemo(
//     () => ({
//       search: filters.search,
//       academic_year: filters.academic_year
//         ? Number(filters.academic_year)
//         : undefined,
//       class_instance: filters.class_instance
//         ? Number(filters.class_instance)
//         : undefined,
//       fee_type: filters.fee_type ? Number(filters.fee_type) : undefined,
//       page: filters.page,
//     }),
//     [filters]
//   );

//   // Fetch Data
//   const { data, isLoading, error, isFetching } = useQuery<
//     PaginatedResponse<ClassFee>,
//     Error
//   >({
//     queryKey: ["classFees", school.id, queryParams],
//     queryFn: () => fetchClassFees(queryParams),
//     placeholderData: (previousData) => previousData, // Keep previous data while loading new page
//     // staleTime: 5 * 60 * 1000, // 5 minutes
//   });

//   // Fetch data for filter dropdowns (simplified)
//   const { data: academicYears } = useQuery({
//     queryKey: ["academicYearsSimple"],
//     queryFn: () => fetchAcademicYears,
//   });
//   const { data: classes } = useQuery({
//     queryKey: ["classesSimple", school.id],
//     queryFn: () => fetchAllClasses(),
//   });
//   const { data: feeTypes } = useQuery({
//     queryKey: ["feeTypesSimple"],
//     queryFn: () => fetchFeeTypes(),
//   });

//   // --- Action Handlers ---
//   const handleAddClick = () => {
//     setSelectedClassFee(null);
//     setAddEditDialogOpen(true);
//   };

//   const handleEditClick = (classFee: ClassFee) => {
//     setSelectedClassFee(classFee);
//     setAddEditDialogOpen(true);
//   };

//   const handleAssignClick = (classFee: ClassFee) => {
//     setSelectedClassFee(classFee);
//     setAssignDialogOpen(true);
//   };

//   const handleDeleteClick = (classFee: ClassFee) => {
//     setSelectedClassFee(classFee);
//     setDeleteDialogOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!selectedClassFee) return;
//     try {
//       await deleteClassFee(selectedClassFee.id);
//       toast.success(tc("success"), {
//         description: t("classFeeDeletedSuccess"),
//       });
//       queryClient.invalidateQueries({ queryKey: ["classFees", school.id] });
//       setDeleteDialogOpen(false);
//       setSelectedClassFee(null);
//     } catch (err: any) {
//       toast.error(tc("error"), {
//         description: err.message || t("classFeeDeletedError"),
//       });
//     }
//   };

//   // --- Column Definition with Actions ---
//   const tableColumns = useMemo(
//     () =>
//       ClassFeeColumns({
//         // Use the specific function here
//         t: tc, // Use common translations or specific 't'
//         onEdit: handleEditClick,
//         onAssign: handleAssignClick,
//         onDelete: handleDeleteClick,
//         currency,
//         locale,
//       }),
//     [
//       tc,
//       handleEditClick,
//       handleAssignClick,
//       handleDeleteClick,
//       currency,
//       locale,
//     ] // Update dependencies
//   );

//   // --- Render Logic ---
//   if (isLoading && filters.page === 1) {
//     return <LoadingErrorState isLoading={true} />;
//   }

//   if (error) {
//     return <LoadingErrorState error={error} />;
//   }

//   // Define filters structure for the FilterControls component
//   const filterConfig = [
//     { id: "search", label: tc("search"), type: "search" },
//     {
//       id: "academic_year",
//       label: t("academicYear"),
//       type: "select",
//       options:
//         academicYears?.map((y) => ({ value: y.id, label: y.name })) || [],
//     },
//     {
//       id: "class_instance",
//       label: t("class"),
//       type: "select",
//       options: classes?.map((c) => ({ value: c.id, label: c.full_name })) || [],
//     },
//     {
//       id: "fee_type",
//       label: t("feeType"),
//       type: "select",
//       options: feeTypes?.map((ft) => ({ value: ft.id, label: ft.name })) || [],
//     },
//   ];

//   return (
//     <div className="space-y-4">
//       <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
//         <FilterControls
//           filters={filters}
//           setFilters={setFilters}
//           config={filterConfig}
//         />
//         <Button onClick={handleAddClick} className="gap-1">
//           <PlusCircle className="h-4 w-4" />
//           {t("addClassFee")}
//         </Button>
//       </div>

//       {isFetching && (
//         <LoadingErrorState
//           isLoading={true}
//           spinnerSize="small"
//           message={tc("loading")}
//         />
//       )}

//       <ClassFeeDataTable
//         columns={tableColumns}
//         data={data?.results ?? []}
//         pagination={{
//           currentPage: filters.page,
//           totalPages: data?.total_pages ?? 1,
//           hasNext: !!data?.next,
//           hasPrev: !!data?.previous,
//         }}
//         onPageChange={(newPage) =>
//           setFilters((prev) => ({ ...prev, page: newPage }))
//         }
//       />

//       {/* Dialogs */}
//       <AddEditClassFeeDialog
//         isOpen={isAddEditDialogOpen}
//         onClose={() => setAddEditDialogOpen(false)}
//         classFee={selectedClassFee}
//         schoolId={school.id}
//       />
//       <AssignFeesDialog
//         isOpen={isAssignDialogOpen}
//         onClose={() => setAssignDialogOpen(false)}
//         classFee={selectedClassFee}
//         schoolId={school.id}
//       />
//       <ConfirmationDialog
//         isOpen={isDeleteDialogOpen}
//         onClose={() => setDeleteDialogOpen(false)}
//         onConfirm={confirmDelete}
//         title={t("deleteClassFeeTitle")}
//         description={t("deleteClassFeeConfirm", {
//           feeType: selectedClassFee?.fee_type_name,
//           className: selectedClassFee?.class_name,
//         })}
//       />
//     </div>
//   );
// };

// export default ClassFeesTab;
