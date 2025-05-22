"use client";
import React from "react";
import { Button } from "@/components/ui/button";

export interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  className?: string;
  onClick?: () => void;
}

export function QuickActionButton({
  icon,
  label,
  className = "",
  onClick,
}: QuickActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={`flex items-center gap-2 ${className}`}
    >
      {icon}
      {label}
    </Button>
  );
}
