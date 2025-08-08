"use client";

import { fetchSchool, logout } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Settings, HelpCircle } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import profileImage from "@/public/fallback.jpeg";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Icons } from "@/components/icons";
import { useState } from "react";
import { GlobalSearch } from "./GlobalSearch";
import { Skeleton } from "@/components/ui/skeleton";

export default function TopBar() {
  const t = useTranslations("topbar");

  const {
    data: school,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["school"], queryFn: fetchSchool });

  // Loading and error states
  if (isLoading)
    return (
      <header className="h-[68px] flex items-center px-6">
        <div className="lg:hidden mr-3">
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-8 flex-1" />
      </header>
    );

  if (isError || !school)
    return (
      <header className="h-[68px] flex items-center px-6">
        <div className="lg:hidden mr-3">
          <SidebarTrigger />
        </div>
        <div>{t("error")}</div>
      </header>
    );

  return (
    <header className="flex items-center justify-between bg-background shadow-sm shadow-muted px-4 md:px-6 py-3 w-full z-40">
      {/* Mobile Sidebar Trigger - Only visible on small screens */}
      <div className="lg:hidden">
        <SidebarTrigger />
      </div>

      {/* Search Bar - Centered with responsive sizing */}
      <div className="flex-1 flex justify-center max-w-2xl mx-4">
        <GlobalSearch />
      </div>

      {/* Right side content */}
      <div className="flex items-center gap-4">
        <span className="font-medium text-sm truncate max-w-[120px] md:max-w-none">
          {school?.name_abrev}
        </span>

        <ProfileDropdown t={t} schoolEmail={school.email} />
      </div>
    </header>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileDropdown({
  t,
  schoolEmail,
}: {
  t: any;
  schoolEmail: string;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const router = useRouter();

  async function logoutUser() {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full">
          <Image
            src={profileImage}
            width={40}
            height={40}
            alt={t("profileAlt")}
            className="rounded-full border-2 border-transparent hover:border-primary transition-all"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">School Admin</p>
              <p className="text-xs leading-none text-muted-foreground">
                {schoolEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <Link href="/dashboard/settings" legacyBehavior passHref>
            <DropdownMenuItem asChild>
              <a className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                {t("settings")}
              </a>
            </DropdownMenuItem>
          </Link>

          <Link href="/contact" legacyBehavior passHref>
            <DropdownMenuItem asChild>
              <a className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                {t("support")}
              </a>
            </DropdownMenuItem>
          </Link>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsLogoutModalOpen(true);
            }}
          >
            <Icons.logout className="mr-2 h-4 w-4" />
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmLogoutTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmLogoutDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={logoutUser} disabled={isLoggingOut}>
              {isLoggingOut && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
