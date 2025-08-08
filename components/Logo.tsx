import Link from "next/link";
import { motion } from "framer-motion";
import { Icons } from "./icons"; // Assuming your icons are here

// A helper function for merging Tailwind classes
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface LogoProps {
  // Allow passing extra classes for container styling (e.g., for positioning)
  className?: string;
  // Optional onClick for mobile menus, etc.
  onClick?: () => void;
  link: string;
}

export function Logo({ className, onClick, link }: LogoProps) {
  const t = useTranslations("NavbarLinks");
  const tagline = t("tagline");
  return (
    <Link href={link} legacyBehavior>
      <a
        className={cn("flex items-center gap-1 group", className)}
        onClick={onClick}
      >
        {/* The icon now has a subtle hover animation */}
        <motion.div
          whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <Icons.coloredLogo className="h-8 w-8 text-primary drop-shadow-sm" />
        </motion.div>

        {/* Text container with better line-height */}
        <div className="flex flex-col">
          <span className="text-xl font-bold leading-tight text-slate-800 group-hover:text-primary transition-colors duration-200">
            KamerSchool
          </span>
          <span className="text-[11px] font-medium leading-tight text-slate-500">
            {tagline}
          </span>
        </div>
      </a>
    </Link>
  );
}
