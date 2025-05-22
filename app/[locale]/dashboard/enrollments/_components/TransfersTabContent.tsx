// FILE: components/transfers/TransfersTabContent.tsx
// This file remains the same as the one provided in my previous response.
// Ensure all imports and props passed to child modals are correct.

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UserPlus, AlertTriangle } from "lucide-react";

import {
  fetchTransferRequests,
  initiateTransferRequest,
  reviewTransferRequest,
  completeTransferRequest,
  cancelTransferRequest,
  fetchTransferRequestDetail,
} from "@/queries/transfers";

import { PaginationComponent } from "./PaginationComponent";
import TransferRequestFilters from "./TransferRequestFilters";
import TransferRequestTable from "./TransferRequestTable";
import ReviewTransferModal from "./ReviewTransferModal";
import InitiateTransferModal from "./InitialTransferModal";
import CompleteTransferModal from "./TransferComplete";
import CancelTransferModal from "./TransferCancel";
import {
  AcademicYear,
  TransferRequest,
  TransferRequestDetail,
} from "@/queries/transfers";

interface TransfersTabContentProps {
  academicYears: AcademicYear[];
  defaultEffectiveYearId?: number | null;
  userSchoolId?: number | null;
}

const DEFAULT_PAGE_SIZE = 15;

function TransfersTabContent({
  academicYears = [],
  defaultEffectiveYearId = null,
  userSchoolId,
}: TransfersTabContentProps) {
  const t = useTranslations("TransfersTab");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    status: "all",
    effectiveYearId: defaultEffectiveYearId?.toString() ?? "",
    search: "",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [isInitiateModalOpen, setInitiateModalOpen] = useState(false);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);

  const [selectedTransferForAction, setSelectedTransferForAction] =
    useState<TransferRequest | null>(null);

  const [transferDetailForModal, setTransferDetailForModal] =
    useState<TransferRequestDetail | null>(null);
  const [isLoadingDetailForModal, setIsLoadingDetailForModal] = useState(false);
  const [detailFetchErrorForModal, setDetailFetchErrorForModal] = useState<
    string | null
  >(null);

  const queryParams = useMemo(
    () => ({
      status: filters.status === "all" ? undefined : filters.status,
      effectiveYearId: filters.effectiveYearId || undefined,
      search: filters.search || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [filters]
  );

  const {
    data: transferData,
    isLoading: isLoadingTransfers,
    isFetching: isFetchingTransfers,
    isError: isTransferError,
    error: transferError,
  } = useQuery({
    queryKey: ["transferRequests", queryParams],
    queryFn: () => fetchTransferRequests(queryParams),
    keepPreviousData: true,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  const requests = transferData?.results || [];
  const pagination = useMemo(
    () => ({
      currentPage: filters.page,
      totalPages: transferData?.totalPages || 1,
      hasNextPage: Boolean(transferData?.next),
      hasPreviousPage: Boolean(transferData?.previous),
      totalCount: transferData?.count || 0,
      pageSize: filters.pageSize,
    }),
    [transferData, filters.page, filters.pageSize]
  );
  const isLoadingOverall = isLoadingTransfers || isFetchingTransfers;

  const handleFilterChange = useCallback(
    (key: keyof typeof filters, value: string | number) => {
      setFilters((prev) => {
        const newState = { ...prev, [key]: value };
        if (key !== "page") {
          newState.page = 1;
        }
        return newState;
      });
    },
    []
  );
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage > 0 && newPage <= pagination.totalPages) {
        handleFilterChange("page", newPage);
      }
    },
    [handleFilterChange, pagination.totalPages]
  );

  const closeAllModals = useCallback(() => {
    setInitiateModalOpen(false);
    setReviewModalOpen(false);
    setCompleteModalOpen(false);
    setCancelModalOpen(false);
    setSelectedTransferForAction(null);
    setTransferDetailForModal(null);
    setIsLoadingDetailForModal(false);
    setDetailFetchErrorForModal(null);
  }, []);

  const handleActionClick = useCallback(
    async (actionType: string, requestItem: TransferRequest | null = null) => {
      setSelectedTransferForAction(requestItem);
      setTransferDetailForModal(null);
      setDetailFetchErrorForModal(null);
      setIsLoadingDetailForModal(false);

      switch (actionType) {
        case "initiate":
          setInitiateModalOpen(true);
          break;

        case "review":
        case "complete":
          if (requestItem?.id) {
            setIsLoadingDetailForModal(true);
            if (actionType === "review") setReviewModalOpen(true);
            if (actionType === "complete") setCompleteModalOpen(true);

            try {
              const detail = await fetchTransferRequestDetail(requestItem.id);
              setTransferDetailForModal(detail);
            } catch (err: any) {
              console.error(
                `Error fetching transfer detail for ${actionType} (ID: ${requestItem.id}):`,
                err
              );
              const errorMsg =
                err.message ||
                `Failed to load details for transfer ${requestItem.id}.`;
              setDetailFetchErrorForModal(errorMsg);
              toast.error(tc("errorLoadingDetailsTitle"), {
                description: errorMsg,
              });
            } finally {
              setIsLoadingDetailForModal(false);
            }
          } else {
            toast.error(tc("actionErrorTitle"), {
              description: tc("actionErrorNoRequest"),
            });
          }
          break;

        case "cancel":
          if (requestItem) {
            setCancelModalOpen(true);
          } else {
            toast.error(tc("actionErrorTitle"), {
              description: tc("actionErrorNoRequest"),
            });
          }
          break;
        default:
          console.warn("Unhandled transfer action:", actionType);
      }
    },
    [tc]
  );

  const commonMutationOptions = (actionName: string) => ({
    onSuccess: (data: any) => {
      toast.success(t("toast.success.title"), {
        description: t(`toast.success.${actionName}Desc`),
      });
      closeAllModals();
      queryClient.invalidateQueries({ queryKey: ["transferRequests"] });
      queryClient.invalidateQueries({ queryKey: ["academicYearEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollmentStatistics"] });
    },
    onError: (error: any) => {
      console.error(`Error during ${actionName}:`, error);
      let description = t("toast.error.genericDesc");
      if (error?.detail) {
        description = error.detail;
      } else if (error?.fieldErrors && typeof error.fieldErrors === "object") {
        const firstKey = Object.keys(error.fieldErrors)[0];
        if (
          firstKey &&
          Array.isArray(error.fieldErrors[firstKey]) &&
          error.fieldErrors[firstKey].length > 0
        ) {
          description = `${firstKey}: ${error.fieldErrors[firstKey][0]}`;
        } else {
          description = error.message || description;
        }
      } else if (error?.message) {
        description = error.message.replace(`${actionName}: `, "");
      }
      toast.error(
        t("toast.error.title", {
          context: t(`toast.error.${actionName}Context`),
        }),
        { description }
      );
    },
  });
  const initiateMutation = useMutation({
    mutationFn: initiateTransferRequest,
    ...commonMutationOptions("initiate"),
  });
  const reviewMutation = useMutation({
    mutationFn: (data: {
      requestId: number;
      reviewData: { approve: boolean; notes?: string };
    }) => reviewTransferRequest(data.requestId, data.reviewData),
    ...commonMutationOptions("review"),
  });
  const completeMutation = useMutation({
    mutationFn: (data: {
      requestId: number;
      completeData: { target_class_id: number; notes?: string };
    }) => completeTransferRequest(data.requestId, data.completeData),
    ...commonMutationOptions("complete"),
  });
  const cancelMutation = useMutation({
    mutationFn: (data: { requestId: number; cancelData: { reason: string } }) =>
      cancelTransferRequest(data.requestId, data.cancelData),
    ...commonMutationOptions("cancel"),
  });

  useEffect(() => {
    if (isTransferError && !isLoadingTransfers) {
      console.error("Error fetching transfers:", transferError);
      toast.error(
        t("toast.error.title", { context: t("toast.error.fetchContext") }),
        {
          description:
            (transferError as any)?.message || t("errorLoading.description"),
        }
      );
    }
  }, [isTransferError, transferError, isLoadingTransfers, t]);

  return (
    <>
      <Card>
        <CardHeader className="border-b border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30 px-4 py-3 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium">
              {t("cardTitle")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {t("cardDescription")}
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => handleActionClick("initiate")}
            disabled={initiateMutation.isPending}
          >
            {initiateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            {t("initiateButton")}
          </Button>
        </CardHeader>
        <CardContent className="pt-5 px-4">
          <TransferRequestFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            academicYears={academicYears}
            isLoading={isLoadingOverall}
          />
          {isTransferError && !isLoadingOverall && (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t("errorLoading.title")}</AlertTitle>
              <AlertDescription>
                {(transferError as any)?.message ||
                  t("errorLoading.description")}
              </AlertDescription>
            </Alert>
          )}
          <TransferRequestTable
            requests={requests}
            isLoading={isLoadingOverall}
            onActionClick={handleActionClick}
            userSchoolId={userSchoolId}
          />
        </CardContent>
        {pagination.totalCount > 0 && !isTransferError && (
          <CardFooter className="border-t border-slate-200 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-800/20 py-3 px-4">
            <PaginationComponent
              {...pagination}
              onPageChange={handlePageChange}
              isLoading={isLoadingOverall}
            />
          </CardFooter>
        )}
        {!isLoadingOverall &&
          pagination.totalCount === 0 &&
          !isTransferError && (
            <CardFooter className="justify-center py-4">
              <p className="text-sm text-muted-foreground">
                {t("table.noData.message")}
              </p>
            </CardFooter>
          )}
      </Card>

      <InitiateTransferModal
        isOpen={isInitiateModalOpen}
        onClose={closeAllModals}
        onSubmit={(data) => initiateMutation.mutate(data)}
        isLoading={initiateMutation.isPending}
        academicYears={academicYears}
      />

      <ReviewTransferModal
        isOpen={isReviewModalOpen}
        onClose={closeAllModals}
        onSubmit={(data) =>
          selectedTransferForAction &&
          reviewMutation.mutate({
            requestId: selectedTransferForAction.id,
            reviewData: data,
          })
        }
        isLoading={reviewMutation.isPending || isLoadingDetailForModal}
        transferRequest={transferDetailForModal}
        fetchError={detailFetchErrorForModal}
      />

      <CompleteTransferModal
        isOpen={isCompleteModalOpen}
        onClose={closeAllModals}
        onSubmit={(data) =>
          selectedTransferForAction &&
          completeMutation.mutate({
            requestId: selectedTransferForAction.id,
            completeData: data,
          })
        }
        isLoading={completeMutation.isPending}
        transferRequest={transferDetailForModal}
        fetchError={detailFetchErrorForModal}
      />

      <CancelTransferModal
        isOpen={isCancelModalOpen}
        onClose={closeAllModals}
        onSubmit={(data) =>
          selectedTransferForAction &&
          cancelMutation.mutate({
            requestId: selectedTransferForAction.id,
            cancelData: data,
          })
        }
        isLoading={cancelMutation.isPending}
        transferRequest={selectedTransferForAction}
      />
    </>
  );
}

export default TransfersTabContent;
