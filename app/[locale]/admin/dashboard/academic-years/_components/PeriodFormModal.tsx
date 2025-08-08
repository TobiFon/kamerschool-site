// frontend/webapp/src/app/admin/dashboard/academic-years/_components/PeriodFormModal.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Icons } from "@/components/icons";
import { AcademicYear } from "@/types/transfers";

// Schemas for validation
const yearSchema = z.object({
  name: z.string().regex(/^\d{4}\/\d{4}$/, "Format must be YYYY/YYYY"),
  start_date: z.string().min(1, "Start date is required."),
  end_date: z.string().min(1, "End date is required."),
  is_active: z.boolean().default(false),
});

const termSchema = z.object({
  name: z.enum(["first", "second", "third"]),
  start_date: z.string().min(1, "Start date is required."),
  end_date: z.string().min(1, "End date is required."),
  is_active: z.boolean().default(false),
  academic_year: z.number(), // Required to link the term
});

interface PeriodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodType: "year" | "term";
  initialData?: AcademicYear | Term | null;
  academicYearId?: number; // Only needed when creating/editing a term
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function PeriodFormModal({
  isOpen,
  onClose,
  periodType,
  initialData,
  academicYearId,
  onSubmit,
  isSubmitting,
}: PeriodFormModalProps) {
  const t = useTranslations("AdminAcademicYearManagement.modal"); // New namespace
  const isYear = periodType === "year";
  const schema = isYear ? yearSchema : termSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: isYear
      ? {
          name: (initialData as AcademicYear)?.name || "",
          start_date: (initialData as AcademicYear)?.start_date || "",
          end_date: (initialData as AcademicYear)?.end_date || "",
          is_active: (initialData as AcademicYear)?.is_active || false,
        }
      : {
          name: (initialData as Term)?.name || "first",
          start_date: (initialData as Term)?.start_date || "",
          end_date: (initialData as Term)?.end_date || "",
          is_active: (initialData as Term)?.is_active || false,
          academic_year: (initialData as Term)?.academic_year || academicYearId,
        },
  });

  const handleSubmit = (values: any) => {
    onSubmit(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData
              ? t("editTitle", { type: t(periodType) })
              : t("createTitle", { type: t(periodType) })}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            {isYear ? (
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("yearNameLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder="2024/2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("termNameLabel")}</FormLabel>
                    {/* Simplified to a text input for now, could be a select */}
                    <Input
                      placeholder="E.g., first, second, third"
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="start_date"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("startDateLabel")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="end_date"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("endDateLabel")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              name="is_active"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{t("activeLabel")}</FormLabel>
                    <DialogDescription>
                      {t("activeDescription", { type: t(periodType) })}
                    </DialogDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {initialData ? t("saveChanges") : t("createButton")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
