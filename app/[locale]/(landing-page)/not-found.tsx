import Link from "next/link";
import { Icons } from "@/components/icons"; // Adjust path if needed
import { motion } from "framer-motion";
import { Home, Search, ChevronRight } from "lucide-react";

// A simple, reusable button component for our error pages
const ActionButton = ({
  href,
  icon,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
}) => (
  <Link
    href={href}
    className="inline-flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
  >
    {icon}
    <span className="ml-2">{text}</span>
  </Link>
);

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-center px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-lg">
        {/* Decorative background shape */}
        <motion.div
          className="absolute -top-16 -left-16 w-48 h-48 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
        <motion.div
          className="absolute -bottom-16 -right-16 w-40 h-40 bg-secondary/10 dark:bg-secondary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "mirror",
            delay: 2,
          }}
        />

        <main className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Icons.coloredLogo className="mx-auto h-20 w-20 text-primary" />
          </motion.div>

          <motion.h1
            className="mt-8 text-5xl font-bold tracking-tight text-slate-800 dark:text-white sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            404
          </motion.h1>

          <motion.p
            className="mt-4 text-xl font-semibold text-primary dark:text-primary-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            This page is playing hooky.
          </motion.p>

          <motion.p
            className="mt-2 text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          >
            We couldn't find the page you were looking for. It might have been
            moved, deleted, or maybe it's just taking a long lunch break.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          >
            <ActionButton
              href="/"
              icon={<Home className="h-4 w-4" />}
              text="Go to Homepage"
            />
            <ActionButton
              href="/contact"
              icon={<ChevronRight className="h-4 w-4" />}
              text="Contact Support"
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
