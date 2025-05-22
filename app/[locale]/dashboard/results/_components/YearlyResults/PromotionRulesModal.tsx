"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  managePromotionRules,
  updatePromotionRule,
  deletePromotionRule,
} from "@/queries/promotions";

// types (simplified)
type PromotionRule = {
  id?: number;
  education_system: number;
  level: string;
  stream?: string | null;
  min_average_for_promotion: number;
  min_subjects_passed?: number | null;
  conditional_min_average: number;
  is_active: boolean;
};

type PromotionRuleModalProps = {
  classEducationSystem: any;
  classLevel: string;
  onClose: () => void;
};

// stream choices
const streamChoices = [
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts" },
  { value: "commercial", label: "Commercial" },
  { value: "general", label: "General" },
];

// validation schema for the form
const promotionRuleSchema = z
  .object({
    education_system: z.number(),
    level: z.string().min(1, { message: "level is required" }),
    stream: z.string().optional().nullable(),
    min_average_for_promotion: z.coerce.number().min(0).max(20, {
      message: "average must be between 0 and 20",
    }),
    min_subjects_passed: z.coerce.number().int().min(0).optional().nullable(),
    conditional_min_average: z.coerce.number().min(0).max(20, {
      message: "conditional average must be between 0 and 20",
    }),
  })
  .refine(
    (data) => data.conditional_min_average < data.min_average_for_promotion,
    {
      message: "conditional average must be lower than promotion average",
      path: ["conditional_min_average"],
    }
  );

type PromotionRuleFormValues = z.infer<typeof promotionRuleSchema>;

export default function PromotionRuleModal({
  classEducationSystem,
  classLevel,
  onClose,
}: PromotionRuleModalProps) {
  const t = useTranslations("PromotionRuleModal");
  const queryClient = useQueryClient();
  console.log(classEducationSystem, classLevel);

  // fetch existing rules for this school
  const { data: rules, isLoading } = useQuery({
    queryKey: ["promotionRules"],
    queryFn: () => managePromotionRules(),
  });

  // find if a rule exists for the given level and education system
  const existingRule = rules?.find(
    (rule: PromotionRule) =>
      rule.level === classLevel &&
      rule.education_system === classEducationSystem.id &&
      !rule.stream
  );

  const form = useForm<PromotionRuleFormValues>({
    resolver: zodResolver(promotionRuleSchema),
    defaultValues: {
      education_system: classEducationSystem.id,
      level: classLevel,
      stream: existingRule ? existingRule.stream : null,
      min_average_for_promotion: existingRule
        ? existingRule.min_average_for_promotion
        : 10,
      min_subjects_passed: existingRule
        ? existingRule.min_subjects_passed
        : null,
      conditional_min_average: existingRule
        ? existingRule.conditional_min_average
        : 8,
    },
  });

  // reset form when rules are fetched or props change
  useEffect(() => {
    if (!isLoading && rules) {
      const rule = rules.find(
        (r: PromotionRule) =>
          r.level === classLevel &&
          r.education_system === classEducationSystem.id &&
          !r.stream
      );
      form.reset({
        education_system: classEducationSystem.id,
        level: classLevel,
        stream: rule ? rule.stream : null,
        min_average_for_promotion: rule ? rule.min_average_for_promotion : 10,
        min_subjects_passed: rule ? rule.min_subjects_passed : null,
        conditional_min_average: rule ? rule.conditional_min_average : 8,
      });
    }
  }, [rules, isLoading, classLevel, classEducationSystem.id, form]);

  // mutation for create/update
  const mutation = useMutation({
    mutationFn: (data: PromotionRuleFormValues) => {
      if (existingRule) {
        return updatePromotionRule(existingRule.id!, data);
      } else {
        return managePromotionRules(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotionRules"] });
      toast.success(existingRule ? t("ruleUpdated") : t("ruleCreated"), {
        description: existingRule
          ? t("ruleUpdatedDescription")
          : t("ruleCreatedDescription"),
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  const onSubmit = (data: PromotionRuleFormValues) => {
    mutation.mutate(data);
  };

  // mutation for deletion (only available in edit mode)
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (existingRule && existingRule.id) {
        return deletePromotionRule(existingRule.id);
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotionRules"] });
      toast.success(t("ruleDeleted"), {
        description: t("ruleDeletedDescription"),
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  const handleDelete = () => {
    if (confirm(t("confirmDeleteRule"))) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return <div>loading rules...</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 max-w-xl mx-auto py-8 px-4 w-full">
        <Card className="border-0 shadow-lg overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-primary/70 to-primary text-white px-8 py-6">
            <CardTitle className="text-xl font-medium">
              {existingRule ? t("editRule") : t("createRule")}
            </CardTitle>
            <CardDescription className="text-primary/15 mt-1">
              {existingRule
                ? t("editRuleDescription")
                : t("createRuleDescription")}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <CardContent className="px-8 py-6 space-y-6">
                <div className="grid gap-6">
                  {/* level (read-only) */}
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">{t("level")}</FormLabel>
                    <div className="bg-gray-100 p-2 rounded-md text-gray-800">
                      {classLevel}
                    </div>
                  </FormItem>

                  {/* stream selector (optional) */}
                  <FormField
                    control={form.control}
                    name="stream"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">
                          {t("stream")} ({t("optional")})
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? null : value)
                          }
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectStream")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              {t("noStream")}
                            </SelectItem>
                            {streamChoices.map((stream) => (
                              <SelectItem
                                key={stream.value}
                                value={stream.value}
                              >
                                {stream.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* minimum average for promotion */}
                  <FormField
                    control={form.control}
                    name="min_average_for_promotion"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">
                          {t("minAverageForPromotion")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder={t("enterMinAverage")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* minimum subjects passed (optional) */}
                  <FormField
                    control={form.control}
                    name="min_subjects_passed"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">
                          {t("minSubjectsPassed")} ({t("optional")})
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder={t("enterMinSubjectsPassed")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* conditional minimum average */}
                  <FormField
                    control={form.control}
                    name="conditional_min_average"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">
                          {t("conditionalMinAverage")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder={t("enterConditionalMinAverage")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  {existingRule && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={mutation.isLoading || deleteMutation.isLoading}
                      className="border-red-300 hover:bg-red-100 transition-colors flex-shrink-0"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("delete")}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={mutation.isLoading || deleteMutation.isLoading}
                    className="border-gray-300 hover:bg-gray-100 transition-colors flex-shrink-0"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("cancel")}
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={mutation.isLoading || deleteMutation.isLoading}
                  className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-indigo-700 text-white px-8 transition-all ml-auto mt-3 sm:mt-0"
                >
                  {mutation.isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("saving")}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {existingRule ? t("updateRule") : t("createRule")}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
