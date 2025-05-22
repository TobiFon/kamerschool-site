"use client";

import { fetchSchool, logout } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Bell, Settings, HelpCircle } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import profileImage from "@/public/fallback.jpeg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  if (isLoading) return <div>{t("loading")}</div>;
  if (isError || !school) return <div>{t("error")}</div>;

  return (
    <header className="flex items-center justify-between bg-background shadow-sm shadow-muted px-4 md:px-6 py-3 w-full z-40 ">
      <div className="flex-1 flex justify-center max-w-2xl">
        <div className="flex-1 flex justify-center max-w-2xl">
          <GlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        {/* <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 hover:bg-accent rounded-full">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-0 right-0 bg-primary text-xs text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </DropdownMenuTrigger>
        </DropdownMenu> */}

        {isLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span className="font-medium text-sm truncate max-w-[120px] md:max-w-none">
            {school?.name_abrev}
          </span>
        )}

        <ProfileDropdown t={t} schoolEmail={school.email} />
      </div>
    </header>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProfileDropdown({ t, schoolEmail }: { t: any; schoolEmail: string }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

        <Link href="/dashboard/support" legacyBehavior passHref>
          <DropdownMenuItem asChild>
            <a className="cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4" />
              {t("support")}
            </a>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logoutUser}>
          <Icons.logout className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
