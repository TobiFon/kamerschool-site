"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  fetchInvoicesForSchool,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  Invoice,
  InvoicePayload,
} from "@/queries/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Plus,
  FileText,
  Terminal,
  MoreHorizontal,
  Edit,
  Trash,
} from "lucide-react";
import InvoiceFormModal from "./InvoiceFormModal";
import InvoiceDetailModal from "./InvoiceDetailModal";

// Helper component for status badges (can be exported if used elsewhere)
export const InvoiceStatusBadge = ({
  status,
}: {
  status: Invoice["status"];
}) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize font-semibold text-xs",
        status === "PAID" &&
          "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
        status === "OVERDUE" &&
          "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
        status === "PARTIALLY_PAID" &&
          "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
        status === "SENT" &&
          "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700"
      )}
    >
      {status.replace("_", " ")}
    </Badge>
  );
};

// Helper function to format currency (can be exported)
export const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
};

interface InvoicesTabProps {
  schoolId: number;
}

export default function InvoicesTab({ schoolId }: InvoicesTabProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("AdminInvoicing");

  // State for modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  const {
    data: invoices,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["invoicesForSchool", schoolId],
    queryFn: () => fetchInvoicesForSchool(schoolId),
  });

  // --- Mutations ---
  const mutationOptions = (action: "create" | "update" | "delete") => ({
    onSuccess: () => {
      toast.success(t(`toast.${action}Success`));
      queryClient.invalidateQueries({
        queryKey: ["invoicesForSchool", schoolId],
      });
      // Close all modals
      setIsFormModalOpen(false);
      setEditingInvoice(null);
      setDeletingInvoice(null);
    },
    onError: (err: Error) => {
      toast.error(t(`toast.${action}Error`), { description: err.message });
    },
  });

  const createMutation = useMutation({
    mutationFn: createInvoice,
    ...mutationOptions("create"),
  });

  const updateMutation = useMutation({
    mutationFn: updateInvoice,
    ...mutationOptions("update"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    ...mutationOptions("delete"),
  });

  // --- Event Handlers ---
  const handleOpenCreateModal = () => {
    setEditingInvoice(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (data: InvoicePayload) => {
    if (editingInvoice) {
      updateMutation.mutate({ schoolId, invoiceId: editingInvoice.id, data });
    } else {
      createMutation.mutate({ schoolId, data });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingInvoice) {
      deleteMutation.mutate({ schoolId, invoiceId: deletingInvoice.id });
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Button onClick={handleOpenCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createInvoice")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {isError && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>{t("error.title")}</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : t("error.unknown")}
              </AlertDescription>
            </Alert>
          )}
          {!isLoading && !isError && invoices?.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{t("empty.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("empty.description")}
              </p>
            </div>
          )}
          {!isLoading && invoices && invoices.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="w-[50px] text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      onClick={() => setDetailInvoiceId(invoice.id)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.due_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.total_amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.balance_due)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleOpenEditModal(invoice)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingInvoice(invoice)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isFormModalOpen && (
        <InvoiceFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          schoolId={schoolId}
          invoice={editingInvoice}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {detailInvoiceId && (
        <InvoiceDetailModal
          isOpen={!!detailInvoiceId}
          onClose={() => setDetailInvoiceId(null)}
          schoolId={schoolId}
          invoiceId={detailInvoiceId}
        />
      )}

      <AlertDialog
        open={!!deletingInvoice}
        onOpenChange={(isOpen) => !isOpen && setDeletingInvoice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this invoice?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice{" "}
              <strong>{deletingInvoice?.invoice_number}</strong>. This action
              cannot be undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
