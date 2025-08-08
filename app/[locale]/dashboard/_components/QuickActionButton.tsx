"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const { canEdit } = useCurrentUser();
  return (
    <Button
      onClick={onClick}
      className={`flex items-center gap-2 ${className}`}
      disabled={!canEdit}
    >
      {icon}
      {label}
    </Button>
  );
}
