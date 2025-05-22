// FILE: components/transfers/CompleteTransferModal.tsx

"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, Info, Star, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
// Use updated interfaces from your queries/types file
import {
  TransferRequestDetail,
  TargetClass,
  fetchEligibleTargetClasses,
} from "@/queries/transfers";

// Schema Creator
const createCompleteSchema = (t: Function) =>
  z.object({
    target_class_id: z
      .string()
      .min(1, { message: t("validation.classRequired") }),
    notes: z.string().optional(),
  });

interface CompleteTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { target_class_id: number; notes?: string }) => void;
  isLoading: boolean;
  transferRequest: TransferRequestDetail | null;
  fetchError?: string | null;
}

function CompleteTransferModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading: isCompleteMutationLoading,
  transferRequest,
  fetchError: detailFetchError,
}: CompleteTransferModalProps) {
  const t = useTranslations("TransfersTab.modals.complete");
  const tc = useTranslations("Common");
  const completeSchema = useMemo(() => createCompleteSchema(t), [t]);

  const form = useForm<z.infer<typeof completeSchema>>({
    resolver: zodResolver(completeSchema),
    defaultValues: { target_class_id: "", notes: "" },
  });

  const [targetClasses, setTargetClasses] = useState<TargetClass[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [fetchClassesError, setFetchClassesError] = useState<string | null>(
    null
  );
  const [selectedClassInfo, setSelectedClassInfo] = useState<{
    name: string;
    isRecommended: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen && transferRequest) {
      const loadClasses = async () => {
        setIsLoadingClasses(true);
        setFetchClassesError(null);
        setTargetClasses([]);
        setSelectedClassInfo(null);
        form.reset({
          target_class_id: "",
          notes: transferRequest.to_school_notes || "",
        });

        try {
          const classes = await fetchEligibleTargetClasses(transferRequest.id);
          setTargetClasses(classes);

          if (classes.length === 0) {
            toast.warning(t("warnings.noClassesFoundTitle"), {
              description: t("warnings.noClassesFoundDesc"),
            });
          } else {
            const firstRecommended = classes.find((c) => c.is_recommended);
            if (firstRecommended) {
              form.setValue("target_class_id", String(firstRecommended.id), {
                shouldValidate: true,
              });
              setSelectedClassInfo({
                name: firstRecommended.full_name,
                isRecommended: true,
              });
            } else {
              setSelectedClassInfo(null);
            }
          }
        } catch (error: any) {
          console.error("Error fetching target classes:", error);
          const errorMsg = error.message || t("errors.fetchFailed");
          setFetchClassesError(errorMsg);
          toast.error(tc("error"), { description: errorMsg });
        } finally {
          setIsLoadingClasses(false);
        }
      };
      loadClasses();
    } else if (!isOpen) {
      setTargetClasses([]);
      setIsLoadingClasses(false);
      setFetchClassesError(null);
      setSelectedClassInfo(null);
      form.reset();
    }
  }, [isOpen, transferRequest, form, t, tc]);

  const handleFormSubmit = (values: z.infer<typeof completeSchema>) => {
    if (!values.target_class_id) {
      toast.error(tc("error"), { description: t("validation.classRequired") });
      return;
    }
    onSubmit({
      target_class_id: parseInt(values.target_class_id, 10),
      notes: values.notes || undefined,
    });
  };

  if (!isOpen) return null;

  if (
    isOpen &&
    !transferRequest &&
    !detailFetchError &&
    !isCompleteMutationLoading
  ) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-muted-foreground">{tc("loadingDetails")}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  if (isOpen && detailFetchError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{tc("errorFetchingDetailsTitle")}</AlertTitle>
            <AlertDescription>{detailFetchError}</AlertDescription>
          </Alert>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{tc("close")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  if (!transferRequest) {
    return null;
  }

  const studentName =
    transferRequest.student?.full_name || tc("unknownStudent");
  const schoolName = transferRequest.to_school?.name || tc("notAvailableShort");
  const yearName =
    transferRequest.effective_academic_year?.name || tc("notAvailableShort");
  const noClassesAvailable = !isLoadingClasses && targetClasses.length === 0;
  const disableSubmitButton =
    isCompleteMutationLoading ||
    isLoadingClasses ||
    noClassesAvailable ||
    !!fetchClassesError;

  const recommendedClassesDisplay = targetClasses.filter(
    (c) => c.is_recommended
  );
  const otherClassesBySystemDisplay: Record<string, TargetClass[]> =
    targetClasses
      .filter((c) => !c.is_recommended)
      .reduce((acc, cls) => {
        const systemKey =
          cls.education_system_name ||
          cls.education_system_code ||
          t("labels.otherSystems");
        if (!acc[systemKey]) acc[systemKey] = [];
        acc[systemKey].push(cls);
        return acc;
      }, {} as Record<string, TargetClass[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="pr-6">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { studentName, schoolName, yearName })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 pl-1 py-2 custom-scrollbar">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              {fetchClassesError && !isLoadingClasses && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{t("errors.fetchFailedTitle")}</AlertTitle>
                  <AlertDescription>{fetchClassesError}</AlertDescription>
                </Alert>
              )}

              {selectedClassInfo &&
                !isLoadingClasses &&
                !fetchClassesError &&
                targetClasses.length > 0 && (
                  <Alert
                    variant={
                      selectedClassInfo.isRecommended ? "default" : "info"
                    }
                    className={
                      selectedClassInfo.isRecommended
                        ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700"
                        : "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700"
                    }
                  >
                    {selectedClassInfo.isRecommended ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <AlertTitle
                      className={
                        selectedClassInfo.isRecommended
                          ? "text-green-800 dark:text-green-300"
                          : "text-blue-800 dark:text-blue-300"
                      }
                    >
                      {selectedClassInfo.isRecommended
                        ? t("suggestions.recommendedClassSelectedTitle")
                        : t("suggestions.manualClassSelectedTitle")}
                    </AlertTitle>
                    <AlertDescription
                      className={
                        selectedClassInfo.isRecommended
                          ? "text-green-700 dark:text-green-300"
                          : "text-blue-700 dark:text-blue-300"
                      }
                    >
                      {t("suggestions.classSelectedDesc", {
                        className: selectedClassInfo.name,
                      })}
                    </AlertDescription>
                  </Alert>
                )}

              <FormField
                control={form.control}
                name="target_class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.targetClass")} *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        const selectedCls = targetClasses.find(
                          (c) => String(c.id) === value
                        );
                        if (selectedCls) {
                          setSelectedClassInfo({
                            name: selectedCls.full_name,
                            isRecommended: selectedCls.is_recommended,
                          });
                        } else {
                          setSelectedClassInfo(null);
                        }
                      }}
                      value={field.value}
                      disabled={disableSubmitButton || isLoadingClasses}
                    >
                      <FormControl>
                        <SelectTrigger
                          aria-label={t("labels.targetClass")}
                          className={
                            noClassesAvailable && !isLoadingClasses
                              ? "text-muted-foreground italic"
                              : ""
                          }
                        >
                          <SelectValue
                            placeholder={
                              isLoadingClasses
                                ? t("placeholders.classLoading")
                                : noClassesAvailable
                                ? t("placeholders.classNone")
                                : t("placeholders.classSelect")
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[calc(50vh-4rem)]">
                        {isLoadingClasses ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            {t("placeholders.classLoading")}
                          </div>
                        ) : noClassesAvailable ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {t("placeholders.classNone")}
                          </div>
                        ) : (
                          <>
                            {recommendedClassesDisplay.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="text-primary flex items-center px-2 py-1.5">
                                  <Star className="h-3.5 w-3.5 mr-1.5 text-amber-500 fill-amber-400" />
                                  {t("labels.recommendedClasses")}
                                </SelectLabel>
                                {recommendedClassesDisplay.map((cls) => (
                                  <SelectItem
                                    key={`rec-${cls.id}`}
                                    value={String(cls.id)}
                                  >
                                    <div className="flex items-center">
                                      <span className="font-medium">
                                        {cls.full_name}
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-2 truncate">
                                        (
                                        {cls.education_system_name ||
                                          cls.education_system_code}{" "}
                                        - {cls.level_display_name}){" "}
                                        {/* USE level_display_name */}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                            {Object.entries(otherClassesBySystemDisplay).map(
                              ([systemKey, classesInSystem]) => (
                                <SelectGroup key={systemKey}>
                                  <SelectLabel className="px-2 py-1.5">
                                    {systemKey === t("labels.otherSystems")
                                      ? systemKey
                                      : t("labels.classesInSystem", {
                                          systemName: systemKey,
                                        })}
                                  </SelectLabel>
                                  {classesInSystem.map((cls) => (
                                    <SelectItem
                                      key={`other-${cls.id}`}
                                      value={String(cls.id)}
                                    >
                                      <div className="flex items-center">
                                        <span>{cls.full_name}</span>
                                        <span className="text-xs text-muted-foreground ml-2 truncate">
                                          ({cls.level_display_name}){" "}
                                          {/* USE level_display_name */}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              )
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("placeholders.notes")}
                        {...field}
                        rows={3}
                        disabled={isCompleteMutationLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="border-t mt-auto pt-4 sm:justify-between">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={isCompleteMutationLoading}
            >
              {tc("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={form.handleSubmit(handleFormSubmit)}
            disabled={disableSubmitButton}
          >
            {isCompleteMutationLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("submitButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CompleteTransferModal;
