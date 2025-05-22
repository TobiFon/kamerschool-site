import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// Generate metadata using the new API
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");

  return {
    title: t("loginMetaTitle"),
    description: t("loginMetaDescription"),
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
