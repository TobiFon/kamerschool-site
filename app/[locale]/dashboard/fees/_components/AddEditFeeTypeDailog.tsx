"use client";

import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { FeeType, FeeTypePayload } from "@/types/fees"; // Corrected types
import { createFeeType, updateFeeType } from "@/queries/fees"; // Corrected queries
import { toast } from "sonner";

// Schema matches FeeTypePayload (excluding school which is handled by backend)
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FeeTypeFormData = z.infer<typeof formSchema>;

interface AddEditFeeTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feeType: FeeType | null; // Existing fee type for editing
}

const AddEditFeeTypeDialog: React.FC<AddEditFeeTypeDialogProps> = ({
  isOpen,
  onClose,
  feeType,
}) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();
  const isEditMode = !!feeType;

  const form = useForm<FeeTypeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (feeType && isOpen) {
      form.reset({
        name: feeType.name,
        description: feeType.description || "",
        is_active: feeType.is_active,
      });
    } else if (!isOpen) {
      form.reset({
        // Reset to defaults when closing or opening for add
        name: "",
        description: "",
        is_active: true,
      });
    }
  }, [feeType, isOpen, form]);

  const mutation = useMutation({
    mutationFn: (data: FeeTypeFormData) => {
      const payload: FeeTypePayload = {
        // Use payload type
        name: data.name,
        description: data.description,
        is_active: data.is_active,
      };
      // Backend assigns school automatically based on user context
      return isEditMode
        ? updateFeeType(feeType!.id, payload) // Use PATCH for update
        : createFeeType(payload);
    },
    onSuccess: () => {
      toast.success(tc("success"), {
        description: isEditMode
          ? t("feeTypeUpdatedSuccess")
          : t("feeTypeCreatedSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["feeTypes"] }); // Invalidate list view
      queryClient.invalidateQueries({ queryKey: ["feeTypesSimple"] }); // Invalidate dropdown list too
      onClose();
    },
    onError: (err: Error) => {
      // Expect Error object from handleApiError
      toast.error(tc("error"), {
        description:
          err.message || // Use message from error object
          (isEditMode ? t("feeTypeUpdatedError") : t("feeTypeCreatedError")),
      });
    },
  });

  const onSubmit = (data: FeeTypeFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={!mutation.isPending ? onClose : undefined}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editFeeType") : t("addFeeType")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t("editFeeTypeDesc") : t("addFeeTypeDesc")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2 pb-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}*</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={mutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{t("active")}</FormLabel>
                    <FormDescription>{t("feeTypeActiveDesc")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={mutation.isPending}
                >
                  {tc("cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? tc("saveChanges") : tc("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditFeeTypeDialog;
