"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// UI Components
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Switch } from "@/components/ui/switch"; // For is_active toggle
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertOctagon, CheckSquare, Square } from "lucide-react";

// Utils and Types
import { cn, getBackendErrorMessage } from "@/lib/utils";
import {
  DisciplineCategory,
  DisciplineRecordType,
  DisciplineTypeFormData,
} from "@/types/discipline";

// API Query Functions
import { createRecordType, updateRecordType } from "@/queries/discipline";
import { DisciplineSeverity } from "./DisciplineAddModal";
// We might need fetchById for types if editing requires fetching full data first,
// but often the data from the table row is sufficient to populate the edit form.
// Let's assume we don't need a separate fetchById for types for now.
export enum DisciplineCategoryEnumEnumEnum {
  Incident = "incident",
  Merit = "merit",
  Observation = "observation",
  Sanction = "sanction",
  Other = "other",
}
// --- Zod Schema for Type Form ---
const disciplineTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters.")
    .max(100),
  category: z.nativeEnum(DisciplineCategoryEnumEnumEnum, {
    errorMap: () => ({ message: "Category is required." }),
  }),
  default_severity: z
    .nativeEnum(DisciplineSeverity)
    .nullable()
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  // Optional: school field for superuser context - add if needed
  // school: z.number().positive().optional().nullable(),
});

type DisciplineTypeFormValues = z.infer<typeof disciplineTypeSchema>;

// Options for dropdowns (reuse from main page/record modal if possible)
const CATEGORY_OPTIONS: { value: DisciplineCategory; labelKey: string }[] = [
  // No "all" option here
  { value: "incident", labelKey: "incident" },
  { value: "merit", labelKey: "merit" },
  { value: "observation", labelKey: "observation" },
  { value: "sanction", labelKey: "sanction" },
  { value: "other", labelKey: "other" },
];
const SEVERITY_OPTIONS: { value: DisciplineSeverity | ""; labelKey: string }[] =
  [
    { value: "", labelKey: "selectSeverityOptional" },
    { value: "high", labelKey: "high" },
    { value: "medium", labelKey: "medium" },
    { value: "low", labelKey: "low" },
    { value: "info", labelKey: "info" },
    { value: "n/a", labelKey: "na" },
  ];

interface DisciplineTypeModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  typeData?: DisciplineRecordType | null; // Pass existing data for editing
}

const DisciplineTypeModal: React.FC<DisciplineTypeModalProps> = ({
  isOpen,
  onClose,
  typeData, // Existing data for edit mode
}) => {
  const t = useTranslations("Discipline.TypeModal");
  const tCategory = useTranslations("Discipline.Category");
  const tSeverity = useTranslations("Discipline.Severity");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const isEditMode = !!typeData;

  // --- Form Initialization ---
  const form = useForm<DisciplineTypeFormValues>({
    resolver: zodResolver(disciplineTypeSchema),
    defaultValues: useMemo(
      () => ({
        name: "",
        category: "incident" as DisciplineCategory,
        default_severity: "",
        description: "",
        is_active: true,
      }),
      []
    ), // Empty array, defaults are static
  });

  // --- Form Population Effect ---
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && typeData) {
        // Populate form with existing data for editing
        form.reset({
          name: typeData.name || "",
          category: typeData.category || "incident",
          default_severity: typeData.default_severity || "",
          description: typeData.description || "",
          is_active: typeData.is_active ?? true,
        });
      } else {
        // Reset form to defaults for adding
        form.reset({
          name: "",
          category: "incident",
          default_severity: "",
          description: "",
          is_active: true,
        });
      }
    }
  }, [isOpen, isEditMode, typeData, form]); // Add form dependency

  // --- Mutations (Create/Update Type) ---
  const mutation = useMutation<
    DisciplineRecordType,
    Error,
    DisciplineTypeFormValues
  >({
    mutationFn: async (formData) => {
      // Prepare payload conforming to DisciplineTypeFormData
      const payload: DisciplineTypeFormData = {
        name: formData.name,
        category: formData.category,
        default_severity: formData.default_severity || null, // Convert "" to null
        description: formData.description || null, // Convert "" to null
        is_active: formData.is_active,
      };

      if (isEditMode && typeData?.id) {
        return updateRecordType(typeData.id, payload);
      } else {
        return createRecordType(payload);
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? t("updateSuccess") : t("createSuccess"));
      // Invalidate the paginated types query to refresh the table
      queryClient.invalidateQueries({ queryKey: ["disciplineRecordTypes"] });
      onClose(true); // Close modal and signal refresh
    },
    onError: (error) => {
      toast.error(
        getBackendErrorMessage(error) ||
          (isEditMode ? t("updateError") : t("createError"))
      );
    },
  });

  // --- Form Submission ---
  const onSubmit = (values: DisciplineTypeFormValues) => {
    mutation.mutate(values);
  };

  // --- Render Logic ---
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editTitle") : t("addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t("editDescription") : t("addDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="discipline-type-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4 pb-2"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("nameLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("categoryLabel")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {tCategory(opt.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Default Severity */}
            <FormField
              control={form.control}
              name="default_severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("defaultSeverityLabel")}{" "}
                    <span className="text-muted-foreground">
                      {tCommon("optional")}
                    </span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""} // Controlled value, handles "" state
                  >
                    <FormControl>
                      <SelectTrigger>
                        {/* This placeholder shows when value is "" */}
                        <SelectValue
                          placeholder={t("defaultSeverityPlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Filter out the empty string option before mapping */}
                      {SEVERITY_OPTIONS.filter((o) => o.value !== "").map(
                        (opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {tSeverity(opt.labelKey)}
                          </SelectItem>
                        )
                      )}
                      {/* REMOVED THIS LINE: <SelectItem value="">{tCommon("none")}</SelectItem> */}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("defaultSeverityHelpText")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("descriptionLabel")}{" "}
                    <span className="text-muted-foreground">
                      {tCommon("optional")}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      className="resize-y min-h-[60px]"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Active */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel>{t("isActiveLabel")}</FormLabel>
                    <FormDescription>{t("isActiveHelpText")}</FormDescription>
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
          </form>
        </Form>

        <DialogFooter className="mt-4 pt-4 border-t">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={mutation.isLoading}
            >
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="discipline-type-form"
            disabled={mutation.isLoading || !form.formState.isDirty}
          >
            {mutation.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? tCommon("saveChanges") : t("addButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisciplineTypeModal;
