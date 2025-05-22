"use client";

import React, { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  BookOpen,
  School,
  Layers,
  ArrowLeft,
  Check,
  X,
  Info,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { createClass } from "@/queries/class";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// Types
type EducationSystem = {
  id: number;
  name: string;
  code: string;
  description?: string;
};

type LevelChoice = {
  value: string;
  label: string;
};

type StreamSuggestion = {
  value: string;
  label: string;
};

// Updated education systems to match Django model
const educationSystems: EducationSystem[] = [
  { id: 1, name: "English General", code: "en_gen" },
  { id: 2, name: "English Technical", code: "en_tech" },
  { id: 3, name: "French General", code: "fr_gen" },
  { id: 4, name: "French Technical", code: "fr_tech" },
];

// Stream suggestions instead of strict options
const streamSuggestions: StreamSuggestion[] = [
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts" },
  { value: "commercial", label: "Commercial" },
  { value: "civil_engineering", label: "Civil Engineering" },
  { value: "electrical_engineering", label: "Electrical Engineering" },
];

// Validation schema
const classFormSchema = z.object({
  education_system_id: z.number({
    required_error: "Education system is required",
  }),
  level: z.string().min(1, { message: "Level is required" }),
  stream: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  sub_stream: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

export default function ClassForm() {
  const t = useTranslations("ClassForm");
  const queryClient = useQueryClient();
  const router = useRouter();
  const [formProgress, setFormProgress] = useState(0);
  const [customStream, setCustomStream] = useState("");

  // Setup form with validation
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      education_system_id: 1,
      level: "",
      stream: null,
      section: null,
      sub_stream: null,
      description: "",
    },
    mode: "onChange",
  });

  // Watch fields for dynamic updates and progress calculation
  const watchEducationSystem = form.watch("education_system_id");
  const watchLevel = form.watch("level");
  const watchStream = form.watch("stream");
  const watchSection = form.watch("section");
  const watchSubStream = form.watch("sub_stream");
  const watchDescription = form.watch("description");

  // Update form progress
  React.useEffect(() => {
    let completedFields = 0;
    let totalFields = 5; // Count required and optional fields

    if (watchEducationSystem) completedFields++;
    if (watchLevel) completedFields++;
    if (watchStream) completedFields++;
    if (watchSection) completedFields++;
    if (watchSubStream) completedFields++;
    if (watchDescription) completedFields += 0.5; // Half weight for description

    setFormProgress(Math.min((completedFields / totalFields) * 100, 100));
  }, [
    watchEducationSystem,
    watchLevel,
    watchStream,
    watchSection,
    watchSubStream,
    watchDescription,
  ]);

  // Define level choices based on education system
  const getLevelChoices = (): LevelChoice[] => {
    const selectedSystem = educationSystems.find(
      (sys) => sys.id === watchEducationSystem
    );
    if (!selectedSystem) return [];

    // Check if English system
    if (selectedSystem.code.startsWith("en")) {
      return [
        { value: "form_1", label: t("form1") },
        { value: "form_2", label: t("form2") },
        { value: "form_3", label: t("form3") },
        { value: "form_4", label: t("form4") },
        { value: "form_5", label: t("form5") },
        { value: "lower_sixth", label: t("lowerSixth") },
        { value: "upper_sixth", label: t("upperSixth") },
      ];
    } else {
      // French system
      return [
        { value: "sixieme", label: t("sixieme") },
        { value: "cinquieme", label: t("cinquieme") },
        { value: "quatrieme", label: t("quatrieme") },
        { value: "troisieme", label: t("troisieme") },
        { value: "seconde", label: t("seconde") },
        { value: "premiere", label: t("premiere") },
        { value: "terminale", label: t("terminale") },
      ];
    }
  };

  // Determine if stream is required based on education system and level
  const isStreamRequired = (): boolean => {
    const selectedSystem = educationSystems.find(
      (sys) => sys.id === watchEducationSystem
    );
    if (!selectedSystem || !watchLevel) return false;

    // If technical education, stream can be chosen at any level
    if (selectedSystem.code.includes("tech")) {
      return true;
    }

    // English General system rules
    if (selectedSystem.code === "en_gen") {
      return ["form_4", "form_5", "lower_sixth", "upper_sixth"].includes(
        watchLevel
      );
    }

    // French General system rules
    if (selectedSystem.code === "fr_gen") {
      return ["seconde", "premiere", "terminale"].includes(watchLevel);
    }

    return false;
  };

  // Determine if sub-stream is required
  const isSubStreamRequired = (): boolean => {
    const selectedSystem = educationSystems.find(
      (sys) => sys.id === watchEducationSystem
    );
    if (!selectedSystem || !watchLevel) return false;

    // Only required for Sixth Forms in English system
    if (selectedSystem.code.startsWith("en")) {
      return ["lower_sixth", "upper_sixth"].includes(watchLevel);
    }

    return false;
  };

  // Handle custom stream input
  const handleCustomStreamChange = (value: string) => {
    setCustomStream(value);
  };

  const handleSelectStream = (value: string) => {
    form.setValue("stream", value);
    setCustomStream("");
  };

  const handleApplyCustomStream = () => {
    if (customStream) {
      form.setValue("stream", customStream);
      setCustomStream("");
    }
  };

  const handleGoBack = () => router.push("/dashboard/classes");

  const handleMutationSuccess = (data) => {
    const classId = data.id;
    router.push(`/dashboard/classes/${classId}`);
  };

  // Mutation for creating class
  const mutation = useMutation({
    mutationFn: (data: ClassFormValues) => createClass(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["classes"],
      });
      toast.success(t("classCreated"), {
        description: t("classCreatedDescription"),
      });
      handleMutationSuccess(response);
    },
    onError: (error: any) => {
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ClassFormValues) => {
    if (isStreamRequired() && !data.stream) {
      form.setError("stream", { message: t("streamRequired") });
      toast.error(t("formError"), {
        description: t("streamRequiredDesc"),
      });
      return;
    }

    if (isSubStreamRequired() && !data.sub_stream) {
      form.setError("sub_stream", { message: t("subStreamRequired") });
      toast.error(t("formError"), {
        description: t("subStreamRequiredDesc"),
      });
      return;
    }

    mutation.mutate(data);
  };

  // Handle cancel action
  const handleCancel = () => router.back();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={handleGoBack}
        className="mb-6 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("backToClasses")}
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("createClass")}
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

          <p className="text-gray-500 mb-6">{t("createClassDescription")}</p>

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
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium flex items-center gap-2">
                        <School className="h-4 w-4 text-primary" />
                        {t("educationSystem")}
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                        disabled={mutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border border-gray-300 hover:border-primary/80 transition-colors">
                            <SelectValue
                              placeholder={t("selectEducationSystem")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {educationSystems.map((system) => (
                            <SelectItem
                              key={system.id}
                              value={system.id.toString()}
                            >
                              {t(system.code, {
                                defaultValue: system.name,
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
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
                        disabled={!watchEducationSystem || mutation.isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white border border-gray-300 hover:border-primary/80 transition-colors">
                            <SelectValue placeholder={t("selectLevel")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getLevelChoices().map((level) => (
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
                {/* Stream (with suggestions) */}
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
                        <div className="flex space-x-2">
                          <div className="flex-grow">
                            <FormControl>
                              <Input
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value || null)
                                }
                                placeholder={t("enterStream")}
                                disabled={mutation.isPending}
                                className={`bg-white border hover:border-primary/80 transition-colors ${
                                  isStreamRequired()
                                    ? "border-amber-400"
                                    : "border-gray-300"
                                }`}
                              />
                            </FormControl>
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={mutation.isPending}
                              >
                                {t("suggestions")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                              <div className="space-y-1">
                                {streamSuggestions.map((option) => (
                                  <Button
                                    key={option.value}
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() =>
                                      handleSelectStream(option.value)
                                    }
                                  >
                                    {t(option.value, {
                                      defaultValue: option.label,
                                    })}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormDescription>{t("streamHelp")}</FormDescription>
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
                      <FormDescription>{t("sectionHelp")}</FormDescription>
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
                      <FormLabel className="font-medium flex items-center gap-2">
                        {t("subStream")}
                        {isSubStreamRequired() && (
                          <span className="text-red-500">*</span>
                        )}
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
                          className={`bg-white border hover:border-primary/80 transition-colors ${
                            isSubStreamRequired()
                              ? "border-amber-400"
                              : "border-gray-300"
                          }`}
                        />
                      </FormControl>
                      <FormDescription>{t("subStreamHelp")}</FormDescription>
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
                    {t("create")}
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
