"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon } from "lucide-react";
import {
  ClassFee,
  ClassFeePayload,
  FeeType,
  SimpleAcademicYearOption,
  SimpleClassOption,
} from "@/types/fees";
import { createClassFee, updateClassFee, fetchFeeTypes } from "@/queries/fees";
import { fetchAcademicYears } from "@/queries/results";
import { fetchAllClasses } from "@/queries/class";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, formatDateISO } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";

// Custom DatePicker component to fix the click issues
const DatePicker = ({ value, onChange, disabled, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDaySelect = (day) => {
    onChange(day);
    setIsOpen(false);
  };

  // Close calendar when clicking outside
  const handleClickOutside = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full pl-3 text-left font-normal",
          !value && "text-muted-foreground"
        )}
        onClick={handleButtonClick}
        disabled={disabled}
      >
        {value ? formatDate(value) : <span>{placeholder}</span>}
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleClickOutside}
            aria-hidden="true"
          />
          <div className="absolute z-50 mt-1 rounded-md border bg-popover p-0 shadow-md">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDaySelect}
              disabled={(date) => date < new Date("1900-01-01") || disabled}
              initialFocus
            />
          </div>
        </>
      )}
    </div>
  );
};

// Schema matches ClassFeePayload structure
const formSchema = z
  .object({
    academic_year: z.coerce.number().positive("Academic Year is required"),
    class_instance: z.coerce.number().positive("Class is required"),
    fee_type: z.coerce.number().positive("Fee Type is required"),
    amount: z.coerce.number().min(0, "Amount must be non-negative"),
    due_date: z.date().optional().nullable(),
    installment_allowed: z.boolean().default(true),
    max_installments: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1")
      .optional()
      .nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      !data.installment_allowed ||
      (data.installment_allowed &&
        data.max_installments &&
        data.max_installments >= 1),
    {
      message:
        "Max installments must be at least 1 if installments are allowed",
      path: ["max_installments"],
    }
  );

type ClassFeeFormData = z.infer<typeof formSchema>;

interface AddEditClassFeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classFee: ClassFee | null;
  schoolId?: number;
}

const AddEditClassFeeDialog: React.FC<AddEditClassFeeDialogProps> = ({
  isOpen,
  onClose,
  classFee,
  schoolId,
}) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const queryClient = useQueryClient();
  const isEditMode = !!classFee;

  const form = useForm<ClassFeeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academic_year: undefined,
      class_instance: undefined,
      fee_type: undefined,
      amount: 0,
      due_date: null,
      installment_allowed: true,
      max_installments: 3,
      notes: "",
    },
  });

  // Fetch data for dropdowns
  const { data: academicYears } = useQuery<SimpleAcademicYearOption[]>({
    queryKey: ["academicYearsSimple"],
    queryFn: () => fetchAcademicYears(),
    enabled: isOpen,
  });

  const { data: classes } = useQuery<SimpleClassOption[]>({
    queryKey: ["classesSimple"],
    queryFn: () => fetchAllClasses(),
    enabled: isOpen,
  });

  const { data: feeTypesPaginated } = useQuery<FeeType[]>({
    queryKey: ["feeTypesSimple"],
    queryFn: () => fetchFeeTypes({ is_active: true, page_size: 1000 }),
    enabled: isOpen,
  });

  const feeTypes = feeTypesPaginated?.results || [];

  React.useEffect(() => {
    if (classFee && isOpen) {
      form.reset({
        academic_year: classFee.academic_year,
        class_instance: classFee.class_instance,
        fee_type: classFee.fee_type,
        amount: parseFloat(classFee.amount),
        due_date: classFee.due_date ? new Date(classFee.due_date) : null,
        installment_allowed: classFee.installment_allowed,
        max_installments: classFee.installment_allowed
          ? classFee.max_installments
          : null,
        notes: classFee.notes || "",
      });
    } else if (!isOpen) {
      form.reset({
        academic_year: undefined,
        class_instance: undefined,
        fee_type: undefined,
        amount: 0,
        due_date: null,
        installment_allowed: true,
        max_installments: 3,
        notes: "",
      });
    }
  }, [classFee, isOpen, form]);

  const mutation = useMutation({
    mutationFn: (data: ClassFeeFormData) => {
      const payload: Partial<ClassFeePayload> = {
        academic_year: data.academic_year,
        class_instance: data.class_instance,
        fee_type: data.fee_type,
        amount: data.amount,
        due_date: data.due_date ? formatDateISO(data.due_date) : null,
        installment_allowed: data.installment_allowed,
        max_installments: data.installment_allowed
          ? data.max_installments
          : null,
        notes: data.notes ?? undefined,
      };
      return isEditMode
        ? updateClassFee(classFee!.id, payload)
        : createClassFee(payload as ClassFeePayload);
    },
    onSuccess: () => {
      toast.success(tc("success"), {
        description: isEditMode
          ? t("classFeeUpdatedSuccess")
          : t("classFeeCreatedSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["classFees"] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error(tc("error"), {
        description:
          err.message ||
          (isEditMode ? t("classFeeUpdatedError") : t("classFeeCreatedError")),
      });
    },
  });

  const onSubmit = (data: ClassFeeFormData) => {
    console.log("Submitting data:", data);
    mutation.mutate(data);
  };

  const installmentAllowed = form.watch("installment_allowed");

  return (
    <Dialog
      open={isOpen}
      onOpenChange={!mutation.isPending ? onClose : undefined}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editClassFee") : t("addClassFee")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2 pb-4"
          >
            {/* Row 1: Year and Class */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("academicYear")}*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : ""}
                      disabled={isEditMode || mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectAcademicYear")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears?.map((year) => (
                          <SelectItem key={year.id} value={String(year.id)}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class_instance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("class")}*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : ""}
                      disabled={isEditMode || mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectClass")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Fee Type and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fee_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("feeType")}*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : ""}
                      disabled={isEditMode || mutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectFeeType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {feeTypes?.map((ft) => (
                          <SelectItem key={ft.id} value={String(ft.id)}>
                            {ft.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("amount")}*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Due Date - Using our custom DatePicker */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col pt-2">
                  <FormLabel>{t("dueDate")}</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={mutation.isPending}
                      placeholder={tc("pickDate")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 4: Installments Checkbox */}
            <FormField
              control={form.control}
              name="installment_allowed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("allowInstallments")}</FormLabel>
                    <FormDescription>
                      {t("allowInstallmentsDesc")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Row 5: Max Installments (conditional) */}
            {installmentAllowed && (
              <FormField
                control={form.control}
                name="max_installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maxInstallments")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value)
                          )
                        }
                        disabled={mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Row 6: Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
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

export default AddEditClassFeeDialog;
