import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Image as ImageIcon,
  ArrowLeft,
  Check,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchTeacher, updateTeacher } from "@/queries/teachers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// Validation schema - Updated to match backend requirements
const teacherFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .nullable()
    .optional(),
  phone_number: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^\+237\d{9}$/.test(val), {
      message: "Phone number must be entered in the format: '+23799999999'",
    }),
  picture: z.any().optional(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface EditTeacherFormProps {
  teacherId: string;
}

export default function EditTeacherForm({ teacherId }: EditTeacherFormProps) {
  const t = useTranslations("TeacherForm");
  const queryClient = useQueryClient();
  const router = useRouter();
  const [formProgress, setFormProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageChanged, setIsImageChanged] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup form with validation
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      email: null,
      phone_number: "+237",
      picture: null,
    },
    mode: "onChange",
  });

  // Fetch teacher data
  const { data: teacher, isLoading } = useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: () => fetchTeacher(teacherId),
    enabled: !!teacherId,
  });

  // Set form values when teacher data is loaded (only once)
  useEffect(() => {
    if (teacher && !initialDataLoaded) {
      const cleanedPhoneNumber = teacher.phone_number
        ? teacher.phone_number.replace(/\s+/g, "")
        : "+237";

      form.reset({
        name: teacher.name || "",
        email: teacher.email || null,
        phone_number: cleanedPhoneNumber,
        picture: null,
      });

      if (teacher.picture_url) {
        setImagePreview(teacher.picture_url);
      }

      setInitialDataLoaded(true);
    }
  }, [teacher, initialDataLoaded, form]);

  // Watch fields for dynamic updates and progress calculation
  const watchName = form.watch("name");
  const watchEmail = form.watch("email");
  const watchPhone = form.watch("phone_number");
  const watchPicture = form.watch("picture");

  // Update form progress
  useEffect(() => {
    let completedFields = 0;
    let totalFields = 4; // Count required and optional fields

    if (watchName) completedFields++;
    if (watchEmail) completedFields++;
    if (watchPhone && watchPhone.length > 4) completedFields++; // Only count if more than just "+237"
    if (watchPicture || (imagePreview && !isImageChanged)) completedFields++;

    setFormProgress(Math.min((completedFields / totalFields) * 100, 100));
  }, [
    watchName,
    watchEmail,
    watchPhone,
    watchPicture,
    imagePreview,
    isImageChanged,
  ]);

  const handleGoBack = () => router.push("/dashboard/teachers");

  const handleMutationSuccess = (data) => {
    router.push(`/dashboard/teachers/${teacherId}`);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("picture", file);
      setIsImageChanged(true);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Mutation for updating teacher
  const mutation = useMutation({
    mutationFn: (data: TeacherFormValues) => {
      // Create a JSON-compatible object
      const jsonData = {
        name: data.name,
        email: data.email || null,
      };

      // Format phone number if needed
      if (data.phone_number && data.phone_number.trim() !== "+237") {
        let phoneNumber = data.phone_number;
        if (!phoneNumber.startsWith("+237")) {
          phoneNumber = "+237" + phoneNumber.replace(/^\+237/, "");
        }
        jsonData.phone_number = phoneNumber;
      }

      return updateTeacher(teacherId, jsonData);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["teacher", teacherId],
      });
      toast.success(t("teacherUpdated"), {
        description: t("teacherUpdatedDescription"),
      });
      handleMutationSuccess(response);
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(t("error"), {
        description: error.message || t("somethingWentWrong"),
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: TeacherFormValues) => {
    console.log("Form submitted with values:", data);
    mutation.mutate(data);
  };

  // Handle cancel action
  const handleCancel = () => router.back();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
        {t("backToTeachers")}
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("editTeacher")}
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

          <p className="text-gray-500 mb-6">{t("editTeacherDescription")}</p>

          <div className="mb-8">
            <Progress value={formProgress} className="h-2" />
          </div>

          <Card className="border-0 shadow-lg overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-primary/70 to-primary text-white px-8 py-6">
              <CardTitle className="text-xl font-medium flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t("teacherInformation")}
              </CardTitle>
              <CardDescription className="text-primary/15 mt-1">
                {t("updateTeacherDetails")}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 py-6 space-y-6">
              {/* Teacher Name - Required */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {t("name")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("enterTeacherName")}
                        disabled={mutation.isPending}
                        className="bg-white border border-gray-300 hover:border-primary/80 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-6" />

              <div className="grid gap-6 md:grid-cols-2">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        {t("email")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          placeholder={t("enterEmail")}
                          disabled={mutation.isPending}
                          className="bg-white border border-gray-300 hover:border-primary/80 transition-colors"
                        />
                      </FormControl>
                      <FormDescription>{t("emailHelp")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        {t("phoneNumber")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || "+237"}
                          onChange={(e) => {
                            let value = e.target.value || "+237";
                            // Ensure it always starts with +237
                            if (!value.startsWith("+237")) {
                              value = "+237" + value.replace(/^\+237/, "");
                            }
                            field.onChange(value);
                          }}
                          placeholder="+23799999999"
                          disabled={mutation.isPending}
                          className="bg-white border border-gray-300 hover:border-primary/80 transition-colors"
                        />
                      </FormControl>
                      <FormDescription>{t("phoneHelp")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              {/* Profile Picture */}
              <div className="space-y-4">
                <FormLabel className="font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  {t("profilePicture")}
                </FormLabel>

                <div className="flex items-center gap-6">
                  <div
                    className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors overflow-hidden"
                    onClick={triggerFileInput}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">
                          {t("clickToUpload")}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                      disabled={mutation.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerFileInput}
                      disabled={mutation.isPending}
                      className="mb-2"
                    >
                      {imagePreview ? t("changePicture") : t("uploadPicture")}
                    </Button>
                    <FormDescription>{t("imageHelp")}</FormDescription>
                  </div>
                </div>
              </div>
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
                    <Save className="mr-2 h-4 w-4" />
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
