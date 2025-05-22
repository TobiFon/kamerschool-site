"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  ListFilter,
  AlertCircle,
  RefreshCcw,
  CalendarDays,
  Users,
  CalendarRange,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ClassTimetable,
  PaginatedClassTimetablesResponse,
  FetchClassTimetablesParams,
} from "@/types/timetable";
import {
  fetchClassTimetables,
  deleteClassTimetable,
  setClassTimetableActive,
} from "@/queries/timetable";

import { fetchAcademicYears } from "@/queries/results";
import { Class } from "@/types/class";
import { AcademicYear } from "@/types/transfers";

import { getBackendErrorMessage, formatDate } from "@/lib/utils";
import { School } from "@/types/auth";
import { fetchSchool } from "@/lib/auth";
import { fetchAllClasses } from "@/queries/class";
import PaginationControls from "../../results/_components/PaginationControls";
import ConfirmationDialog from "../../fees/_components/ConfirmDailogue";
import ClassTimetableCreateModal from "./ClassTimeTableCreateModal";

const DEFAULT_PAGE_SIZE = 20;

interface ClassTimetablesOverviewProps {
  onViewTimetable: (timetableId: number) => void; // Callback to navigate to editor
}

const ClassTimetablesOverview: React.FC<ClassTimetablesOverviewProps> = ({
  onViewTimetable,
}) => {
  const t = useTranslations("Timetable.ClassTimetables");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  // No editing modal here, editing happens in the TimetableEditor component
  const [timetableToDelete, setTimetableToDelete] =
    useState<ClassTimetable | null>(null);

  const [filters, setFilters] = useState<{
    academicYearId: string; // "all" or ID
    classId: string; // "all" or ID
    isActive: string; // "all", "true", "false"
  }>({ academicYearId: "all", classId: "all", isActive: "all" });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Fetch current school data
  const { data: schoolData, isLoading: isLoadingSchool } = useQuery<
    School,
    Error
  >({
    queryKey: ["currentSchool"],
    queryFn: fetchSchool,
    staleTime: Infinity,
  });

  // Fetch Academic Years for filter
  const { data: academicYears, isLoading: isLoadingAcademicYears } = useQuery<
    AcademicYear[],
    Error
  >({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
    staleTime: 5 * 60 * 1000,
    select: (data) =>
      data.sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      ),
  });

  // Fetch Classes for filter (for the current school)
  const { data: schoolClasses, isLoading: isLoadingSchoolClasses } = useQuery<
    Class[],
    Error
  >({
    queryKey: ["schoolClasses", schoolData?.id],
    queryFn: () => fetchAllClasses(), // Assumes backend filters by authenticated school admin
    enabled: !!schoolData,
    staleTime: 5 * 60 * 1000,
    select: (data) =>
      data?.sort((a, b) => a.full_name.localeCompare(b.full_name)),
  });

  // Derived filters for the query
  const queryFilters: FetchClassTimetablesParams = useMemo(
    () => ({
      academic_year_pk:
        filters.academicYearId === "all" ? undefined : filters.academicYearId,
      class_pk: filters.classId === "all" ? undefined : filters.classId,
      is_active: filters.isActive === "all" ? undefined : filters.isActive,
      page: pagination.page,
      pageSize: pagination.pageSize,
    }),
    [filters, pagination]
  );

  const classTimetablesQueryKey = useMemo(
    () => ["classTimetables", schoolData?.id, queryFilters],
    [schoolData, queryFilters]
  );

  // Fetch Class Timetables
  const {
    data: timetablesResponse,
    isLoading: isLoadingTimetables,
    isFetching: isFetchingTimetables,
    error: errorTimetables,
    isError: isErrorTimetables,
    refetch: refetchTimetables,
  } = useQuery<PaginatedClassTimetablesResponse, Error>({
    queryKey: classTimetablesQueryKey,
    queryFn: () => fetchClassTimetables(queryFilters),
    enabled: !!schoolData,
    keepPreviousData: true,
    staleTime: 60 * 1000, // 1 minute
  });

  const timetables = timetablesResponse?.results ?? [];
  const totalTimetables = timetablesResponse?.count ?? 0;
  const totalPages = Math.ceil(totalTimetables / pagination.pageSize);

  // Mutations
  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: deleteClassTimetable,
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      setTimetableToDelete(null);
      queryClient.invalidateQueries({ queryKey: classTimetablesQueryKey });
    },
    onError: (err) => {
      toast.error(getBackendErrorMessage(err) || t("deleteError"));
      setTimetableToDelete(null);
    },
  });

  const setActiveMutation = useMutation<void, Error, number>({
    mutationFn: setClassTimetableActive,
    onSuccess: (_, timetableId) => {
      toast.success(t("setActiveSuccess"));
      queryClient.invalidateQueries({ queryKey: classTimetablesQueryKey });
      // If the editor was open for this timetable, you might want to refetch its detail
      queryClient.invalidateQueries({
        queryKey: ["classTimetableDetail", timetableId],
      });
    },
    onError: (err) => {
      toast.error(getBackendErrorMessage(err) || t("setActiveError"));
    },
  });

  // Handlers
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(
    (refresh?: boolean) => {
      setIsModalOpen(false);
      if (refresh) {
        queryClient.invalidateQueries({ queryKey: classTimetablesQueryKey });
      }
    },
    [queryClient, classTimetablesQueryKey]
  );

  const handleDeleteClick = useCallback((timetable: ClassTimetable) => {
    setTimetableToDelete(timetable);
  }, []);

  const confirmDelete = useCallback(() => {
    if (timetableToDelete) {
      deleteMutation.mutate(timetableToDelete.id);
    }
  }, [timetableToDelete, deleteMutation]);

  const handleSetActiveClick = useCallback(
    (timetableId: number) => {
      setActiveMutation.mutate(timetableId);
    },
    [setActiveMutation]
  );

  const handleFilterChange = useCallback(
    (name: keyof typeof filters, value: string) => {
      setFilters((prev) => ({ ...prev, [name]: value }));
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setFilters({ academicYearId: "all", classId: "all", isActive: "all" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (
    isLoadingSchool ||
    (schoolData && (isLoadingAcademicYears || isLoadingSchoolClasses))
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListFilter className="h-5 w-5" /> {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">
            {tCommon("loadingFilters")}...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isErrorTimetables && !isFetchingTimetables && timetables.length === 0) {
    return (
      <Card className="bg-destructive/5 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle /> {tCommon("errorTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          <p className="text-center">
            {getBackendErrorMessage(errorTimetables) ||
              tCommon("fetchErrorGeneric")}
          </p>
          <Button
            variant="destructive"
            outline
            onClick={() => refetchTimetables()}
            disabled={isFetchingTimetables}
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
        {isFetchingTimetables && !isLoadingTimetables && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <ListFilter className="h-5 w-5" /> {t("title")}
            </CardTitle>
            <Button
              size="sm"
              onClick={handleOpenModal}
              disabled={!schoolData || isFetchingTimetables}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> {t("addTimetable")}
            </Button>
          </div>
          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <Select
              value={filters.academicYearId}
              onValueChange={(v) => handleFilterChange("academicYearId", v)}
              disabled={isFetchingTimetables}
            >
              <SelectTrigger className="h-9 text-sm">
                <CalendarDays className="h-4 w-4 mr-2 opacity-70" />{" "}
                <SelectValue placeholder={t("filterYear")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allYears")}</SelectItem>
                {academicYears?.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.classId}
              onValueChange={(v) => handleFilterChange("classId", v)}
              disabled={isFetchingTimetables}
            >
              <SelectTrigger className="h-9 text-sm">
                <Users className="h-4 w-4 mr-2 opacity-70" />{" "}
                <SelectValue placeholder={t("filterClass")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allClasses")}</SelectItem>
                {schoolClasses?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.isActive}
              onValueChange={(v) => handleFilterChange("isActive", v)}
              disabled={isFetchingTimetables}
            >
              <SelectTrigger className="h-9 text-sm">
                <CheckCircle className="h-4 w-4 mr-2 opacity-70" />{" "}
                <SelectValue placeholder={t("filterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="true">{tCommon("active")}</SelectItem>
                <SelectItem value="false">{tCommon("inactive")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs h-9 justify-self-start md:justify-self-end"
              disabled={isFetchingTimetables}
            >
              <RefreshCcw className="h-3.5 w-3.5 mr-1" />{" "}
              {tCommon("resetFilters")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {" "}
          {/* Table has its own padding */}
          {isLoadingTimetables && timetables.length === 0 ? (
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 border-b"
                >
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : timetables.length === 0 && !isFetchingTimetables ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarRange className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="font-medium">{t("noTimetablesTitle")}</p>
              <p className="text-sm">{t("noTimetablesDescription")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t("tableClass")}</TableHead>
                    <TableHead>{t("tableYear")}</TableHead>
                    <TableHead className="text-center">
                      {t("tableStatus")}
                    </TableHead>
                    <TableHead>{t("tableLastUpdated")}</TableHead>
                    <TableHead className="text-right">
                      {tCommon("actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timetables.map((tt) => (
                    <TableRow key={tt.id}>
                      <TableCell className="font-medium">
                        {tt.school_class.full_name}
                      </TableCell>
                      <TableCell>{tt.academic_year.name}</TableCell>
                      <TableCell className="text-center">
                        {tt.is_active ? (
                          <Badge variant="success">{tCommon("active")}</Badge>
                        ) : (
                          <Badge variant="outline">{tCommon("inactive")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(tt.updated_at, true)}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5"
                              onClick={() => onViewTimetable(tt.id)}
                            >
                              <Eye className="h-4 w-4 mr-1.5" />{" "}
                              {t("viewEditSchedule")}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("viewEditScheduleTooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                        {!tt.is_active && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSetActiveClick(tt.id)}
                                disabled={
                                  setActiveMutation.isLoading &&
                                  setActiveMutation.variables === tt.id
                                }
                              >
                                {setActiveMutation.isLoading &&
                                setActiveMutation.variables === tt.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <span className="sr-only">
                                  {t("setActive")}
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("setActiveTooltip")}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteClick(tt)}
                              disabled={
                                deleteMutation.isLoading &&
                                timetableToDelete?.id === tt.id
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
          {totalPages > 1 && !isLoadingTimetables && (
            <div className="flex justify-center p-4 border-t">
              <PaginationControls
                currentPage={pagination.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && schoolData && (
        <ClassTimetableCreateModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          // Pass any necessary props like lists of classes/academic years if not fetched inside modal
          // For creation, schoolId is context.
          schoolId={schoolData.id}
          existingClasses={schoolClasses || []}
          existingAcademicYears={academicYears || []}
        />
      )}

      <ConfirmationDialog
        isOpen={!!timetableToDelete}
        onClose={() => setTimetableToDelete(null)}
        onConfirm={confirmDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDescription", {
          class: timetableToDelete?.school_class.full_name,
          year: timetableToDelete?.academic_year.name,
        })}
        confirmText={tCommon("delete")}
        confirmVariant="destructive"
        isConfirming={deleteMutation.isLoading}
      />
    </TooltipProvider>
  );
};

export default ClassTimetablesOverview;
