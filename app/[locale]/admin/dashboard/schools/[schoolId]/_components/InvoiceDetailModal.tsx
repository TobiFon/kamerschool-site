"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  fetchInvoiceById,
  recordPayment,
  PaymentPayload,
  Invoice,
  InvoicePayment,
} from "@/queries/admin";
import { authFetch } from "@/lib/auth"; // ✨ IMPORT authFetch
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PaymentFormModal from "./PaymentFormModal";
import { Download, PlusCircle, Terminal, Loader2 } from "lucide-react";
import { formatCurrency, InvoiceStatusBadge } from "./InvoiceTab";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ... (DetailRow component is the same)
const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between items-center py-2 border-b">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: number;
  invoiceId: number;
}

export default function InvoiceDetailModal({
  isOpen,
  onClose,
  schoolId,
  invoiceId,
}: InvoiceDetailModalProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("AdminInvoicing.detailModal");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // ✨ State for download spinner

  const {
    data: invoice,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["invoiceDetails", invoiceId],
    queryFn: () => fetchInvoiceById({ schoolId, invoiceId }),
    enabled: isOpen,
  });

  const paymentMutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      toast.success("Payment recorded successfully!");
      queryClient.invalidateQueries({
        queryKey: ["invoiceDetails", invoiceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["invoicesForSchool", schoolId],
      });
      setIsPaymentModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error("Failed to record payment", { description: err.message });
    },
  });

  const handlePaymentSubmit = (data: PaymentPayload) => {
    paymentMutation.mutate({ schoolId, invoiceId, data });
  };

  // ✨ NEW: Function to handle the PDF download
  const handleDownloadReceipt = async () => {
    if (!invoice) return;
    setIsDownloading(true);
    try {
      const receiptUrl = `${API_URL}/admin/schools/${schoolId}/invoices/${invoiceId}/receipt/`;

      // Use authFetch to ensure cookies are sent
      const response = await authFetch(receiptUrl);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      // Get the PDF data as a blob
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Clean up the temporary link and URL
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download receipt", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t("title")}: {invoice ? invoice.invoice_number : "Loading..."}
            </DialogTitle>
          </DialogHeader>
          {isLoading && <Skeleton className="h-96 w-full" />}
          {isError && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {invoice && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              <div className="space-y-4">
                <h3 className="font-semibold">{t("summary")}</h3>
                <DetailRow
                  label={t("status")}
                  value={<InvoiceStatusBadge status={invoice.status} />}
                />
                <DetailRow
                  label={t("issueDate")}
                  value={format(new Date(invoice.issue_date), "PPP")}
                />
                <DetailRow
                  label={t("dueDate")}
                  value={format(new Date(invoice.due_date), "PPP")}
                />
                <DetailRow
                  label={t("totalAmount")}
                  value={formatCurrency(invoice.total_amount)}
                />
                <DetailRow
                  label={t("amountPaid")}
                  value={formatCurrency(invoice.amount_paid)}
                />
                <DetailRow
                  label={t("balanceDue")}
                  value={
                    <span className="font-bold text-lg">
                      {formatCurrency(invoice.balance_due)}
                    </span>
                  }
                />

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => setIsPaymentModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> {t("recordPayment")}
                  </Button>
                  {/* ✨ UPDATED: Changed from an <a> tag to a <Button> with onClick */}
                  <Button
                    variant="outline"
                    onClick={handleDownloadReceipt}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {t("downloadReceipt")}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">{t("itemsTitle")}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("itemsDescriptionHeader")}</TableHead>
                        <TableHead className="text-right">
                          {t("itemsTotalHeader")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t("paymentsTitle")}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("paymentsDateHeader")}</TableHead>
                        <TableHead>{t("paymentsMethodHeader")}</TableHead>
                        <TableHead className="text-right">
                          {t("paymentsAmountHeader")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.invoice_payments.length > 0 ? (
                        invoice.invoice_payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              {format(new Date(p.payment_date), "PPP")}
                            </TableCell>
                            <TableCell>{p.payment_method}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(p.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground"
                          >
                            {t("noPayments")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isPaymentModalOpen && invoice && (
        <PaymentFormModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          balanceDue={Number(invoice.balance_due)}
          onSubmit={handlePaymentSubmit}
          isSubmitting={paymentMutation.isLoading}
        />
      )}
    </>
  );
}
