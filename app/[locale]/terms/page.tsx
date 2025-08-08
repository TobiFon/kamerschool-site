// app/[locale]/terms/page.tsx
import { useTranslations } from "next-intl";
import Link from "next/link";

// This is a more robust layout for legal/content pages.
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

export default function TermsPage() {
  const t = useTranslations("TermsPage");

  return (
    <LegalPageLayout title={t("title")} lastUpdated={t("lastUpdated")}>
      <p className="lead">{t("introduction.p1")}</p>
      <div className="my-6 p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"></div>
      <p>{t("introduction.p2")}</p>

      <section>
        <h2>{t("section1.title")}</h2>
        <p>{t("section1.p1")}</p>
        <ul>
          <li>
            <strong>{t("section1.terms.service.title")}:</strong>{" "}
            {t("section1.terms.service.desc")}
          </li>
          <li>
            <strong>{t("section1.terms.school.title")}:</strong>{" "}
            {t("section1.terms.school.desc")}
          </li>
          <li>
            <strong>{t("section1.terms.user.title")}:</strong>{" "}
            {t("section1.terms.user.desc")}
          </li>
          <li>
            <strong>{t("section1.terms.content.title")}:</strong>{" "}
            {t("section1.terms.content.desc")}
          </li>
        </ul>
      </section>

      <section>
        <h2>{t("section2.title")}</h2>
        <p>{t("section2.p1")}</p>
        <p>{t("section2.p2")}</p>
      </section>

      <section>
        <h2>{t("section3.title")}</h2>
        <h3>{t("section3.subsections.acceptableUse.title")}</h3>
        <p>{t("section3.subsections.acceptableUse.p1")}</p>
        <ul>
          <li>{t("section3.subsections.acceptableUse.list.item1")}</li>
          <li>{t("section3.subsections.acceptableUse.list.item2")}</li>
          <li>{t("section3.subsections.acceptableUse.list.item3")}</li>
          <li>{t("section3.subsections.acceptableUse.list.item4")}</li>
        </ul>
        <h3>{t("section3.subsections.schoolResponsibilities.title")}</h3>
        <p>{t("section3.subsections.schoolResponsibilities.p1")}</p>
        <ul>
          <li>{t("section3.subsections.schoolResponsibilities.list.item1")}</li>
          <li>{t("section3.subsections.schoolResponsibilities.list.item2")}</li>
          <li>{t("section3.subsections.schoolResponsibilities.list.item3")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("section4.title")}</h2>
        <p>{t("section4.p1")}</p>
        <p>
          {t("section4.p2", {
            privacyPolicyLink: (
              <Link href="/privacy" className="underline hover:text-primary">
                {t("privacyPolicyLinkText")}
              </Link>
            ),
          })}
        </p>
      </section>

      <section>
        <h2>{t("section5.title")}</h2>
        <h3>{t("section5.subsections.schoolContent.title")}</h3>
        <p>{t("section5.subsections.schoolContent.p1")}</p>
        <h3>{t("section5.subsections.ourLicense.title")}</h3>
        <p>{t("section5.subsections.ourLicense.p1")}</p>
      </section>

      <section>
        <h2>{t("section6.title")}</h2>
        <p>{t("section6.p1")}</p>
        <p>{t("section6.p2")}</p>
      </section>

      <section>
        <h2>{t("section7.title")}</h2>
        <p>{t("section7.p1")}</p>
      </section>

      <section>
        <h2>{t("section8.title")}</h2>
        <p>{t("section8.p1")}</p>
      </section>

      <section>
        <h2>{t("section9.title")}</h2>
        <p>{t("section9.p1")}</p>
      </section>

      <section>
        <h2>{t("section10.title")}</h2>
        <p>{t("section10.p1")}</p>
        <p>{t("section10.p2")}</p>
      </section>

      <section>
        <h2>{t("section11.title")}</h2>
        <p>{t("section11.p1", { companyName: "KamerSchool SARL" })}</p>{" "}
      </section>

      <section>
        <h2>{t("section12.title")}</h2>
        <p>
          {t("section12.p1", {
            email: (
              <a
                href="mailto:support@kamerschool.com"
                className="underline hover:text-primary"
              >
                kamerschoolapp@gmail.com
              </a>
            ),
          })}
        </p>{" "}
        {/* Replace with your support email */}
      </section>
    </LegalPageLayout>
  );
}
