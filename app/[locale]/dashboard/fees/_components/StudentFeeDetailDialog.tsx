// src/app/[locale]/dashboard/finance/_components/dialogs/StudentFeeDetailDialog.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose, // Import Close
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Import Button for close
import { X } from "lucide-react"; // Import X for close button
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StudentFee, Payment } from "@/types/fees";
import { fetchStudentFeeById } from "@/queries/fees";
import { formatCurrency, formatDate } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingErrorState from "./LoadingErrorState";
import StatusBadge from "./StatusBadge";

interface StudentFeeDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentFeeId: number | null;
  currency: string;
  locale: string;
}

const StudentFeeDetailDialog: React.FC<StudentFeeDetailDialogProps> = ({
  isOpen,
  onClose,
  studentFeeId,
  currency,
  locale,
}) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");

  const {
    data: feeDetail,
    isLoading,
    error,
  } = useQuery<StudentFee, Error>({
    queryKey: ["studentFeeDetail", studentFeeId],
    queryFn: () => fetchStudentFeeById(studentFeeId!), // Add non-null assertion
    enabled: isOpen && !!studentFeeId, // Only fetch when open and ID is available
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const renderDetailItem = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium text-right">{value || "-"}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t("studentFeeDetails")}</DialogTitle>
          {/* Add Close button */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{tc("close")}</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        <ScrollArea className="flex-grow pr-6 -mr-6">
          {" "}
          {/* Add padding compensation for scrollbar */}
          {isLoading && <LoadingErrorState isLoading={true} />}
          {error && <LoadingErrorState error={error} />}
          {feeDetail && (
            <div className="space-y-4 py-4">
              {/* Student Information */}
              <section>
                <h3 className="text-md font-semibold mb-2">
                  {t("studentInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {renderDetailItem(
                    t("studentName"),
                    feeDetail.student_details?.full_name
                  )}
                  {renderDetailItem(
                    t("matricule"),
                    feeDetail.student_details?.matricule
                  )}
                  {/* Add more student details if needed */}
                </div>
              </section>

              <Separator />

              {/* Fee Information */}
              <section>
                <h3 className="text-md font-semibold mb-2">
                  {t("feeInformation")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {renderDetailItem(t("feeType"), feeDetail.fee_type_name)}
                  {renderDetailItem(
                    t("status"),
                    <StatusBadge status={feeDetail.status} />
                  )}
                  {renderDetailItem(
                    t("totalAmount"),
                    formatCurrency(feeDetail.amount, currency, locale)
                  )}
                  {renderDetailItem(
                    t("amountPaid"),
                    formatCurrency(feeDetail.amount_paid, currency, locale)
                  )}
                  {renderDetailItem(
                    t("balance"),
                    <span
                      className={
                        parseFloat(feeDetail.balance) > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {formatCurrency(feeDetail.balance, currency, locale)}
                    </span>
                  )}
                  {renderDetailItem(
                    t("dueDate"),
                    feeDetail.due_date
                      ? formatDate(feeDetail.due_date, locale)
                      : "-"
                  )}
                  {feeDetail.status === "waived" &&
                    renderDetailItem(
                      t("waiverReason"),
                      feeDetail.waiver_reason
                    )}
                </div>
                {feeDetail.notes && (
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">
                      {t("notes")}:
                    </span>
                    <p className="text-sm mt-1 p-2 border rounded bg-muted/50">
                      {feeDetail.notes}
                    </p>
                  </div>
                )}
              </section>

              <Separator />

              {/* Class & Year Information */}
              <section>
                <h3 className="text-md font-semibold mb-2">
                  {t("classAndYearInfo")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {renderDetailItem(
                    t("class"),
                    feeDetail.class_fee_details?.class_name
                  )}
                  {renderDetailItem(
                    t("academicYear"),
                    feeDetail.class_fee_details?.academic_year_name
                  )}
                </div>
              </section>

              <Separator />

              {/* Payment History */}
              <section>
                <h3 className="text-md font-semibold mb-2">
                  {t("paymentHistory")}
                </h3>
                {feeDetail.payments && feeDetail.payments.length > 0 ? (
                  <Table className="mt-2 text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead className="text-right">
                          {t("amount")}
                        </TableHead>
                        <TableHead>{t("method")}</TableHead>
                        <TableHead>{t("reference")}</TableHead>
                        <TableHead>{t("receivedBy")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeDetail.payments.map((payment: Payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {formatDate(payment.payment_date, locale)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount, currency, locale)}
                          </TableCell>
                          <TableCell>
                            {" "}
                            <Badge
                              variant="outline"
                              className="capitalize text-xs"
                            >
                              {payment.payment_method_display}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.reference_number || "-"}
                          </TableCell>
                          <TableCell>
                            {payment.received_by_name || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("noPaymentsFound")}
                  </p>
                )}
              </section>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default StudentFeeDetailDialog;
