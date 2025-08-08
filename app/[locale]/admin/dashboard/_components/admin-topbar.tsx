"use client";

import { getCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileDropdown } from "@/app/[locale]/dashboard/_components/TopBar";

export default function AdminTopBar() {
  const t = useTranslations("adminTopbar");
  const topbarT = useTranslations("topbar"); // ✅ Hook called at top level

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["currentUser"], queryFn: getCurrentUser });

  if (isLoading) {
    return (
      <header className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
        <div className="lg:hidden">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1" />
        <Skeleton className="h-8 w-24" />
      </header>
    );
  }

  if (isError || !user) {
    return (
      <header className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
        <div className="lg:hidden">
          <SidebarTrigger />
        </div>
        <div>{t("error")}</div>
      </header>
    );
  }

  return (
    <>
      <div className="lg:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex-1" /> {/* Spacer */}
      <div className="flex items-center gap-4">
        <span className="font-medium text-sm truncate">
          {user.username} (Admin)
        </span>
        {/* We can likely reuse the same dropdown component, passing the superuser email */}
        <ProfileDropdown
          t={topbarT} // ✅ Using the hook result, not calling the hook here
          schoolEmail={user.email}
        />
      </div>
    </>
  );
}
