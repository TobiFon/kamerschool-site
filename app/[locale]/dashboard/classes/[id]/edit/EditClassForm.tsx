"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  BookOpen,
  School,
  Layers,
  ArrowLeft,
  Check,
  X,
  Info,
  AlertCircle,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { fetchClassById, updateClass } from "@/queries/class";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// types
type EducationSystem = {
  id: number;
  name: string;
  code: string;
};

type LevelChoice = {
  value: string;
  label: string;
};

type StreamOption = {
  value: string;
  label: string;
};

const educationSystems: EducationSystem[] = [
  { id: 1, name: "English", code: "en" },
  { id: 2, name: "French", code: "fr" },
];

const streamOptions: StreamOption[] = [
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts" },
  { value: "commercial", label: "Commercial" },
];

const classFormSchema = z.object({
  education_system_id: z.number({
    required_error: "education system is required",
  }),
  level: z.string().min(1, { message: "level is required" }),
  stream: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  sub_stream: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface EditClassFormProps {
  classId: string;
}

export default function EditClassForm({ classId }: EditClassFormProps) {
  const t = useTranslations("ClassForm");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formProgress, setFormProgress] = React.useState(0);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    mode: "onChange",
  });

  const {
    data: classData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClassById(classId),
    enabled: !!classId,
  });

  useEffect(() => {
    if (classData) {
      const education_system_id = classData.education_system?.id || 1;
      form.reset({
        education_system_id,
        level: classData.level || "",
        stream: classData.stream || null,
        section: classData.section || null,
        sub_stream: classData.sub_stream || null,
        description: classData.description || "",
      });
      setTimeout(() => {
        form.setValue("level", classData.level);
      }, 0);
    }
  }, [classData, form]);

  const watchEducationSystem = form.watch("education_system_id");
  const watchLevel = form.watch("level");
  const watchStream = form.watch("stream");
  const watchSection = form.watch("section");
  const watchSubStream = form.watch("sub_stream");
  const watchDescription = form.watch("description");

  // Update form progress
  React.useEffect(() => {
    if (classData) {
      let completedFields = 0;
      let totalFields = 5; // Count required and optional fields

      if (watchEducationSystem) completedFields++;
      if (watchLevel) completedFields++;
      if (watchStream) completedFields++;
      if (watchSection) completedFields++;
      if (watchSubStream) completedFields++;
      if (watchDescription) completedFields += 0.5; // Half weight for description

      setFormProgress(Math.min((completedFields / totalFields) * 100, 100));
    }
  }, [
    classData,
    watchEducationSystem,
    watchLevel,
    watchStream,
    watchSection,
    watchSubStream,
    watchDescription,
  ]);

  const levelChoices = useMemo<LevelChoice[]>(() => {
    const selectedSystem = educationSystems.find(
      (sys) => sys.id === watchEducationSystem
    );
    if (!selectedSystem) return [];
    return selectedSystem.code === "en"
      ? [
          { value: "form_1", label: t("form1") },
          { value: "form_2", label: t("form2") },
          { value: "form_3", label: t("form3") },
          { value: "form_4", label: t("form4") },
          { value: "form_5", label: t("form5") },
          { value: "lower_sixth", label: t("lowerSixth") },
          { value: "upper_sixth", label: t("upperSixth") },
        ]
      : [
          { value: "sixieme", label: t("sixieme") },
          { value: "cinquieme", label: t("cinquieme") },
          { value: "quatrieme", label: t("quatrieme") },
          { value: "troisieme", label: t("troisieme") },
          { value: "seconde", label: t("seconde") },
          { value: "premiere", label: t("premiere") },
          { value: "terminale", label: t("terminale") },
        ];
  }, [watchEducationSystem, t]);

  const isStreamRequired = (): boolean => {
    const selectedSystem = educationSystems.find(
      (sys) => sys.id === watchEducationSystem
    );
    if (!selectedSystem || !watchLevel) return false;
    if (selectedSystem.code === "en") {
      return ["form_4", "form_5", "lower_sixth", "upper_sixth"].includes(
        watchLevel
      );
    }
    if (selectedSystem.code === "fr") {
      return ["seconde", "premiere", "terminale"].includes(watchLevel);
    }
    return false;
  };

  const handleGoBack = () => router.push(`/dashboard/classes/${classId}`);

  const mutation = useMutation({
    mutationFn: (data: ClassFormValues) => updateClass(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
      toast.success(t("classUpdated"), {
        description: t("classUpdatedDescription"),
      });
      router.push(`/dashboard/classes/${classId}`);
    },
    onError: (error: any) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  const onSubmit = (data: ClassFormValues) => {
    if (isStreamRequired() && !data.stream) {
      form.setError("stream", { message: t("streamRequired") });
      toast.error(t("formError"), { description: t("streamRequiredDesc") });
      return;
    }
    mutation.mutate(data);
  };

  const handleCancel = () => router.push(`/dashboard/classes/${classId}`);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t("failedToLoadClass")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={handleGoBack}
        className="mb-6 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("backToClass")}
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("editClass")}
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

          <p className="text-gray-500 mb-6">{t("editClassDescription")}</p>

          <div className="mb-8">
            <Progress value={formProgress} className="h-2" />
          </div>

          <Card className="border-0 shadow-lg overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-primary/70 to-primary text-white px-8 py-6">
              <CardTitle className="text-xl font-medium flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                {t("basicInformation")}
              </CardTitle>
              <CardDescription className="text-primary/15 mt-1">
                {t("specifyBasicClassDetails")}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 py-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Education System */}
                <FormField
                  control={form.control}
                  name="education_system_id"
                  render={({ field }) => {
                    const system = educationSystems.find(
                      (sys) => sys.id === field.value
                    );
                    return (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          {t("educationSystem")}
                        </FormLabel>
                        <Select disabled={true} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="bg-white border border-gray-300 hover:border-primary/80 transition-colors">
                              <SelectValue>{system?.name || ""}</SelectValue>
                            </SelectTrigger>
                          </FormControl>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Level */}
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        {t("level")}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={mutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border border-gray-300 hover:border-primary/80 transition-colors">
                            <SelectValue placeholder={t("selectLevel")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levelChoices.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              <div className="grid gap-6 md:grid-cols-2">
                {/* Stream (conditionally shown/required) */}
                {watchLevel && (
                  <FormField
                    control={form.control}
                    name="stream"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-medium flex items-center gap-2">
                          {t("stream")}
                          {isStreamRequired() && (
                            <span className="text-red-500">*</span>
                          )}
                          {isStreamRequired() && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-primary cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-primary text-white">
                                  <p>{t("streamRequiredDesc")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={mutation.isPending}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={`bg-white border hover:border-primary/80 transition-colors ${
                                isStreamRequired()
                                  ? "border-amber-400"
                                  : "border-gray-300"
                              }`}
                            >
                              <SelectValue placeholder={t("selectStream")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {streamOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {t(option.value, {
                                  defaultValue: option.label,
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Section */}
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">
                        {t("section")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          placeholder={t("enterSection")}
                          disabled={mutation.isPending}
                          className="bg-white border border-gray-300 hover:border-primary/80 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Sub Stream */}
                <FormField
                  control={form.control}
                  name="sub_stream"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium">
                        {t("subStream")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          placeholder={t("enterSubStream")}
                          disabled={mutation.isPending}
                          className="bg-white border border-gray-300 hover:border-primary/80 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder={t("enterDescription")}
                        disabled={mutation.isPending}
                        className="bg-white border border-gray-300 hover:border-primary/80 transition-colors resize-y min-h-[120px]"
                      />
                    </FormControl>
                    <FormDescription>{t("descriptionHelp")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="bg-gray-50 px-8 py-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={mutation.isPending}
                className="border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-indigo-700 text-white px-8 transition-all"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("update")}
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
