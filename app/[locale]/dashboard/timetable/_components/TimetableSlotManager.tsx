"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Clock,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  TimeSlot,
  TimeSlotFormData,
  PaginatedTimeSlotsResponse,
} from "@/types/timetable";
import { fetchTimeSlots, deleteTimeSlot } from "@/queries/timetable";
import { fetchSchool } from "@/lib/auth";
import TimeSlotModal from "./TimeSlotModal";
import PaginationControls from "../../results/_components/PaginationControls";
import ConfirmationDialog from "../../fees/_components/ConfirmDailogue";
import { School } from "@/types/auth";
import { getBackendErrorMessage } from "@/lib/utils";

const DEFAULT_PAGE_SIZE = 15;

const TimeSlotsManager = () => {
  const t = useTranslations("Timetable.TimeSlots");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlotToDelete, setTimeSlotToDelete] = useState<TimeSlot | null>(
    null
  );
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Fetch current school data (needed for context, though backend might auto-set school on create for non-superusers)
  const { data: schoolData, isLoading: isLoadingSchool } = useQuery<
    School,
    Error
  >({
    queryKey: ["currentSchool"],
    queryFn: fetchSchool,
    staleTime: Infinity, // School data for the admin rarely changes
  });

  // Fetch Time Slots for the current school
  const timeSlotsQueryKey = useMemo(
    () => ["timeSlots", schoolData?.id, pagination.page, pagination.pageSize],
    [schoolData, pagination]
  );

  const {
    data: timeSlotsResponse,
    isLoading: isLoadingTimeSlots,
    isFetching: isFetchingTimeSlots,
    error: errorTimeSlots,
    isError: isErrorTimeSlots,
    refetch: refetchTimeSlots,
  } = useQuery<PaginatedTimeSlotsResponse, Error>({
    queryKey: timeSlotsQueryKey,
    queryFn: () =>
      fetchTimeSlots({
        // If your backend for TimeSlots automatically filters by auth user's school,
        // school_id might not be needed here. If superuser can manage any school, they'd pass it.
        // For a school admin, their school is context.
        // Let's assume backend /api/timetables/time-slots/ filters by logged-in school admin.
        page: pagination.page,
        pageSize: pagination.pageSize,
        ordering: "order,start_time", // Default ordering
      }),
    enabled: !!schoolData, // Only fetch if schoolData is available
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const timeSlots = timeSlotsResponse?.results ?? [];
  const totalTimeSlots = timeSlotsResponse?.count ?? 0;
  const totalPages = Math.ceil(totalTimeSlots / pagination.pageSize);

  // Mutations
  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: deleteTimeSlot,
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      setTimeSlotToDelete(null);
      queryClient.invalidateQueries({ queryKey: timeSlotsQueryKey });
    },
    onError: (err) => {
      toast.error(getBackendErrorMessage(err) || t("deleteError"));
      setTimeSlotToDelete(null);
    },
  });

  // Handlers
  const handleOpenModal = useCallback((slot?: TimeSlot) => {
    setEditingTimeSlot(slot || null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(
    (refresh?: boolean) => {
      setIsModalOpen(false);
      setEditingTimeSlot(null);
      if (refresh) {
        queryClient.invalidateQueries({ queryKey: timeSlotsQueryKey });
      }
    },
    [queryClient, timeSlotsQueryKey]
  );

  const handleDeleteClick = useCallback((slot: TimeSlot) => {
    setTimeSlotToDelete(slot);
  }, []);

  const confirmDelete = useCallback(() => {
    if (timeSlotToDelete) {
      deleteMutation.mutate(timeSlotToDelete.id);
    }
  }, [timeSlotToDelete, deleteMutation]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (isLoadingSchool) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Global error for this component if school data fails or initial timeslot fetch fails
  if (isErrorTimeSlots && !isFetchingTimeSlots && timeSlots.length === 0) {
    return (
      <Card className="bg-destructive/5 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle /> {tCommon("errorTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          <p className="text-center">
            {getBackendErrorMessage(errorTimeSlots) ||
              tCommon("fetchErrorGeneric")}
          </p>
          <Button
            variant="destructive"
            outline
            onClick={() => refetchTimeSlots()}
            disabled={isFetchingTimeSlots}
          >
            <RefreshCcw className="h-4 w-4 mr-2" /> {tCommon("retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="relative">
        {isFetchingTimeSlots &&
          !isLoadingTimeSlots && ( // Show spinner on refetch only
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" /> {t("title")}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => handleOpenModal()}
            disabled={!schoolData || isFetchingTimeSlots}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> {t("addSlot")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingTimeSlots && timeSlots.length === 0 ? (
            <div className="space-y-2 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 border rounded-md"
                >
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : timeSlots.length === 0 && !isFetchingTimeSlots ? (
            <div className="text-center py-10 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="font-medium">{t("noSlotsTitle")}</p>
              <p className="text-sm">{t("noSlotsDescription")}</p>
            </div>
          ) : (
            <div className="mt-4 border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[80px]">
                      {t("tableOrder")}
                    </TableHead>
                    <TableHead>{t("tableName")}</TableHead>
                    <TableHead className="w-[120px]">
                      {t("tableStartTime")}
                    </TableHead>
                    <TableHead className="w-[120px]">
                      {t("tableEndTime")}
                    </TableHead>
                    <TableHead className="w-[120px]">
                      {t("tableDuration")}
                    </TableHead>
                    <TableHead className="w-[100px] text-center">
                      {t("tableIsBreak")}
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      {tCommon("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-mono text-center">
                        {slot.order}
                      </TableCell>
                      <TableCell className="font-medium">{slot.name}</TableCell>
                      <TableCell>{slot.start_time.substring(0, 5)}</TableCell>
                      <TableCell>{slot.end_time.substring(0, 5)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {slot.duration_display || "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        {slot.is_break ? (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-300"
                          >
                            {tCommon("yes")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-700 border-red-300"
                          >
                            {tCommon("no")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenModal(slot)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                              <span className="sr-only">{tCommon("edit")}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tCommon("edit")}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteClick(slot)}
                              disabled={
                                deleteMutation.isLoading &&
                                timeSlotToDelete?.id === slot.id
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">
                                {tCommon("delete")}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{tCommon("delete")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && !isLoadingTimeSlots && (
            <div className="flex justify-center mt-6">
              <PaginationControls
                currentPage={pagination.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen &&
        schoolData && ( // Pass schoolData to modal if needed for context
          <TimeSlotModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            existingTimeSlot={editingTimeSlot}
            schoolId={schoolData.id} // Pass schoolId to the modal
          />
        )}

      <ConfirmationDialog
        isOpen={!!timeSlotToDelete}
        onClose={() => setTimeSlotToDelete(null)}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", {
          name: timeSlotToDelete?.name,
        })}
        confirmText={tCommon("delete")}
        confirmVariant="destructive"
        isConfirming={deleteMutation.isLoading}
      />
    </TooltipProvider>
  );
};

export default TimeSlotsManager;
