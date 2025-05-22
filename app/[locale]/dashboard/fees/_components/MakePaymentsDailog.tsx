"use client";

import React, { useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency, formatDate, formatDateISO } from "@/lib/utils";
import { StudentFee, MakePaymentPayload, SimpleOption } from "@/types/fees";
import { makePayment } from "@/queries/fees";

// Payment method options (ensure labels are translated if needed)
const paymentMethodOptions: SimpleOption[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];

// Schema for the payment form fields
// Use a function to create schema dynamically based on max amount (balance)
const createFormSchema = (maxAmount: number, t: Function) =>
  z.object({
    amount: z.coerce // Use coerce for number input from text field
      .number()
      .positive({ message: t("amountMustBePositive") })
      .max(maxAmount, {
        message: t("amountExceedsBalance", {
          balance: formatCurrency(maxAmount), // Format balance in error message
        }),
      }),
    payment_date: z.date({ required_error: t("paymentDateRequired") }),
    payment_method: z.string().min(1, { message: t("paymentMethodRequired") }),
    reference_number: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  });

type PaymentFormData = z.infer<ReturnType<typeof createFormSchema>>;

interface MakePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentFee: StudentFee | null; // The specific fee being paid
  currency: string;
  locale: string;
}

const MakePaymentDialog: React.FC<MakePaymentDialogProps> = ({
  isOpen,
  onClose,
  studentFee,
  currency,
  locale,
}) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();

  // Calculate max payable amount (balance) safely
  const balance = studentFee ? parseFloat(studentFee.balance) || 0 : 0;

  // Create schema dynamically with the current balance
  const formSchema = useMemo(() => createFormSchema(balance, t), [balance, t]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(formSchema),
    // Default values should be set, especially for controlled components
    defaultValues: {
      amount: undefined, // Start empty
      payment_date: new Date(),
      payment_method: "cash",
      reference_number: "",
      notes: "",
    },
  });

  // Reset form when dialog opens or studentFee changes
  // Also recalculate schema if balance changes while open (unlikely but safe)
  useEffect(() => {
    if (isOpen && studentFee) {
      // Reset the form values
      form.reset({
        amount: undefined,
        payment_date: new Date(),
        payment_method: "cash",
        reference_number: "",
        notes: "",
      });
      // Manually clear any previous validation errors, especially for amount
      form.clearErrors();
    }
    // Update resolver if schema changes (due to balance change)
    // This might cause a flicker if balance updates frequently, but ensures validation is current
    // form.reset(undefined, { resolver: zodResolver(formSchema) }); // Re-attach resolver - use cautiously

    // Only reset values, not the whole form config ideally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, studentFee]); // form is dependency

  const mutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      if (!studentFee) {
        throw new Error("Student Fee information is missing.");
      }

      // **** CORRECTED: Access the IDs directly from the studentFee object ****
      // These IDs should now be present thanks to the backend serializer change
      const studentId = studentFee.student_id;
      const feeTypeId = studentFee.fee_type_id;
      const academicYearId = studentFee.academic_year_id; // This might be null, backend handles it

      // Add a check to ensure the IDs were actually found
      if (typeof studentId !== "number" || typeof feeTypeId !== "number") {
        console.error(
          "Critical Error: Missing student_id or fee_type_id in studentFee object received by MakePaymentDialog.",
          studentFee
        );
        throw new Error(
          "Required fee information (student or fee type ID) is missing. Cannot proceed."
        );
      }

      // Construct the payload expected by the backend PaymentCreateSerializer
      const payload: MakePaymentPayload = {
        student_id: studentId,
        fee_type_id: feeTypeId,
        // Pass academic_year_id if it exists, otherwise null/undefined is fine if serializer allows
        academic_year_id: academicYearId ?? null, // Use nullish coalescing for safety
        amount: data.amount, // Already validated number
        payment_date: formatDateISO(data.payment_date), // Format date as YYYY-MM-DD
        payment_method:
          data.payment_method as MakePaymentPayload["payment_method"], // Cast type
        reference_number: data.reference_number || null, // Send null if empty
        notes: data.notes || null, // Send null if empty
      };

      console.log("Sending Payment Payload:", payload); // Log for debugging
      return makePayment(payload); // Call the API function
    },
    onSuccess: (newPayment) => {
      toast.success(tc("success"), {
        description: t("paymentRecordedSuccess"),
      });
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["payments"] }); // Refetch payments list
      queryClient.invalidateQueries({ queryKey: ["studentFees"] }); // Refetch student fees list
      queryClient.invalidateQueries({ queryKey: ["feeDashboard"] }); // Refetch dashboard
      // Invalidate specific student summary if applicable
      if (studentFee) {
        queryClient.invalidateQueries({
          queryKey: ["studentFeeSummary", studentFee.student_id], // Use student_id
        });
        // Invalidate payment history for the specific fee (if such a query exists)
        queryClient.invalidateQueries({
          queryKey: ["paymentHistory", studentFee.id], // Use student_fee id
        });
      }
      onClose(); // Close the dialog
    },
    onError: (err: Error) => {
      console.error("Make Payment Error:", err); // Log detailed error
      // Display specific error from backend if possible
      const message = err.message || t("paymentRecordedError");
      // Check if it's a DRF validation error structure
      if (message.includes("{") && message.includes("}")) {
        try {
          const errorObj = JSON.parse(message.replace(/'/g, '"')); // Basic parsing attempt
          const details = Object.values(errorObj).flat().join(" ");
          toast.error(tc("error"), {
            description: details || t("paymentRecordedError"),
          });
        } catch (e) {
          toast.error(tc("error"), { description: message });
        }
      } else {
        toast.error(tc("error"), { description: message });
      }
    },
  });

  // Handler for form submission
  const onSubmit = (data: PaymentFormData) => {
    console.log("Form Data Submitted:", data);
    mutation.mutate(data); // Trigger the mutation
  };

  // Don't render if no student fee data
  if (!studentFee) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) {
          onClose(); // Close only if not loading
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("recordPayment")}</DialogTitle>
          <DialogDescription>
            {t("recordPaymentFor", {
              studentName: studentFee.student_name,
              feeType: studentFee.fee_type_name,
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Display Key Fee Info */}
        <div className="mt-4 space-y-1 text-sm border-t pt-4">
          <p>
            <span className="font-medium text-muted-foreground">
              {t("totalAmount")}:{" "}
            </span>
            {formatCurrency(studentFee.amount, currency, locale)}
          </p>
          <p>
            <span className="font-medium text-muted-foreground">
              {t("amountPaid")}:{" "}
            </span>
            {formatCurrency(studentFee.amount_paid, currency, locale)}
          </p>
          <p>
            <span className="font-medium text-muted-foreground">
              {t("remainingBalance")}:{" "}
            </span>
            <span className="font-semibold text-red-600">
              {formatCurrency(balance, currency, locale)}
            </span>
          </p>
        </div>

        {/* Payment Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2 pb-4 border-t mt-4"
          >
            {/* Amount Field */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("paymentAmount")}*</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01" // HTML5 min validation
                      max={balance} // HTML5 max validation
                      placeholder={t("enterAmount")}
                      {...field}
                      // Handle controlled component value (undefined -> empty string)
                      value={field.value ?? ""}
                      onChange={(e) => {
                        // Let zod handle coercion from string/undefined
                        field.onChange(e.target.value);
                      }}
                      disabled={mutation.isPending || balance <= 0}
                      className={
                        form.formState.errors.amount ? "border-red-500" : ""
                      } // Highlight error
                    />
                  </FormControl>
                  <FormDescription>
                    {t("maxPayable", {
                      amount: formatCurrency(balance, currency, locale),
                    })}
                  </FormDescription>
                  <FormMessage /> {/* Display Zod validation error */}
                </FormItem>
              )}
            />

            {/* Payment Date Field */}
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-1">
                  <FormLabel>{t("paymentDate")}*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={mutation.isPending}
                        >
                          {field.value ? (
                            formatDate(field.value, locale) // Use locale
                          ) : (
                            <span>{tc("pickDate")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || // Cannot be future date
                          date < new Date("2000-01-01") || // Limit past date
                          mutation.isPending
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method Field */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("paymentMethod")}*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value} // Use value from form state
                    disabled={mutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectPaymentMethod")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethodOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value as string}
                        >
                          {/* Translate payment method labels */}
                          {t(option.label.replace(/\s+/g, ""))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference Number Field */}
            <FormField
              control={form.control}
              name="reference_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("referenceNumberOptional")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("enterReferenceNumber")}
                      {...field}
                      value={field.value ?? ""} // Handle null
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notesOptional")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("addOptionalNotes")}
                      {...field}
                      value={field.value ?? ""} // Handle null
                      disabled={mutation.isPending}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dialog Footer with Buttons */}
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
              <Button
                type="submit"
                disabled={
                  mutation.isPending || // Disable if submitting
                  balance <= 0 || // Disable if nothing to pay
                  !form.formState.isValid // Disable if form invalid
                }
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("recordPayment")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MakePaymentDialog;
