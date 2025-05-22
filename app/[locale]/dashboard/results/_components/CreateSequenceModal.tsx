"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  createSequence,
  updateSequence,
  deleteSequence,
} from "@/queries/results";

// Types
type Term = {
  id: number;
  name: string;
  is_active?: boolean;
};

type Sequence = {
  id: number;
  term: number;
  name: string;
  sequence_type: string;
};

type SequenceModalProps = {
  terms: Term[];
  onClose: () => void;
  sequence?: Sequence;
};

// Define some static options for sequence type
const sequenceTypeOptions = [
  { value: "test", label: "Test" },
  { value: "exam", label: "Exam" },
];

// Validation schema for the form
const sequenceFormSchema = z.object({
  term: z.number({
    required_error: "Term is required",
  }),
  name: z.string().min(1, { message: "Sequence name is required" }),
  sequence_type: z.string().min(1, { message: "Sequence type is required" }),
});

type SequenceFormValues = z.infer<typeof sequenceFormSchema>;

export default function SequenceModal({
  terms,
  onClose,
  sequence,
}: SequenceModalProps) {
  const t = useTranslations("SequenceModal");
  const queryClient = useQueryClient();

  // Determine the default term:
  // In edit mode, use the sequence's term; otherwise, pick the active term or fallback to the first term.
  const defaultTerm = sequence
    ? terms.find((term) => term.id === sequence.term) || terms[0]
    : terms.find((term) => term.is_active) || terms[0];

  const form = useForm<SequenceFormValues>({
    resolver: zodResolver(sequenceFormSchema),
    defaultValues: {
      term: sequence ? sequence.term : defaultTerm ? defaultTerm.id : 0,
      name: sequence ? sequence.name : "",
      sequence_type: sequence
        ? sequence.sequence_type
        : sequenceTypeOptions[0].value,
    },
  });

  // Mutation for create/update
  const mutation = useMutation({
    mutationFn: (data: SequenceFormValues) => {
      if (sequence) {
        return updateSequence(sequence.id, data);
      }
      return createSequence(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      toast.success(sequence ? t("sequenceUpdated") : t("sequenceCreated"), {
        description: sequence
          ? t("sequenceUpdatedDescription")
          : t("sequenceCreatedDescription"),
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  // Mutation for deletion (only available in edit mode)
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (sequence) {
        return deleteSequence(sequence.id);
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      toast.success(t("sequenceDeleted"), {
        description: t("sequenceDeletedDescription"),
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  const onSubmit = (data: SequenceFormValues) => {
    mutation.mutate(data);
  };

  const handleDelete = () => {
    if (confirm(t("confirmDeleteSequence"))) {
      deleteMutation.mutate();
    }
  };

  // Make the modal wider in edit mode to accommodate the extra button
  const modalWidth = sequence ? "max-w-xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay with dark transparent background */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      {/* Modal content */}
      <div className={`relative z-10 ${modalWidth} mx-auto py-8 px-4 w-full`}>
        <Card className="border-0 shadow-lg overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-primary/70 to-primary text-white px-8 py-6">
            <CardTitle className="text-xl font-medium">
              {sequence ? t("editSequence") : t("createSequence")}
            </CardTitle>
            <CardDescription className="text-primary/15 mt-1">
              {sequence
                ? t("editSequenceDescription")
                : t("createSequenceDescription")}
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <CardContent className="px-8 py-6 space-y-6">
                <div className="grid gap-6">
                  {/* Term Selector */}
                  <FormField
                    control={form.control}
                    name="term"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">
                          {t("term")}
                        </FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={field.value ? field.value.toString() : ""}
                          disabled={
                            mutation.isLoading || deleteMutation.isLoading
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border border-gray-300 hover:border-primary/80 transition-colors">
                              <SelectValue placeholder={t("selectTerm")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {terms.map((term) => (
                              <SelectItem
                                key={term.id}
                                value={term.id.toString()}
                              >
                                {term.name}
                                {term.is_active && (
                                  <span className="ml-2 text-green-600">
                                    {t("current")}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sequence Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">
                          {t("sequenceName")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("enterSequenceName")}
                            disabled={
                              mutation.isLoading || deleteMutation.isLoading
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sequence Type */}
                  <FormField
                    control={form.control}
                    name="sequence_type"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium">
                          {t("sequenceType")}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={
                            mutation.isLoading || deleteMutation.isLoading
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border border-gray-300 hover:border-primary/80 transition-colors">
                              <SelectValue
                                placeholder={t("selectSequenceType")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sequenceTypeOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  {sequence && (
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
                  )}{" "}
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
                      {sequence ? t("updateSequence") : t("createSequence")}
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
