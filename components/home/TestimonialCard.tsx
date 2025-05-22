// src/components/home/TestimonialCard.tsx
"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, CheckCircle, Quote } from "lucide-react";

export interface Testimonial {
  id: string;
  quote: string;
  highlight?: string;
  name: string;
  role: string;
  avatarSrc?: string;
  schoolLogoSrc?: string;
  rating?: number;
  isVerified?: boolean;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  isActive: boolean;
}

export default function TestimonialCard({
  testimonial,
  isActive,
}: TestimonialCardProps) {
  const {
    quote,
    highlight,
    name,
    role,
    avatarSrc,
    schoolLogoSrc,
    rating,
    isVerified,
  } = testimonial;

  return (
    <motion.div
      className={`flex flex-col h-full bg-card dark:bg-slate-800 rounded-2xl shadow-lg 
                  border border-border/60 dark:border-slate-700/40
                  p-6 md:p-7 relative overflow-hidden transition-all duration-300 ease-out group`}
      animate={{
        scale: isActive ? 1 : 0.94, // Keep scale difference for emphasis
        opacity: isActive ? 1 : 0.65, // More opacity difference for inactive
        boxShadow: isActive
          ? "0px 12px 30px -8px hsla(var(--foreground)/0.12)" // Softer active shadow
          : "0px 6px 15px -10px hsla(var(--foreground)/0.08)",
      }}
      transition={{ type: "spring", stiffness: 180, damping: 25 }}
    >
      {/* Decorative Quote Icon - matching reference */}
      <Quote className="absolute top-5 right-5 w-12 h-12 text-primary/10 dark:text-primary/15 opacity-70 transform rotate-[10deg] -z-1" />

      {/* Highlight - using primary color as in reference */}
      {highlight && (
        <p className="text-lg font-semibold text-primary mb-3 leading-tight">
          “{highlight}”
        </p>
      )}

      <blockquote className="text-sm md:text-base text-foreground/70 dark:text-slate-300/80 leading-relaxed mb-6 flex-grow">
        {/* No explicit quote marks here if highlight already has them */}
        {quote}
      </blockquote>

      <div className="mt-auto border-t border-border/50 dark:border-slate-700/30 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {avatarSrc && (
              <Image
                src={avatarSrc}
                alt={name}
                width={40} // Slightly smaller avatar
                height={40}
                // Rounded rectangle avatar as in reference
                className="rounded-lg object-cover shadow-sm border border-border/50"
              />
            )}
            <div>
              <p className="font-medium text-sm text-foreground dark:text-slate-100">
                {name}
              </p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">
                {role}
              </p>
            </div>
          </div>
          {schoolLogoSrc && (
            <Image
              src={schoolLogoSrc}
              alt={`${role} Logo`}
              width={50}
              height={20}
              className="object-contain opacity-60 group-hover:opacity-90 transition-opacity"
            />
          )}
        </div>

        {(rating || isVerified) && (
          <div className="flex items-center space-x-3 mt-3 text-xs">
            {rating && (
              <div className="flex items-center space-x-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(rating)
                        ? "fill-current"
                        : i < rating && i >= Math.floor(rating)
                        ? "fill-current opacity-60"
                        : "opacity-30" // Handling half stars crudely
                    }`}
                  />
                ))}
                <span className="ml-1.5 text-xs text-muted-foreground dark:text-slate-400">
                  ({rating.toFixed(1)})
                </span>
              </div>
            )}
            {isVerified && (
              <div className="flex items-center text-green-600 dark:text-green-500">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                <span className="font-medium text-xs">Verified User</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subtle Background Glow for Active Card - matching reference */}
      {isActive && (
        <motion.div
          className="absolute inset-0 -z-[5] pointer-events-none rounded-2xl" // Apply to the shape of the card
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            // Soft radial gradient from bottom center, primary color based
            background: `radial-gradient(ellipse at 50% 120%, hsl(var(--primary)/0.15) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}
