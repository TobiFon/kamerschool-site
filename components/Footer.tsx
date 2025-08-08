"use client";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "framer-motion";
import { Icons } from "./icons"; // We will add youtube and whatsapp icons here
import { ArrowUpCircle } from "lucide-react";

// --- MODIFIED: Updated Social Links ---
const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/KamerSchool",
    icon: <Icons.facebook className="h-5 w-5" />,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@KamerSchool",
    icon: <Icons.youtube className="h-5 w-5" />,
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/237696602209?text=Hello%20KamerSchools%2C%20I'm%20interested%20in%20your%20platform",
    icon: <Icons.whatsapp className="h-5 w-5" />,
  },
];

// --- MODIFIED: Updated Footer Navigation Sections ---
const footerNavSections = [
  {
    titleKey: "company",
    links: [
      { href: "/about", labelKey: "aboutUs", source: "Footer" },
      { href: "/careers", labelKey: "careers", source: "Footer" },
      { href: "/blog", labelKey: "blog", source: "Footer" },
    ],
  },
  {
    titleKey: "product",
    links: [
      { href: "/features", labelKey: "features", source: "NavbarLinks" },
      { href: "/parents", labelKey: "forParents", source: "NavbarLinks" },
      { href: "/contact", labelKey: "requestDemo", source: "NavbarLinks" },
    ],
  },
  {
    titleKey: "resources",
    links: [
      { href: "/contact", labelKey: "supportCenter", source: "Footer" },
      { href: "/faq", labelKey: "faq", source: "Footer" },
      // --- ADDED: New Legal Links ---
      { href: "/terms", labelKey: "terms", source: "Footer" },
      { href: "/privacy", labelKey: "privacy", source: "Footer" },
    ],
  },
];

export default function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("NavbarLinks");
  const currentYear = new Date().getFullYear();

  const footerRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });

  const yTransform1 = useTransform(scrollYProgress, [0, 1], ["-20%", "10%"]);
  const yTransform2 = useTransform(scrollYProgress, [0, 1], ["20%", "-10%"]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.5], [0, 0.15]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const linkHoverVariant = {
    hover: {
      color: "hsl(var(--primary))",
      x: 3,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
  };
  const socialIconHoverVariant = {
    hover: {
      scale: 1.2,
      rotate: [0, -10, 10, 0],
      color: "hsl(var(--primary))",
      transition: { duration: 0.4, type: "spring", stiffness: 200 },
    },
  };

  const getTranslation = (source: "Footer" | "NavbarLinks", key: string) => {
    return source === "NavbarLinks" ? tNav(key) : t(`links.${key}`);
  };

  return (
    <motion.footer
      ref={footerRef}
      className="relative bg-slate-900 dark:bg-black text-slate-400 dark:text-slate-500 pt-16 md:pt-24 pb-8 overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Decorative Backgrounds (unchanged) */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-1/2 opacity-5"
        style={{
          y: yTransform1,
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1.5px)",
          backgroundSize: "30px 30px",
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-5"
        style={{
          y: yTransform2,
          backgroundImage:
            "radial-gradient(ellipse, hsl(var(--primary)) 0.5px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/5 via-primary/10 to-transparent dark:from-primary/10 dark:via-primary/15 pointer-events-none"
        style={{ opacity: opacityTransform }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 xl:gap-12 mb-12 md:mb-16">
          <div className="col-span-2 md:col-span-4 lg:col-span-2 pr-4">
            <Link href="/" className="inline-block mb-6 group">
              <div className="flex items-center space-x-2.5">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icons.coloredLogo className="h-9 w-9 sm:h-10 sm:w-10 text-primary" />
                </motion.div>
                <span className="text-xl sm:text-2xl font-bold text-slate-200 dark:text-white group-hover:text-primary transition-colors">
                  KamerSchool
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-sm">
              {t("description")}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-primary transition-colors"
                  title={social.name}
                  variants={socialIconHoverVariant}
                  whileHover="hover"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {footerNavSections.map((section) => (
            <div key={section.titleKey}>
              <h3 className="text-sm font-semibold text-slate-300 dark:text-slate-200 tracking-wider uppercase mb-5">
                {t(`sections.${section.titleKey}`)}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href + link.labelKey}>
                    <motion.div variants={linkHoverVariant} whileHover="hover">
                      <Link
                        href={link.href}
                        className="text-sm hover:text-primary transition-colors duration-200 ease-in-out"
                      >
                        {getTranslation(link.source as any, link.labelKey)}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-700/50 dark:border-slate-800/70 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-center sm:text-left">
            © {currentYear} KamerSchool. {t("copyrightNotice")}
          </p>
          <button
            onClick={scrollToTop}
            className="mt-4 sm:mt-0 group flex items-center text-xs text-slate-400 hover:text-primary transition-colors"
            title={t("backToTop")}
          >
            {t("backToTop")}
            <ArrowUpCircle className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </motion.footer>
  );
}
