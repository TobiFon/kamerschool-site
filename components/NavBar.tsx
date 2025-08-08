// src/components/layout/Navbar.tsx
"use client";
import React, { useState, useEffect, useRef } from "react"; // Added useRef
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import RequestDemoModal from "./RequestDemoModal";
import { Logo } from "./Logo";

const navLinks = [
  { href: "/", labelKey: "home" },
  { href: "/features", labelKey: "features" },
  { href: "/parents", labelKey: "forParents" },
  { href: "/contact", labelKey: "contact" },
];

export default function Navbar() {
  const t = useTranslations("NavbarLinks");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navHeight, setNavHeight] = useState(64);
  const navRef = useRef<HTMLDivElement>(null); // Corrected type for navRef

  // State for the demo modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false); // <--- ADD MODAL STATE

  // Handle mobile menu body overflow
  useEffect(() => {
    if (isOpen || isDemoModalOpen) {
      // <--- INCLUDE DEMO MODAL
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isDemoModalOpen]); // <--- INCLUDE DEMO MODAL

  // Update nav height reference & handle scroll effects
  useEffect(() => {
    if (navRef.current) {
      setNavHeight(navRef.current.offsetHeight);
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleResize = () => {
      if (navRef.current) {
        setNavHeight(navRef.current.offsetHeight);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    handleScroll();
    handleResize();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const isActive =
      pathname === href ||
      (href === "/" && (pathname === "/" || pathname.startsWith("/?")));

    return (
      <Link href={href} legacyBehavior>
        <a
          onClick={() => {
            setIsOpen(false);
            // Consider if clicking a nav link should also close the demo modal
            // setIsDemoModalOpen(false);
          }}
          className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-out group
            ${
              isActive
                ? "text-primary font-semibold"
                : "text-slate-600 hover:text-primary"
            }`}
        >
          <span className="relative z-10">{label}</span>
          <motion.span
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.85,
            }}
            className="absolute inset-0 bg-primary/10 rounded-full -z-0"
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          />
          <motion.span
            initial={false}
            animate={{
              width: isActive ? "100%" : "0%",
              opacity: isActive ? 1 : 0,
            }}
            className="absolute bottom-0 left-0 h-[3px] bg-primary rounded-t-md"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
          {!isActive && (
            <motion.span
              initial={{ width: "0%", opacity: 0 }}
              whileHover={{ width: "80%", opacity: 1 }}
              className="absolute bottom-0 left-[10%] h-[2px] bg-primary/60 rounded-t-md"
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
        </a>
      </Link>
    );
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.1 }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-out w-full
          ${
            isScrolled || isOpen || isDemoModalOpen // <--- INCLUDE DEMO MODAL for background effect
              ? "bg-white/95 backdrop-blur-lg shadow-md border-b border-slate-200/60"
              : "bg-white/80 backdrop-blur-sm"
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Logo
              onClick={() => {
                setIsOpen(false);
                setIsDemoModalOpen(false);
              }}
              link="/"
            />

            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <div className="bg-slate-100/80 rounded-full px-1 py-1 backdrop-blur-sm">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={t(link.labelKey)}
                  />
                ))}
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="ml-4 lg:ml-5 text-slate-700 hover:bg-slate-100 hover:text-primary font-medium px-4 h-10"
              >
                <Link href="/dashboard">{t("login")}</Link>
              </Button>
              {/* MODIFIED DESKTOP "REQUEST DEMO" BUTTON */}
              <Button
                size="sm"
                onClick={() => setIsDemoModalOpen(true)} // <--- OPEN MODAL
                className="ml-1.5 bg-primary hover:bg-primary-dark text-primary-foreground shadow-md hover:shadow-lg transform hover:-translate-y-px transition-all duration-200 px-5 h-10 flex items-center font-medium"
              >
                {t("requestDemo")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="md:hidden flex">
              <button
                onClick={toggleMenu}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-full text-slate-600 hover:text-primary hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
                aria-controls="mobile-menu"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={isOpen ? "x-icon-mobile" : "menu-icon-mobile"}
                    initial={{
                      rotate: isOpen ? -90 : 0,
                      opacity: 0,
                      scale: 0.8,
                    }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: isOpen ? 0 : 90, opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.2,
                      type: "tween",
                      ease: "circOut",
                    }}
                  >
                    {isOpen ? (
                      <X className="block h-6 w-6" />
                    ) : (
                      <Menu className="block h-6 w-6" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -20,
              transition: { duration: 0.2, ease: "easeIn" },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 left-0 w-full bg-white z-[99] pt-6 md:pt-20 shadow-xl border-b border-slate-200/70"
            style={{
              top: navHeight,
              maxHeight: `calc(100vh - ${navHeight}px)`,
              overflowY: "auto",
            }}
            id="mobile-menu"
          >
            <div className="px-4 pt-4 pb-6 space-y-1.5">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href === "/" &&
                    (pathname === "/" || pathname.startsWith("/?")));
                return (
                  <Link href={link.href} legacyBehavior key={link.href}>
                    <motion.a
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-base transition-all duration-200 relative overflow-hidden
                        ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold shadow-sm"
                            : "text-slate-700 hover:bg-slate-100 hover:text-primary font-medium"
                        }`}
                      whileHover={{ x: isActive ? 0 : 5 }}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      {t(link.labelKey)}
                    </motion.a>
                  </Link>
                );
              })}
            </div>
            <div className="pt-4 pb-6 border-t border-slate-200/70 px-4 space-y-3 bg-slate-50">
              {/* MODIFIED MOBILE "REQUEST DEMO" BUTTON */}
              <Button
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground shadow-md py-2.5 text-sm font-medium h-12"
                onClick={() => {
                  setIsOpen(false); // Close mobile menu
                  setIsDemoModalOpen(true); // Open demo modal
                }}
              >
                {t("requestDemo")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-primary/70 py-2.5 text-sm h-12"
              >
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  {t("login")}
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER THE MODAL COMPONENT */}
      <RequestDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
}
