"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { Invoice, InvoicePayload } from "@/queries/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { Trash } from "lucide-react";

// Zod schema for validation
const formSchema = z.object({
  issue_date: z.string().min(1, "Issue date is required."),
  due_date: z.string().min(1, "Due date is required."),
  status: z.enum(["DRAFT", "SENT"]),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required."),
        quantity: z.coerce.number().min(0.01, "Quantity must be positive."),
        unit_price: z.coerce.number().min(0.01, "Price must be positive."),
      })
    )
    .min(1, "At least one item is required."),
});

type InvoiceFormData = z.infer<typeof formSchema>;

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: number;
  invoice?: Invoice | null; // Pass existing invoice for editing
  onSubmit: (data: InvoiceFormData) => void;
  isSubmitting: boolean;
}

export default function InvoiceFormModal({
  isOpen,
  onClose,
  invoice,
  onSubmit,
  isSubmitting,
}: InvoiceFormModalProps) {
  const t = useTranslations("AdminInvoicing.modal");
  const isEditing = !!invoice;

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issue_date: invoice?.issue_date || new Date().toISOString().split("T")[0],
      due_date: invoice?.due_date || "",
      status:
        invoice?.status === "DRAFT" || invoice?.status === "SENT"
          ? invoice.status
          : "DRAFT",
      notes: invoice?.notes || "",
      items: invoice?.items.map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
      })) || [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const totalAmount = watchItems.reduce((acc, item) => {
    const quantity = item.quantity || 0;
    const price = item.unit_price || 0;
    return acc + quantity * price;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                name="issue_date"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("issueDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="due_date"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("dueDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="status"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>{t("items")}</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      name={`items.${index}.description`}
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          placeholder={t("itemDescription")}
                          {...field}
                          className="flex-grow"
                        />
                      )}
                    />
                    <FormField
                      name={`items.${index}.quantity`}
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder={t("itemQuantity")}
                          {...field}
                          className="w-24"
                        />
                      )}
                    />
                    <FormField
                      name={`items.${index}.unit_price`}
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          placeholder={t("itemPrice")}
                          {...field}
                          className="w-28"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  append({ description: "", quantity: 1, unit_price: 0 })
                }
              >
                {t("addItem")}
              </Button>
            </div>

            <FormField
              name="notes"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("notesPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-right text-lg font-bold">
              Total: ${totalAmount.toFixed(2)}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? t("saveChanges") : t("createInvoice")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
