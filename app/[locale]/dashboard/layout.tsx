import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Providers } from "./_components/providers";
import TopBar from "./_components/TopBar";
import { SimpleLoadingIndicator } from "@/components/loading-indicator";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const awaitedParams = await params;
  const locale = awaitedParams.locale;
  const t = await getTranslations({ locale, namespace: "Metadata.Dashboard" });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <SimpleLoadingIndicator />
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-1 flex-col w-full min-h-screen">
          <header className="w-full sticky top-0 z-50">
            <TopBar />
          </header>
          <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </Providers>
  );
}
