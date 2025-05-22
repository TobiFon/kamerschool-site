// components/transfers/ReviewTransferModal.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TransferRequestDetail } from "@/types/transfers";

interface ReviewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { approve: boolean; notes?: string }) => void;
  isLoading: boolean;
  // Use TransferRequestDetail to get all fields including snapshot displays
  transferRequest: TransferRequestDetail | null;
}

function ReviewTransferModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  transferRequest,
}: ReviewTransferModalProps) {
  const t = useTranslations("TransfersTab.modals.review");
  const tc = useTranslations("Common");
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState(false);

  useEffect(() => {
    if (isOpen && transferRequest) {
      // Optionally pre-fill notes from request's to_school_notes if editing?
      // setNotes(transferRequest.to_school_notes || "");
      setNotes(""); // Reset notes for a fresh review
      setNotesError(false);
    }
  }, [isOpen, transferRequest]);

  const studentName = useMemo(
    () => transferRequest?.student?.full_name || tc("unknownStudent"),
    [transferRequest?.student?.full_name, tc]
  );

  const handleAction = (approve: boolean) => {
    if (isLoading) return;
    const trimmedNotes = notes.trim();
    if (!approve && !trimmedNotes) {
      setNotesError(true);
      toast.error(tc("error"), {
        description: t("validation.notesRequiredOnReject"),
      });
      return;
    }
    setNotesError(false);
    onSubmit({ approve, notes: trimmedNotes || undefined });
  };

  if (!transferRequest) return null;

  // Safely access snapshot data
  const prevLevel =
    transferRequest.previous_class_level_display || tc("notAvailableShort");
  const prevSystem =
    transferRequest.previous_education_system_display ||
    tc("notAvailableShort");
  const lastPromo =
    transferRequest.last_promotion_status_display || tc("notAvailableShort");
  const lastAvg =
    transferRequest.last_yearly_average_display !== null
      ? transferRequest.last_yearly_average_display
      : tc("notAvailableShort");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="pr-6">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { studentName })}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto px-1 py-2 space-y-4">
          {/* Display Request Details - NOW INCLUDES SNAPSHOT DATA */}
          <div className="space-y-3 rounded-md border bg-muted/50 dark:bg-slate-800/40 p-4 text-sm">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {t("requestDetails")}:
            </p>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
              {/* Standard Info */}
              <span className="col-span-1 font-medium text-muted-foreground">
                {t("labels.student")}:
              </span>
              <span className="col-span-2">
                {studentName} (
                {transferRequest.student?.matricule || tc("noId")})
              </span>

              <span className="col-span-1 font-medium text-muted-foreground">
                {t("labels.fromSchool")}:
              </span>
              <span className="col-span-2">
                {transferRequest.from_school?.name || tc("notAvailableShort")}
              </span>

              <span className="col-span-1 font-medium text-muted-foreground">
                {t("labels.toSchool")}:
              </span>
              <span className="col-span-2">
                {transferRequest.to_school?.name || tc("notAvailableShort")}
              </span>

              <span className="col-span-1 font-medium text-muted-foreground">
                {t("labels.effectiveYear")}:
              </span>
              <span className="col-span-2">
                {transferRequest.effective_academic_year?.name ||
                  tc("notAvailableShort")}
              </span>

              {/* Snapshot Academic Info */}
              <span className="col-span-3 font-medium text-muted-foreground pt-2 border-t mt-2">
                {t("labels.previousAcademicInfo")}
              </span>

              <span className="col-span-1 font-medium text-muted-foreground">
                {t("labels.previousLevel")}:
              </span>
              <span className="col-span-2">{prevLevel}</span>

              <span className="col-span-1 font-medium text-muted-foreground">
                {t("labels.previousSystem")}:
              </span>
              <span className="col-span-2">{prevSystem}</span>

              <span className="col-span-1 font-medium text-muted-foreground">
                {t("labels.lastPromotion")}:
              </span>
              <span className="col-span-2">{lastPromo}</span>

              <span className="col-span-1 font-medium text-muted-foreground">
                {t("labels.lastAverage")}:
              </span>
              <span className="col-span-2">{lastAvg}</span>

              {/* Original Reason */}
              <span className="col-span-3 font-medium text-muted-foreground pt-2 border-t mt-2">
                {t("labels.transferReason")}
              </span>
              <span className="col-span-3 whitespace-pre-wrap break-words">
                {transferRequest.transfer_reason || tc("notAvailableShort")}
              </span>

              {/* Display internal notes if they exist (might contain suggestion hint) */}
              {transferRequest.internal_processing_notes && (
                <>
                  <span className="col-span-3 font-medium text-muted-foreground pt-2 border-t mt-2">
                    {t("labels.internalNotes")}
                  </span>
                  <span className="col-span-3 whitespace-pre-wrap break-words text-xs italic text-slate-500 dark:text-slate-400">
                    {transferRequest.internal_processing_notes}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Notes/Reason Input */}
          <div className="space-y-1.5 pt-1">
            <Label
              htmlFor="reviewNotes"
              className={cn(
                "text-sm",
                notesError && "text-red-600 dark:text-red-500"
              )}
            >
              {t("labels.notes")}{" "}
              {!notesError && (
                <span className="text-muted-foreground text-xs">
                  {" "}
                  ({t("validation.requiredIfRejecting")})
                </span>
              )}
            </Label>
            <Textarea
              id="reviewNotes"
              placeholder={t("placeholders.notes")}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (notesError) setNotesError(false);
              }}
              rows={4}
              className={cn(
                notesError &&
                  "border-red-500 focus-visible:ring-red-500 dark:border-red-600"
              )}
              disabled={isLoading}
              aria-invalid={notesError}
              aria-describedby={notesError ? "notes-error-msg" : undefined}
            />
            {notesError && (
              <p
                id="notes-error-msg"
                className="text-xs text-red-600 dark:text-red-500"
              >
                {t("validation.notesRequiredOnReject")}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:justify-between flex flex-col-reverse sm:flex-row pt-4 border-t mt-auto">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              {tc("cancel")}
            </Button>
          </DialogClose>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => handleAction(false)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              {tc("reject")}
            </Button>
            <Button
              type="button"
              variant="default"
              className="w-full sm:w-auto"
              onClick={() => handleAction(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {tc("approve")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReviewTransferModal;
