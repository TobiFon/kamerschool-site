"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { logout } from "@/lib/auth";
import { useMemo, useState } from "react";
import { Icons } from "@/components/icons";
import { Logo } from "@/components/Logo";

// Define a type for menu items for better organization
interface AdminMenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AdminSidebar() {
  const t = useTranslations("adminSidebar"); // Create this namespace
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems: AdminMenuItem[] = useMemo(
    () => [
      { title: t("dashboard"), url: "/admin/dashboard", icon: Icons.dashboard },
      {
        title: t("schools"),
        url: "/admin/dashboard/schools",
        icon: Icons.classes,
      }, // Re-using an icon
      {
        title: t("subjects"),
        url: "/admin/dashboard/subjects",
        icon: Icons.results,
      }, // Re-using an icon
      {
        title: t("academicYears"),
        url: "/admin/dashboard/academic-years",
        icon: Icons.calendar,
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
        <div className="px-2">
          <Logo link={"/admin/dashboard"} />
        </div>
        <p className="text-xs text-center text-muted-foreground uppercase tracking-wider mt-2">
          {t("adminPanel")}
        </p>
      </SidebarHeader>

      <SidebarContent className="mt-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url}>
                <Link href={item.url} className="gap-3" aria-label={item.title}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="flex items-center gap-3 w-full p-2 text-sm hover:bg-accent rounded transition-colors"
              aria-label={t("logout")}
            >
              <Icons.logout className="w-4 h-4" />
              <span>{t("logout")}</span>
            </button>
          </AlertDialogTrigger>
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
      </SidebarFooter>
    </Sidebar>
  );
}
