"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { SchoolProfileTab } from "./_components/SchoolProfileTab";
import { ManageStaffTab } from "./_components/ManageStaffTab";
import { SecurityTab } from "./_components/SecurityTabs";

export default function SettingsPage() {
  const t = useTranslations("settingsPage");

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* <PageHeader title={t("title")} /> */}
      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="profile">{t("tabs.profile")}</TabsTrigger>
          <TabsTrigger value="staff">{t("tabs.staff")}</TabsTrigger>
          <TabsTrigger value="security">{t("tabs.security")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <SchoolProfileTab />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <ManageStaffTab />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
