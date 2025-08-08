"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

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
import { Icons } from "@/components/icons";
import { School } from "@/types/auth";
import { FileUpload } from "@/components/file-upload";

// ✨ UPDATED: Add logo field to the schema
const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "School name must be at least 3 characters." }),
  name_abrev: z.string().min(2, { message: "Abbreviation is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone_number: z.string().regex(/^\+237\d{9}$/, {
    message: "Enter a valid Cameroon phone number (+237...).",
  }),
  city: z.string().min(2, { message: "City is required." }),
  province: z.string().optional(),
  division: z.string().optional(),
  moto: z.string().optional(),
  logo: z.any().optional(), // Can be File, string (URL), or null
});

type SchoolFormData = z.infer<typeof formSchema>;

interface SchoolFormProps {
  initialData?: School | null;
  onSubmit: (data: FormData) => void; // ✨ CHANGED: We now submit FormData for the file
  isSubmitting: boolean;
}

export function SchoolForm({
  initialData,
  onSubmit,
  isSubmitting,
}: SchoolFormProps) {
  const t = useTranslations("AdminSchoolManagement.form");

  const form = useForm<SchoolFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      name_abrev: "",
      email: "",
      phone_number: "+237",
      city: "",
      province: "",
      division: "",
      moto: "",
      logo: null,
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({ ...initialData, logo: initialData.logo || null });
    }
  }, [initialData, form]);

  const handleFormSubmit = (data: SchoolFormData) => {
    const formData = new FormData();

    // Append all fields to FormData
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof SchoolFormData];
      if (key === "logo") {
        if (value instanceof File) {
          formData.append("logo", value);
        } else if (value === null) {
          // If logo was removed, we can send an empty string to signal removal on the backend if needed
          formData.append("logo", "");
        }
        // If `value` is a string (URL), we don't append it, as it's not a new upload.
      } else if (value !== null && value !== undefined) {
        formData.append(key, value as string);
      }
    });

    onSubmit(formData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* ✨ ADDED: Logo Upload Field */}
        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("logoLabel")}</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... (rest of the form fields remain the same) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("namePlaceholder")} {...field} />
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
                <FormLabel>{t("abbreviationLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("abbreviationPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("emailLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
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
              <FormLabel>{t("phoneLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("phonePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("cityLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("cityPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("provinceLabel")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("provincePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          {initialData ? t("saveChanges") : t("createSchool")}
        </Button>
      </form>
    </Form>
  );
}
