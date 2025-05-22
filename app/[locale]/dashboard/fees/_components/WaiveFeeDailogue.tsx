"use client";

import React, { useState, useEffect } from "react"; // Added useEffect
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StudentFee, WaiveFeePayload } from "@/types/fees"; // Corrected types
import { waiveStudentFee } from "@/queries/fees"; // Corrected queries
import { toast } from "sonner";

interface WaiveFeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentFee: StudentFee | null;
  schoolId?: number; // Needed for query invalidation key if used
  currency: string;
  locale: string;
}

const WaiveFeeDialog: React.FC<WaiveFeeDialogProps> = ({
  isOpen,
  onClose,
  studentFee,
  schoolId, // Accept schoolId
  currency,
  locale,
}) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  // Reset reason when dialog opens or studentFee changes
  useEffect(() => {
    if (isOpen) {
      setReason(studentFee?.waiver_reason || ""); // Pre-fill if already waived? Or clear? Clear for now.
      // setReason(""); // Clear reason on open
    }
  }, [isOpen, studentFee]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!studentFee) throw new Error("No student fee selected");
      if (!reason.trim()) throw new Error(t("waiverReasonRequired")); // Add validation
      return waiveStudentFee(studentFee.id, reason.trim()); // Trim reason
    },
    onSuccess: () => {
      toast.success(tc("success"), {
        description: t("feeWaivedSuccess"),
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["studentFees"] }); // Might need schoolId
      queryClient.invalidateQueries({ queryKey: ["feeDashboard"] }); // Might need schoolId
      if (studentFee) {
        // Invalidate specific student summary if that query exists
        queryClient.invalidateQueries({
          queryKey: ["studentFeeSummary", studentFee.student],
        });
      }
      onClose();
    },
    onError: (err: Error) => {
      toast.error(tc("error"), {
        description: err.message || t("feeWaivedError"),
      });
    },
  });

  const handleConfirm = () => {
    // Basic validation before calling mutate
    if (!reason.trim()) {
      toast.error(tc("error"), { description: t("waiverReasonRequired") });
      return;
    }
    mutation.mutate();
  };

  if (!studentFee) return null; // Don't render if no fee selected

  return (
    <Dialog
      open={isOpen}
      onOpenChange={!mutation.isPending ? onClose : undefined}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t("waiveFeeTitle")}</DialogTitle>
          <DialogDescription>
            {t("waiveFeeConfirmDesc", {
              studentName: studentFee.student_name,
              feeType: studentFee.fee_type_name,
              amount: formatCurrency(studentFee.amount, currency, locale),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="waiver_reason">{t("waiverReason")}*</Label>
          <Textarea
            id="waiver_reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("waiverReasonPlaceholder")}
            disabled={mutation.isPending}
            rows={3} // Adjust height
          />
          <p className="text-xs text-muted-foreground">
            {t("waiverReasonRequired")}
          </p>{" "}
          {/* Reminder */}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={mutation.isPending}>
              {tc("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={mutation.isPending || !reason.trim()} // Disable if no reason
            variant="destructive" // Use destructive variant for waive action
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("confirmWaive")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaiveFeeDialog;
