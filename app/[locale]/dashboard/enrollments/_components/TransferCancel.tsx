"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react"; // Use AlertTriangle for warning
// Ensure correct import path for type
import { TransferRequest } from "@/queries/transfers"; // Import updated interface

// Schema Creator using translations
const createCancelSchema = (t: Function) =>
  z.object({
    // Min length validation is handled by backend, but good practice here too
    reason: z.string().min(5, { message: t("validation.reasonRequired") }),
  });

interface CancelTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string }) => void; // Expects { reason: string }
  isLoading: boolean;
  transferRequest: TransferRequest | null; // Use updated interface
}

function CancelTransferModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  transferRequest,
}: CancelTransferModalProps) {
  const t = useTranslations("TransfersTab.modals.cancel");
  const tc = useTranslations("Common");
  // Memoize schema creation based on translation function
  const cancelSchema = useMemo(() => createCancelSchema(t), [t]);

  const form = useForm<z.infer<typeof cancelSchema>>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "" },
  });

  // Reset form when modal opens or request changes
  useEffect(() => {
    if (isOpen) {
      form.reset({ reason: "" });
    }
  }, [isOpen, transferRequest, form]); // Depend on request too

  // Form submission handler is simple
  const handleFormSubmit = (values: z.infer<typeof cancelSchema>) => {
    onSubmit(values); // Submit validated data { reason: string }
  };

  if (!transferRequest) return null;

  // Safely access student name
  const studentName =
    transferRequest.student?.full_name || tc("unknownStudent");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />{" "}
            {/* Warning icon */}
            {t("title")}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {t("description", { studentName })} {t("warning")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 pt-2"
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.reason")} *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("placeholders.reason")}
                      {...field}
                      rows={4}
                      disabled={isLoading}
                      aria-invalid={!!form.formState.errors.reason}
                    />
                  </FormControl>
                  <FormMessage /> {/* Shows Zod validation error */}
                </FormItem>
              )}
            />
            <DialogFooter className="pt-3">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isLoading}>
                  {tc("cancel")} {/* Use common Cancel */}
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("submitButton")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CancelTransferModal;
