"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { PaymentPayload } from "@/queries/admin";
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

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be a positive number."),
  payment_date: z.string().min(1, "Payment date is required."),
  payment_method: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "OTHER"]),
  transaction_id: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof formSchema>;

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceDue: number;
  onSubmit: (data: PaymentFormData) => void;
  isSubmitting: boolean;
}

export default function PaymentFormModal({
  isOpen,
  onClose,
  balanceDue,
  onSubmit,
  isSubmitting,
}: PaymentFormModalProps) {
  const t = useTranslations("AdminInvoicing.paymentModal");

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: balanceDue > 0 ? balanceDue : 0,
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "BANK_TRANSFER",
      transaction_id: "",
      notes: "",
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="amount"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="payment_date"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("paymentDate")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="payment_method"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("paymentMethod")}</FormLabel>
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
                      <SelectItem value="BANK_TRANSFER">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="transaction_id"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("transactionId")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional transaction reference"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
