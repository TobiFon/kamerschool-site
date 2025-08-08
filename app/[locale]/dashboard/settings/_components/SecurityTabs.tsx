"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { authFetch, fetchSchool } from "@/lib/auth"; // Assuming authFetch handles headers
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";

// API function to change password
async function changeSchoolPassword(
  schoolId: number | string,
  currentPasswordVal: string, // Renamed for clarity
  newPasswordVal: string // Renamed for clarity
): Promise<void> {
  const res = await authFetch(
    // authFetch should add Content-Type: application/json
    `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        current_password: currentPasswordVal, // Match backend expected field name
        password: newPasswordVal, // This is for the new password
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // Prioritize specific field errors from backend if available
    let errorMessage = "Failed to update password";
    if (
      errorData.current_password &&
      Array.isArray(errorData.current_password)
    ) {
      errorMessage = errorData.current_password.join(" ");
    } else if (errorData.password && Array.isArray(errorData.password)) {
      errorMessage = errorData.password.join(" ");
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    }
    throw new Error(errorMessage);
  }
  // Optional: Send a "password changed" notification email here,
  // or trigger it from the backend upon successful password change.
}

export function SecurityTab() {
  const t = useTranslations("settingsPage.security");
  const tCommon = useTranslations("Common");
  const tZod = useTranslations("zodValidation");
  const {
    data: school,
    isLoading: isLoadingSchool,
    isError: isErrorSchool,
  } = useQuery<School>({
    queryKey: ["school"],
    queryFn: fetchSchool,
  });

  const passwordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: tZod("currentPasswordRequired") }),
      newPassword: z
        .string()
        .min(8, { message: tZod("passwordMinLength", { min: 8 }) })
        .regex(/[a-z]/, { message: tZod("passwordLowercase") })
        .regex(/[A-Z]/, { message: tZod("passwordUppercase") })
        .regex(/[0-9]/, { message: tZod("passwordNumber") })
        // Optional: Add special character requirement
        .regex(/[^a-zA-Z0-9]/, { message: tZod("passwordSpecialChar") }),
      confirmPassword: z
        .string()
        .min(1, { message: tZod("confirmPasswordRequired") }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: tZod("passwordMismatch"),
      path: ["confirmPassword"], // Attach error to the confirmation field
    });

  type PasswordFormData = z.infer<typeof passwordSchema>;

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: PasswordFormData) => {
      if (!school?.id)
        throw new Error("School ID not found for password change.");
      return changeSchoolPassword(
        school.id,
        data.currentPassword,
        data.newPassword
      );
    },
    onSuccess: () => {
      toast.success(tCommon("success"), {
        description: t("changeSuccess"),
      });
      form.reset();
      // Consider sending a notification email that password was changed
      // This could be a separate API call or handled by the backend automatically
    },
    onError: (error) => {
      let description = t("changeErrorDefault"); // More specific default
      if (error instanceof Error && error.message) {
        description = error.message; // Use the error message from changeSchoolPassword
      }
      toast.error(tCommon("error"), {
        description: description,
      });
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    mutation.mutate(data);
  };

  if (isLoadingSchool) return <div>{tCommon("loading")}...</div>;
  if (isErrorSchool || !school)
    return <div className="text-destructive">{tCommon("errorGeneral")}</div>; // More specific

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("changePasswordTitle")}</CardTitle>{" "}
        {/* More specific key */}
        <CardDescription>{t("changePasswordDescription")}</CardDescription>{" "}
        {/* More specific key */}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 max-w-md"
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("currentPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                !form.formState.isDirty ||
                !form.formState.isValid
              }
            >
              {mutation.isPending && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("savePasswordButton")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
