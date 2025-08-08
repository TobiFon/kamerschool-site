"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import {
  Loader2,
  MessageCircle,
  Target,
  AlarmClock,
  Check,
  X,
  ArrowLeft,
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
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { createAnnouncement, updateAnnouncement } from "@/queries/announcments";
import { fetchAllClasses, fetchClasses } from "@/queries/class";
import { ClassesResponse } from "@/types/class";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Validation schema
const announcementFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z
    .string()
    .min(10, { message: "Content must be at least 10 characters" }),
  target: z.enum(["school", "class"], { required_error: "Target is required" }),
  target_classes: z.array(z.number()).optional(),
  is_urgent: z.boolean().optional().default(false),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

type AnnouncementFormProps = {
  initialData?: Partial<AnnouncementFormValues> & { id?: number };
  onSuccess?: () => void;
};

export default function AnnouncementForm({
  initialData,
  onSuccess,
}: AnnouncementFormProps) {
  const t = useTranslations("Announcements");
  const queryClient = useQueryClient();
  const router = useRouter();
  const [formProgress, setFormProgress] = useState(0);
  const { canEdit } = useCurrentUser();

  // Fetch classes with infinite query
  const {
    data: allClasses,
    isLoading: isClassesLoading,
    error: classesError,
  } = useQuery<ClassesResponse>({
    queryKey: ["classes"],
    queryFn: () => fetchAllClasses(),
  });

  // Setup form with validation
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      target: initialData?.target || "school",
      target_classes: initialData?.target_classes || [],
      is_urgent: initialData?.is_urgent || false,
    },
    mode: "onChange",
  });

  // Watch fields for dynamic updates and progress calculation
  const watchTitle = form.watch("title");
  const watchContent = form.watch("content");
  const watchTarget = form.watch("target");
  const watchTargetClasses = form.watch("target_classes");
  const watchUrgent = form.watch("is_urgent");

  // Update form progress
  useEffect(() => {
    let completedFields = 0;
    const totalFields = 4;

    if (watchTitle) completedFields++;
    if (watchContent) completedFields++;
    if (watchTarget) completedFields++;

    // For class target, ensure at least one class is selected
    if (
      watchTarget === "school" ||
      (watchTarget === "class" && watchTargetClasses?.length)
    ) {
      completedFields++;
    }

    if (watchUrgent !== undefined) completedFields++;

    setFormProgress(Math.min((completedFields / totalFields) * 100, 100));
  }, [watchTitle, watchContent, watchTarget, watchTargetClasses, watchUrgent]);

  // Unified go back functionality
  const handleGoBack = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard/announcements");
    }
  };

  // Mutation for creating/updating announcement
  const mutation = useMutation({
    mutationFn: initialData?.id
      ? (data: AnnouncementFormValues) =>
          updateAnnouncement(initialData.id!, data)
      : createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success(
        initialData?.id ? t("announcementUpdated") : t("announcementCreated"),
        {
          description: initialData?.id
            ? t("announcementUpdatedDescription")
            : t("announcementCreatedDescription"),
        }
      );
      handleGoBack();
    },
    onError: (error: any) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AnnouncementFormValues) => {
    mutation.mutate(data);
  };

  // Select all classes
  const handleSelectAllClasses = () => {
    const allClassIds = allClasses?.map((classItem) => classItem.id);
    form.setValue("target_classes", allClassIds);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back to announcements button */}
      <Button
        variant="ghost"
        onClick={handleGoBack}
        className="mb-6 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("backToAnnouncements")}
      </Button>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto space-y-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {initialData?.id
                ? t("editAnnouncement")
                : t("createAnnouncement")}
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
                <MessageCircle className="h-5 w-5 mr-2" />
                {t("announcementDetails")}
              </CardTitle>
              <CardDescription className="text-primary/15 mt-1">
                {t("specifyAnnouncementDetails")}
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
                      <MessageCircle className="h-4 w-4 text-primary" />
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

              {/* Content */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium">
                      {t("content")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("enterContent")}
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
                {/* Target */}
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        {t("target")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={mutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border border-gray-300 hover:border-primary/80 transition-colors">
                            <SelectValue placeholder={t("selectTarget")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="school">{t("school")}</SelectItem>
                          <SelectItem value="class">{t("class")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Urgent Switch */}
                <FormField
                  control={form.control}
                  name="is_urgent"
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
                          <AlarmClock className="h-4 w-4 text-primary" />
                          {t("urgent")}
                        </FormLabel>
                      </div>
                      <FormDescription>
                        {t("urgentDescription")}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              {/* Class Selection */}
              {watchTarget === "class" && (
                <FormField
                  control={form.control}
                  name="target_classes"
                  render={() => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel className="font-medium">
                          {t("selectClasses")}
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAllClasses}
                          disabled={isClassesLoading}
                        >
                          {t("selectAll")}
                        </Button>
                      </div>
                      {isClassesLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("loadingClasses")}
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                            {allClasses?.map((classItem) => (
                              <Controller
                                key={classItem.id}
                                control={form.control}
                                name="target_classes"
                                render={({ field }) => (
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value?.includes(
                                        classItem.id
                                      )}
                                      onCheckedChange={(checked) => {
                                        const currentClasses =
                                          field.value || [];
                                        const newClasses = checked
                                          ? [...currentClasses, classItem.id]
                                          : currentClasses.filter(
                                              (id) => id !== classItem.id
                                            );
                                        field.onChange(newClasses);
                                      }}
                                      disabled={mutation.isPending}
                                    />
                                    <label>{classItem.full_name}</label>
                                  </div>
                                )}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      <FormDescription>
                        {t("selectClassesDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                disabled={
                  mutation.isPending ||
                  !canEdit ||
                  (watchTarget === "class" &&
                    (!watchTargetClasses?.length ||
                      watchTargetClasses.length === 0))
                }
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
