// src/app/[locale]/dashboard/finance/_components/shared/StatusBadge.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "partial" | "paid" | "overdue" | "waived" | string; // Allow string for flexibility
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  partial: "bg-blue-100 text-blue-800 border-blue-300",
  paid: "bg-green-100 text-green-800 border-green-300",
  overdue: "bg-red-100 text-red-800 border-red-300",
  waived: "bg-gray-100 text-gray-800 border-gray-300",
  // Add more statuses if needed
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800"; // Default style
  return (
    <Badge
      variant="outline"
      className={cn("capitalize font-medium px-2 py-0.5 text-xs", style)}
    >
      {status}
    </Badge>
  );
};

export default StatusBadge;
