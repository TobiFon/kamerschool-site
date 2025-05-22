"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icons } from "@/components/icons";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { isAuthenticated, login } from "@/lib/auth";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Create a schema with translated error messages
  const formSchema = useMemo(
    () =>
      z.object({
        username: z.string().min(2, {
          message: t("usernameMinLengthError"),
        }),
        password: z.string().min(8, {
          message: t("passwordMinLengthError"),
        }),
      }),
    [t]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        const authed = await isAuthenticated();
        if (authed) {
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  // Clear the error when the form values change
  useEffect(() => {
    if (loginError) {
      const subscription = form.watch(() => setLoginError(null));
      return () => subscription.unsubscribe();
    }
  }, [form, loginError]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      await login(data.username, data.password);
      router.replace("/dashboard");
    } catch (error) {
      // Display error directly in the form
      if (error instanceof Error && error.message.includes("Invalid")) {
        setLoginError(t("invalidCredentials"));
      } else {
        setLoginError(t("loginFailed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="flex flex-col items-center space-y-4 text-white">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-primary overflow-hidden">
      {/* Left Section with Branding */}
      <div className="hidden w-1/2 flex-col items-center justify-center lg:flex space-y-4 relative z-10">
        <Icons.logo />
        <h1 className="text-4xl font-bold text-white">KAMERSCHOOLS</h1>
      </div>

      {/* Right Section with Form */}
      <div className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2 relative z-10">
        <Card className="w-full max-w-md lg:p-10 py-4 shadow-2xl rounded-lg space-y-6 min-h-[500px]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold mb-6">
              {t("signInTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {loginError && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="username">{t("usernameLabel")}</Label>
                      <FormControl>
                        <Input
                          id="username"
                          type="text"
                          placeholder={t("usernamePlaceholder")}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="password">{t("passwordLabel")}</Label>
                      <FormControl>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={t("passwordPlaceholder")}
                            disabled={isLoading}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <Icons.eyeoff className="h-5 w-5" />
                            ) : (
                              <Icons.eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      {t("signingIn")}
                    </>
                  ) : (
                    t("signInButton")
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
