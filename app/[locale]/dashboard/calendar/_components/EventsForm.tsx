"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Calendar,
  Target,
  Check,
  X,
  ArrowLeft,
  Repeat2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createCalendarEvent, updateCalendarEvent } from "@/queries/events";
import { eventFormSchema, EventFormValues } from "@/types/events";

type EventFormProps = {
  initialData?: Partial<EventFormValues> & { id?: number };
  onSuccess?: () => void;
};

export default function EventForm({ initialData, onSuccess }: EventFormProps) {
  const t = useTranslations("Events");
  const queryClient = useQueryClient();
  const router = useRouter();
  const [formProgress, setFormProgress] = useState(0);

  // Setup form with validation
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      event_type: initialData?.event_type || "other",
      start_date: initialData?.start_date
        ? new Date(initialData.start_date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      end_date: initialData?.end_date
        ? new Date(initialData.end_date).toISOString().slice(0, 16)
        : new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1 hour later
      is_recurring: initialData?.is_recurring || false,
    },
    mode: "onChange",
  });

  // Watch fields for dynamic updates and progress calculation
  const watchTitle = form.watch("title");
  const watchDescription = form.watch("description");
  const watchEventType = form.watch("event_type");
  const watchStartDate = form.watch("start_date");
  const watchEndDate = form.watch("end_date");
  const watchRecurring = form.watch("is_recurring");

  // Update form progress
  useEffect(() => {
    let completedFields = 0;
    const totalFields = 5;

    if (watchTitle) completedFields++;
    if (watchEventType) completedFields++;
    if (watchStartDate) completedFields++;
    if (watchEndDate) completedFields++;
    if (watchRecurring !== undefined) completedFields++;

    setFormProgress(Math.min((completedFields / totalFields) * 100, 100));
  }, [
    watchTitle,
    watchEventType,
    watchStartDate,
    watchEndDate,
    watchRecurring,
  ]);

  // Unified go back functionality
  const handleGoBack = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard/events");
    }
  };

  // Mutation for creating/updating event
  const mutation = useMutation({
    mutationFn: initialData?.id
      ? (data: EventFormValues) => updateCalendarEvent(initialData.id!, data)
      : createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success(initialData?.id ? t("eventUpdated") : t("eventCreated"), {
        description: initialData?.id
          ? t("eventUpdatedDescription")
          : t("eventCreatedDescription"),
      });
      handleGoBack();
    },
    onError: (error: any) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: EventFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back to events button */}
      <Button
        variant="ghost"
        onClick={handleGoBack}
        className="mb-6 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("backToEvents")}
      </Button>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto space-y-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {initialData?.id ? t("editEvent") : t("createEvent")}
            </h1>
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 px-3 py-1"
            >
              {formProgress < 50
                ? t("gettingStarted")
                : formProgress < 80
                ? t("almostThere")
                : formProgress === 100
                ? t("readyToSubmit")
                : t("inProgress")}
            </Badge>
          </div>

          <div className="mb-8">
            <Progress value={formProgress} className="h-2" />
          </div>

          <Card className="border-0 shadow-lg overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-primary/70 to-primary text-white px-8 py-6">
              <CardTitle className="text-xl font-medium flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {t("eventDetails")}
              </CardTitle>
              <CardDescription className="text-primary/15 mt-1">
                {t("specifyEventDetails")}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 py-6 space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t("title")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("enterTitle")}
                        disabled={mutation.isPending}
                        className="bg-white border border-gray-300 hover:border-primary/80 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">
                      {t("description")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("enterDescription")}
                        disabled={mutation.isPending}
                        className="bg-white border border-gray-300 hover:border-primary/80 transition-colors resize-y min-h-[200px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-6" />

              <div className="grid gap-6 md:grid-cols-2">
                {/* Event Type */}
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        {t("eventType")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={mutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border border-gray-300 hover:border-primary/80 transition-colors">
                            <SelectValue placeholder={t("selectEventType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="holiday">
                            {t("holiday")}
                          </SelectItem>
                          <SelectItem value="meeting">
                            {t("meeting")}
                          </SelectItem>
                          <SelectItem value="exam">{t("exam")}</SelectItem>
                          <SelectItem value="other">{t("other")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recurring Switch */}
                <FormField
                  control={form.control}
                  name="is_recurring"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={mutation.isPending}
                          />
                        </FormControl>
                        <FormLabel className="flex items-center gap-2">
                          <Repeat2 className="h-4 w-4 text-primary" />
                          {t("recurring")}
                        </FormLabel>
                      </div>
                      <FormDescription>
                        {t("recurringDescription")}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">
                        {t("startDate")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={mutation.isPending}
                          className="bg-white border border-gray-300 hover:border-primary/80 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">
                        {t("endDate")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          disabled={mutation.isPending}
                          className="bg-white border border-gray-300 hover:border-primary/80 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>

            <CardFooter className="bg-gray-50 px-8 py-6 flex justify-between">
              {/* Cancel button now uses handleGoBack */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoBack}
                disabled={mutation.isPending}
                className="border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80 text-white px-8 transition-all"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {initialData?.id ? t("update") : t("create")}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
