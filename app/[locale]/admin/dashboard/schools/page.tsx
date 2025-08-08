"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import Link from "next/link"; // ✨ Import

import {
  createSchool,
  updateSchool,
  deleteSchool,
  fetchAllSchools,
} from "@/queries/admin";
import { School } from "@/types/auth";
import { formatDate } from "@/lib/utils";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import PageHeader from "@/app/[locale]/dashboard/_components/PageHeader";

import {
  Building,
  Edit,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Trash,
} from "lucide-react";
import PaginationControls from "@/app/[locale]/dashboard/results/_components/PaginationControls";
import SchoolFormModal from "../_components/SchoolFormModal";

const SchoolTableRowSkeleton = () => (
  <TableRow>
    <TableCell className="hidden sm:table-cell">
      <Skeleton className="h-10 w-10 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24 mt-2" />
    </TableCell>
    <TableCell className="hidden md:table-cell">
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell className="hidden lg:table-cell">
      <Skeleton className="h-4 w-40" />
    </TableCell>
    <TableCell className="hidden md:table-cell">
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell className="text-right">
      <Skeleton className="h-8 w-8 ml-auto" />
    </TableCell>
  </TableRow>
);

export default function AdminSchoolManagementPage() {
  const t = useTranslations("AdminSchoolManagement");
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["adminSchools", page, debouncedSearch],
    queryFn: () => fetchAllSchools({ page, search: debouncedSearch }),
    keepPreviousData: true,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSchools"] });
      setIsModalOpen(false);
      setEditingSchool(null);
    },
    onError: (err: Error) => {
      toast.error(t("toast.operationError"), { description: err.message });
    },
  };

  const createMutation = useMutation({
    mutationFn: createSchool,
    ...mutationOptions,
    onSuccess: () => {
      toast.success(t("toast.createSuccess"));
      mutationOptions.onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSchool,
    ...mutationOptions,
    onSuccess: () => {
      toast.success(t("toast.updateSuccess"));
      mutationOptions.onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSchool,
    onSuccess: () => {
      toast.success(t("toast.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["adminSchools"] });
      setSchoolToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(t("toast.deleteError"), { description: err.message });
    },
  });

  const handleCreateSchool = () => {
    setEditingSchool(null);
    setIsModalOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setIsModalOpen(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSchoolToDelete(school);
  };

  const handleConfirmDelete = () => {
    if (schoolToDelete) {
      deleteMutation.mutate(schoolToDelete.id);
    }
  };

  const handleModalSubmit = (formData: FormData) => {
    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-auto md:flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateSchool} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t("createSchool")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">
                    <span className="sr-only">Logo</span>
                  </TableHead>
                  <TableHead>{t("tableHeaderName")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("tableHeaderCity")}
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("tableHeaderEmail")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("tableHeaderDate")}
                  </TableHead>
                  <TableHead className="w-[50px] text-right">
                    <span className="sr-only">{t("tableHeaderActions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <SchoolTableRowSkeleton key={`loading-${i}`} />
                  ))}
                {isError && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
                {!isLoading && !isError && data?.results.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground p-12"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <Building className="h-16 w-16 text-gray-300 dark:text-gray-700" />
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">
                            {debouncedSearch
                              ? t("noSchoolsFound")
                              : t("noSchoolsCreated")}
                          </p>
                          <p className="text-sm">
                            {debouncedSearch
                              ? t("tryChangingFilters")
                              : t("createFirstSchool")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  data?.results.map((school) => (
                    <TableRow key={school.id} className="hover:bg-muted/50">
                      <TableCell className="hidden sm:table-cell">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={school.logo}
                            alt={`${school.name} logo`}
                          />
                          <AvatarFallback>
                            <Building className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/dashboard/schools/${school.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {school.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {school.school_id}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {school.city}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {school.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(school.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {t("actions")}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditSchool(school)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteSchool(school)}
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
      </Card>
      {data && data.count > data.results.length && (
        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(data.count / 15)}
          onPageChange={setPage}
        />
      )}
      {isModalOpen && (
        <SchoolFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          school={editingSchool}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
        />
      )}
      <AlertDialog
        open={!!schoolToDelete}
        onOpenChange={(isOpen) => !isOpen && setSchoolToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription")}
              <br />
              <br />
              <span className="font-bold text-destructive">
                {schoolToDelete?.name} ({schoolToDelete?.school_id})
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isLoading && (
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
