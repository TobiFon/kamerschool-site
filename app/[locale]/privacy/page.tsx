// app/[locale]/privacy/page.tsx
import { useTranslations } from "next-intl";
import Link from "next/link";

// Re-using the same layout component for a consistent look and feel.
function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-950">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <header className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {lastUpdated}
          </p>
        </header>
        <article className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none">
          {children}
        </article>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const t = useTranslations("PrivacyPage");

  return (
    <LegalPageLayout title={t("title")} lastUpdated={t("lastUpdated")}>
      <p className="lead">{t("introduction.p1")}</p>
      <p>{t("introduction.p2")}</p>

      <section>
        <h2>{t("section1.title")}</h2>
        <p>{t("section1.p1")}</p>
        <ul>
          <li>
            <strong>{t("section1.terms.controller.title")}:</strong>{" "}
            {t("section1.terms.controller.desc")}
          </li>
          <li>
            <strong>{t("section1.terms.processor.title")}:</strong>{" "}
            {t("section1.terms.processor.desc")}
          </li>
        </ul>
        <p>{t("section1.p2")}</p>
      </section>

      <section>
        <h2>{t("section2.title")}</h2>
        <p>{t("section2.p1")}</p>
        <h3>{t("section2.subsections.schoolProvided.title")}</h3>
        <p>{t("section2.subsections.schoolProvided.p1")}</p>
        <ul>
          <li>{t("section2.subsections.schoolProvided.list.item1")}</li>
          <li>{t("section2.subsections.schoolProvided.list.item2")}</li>
          <li>{t("section2.subsections.schoolProvided.list.item3")}</li>
        </ul>
        <h3>{t("section2.subsections.userProvided.title")}</h3>
        <p>{t("section2.subsections.userProvided.p1")}</p>
        <h3>{t("section2.subsections.autoCollected.title")}</h3>
        <p>{t("section2.subsections.autoCollected.p1")}</p>
      </section>

      <section>
        <h2>{t("section3.title")}</h2>
        <p>{t("section3.p1")}</p>
        <ul>
          <li>{t("section3.list.item1")}</li>
          <li>{t("section3.list.item2")}</li>
          <li>{t("section3.list.item3")}</li>
          <li>{t("section3.list.item4")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("section4.title")}</h2>
        <div className="my-6 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <p className="font-semibold text-blue-800 dark:text-blue-300">
            {t("section4.disclaimer")}
          </p>
        </div>
        <p>{t("section4.p1")}</p>
        <ul>
          <li>{t("section4.list.item1")}</li>
          <li>{t("section4.list.item2")}</li>
          <li>{t("section4.list.item3")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("section5.title")}</h2>
        <p>{t("section5.p1")}</p>
        <p>{t("section5.p2")}</p>
      </section>

      <section>
        <h2>{t("section6.title")}</h2>
        <p>{t("section6.p1")}</p>
      </section>

      <section>
        <h2>{t("section7.title")}</h2>
        <p>{t("section7.p1")}</p>
        <ul>
          <li>{t("section7.list.item1")}</li>
          <li>{t("section7.list.item2")}</li>
          <li>{t("section7.list.item3")}</li>
          <li>{t("section7.list.item4")}</li>
        </ul>
        <p>{t("section7.p2")}</p>
      </section>

      <section>
        <h2>{t("section8.title")}</h2>
        <div className="my-6 p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <p className="font-semibold text-red-800 dark:text-red-300">
            {t("section8.disclaimer")}
          </p>
        </div>
        <p>
          {t("section8.p1", {
            termsLink: (
              <Link href="/terms" className="underline hover:text-primary">
                {t("termsLinkText")}
              </Link>
            ),
          })}
        </p>
        <p>{t("section8.p2")}</p>
      </section>

      <section>
        <h2>{t("section9.title")}</h2>
        <p>{t("section9.p1")}</p>
      </section>

      <section>
        <h2>{t("section10.title")}</h2>
        <p>{t("section10.p1")}</p>
      </section>

      <section>
        <h2>{t("section11.title")}</h2>
        <p>
          {t("section11.p1", {
            email: (
              <a
                href="mailto:privacy@kamerschool.com"
                className="underline hover:text-primary"
              >
                privacy@kamerschool.com
              </a>
            ),
          })}
        </p>
      </section>
    </LegalPageLayout>
  );
}
