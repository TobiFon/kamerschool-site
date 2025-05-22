"use client";
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl"; // Import useTranslations
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
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckSquare, Loader2, Info, AlertTriangle } from "lucide-react";
import { StatusBadge } from "./StatusBadge"; // Adjust path, assumes StatusBadge handles own translations

// Placeholder values remain internal
const SELECT_NO_CLASS_VALUE = "none";
const SELECT_NO_OPTIONS_VALUE = "no-classes";

// Function to create schema, accepting translation function `t`
const createAssignmentSchema = (t) =>
  z.object({
    class_id: z.string().refine(
      (val) =>
        val && val !== SELECT_NO_CLASS_VALUE && val !== SELECT_NO_OPTIONS_VALUE,
      { message: t("validation.classRequired") } // Translate validation message
    ),
    assignment_notes: z.string().optional(),
  });

function ClassAssignmentModal({
  isOpen,
  onClose,
  onSubmit,
  workflow,
  isLoading,
}) {
  const t = useTranslations("ClassAssignmentModal"); // Initialize hook

  // Create the schema using the translation function
  const assignmentSchema = useMemo(() => createAssignmentSchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { class_id: SELECT_NO_CLASS_VALUE, assignment_notes: "" },
  });

  const studentName = workflow?.student?.full_name || t("common.student");
  const previousClassInfo = workflow?.promotion_decision?.previous_class;
  const previousClassName =
    workflow?.previous_class_name || t("common.notAvailableShort");
  const promotionStatus =
    workflow?.promotion_decision?.promotion_status || "N/A"; // StatusBadge will handle N/A potentially

  const assignableClasses = useMemo(
    () => workflow?.target_class_options || [],
    [workflow?.target_class_options]
  );
  const noOptionsAvailable = assignableClasses.length === 0;

  const suggestedClass = useMemo(() => {
    if (noOptionsAvailable) return null;
    if (promotionStatus === "repeated" && previousClassInfo) {
      const prevClassOption = assignableClasses.find(
        (cls) => cls.id === previousClassInfo.id
      );
      if (prevClassOption) return prevClassOption;
    }
    return assignableClasses[0];
  }, [
    assignableClasses,
    promotionStatus,
    previousClassInfo,
    noOptionsAvailable,
  ]);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        class_id: suggestedClass
          ? String(suggestedClass.id)
          : noOptionsAvailable
          ? SELECT_NO_OPTIONS_VALUE
          : SELECT_NO_CLASS_VALUE,
        assignment_notes: "", // Reset notes on open
      });
    }
  }, [isOpen, suggestedClass, form, noOptionsAvailable]); // Removed workflow dep to avoid resetting notes pre-fill if desired

  const handleFormSubmit = (values) => {
    if (noOptionsAvailable) {
      console.error(
        "Attempted to submit assignment with no available classes."
      );
      return;
    }
    onSubmit(parseInt(values.class_id), values.assignment_notes);
  };

  // Determine suggested class alert text
  let suggestedClassAlertText = "";
  if (suggestedClass) {
    if (promotionStatus === "repeated") {
      suggestedClassAlertText = t("alerts.suggestedClass.repeaterText", {
        className: suggestedClass.name,
      });
    } else {
      suggestedClassAlertText = t("alerts.suggestedClass.progressText", {
        className: suggestedClass.name,
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          {/* Translate title with placeholder */}
          <DialogTitle>{t("title", { studentName })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <div className="p-3 rounded-md border bg-muted/50 text-sm space-y-1">
              <p>
                <strong>{t("context.previousClassLabel")}</strong>{" "}
                {previousClassName}
              </p>
              <p>
                <strong>{t("context.promotionStatusLabel")}</strong>{" "}
                {/* Assuming StatusBadge handles translation */}
                <StatusBadge status={promotionStatus} type="promotion" />
              </p>
            </div>

            {suggestedClass && !noOptionsAvailable && (
              <Alert
                variant="default"
                className="bg-blue-50 border-blue-200 text-blue-800"
              >
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="font-semibold text-blue-900">
                  {t("alerts.suggestedClass.title")}
                </AlertTitle>
                <AlertDescription className="text-sm text-blue-700">
                  {suggestedClassAlertText}{" "}
                  {/* Use determined translated text */}
                </AlertDescription>
              </Alert>
            )}

            {noOptionsAvailable && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t("alerts.noClasses.title")}</AlertTitle>
                <AlertDescription>
                  {t("alerts.noClasses.description")}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("labels.assignClass")} {noOptionsAvailable ? "" : "*"}
                  </FormLabel>
                  <ShadSelect
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={noOptionsAvailable || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={
                          noOptionsAvailable
                            ? "text-muted-foreground italic"
                            : ""
                        }
                      >
                        <SelectValue
                          placeholder={
                            noOptionsAvailable
                              ? t("placeholders.noClasses")
                              : t("placeholders.selectClass")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {noOptionsAvailable ? (
                        <SelectItem value={SELECT_NO_OPTIONS_VALUE} disabled>
                          {t("selectOptions.noClassesFound")}
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value={SELECT_NO_CLASS_VALUE} disabled>
                            {t("selectOptions.prompt")}
                          </SelectItem>
                          {assignableClasses.map((cls) => (
                            <SelectItem key={cls.id} value={String(cls.id)}>
                              {cls.name}{" "}
                              {cls.id === suggestedClass?.id
                                ? t("selectOptions.suggestedSuffix")
                                : ""}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </ShadSelect>
                  {!noOptionsAvailable && <FormMessage />}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignment_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("labels.notes")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("placeholders.notes")}
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  {t("buttons.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || noOptionsAvailable}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("buttons.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default ClassAssignmentModal;
