"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  createTerm,
  updateTerm,
  deleteTerm,
  fetchAllAcademicYears,
} from "@/queries/admin";
import { AcademicYear, Term } from "@/types/transfers";

import PageHeader from "@/app/[locale]/dashboard/_components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Icons } from "@/components/icons";
import PeriodFormModal from "./_components/PeriodFormModal";
import {
  Plus,
  Edit,
  Trash,
  MoreVertical,
  CalendarOff,
  Terminal,
} from "lucide-react";

// --- Sub-component for a single Term ---
const TermRow = ({
  term,
  onEdit,
  onDelete,
}: {
  term: Term;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (data: { id: number; is_active: boolean }) =>
      updateTerm({ id: data.id, data: { is_active: data.is_active } }),
    onSuccess: () => {
      toast.success("Term status updated!");
      queryClient.invalidateQueries({ queryKey: ["adminAcademicYears"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to update status", { description: err.message });
      // Revert the toggle on error by refetching
      queryClient.invalidateQueries({ queryKey: ["adminAcademicYears"] });
    },
  });

  return (
    <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <Switch
          id={`term-active-${term.id}`}
          checked={term.is_active}
          onCheckedChange={(checked) =>
            toggleMutation.mutate({ id: term.id, is_active: checked })
          }
          disabled={toggleMutation.isLoading}
        />
        <div>
          <p className="font-medium capitalize">{term.name}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(term.start_date), "MMM d")} -{" "}
            {format(new Date(term.end_date), "MMM d, yyyy")}
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit Term
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash className="mr-2 h-4 w-4" /> Delete Term
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// --- Sub-component for a single Academic Year Card ---
const AcademicYearCard = ({
  year,
  onEdit,
  onDelete,
  onAddTerm,
  onEditTerm,
}: {
  year: AcademicYear;
  onEdit: () => void;
  onDelete: () => void;
  onAddTerm: () => void;
  onEditTerm: (term: Term) => void;
}) => {
  const [termToDelete, setTermToDelete] = useState<Term | null>(null);
  const queryClient = useQueryClient();

  const termDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteTerm(id),
    onSuccess: () => {
      toast.success("Term deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminAcademicYears"] });
      setTermToDelete(null);
    },
    onError: (err: Error) =>
      toast.error("Failed to delete term", { description: err.message }),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{year.name}</CardTitle>
            <CardDescription>
              {format(new Date(year.start_date), "PPP")} -{" "}
              {format(new Date(year.end_date), "PPP")}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit Year
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddTerm}>
                <Plus className="mr-2 h-4 w-4" /> Add Term
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" /> Delete Year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-2">
          {year.terms
            ?.sort(
              (a, b) =>
                new Date(a.start_date).getTime() -
                new Date(b.start_date).getTime()
            )
            .map((term) => (
              <TermRow
                key={term.id}
                term={term}
                onEdit={() => onEditTerm(term)}
                onDelete={() => setTermToDelete(term)}
              />
            ))}
        </CardContent>
      </Card>
      <AlertDialog
        open={!!termToDelete}
        onOpenChange={(isOpen) => !isOpen && setTermToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Term?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the term "{termToDelete?.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                termToDelete && termDeleteMutation.mutate(termToDelete.id)
              }
              disabled={termDeleteMutation.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {termDeleteMutation.isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// --- Main Page Component ---
export default function AcademicPeriodManagementPage() {
  const t = useTranslations("AdminAcademicYearManagement");
  const queryClient = useQueryClient();

  const [modalState, setModalState] = useState<{
    type: "year" | "term";
    data: any | null;
    yearId?: number;
  } | null>(null);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);

  const {
    data: academicYears,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["adminAcademicYears"],
    queryFn: fetchAllAcademicYears,
  });

  const mutationOptions = (periodType: "year" | "term") => ({
    onSuccess: () => {
      toast.success(
        `${periodType === "year" ? "Academic Year" : "Term"} saved successfully!`
      );
      queryClient.invalidateQueries({ queryKey: ["adminAcademicYears"] });
      setModalState(null);
    },
    onError: (err: Error) =>
      toast.error(`Failed to save ${periodType}`, { description: err.message }),
  });

  const yearMutation = useMutation({
    mutationFn: (vars: { id?: number; data: any }) =>
      vars.id ? updateAcademicYear(vars) : createAcademicYear(vars.data),
    ...mutationOptions("year"),
  });

  const termMutation = useMutation({
    mutationFn: (vars: { id?: number; data: any }) =>
      vars.id ? updateTerm(vars) : createTerm(vars.data),
    ...mutationOptions("term"),
  });

  const yearDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteAcademicYear(id),
    onSuccess: () => {
      toast.success("Academic year deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminAcademicYears"] });
      setYearToDelete(null);
    },
    onError: (err: Error) =>
      toast.error("Failed to delete year", { description: err.message }),
  });

  const handleFormSubmit = (formData: any) => {
    if (!modalState) return;
    const { type, data, yearId } = modalState;

    if (type === "year") {
      yearMutation.mutate({ id: data?.id, data: formData });
    } else if (type === "term") {
      const payload = data?.id
        ? formData
        : { ...formData, academic_year: yearId };
      termMutation.mutate({ id: data?.id, data: payload });
    }
  };

  const isSubmitting = yearMutation.isLoading || termMutation.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
      <div className="flex justify-end">
        <Button onClick={() => setModalState({ type: "year", data: null })}>
          <Plus className="mr-2 h-4 w-4" /> {t("createYear")}
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {isError && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "An unknown error occurred"}
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && academicYears?.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
          <CalendarOff className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            No Academic Years Created
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating the first academic year.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {academicYears?.map((year) => (
          <AcademicYearCard
            key={year.id}
            year={year}
            onEdit={() => setModalState({ type: "year", data: year })}
            onDelete={() => setYearToDelete(year)}
            onAddTerm={() =>
              setModalState({ type: "term", data: null, yearId: year.id })
            }
            onEditTerm={(term) =>
              setModalState({ type: "term", data: term, yearId: year.id })
            }
          />
        ))}
      </div>

      {modalState && (
        <PeriodFormModal
          isOpen={!!modalState}
          onClose={() => setModalState(null)}
          periodType={modalState.type}
          initialData={modalState.data}
          academicYearId={modalState.yearId}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      <AlertDialog
        open={!!yearToDelete}
        onOpenChange={(isOpen) => !isOpen && setYearToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Year?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the year "{yearToDelete?.name}" and
              all its associated terms. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                yearToDelete && yearDeleteMutation.mutate(yearToDelete.id)
              }
              disabled={yearDeleteMutation.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {yearDeleteMutation.isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
