import { Badge } from "@/components/ui/badge";

const stageMap = {
  awaiting_promotion_decision: {
    label: "Awaiting Decision",
    variant: "secondary",
  },
  needs_stream_selection: { label: "Needs Stream", variant: "warning" },
  needs_external_results: { label: "Needs Results", variant: "info" },
  ready_for_enrollment: { label: "Ready to Enroll", variant: "default" },
  enrollment_complete: { label: "Completed", variant: "success" },
  promoted: { label: "Promoted", variant: "success" },
  conditional: { label: "Conditional", variant: "warning" },
  repeated: { label: "Repeated", variant: "destructive" },
  graduated: { label: "Graduated", variant: "secondary" },
};

const badgeVariantClasses = {
  warning:
    "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  info: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  success:
    "bg-green-100 text-green-800 border-green-300 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
};

export function StatusBadge({ status }) {
  const config = stageMap[status] || {
    label: status || "Unknown",
    variant: "secondary",
  };
  const customClass = badgeVariantClasses[config.variant] || "";

  return (
    <Badge
      variant={customClass ? "outline" : config.variant}
      className={customClass}
    >
      {config.label}
    </Badge>
  );
}
