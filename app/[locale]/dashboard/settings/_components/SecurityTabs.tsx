"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { authFetch, fetchSchool } from "@/lib/auth";
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
  newPassword: string
): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ password: newPassword }),
    }
  );

  if (!res.ok) {
    // Try to get more specific error from backend if possible
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.password || "Failed to update password"
    );
  }
}

export function SecurityTab() {
  const t = useTranslations("settingsPage.security");
  const tCommon = useTranslations("Common");

  // Fetch school data to get the ID
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
      // currentPassword: z.string().min(1, { message: t("currentPasswordRequired") }), // Backend doesn't use current password for this endpoint yet
      newPassword: z.string().min(8, { message: t("passwordMinLength") }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"], // Attach error to the confirmation field
    });

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      //   currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof passwordSchema>) => {
      if (!school?.id) throw new Error("School ID not found");
      return changeSchoolPassword(school.id, data.newPassword);
    },
    onSuccess: () => {
      toast.success(tCommon("success"), {
        description: t("changeSuccess"),
      });
      form.reset();
      // Optional: refetch user/auth status if needed
    },
    onError: (error) => {
      let description = t("changeError");
      if (error instanceof Error && error.message) {
        // Basic check if backend provided a detail message
        if (!error.message.includes("Failed")) {
          description = error.message;
        }
      }
      toast.error(tCommon("error"), {
        description: description,
      });
    },
  });

  const onSubmit = (data: z.infer<typeof passwordSchema>) => {
    mutation.mutate(data);
  };

  if (isLoadingSchool) return <div>{tCommon("loading")}...</div>;
  if (isErrorSchool || !school)
    return <div className="text-destructive">{tCommon("error")}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("changePassword")}</CardTitle>
        <CardDescription>{t("title")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 max-w-md"
          >
            {/* Current password field (if needed by backend) */}
            {/* <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("currentPassword")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newPassword")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("savePasswordButton")}
            </Button>
          </form>
        </Form>
        {/* Optional: Link to forgot password */}
        {/* <div className="mt-4 text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            {t("forgotPasswordLink")}
          </Link>
        </div> */}
      </CardContent>
    </Card>
  );
}
