"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

import {
  fetchAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchEducationSystems,
  Subject,
} from "@/queries/admin";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import PageHeader from "@/app/[locale]/dashboard/_components/PageHeader";
import {
  Book,
  ChevronLeft,
  ChevronRight,
  Edit,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Trash,
  Users,
} from "lucide-react";
import SubjectFormModal from "./_components/SubjectsFormModal";

const SubjectTableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-4 w-40" />
    </TableCell>
    <TableCell className="hidden md:table-cell">
      <Skeleton className="h-4 w-32" />
    </TableCell>
    <TableCell className="hidden sm:table-cell">
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell className="text-right">
      <Skeleton className="h-8 w-8 ml-auto" />
    </TableCell>
  </TableRow>
);

const PAGE_LIMIT = 20;

export default function AdminSubjectManagementPage() {
  const t = useTranslations("AdminSubjectManagement");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [systemFilter, setSystemFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [offset, setOffset] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const queryKey = [
    "adminSubjects",
    debouncedSearch,
    systemFilter,
    levelFilter,
    offset,
  ];

  const {
    data: subjectsResponse,
    isLoading: isLoadingSubjects,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKey,
    queryFn: () =>
      fetchAllSubjects({
        search: debouncedSearch,
        education_system: systemFilter,
        school_level: levelFilter,
        limit: PAGE_LIMIT,
        offset: offset,
      }),
  });

  const { data: educationSystems, isLoading: isLoadingSystems } = useQuery({
    queryKey: ["educationSystems"],
    queryFn: fetchEducationSystems,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSubjects"] });
      setIsModalOpen(false);
      setEditingSubject(null);
    },
    onError: (err: any) => {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.code?.[0] ||
        err.message;
      toast.error(t("toast.operationError"), { description: errorMessage });
    },
  };

  const createMutation = useMutation({
    ...mutationOptions,
    mutationFn: createSubject,
    onSuccess: () => {
      toast.success(t("toast.createSuccess"));
      mutationOptions.onSuccess();
    },
  });

  const updateMutation = useMutation({
    ...mutationOptions,
    mutationFn: updateSubject,
    onSuccess: () => {
      toast.success(t("toast.updateSuccess"));
      mutationOptions.onSuccess();
    },
  });

  const deleteMutation = useMutation({
    ...mutationOptions,
    mutationFn: deleteSubject,
    onSuccess: () => {
      toast.success(t("toast.deleteSuccess"));
      setSubjectToDelete(null);
      // No need to invalidate here, it's done in the shared options
    },
  });

  const handleFormSubmit = (formData: any) => {
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (subjectToDelete) {
      deleteMutation.mutate(subjectToDelete.id);
    }
  };

  const handleRefresh = () => {
    toast.info(t("toast.refreshing"));
    refetch();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const filtersAreActive =
    debouncedSearch !== "" || systemFilter !== "all" || levelFilter !== "all";

  const subjects = subjectsResponse?.results || [];
  const totalCount = subjectsResponse?.count || 0;
  const currentPage = Math.floor(offset / PAGE_LIMIT) + 1;
  const totalPages = Math.ceil(totalCount / PAGE_LIMIT);

  return (
    <div className="space-y-6">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold">
              {t("subjectsList")}
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isFetching}
                aria-label="Refresh list"
              >
                {isFetching ? (
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => {
                  setEditingSubject(null);
                  setIsModalOpen(true);
                }}
                className="w-full flex-shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" /> {t("createSubject")}
              </Button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 pt-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOffset(0);
                }}
                className="pl-8 w-full"
              />
            </div>
            <Select
              value={systemFilter}
              onValueChange={(value) => {
                setSystemFilter(value);
                setOffset(0);
              }}
              disabled={isLoadingSystems}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("filterBySystem")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allSystems")}</SelectItem>
                {educationSystems?.map((s) => (
                  <SelectItem key={s.id} value={s.code}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={levelFilter}
              onValueChange={(value) => {
                setLevelFilter(value);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t("filterByLevel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLevels")}</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="high_school">High School</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableHeaderName")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("tableHeaderSystem")}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    {t("tableHeaderUsage")}
                  </TableHead>
                  <TableHead className="w-[50px] text-right">
                    <span className="sr-only">{t("tableHeaderActions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSubjects &&
                  !isFetching &&
                  Array.from({ length: 10 }).map((_, i) => (
                    <SubjectTableRowSkeleton key={`loading-${i}`} />
                  ))}

                {isError && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-destructive p-8"
                    >
                      <p className="font-medium mb-2">{t("errorLoading")}</p>
                      <p className="text-sm">
                        {error instanceof Error
                          ? error.message
                          : "An unknown error occurred"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className="mt-4"
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {t("retry")}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}

                {!isLoadingSubjects && subjects.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground p-12"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <Book className="h-16 w-16 text-gray-300 dark:text-gray-700" />
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">
                            {filtersAreActive
                              ? t("noSubjectsFound")
                              : t("noSubjectsCreated")}
                          </p>
                          <p className="text-sm">
                            {filtersAreActive
                              ? t("tryChangingFilters")
                              : t("createFirstSubjectAfterPopulate")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {subjects.map((subject) => (
                  <TableRow
                    key={subject.id}
                    data-state={subject.usage_count > 0 ? "in-use" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{subject.name}</span>
                        <Badge variant="secondary" className="w-fit mt-1">
                          {subject.code}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        {subject.education_system?.name || "N/A"}
                        <div className="text-xs text-muted-foreground capitalize">
                          {subject.school_level?.replace("_", " ") || "N/A"}{" "}
                          Level
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <div className="flex items-center justify-center gap-1 font-mono">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {subject.usage_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingSubject(subject);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSubjectToDelete(subject)}
                            className="text-destructive focus:text-destructive"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-end items-center gap-4 py-4 border-t">
            <span className="text-sm text-muted-foreground">
              {t("paginationStatus", { currentPage, totalPages, totalCount })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setOffset((prev) => Math.max(0, prev - PAGE_LIMIT))
                }
                disabled={offset === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset((prev) => prev + PAGE_LIMIT)}
                disabled={!subjectsResponse?.next}
              >
                {t("next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {isModalOpen && (
        <SubjectFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          subject={editingSubject}
          educationSystems={educationSystems || []}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      <AlertDialog
        open={!!subjectToDelete}
        onOpenChange={(isOpen) => !isOpen && setSubjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            {subjectToDelete && subjectToDelete.usage_count > 0 ? (
              <AlertDialogDescription className="text-destructive font-medium">
                {t("deleteConfirmInUseDescription", {
                  subjectName: subjectToDelete?.name,
                  count: subjectToDelete?.usage_count,
                })}
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                {t("deleteConfirmDescription", {
                  subjectName: subjectToDelete?.name,
                })}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
