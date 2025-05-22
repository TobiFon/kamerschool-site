"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Icons } from "./icons";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { logout } from "@/lib/auth";
import { useMemo, useState } from "react";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AppSidebar() {
  const t = useTranslations("sidebar");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems: MenuItem[] = useMemo(
    () => [
      { title: t("dashboard"), url: "/dashboard", icon: Icons.dashboard },
      { title: t("classes"), url: "/dashboard/classes", icon: Icons.classes },
      { title: t("results"), url: "/dashboard/results", icon: Icons.results },
      {
        title: t("analytics"),
        url: "/dashboard/analytics",
        icon: Icons.analytics,
      },
      {
        title: t("enrollments"),
        url: "/dashboard/enrollments",
        icon: Icons.results,
      },
      {
        title: t("feesManagement"),
        url: "/dashboard/fees",
        icon: Icons.fees,
      },
      {
        title: t("discipline"),
        url: "/dashboard/discipline",
        icon: Icons.discipline,
      },
      {
        title: t("timetableManagement"),
        url: "/dashboard/timetable",
        icon: Icons.timetable,
      },
      {
        title: t("teachers"),
        url: "/dashboard/teachers",
        icon: Icons.teacher,
      },
      {
        title: t("posts"),
        url: "/dashboard/posts",
        icon: Icons.posts,
      },
      {
        title: t("announcements"),
        url: "/dashboard/announcements",
        icon: Icons.announcements,
      },
      {
        title: t("calendar"),
        url: "/dashboard/calendar",
        icon: Icons.calendar,
      },
      {
        title: t("settings"),
        url: "/dashboard/settings",
        icon: Icons.settings,
      },
    ],
    [t]
  );

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
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-baseline gap-2 px-2">
          <Icons.coloredLogo className="w-8 h-8" />
          <h3 className="text-xl font-bold">KamerSchools</h3>
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      (item.url !== "/dashboard" &&
                        pathname.startsWith(item.url + "/"))
                    }
                  >
                    <Link
                      href={item.url}
                      className="gap-3"
                      aria-label={item.title}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <button
          onClick={logoutUser}
          disabled={isLoggingOut}
          className="flex items-center gap-3 w-full p-2 text-sm hover:bg-accent rounded transition-colors"
          aria-label={t("logout")}
        >
          {isLoggingOut ? (
            <Icons.spinner className="w-4 h-4 animate-spin" />
          ) : (
            <Icons.logout className="w-4 h-4" />
          )}
          <span>{t("logout")}</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
