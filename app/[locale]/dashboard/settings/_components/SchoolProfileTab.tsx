"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { fetchSchool } from "@/lib/auth";

import { School } from "@/types/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import fallbackImage from "@/public/fallback.jpeg";
import { updateSchoolDetails } from "@/queries/schools";
import { toast } from "sonner";
import { Edit } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const profileSchema = z.object({
  name: z.string().min(3, "School name is required"),
  name_abrev: z.string().min(1, "Abbreviation is required"),
  city: z.string().min(2, "City is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().regex(/^\+237\d{9}$/, "Phone format: +237XXXXXXXXX"),
  moto: z.string().max(300).optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function SchoolProfileTab() {
  const t = useTranslations("settingsPage.profile");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { canEdit } = useCurrentUser(); // Assuming this hook provides the user's permissions

  const {
    data: school,
    isLoading,
    isError,
  } = useQuery<School>({
    queryKey: ["school"],
    queryFn: fetchSchool,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (school) {
      form.reset({
        name: school.name || "",
        name_abrev: school.name_abrev || "",
        city: school.city || "",
        email: school.email || "",
        phone_number: school.phone_number || "",
        moto: school.moto || "",
      });
      setLogoPreview(school.logo || null);
      setLogoFile(null);
    }
    if (!isEditing) {
      setLogoFile(null);
      if (school) setLogoPreview(school.logo || null);
    }
  }, [school, form, isEditing]);

  const mutation = useMutation({
    mutationFn: ({
      formData,
      file,
    }: {
      formData: ProfileFormData;
      file: File | null;
    }) => {
      if (!school?.id) throw new Error("School ID not found");
      // Pass both text data and the file (if any)
      return updateSchoolDetails(school.id, formData, file);
    },
    onSuccess: (updatedSchool) => {
      toast.success(tCommon("success"), {
        description: t("updateSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["school"] }); // Refresh school data everywhere
      setIsEditing(false); // Exit edit mode
      setLogoFile(null); // Clear selected file state
      setLogoPreview(updatedSchool.logo || null); // Update preview with potentially new logo URL
    },
    onError: (error) => {
      toast.error(tCommon("error"), {
        description: `${t("updateError")} ${
          error instanceof Error ? error.message : ""
        }`,
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    mutation.mutate({ formData: data, file: logoFile });
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview(school?.logo || null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  if (isError || !school) {
    return (
      <div className="text-destructive">
        {tCommon("error")} {t("updateError")}
      </div>
    );
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            {!isEditing && (
              <CardDescription>
                {tCommon("viewModeDescription")}
              </CardDescription>
            )}
            {isEditing && (
              <CardDescription>
                {tCommon("editModeDescription")}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Display/Input */}
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <Image
                src={logoPreview || fallbackImage}
                alt={school.name_abrev || "School Logo"}
                width={128}
                height={128}
                className="rounded-md border object-contain bg-muted"
                priority={!logoPreview} // Prioritize if it's the fallback
              />
              {isEditing && (
                <div className="w-full md:w-auto">
                  <Label htmlFor="logo-upload">{t("logo")}</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleLogoChange}
                    className="mt-1"
                    disabled={mutation.isPending}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {tCommon("imageUploadHint")}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* School ID (Read-only) */}
              <div className="space-y-1">
                <Label>{t("schoolId")}</Label>
                <Input
                  value={school.school_id || "-"}
                  readOnly
                  disabled
                  className="bg-muted/50"
                />
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={!isEditing}
                        disabled={mutation.isPending || !isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_abrev"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("abbreviation")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={!isEditing}
                        disabled={mutation.isPending || !isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("city")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        readOnly={!isEditing}
                        disabled={mutation.isPending || !isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        readOnly={!isEditing}
                        disabled={mutation.isPending || !isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        {...field}
                        readOnly={!isEditing}
                        disabled={mutation.isPending || !isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("moto")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        readOnly={!isEditing}
                        disabled={mutation.isPending || !isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {!isEditing ? (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={!canEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("editButton")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset(); // Revert changes on cancel
                    setLogoFile(null);
                    setLogoPreview(school?.logo || null);
                  }}
                  disabled={mutation.isPending}
                >
                  {t("cancelButton")}
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("saveButton")}
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
