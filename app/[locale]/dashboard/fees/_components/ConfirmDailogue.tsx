"use client";

import React, { useState } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void; // Allow async confirm
  title: string;
  description: string | React.ReactNode; // Allow React nodes in description
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: // Allow specifying button variant
  "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  isConfirming?: boolean; // Allow external loading control
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  confirmVariant = "destructive", // Default destructive for confirmations
  isConfirming: externalLoading, // Renamed prop
}) => {
  const tc = useTranslations("Common");
  const [internalLoading, setInternalLoading] = useState(false);

  // Use external loading state if provided, otherwise use internal state
  const isLoading = externalLoading ?? internalLoading;

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();
      // onClose(); // Let parent handle closing on success/error
    } catch (error) {
      console.error("Confirmation action failed:", error);
      // Parent component should show toast based on mutation result
    } finally {
      // Only set internal loading false if it's controlling the state
      if (externalLoading === undefined) {
        setInternalLoading(false);
      }
    }
  };

  // Prevent closing while loading, only if using internal loading state
  const handleOpenChange = (open: boolean) => {
    if (isLoading && externalLoading === undefined) {
      // Prevent closing if internally loading
      return;
    }
    if (!open) {
      onClose();
    }
  };

  return (
    // Control open state and prevent close when loading (if internal)
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 sm:justify-end">
          {" "}
          {/* Align buttons end */}
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText || tc("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            // Apply the specified variant using cn and buttonVariants
            className={cn(buttonVariants({ variant: confirmVariant }))}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText || tc("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
