import { SimpleLoadingIndicator } from "@/components/loading-indicator";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getTranslations } from "next-intl/server";
import { Providers } from "../../dashboard/_components/providers";
import { AdminSidebar } from "./_components/AdminSidebar";
import AdminTopBar from "./_components/admin-topbar";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "Metadata.AdminDashboard",
  });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <SimpleLoadingIndicator />
      <SidebarProvider>
        <AdminSidebar />
        <main className="flex flex-1 flex-col w-full min-h-screen py-4">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <AdminTopBar />
          </header>
          <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </Providers>
  );
}
