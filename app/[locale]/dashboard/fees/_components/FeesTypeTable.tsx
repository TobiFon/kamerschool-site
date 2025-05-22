"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FeeType, PaginatedResponse } from "@/types/fees"; // Added PaginatedResponse
import { deleteFeeType, fetchFeeTypes } from "@/queries/fees";
import { toast } from "sonner";
import { FeeTypeColumns } from "./FeetypeColumns";
import LoadingErrorState from "./LoadingErrorState";
import { FeeTypeDataTable } from "./FeetypeDataTables";
import AddEditFeeTypeDialog from "./AddEditFeeTypeDailog";
import ConfirmationDialog from "./ConfirmDailogue";

const FeeTypesTab: React.FC = () => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();

  // State
  const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Data (backend handles school scoping)
  // Assuming fetchFeeTypes returns PaginatedResponse based on usage and query signature correction
  const { data, isLoading, error, isFetching } = useQuery<
    PaginatedResponse<FeeType>,
    Error
  >({
    queryKey: ["feeTypes", { search: searchTerm }],
    queryFn: () => fetchFeeTypes({ search: searchTerm }), // Add page_size if needed, e.g., page_size: 1000
    placeholderData: (prevData) => prevData, // Keep data while searching/refetching
  });

  // Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFeeType(id),
    onSuccess: () => {
      toast.success(tc("success"), { description: t("feeTypeDeletedSuccess") });
      queryClient.invalidateQueries({ queryKey: ["feeTypes"] }); // Refetch list
      queryClient.invalidateQueries({ queryKey: ["feeTypesSimple"] }); // Refetch dropdown list used elsewhere
      setDeleteDialogOpen(false);
      setSelectedFeeType(null);
    },
    onError: (err: Error) => {
      toast.error(tc("error"), {
        description: err.message || t("feeTypeDeletedError"),
      });
      // Keep dialog open on error? Optional.
      // setDeleteDialogOpen(false);
    },
  });

  // --- Action Handlers (wrapped in useCallback) ---
  const handleAddClick = useCallback(() => {
    setSelectedFeeType(null);
    setAddEditDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((feeType: FeeType) => {
    setSelectedFeeType(feeType);
    setAddEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((feeType: FeeType) => {
    setSelectedFeeType(feeType);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedFeeType) {
      deleteMutation.mutate(selectedFeeType.id);
    }
  }, [selectedFeeType, deleteMutation]); // Dependencies

  // --- Column Definition ---
  const tableColumns = useMemo(
    () =>
      FeeTypeColumns({
        t: tc, // Use common translations for actions
        onEdit: handleEditClick,
        onDelete: handleDeleteClick,
      }),
    [tc, handleEditClick, handleDeleteClick] // Dependencies
  );

  // --- Render Logic ---
  if (isLoading) {
    // Initial load state
    return <LoadingErrorState isLoading={true} />;
  }

  if (error) {
    return <LoadingErrorState error={error} />;
  }

  // Extract results for the table, even if pagination isn't used for controls
  const tableData = data?.results ?? [];

  return (
    <div className="space-y-4">
      {/* Header Row with Search and Add Button */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        <div className="w-full sm:w-auto max-w-xs">
          <Input
            placeholder={tc("searchByName")} // Use common translation
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <Button onClick={handleAddClick} size="sm" className="gap-1">
          {" "}
          {/* Use size sm */}
          <PlusCircle className="h-4 w-4" />
          {t("addFeeType")}
        </Button>
      </div>

      {/* Loading indicator during search/refetch */}
      {isFetching && <LoadingErrorState isLoading={true} spinnerSize="small" />}

      {/* Data Table - Passing data array, no pagination controls */}
      <FeeTypeDataTable columns={tableColumns} data={tableData} />

      {/* Dialogs */}
      <AddEditFeeTypeDialog
        isOpen={isAddEditDialogOpen}
        onClose={() => setAddEditDialogOpen(false)}
        feeType={selectedFeeType}
      />
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={t("deleteFeeTypeTitle")}
        // Use fee type name in confirmation message
        description={t("deleteFeeTypeConfirmDesc", {
          // Adjusted key to match i18n json
          feeTypeName: selectedFeeType?.name ?? "", // Provide fallback
        })}
        confirmText={tc("delete")}
        isConfirming={deleteMutation.isPending} // Pass loading state
      />
    </div>
  );
};

export default FeeTypesTab;
