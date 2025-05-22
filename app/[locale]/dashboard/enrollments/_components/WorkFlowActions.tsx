"use client";
import React from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { Button } from "@/components/ui/button";
import { Edit, CheckSquare, Loader2 } from "lucide-react";

export function WorkflowActions({
  workflow,
  onActionClick,
  isLoading = false,
}) {
  const t = useTranslations("WorkflowActions"); // Initialize useTranslations

  const handleAction = (actionType) => {
    if (!isLoading) {
      onActionClick(actionType, workflow);
    }
  };

  const renderButton = (actionType, icon, textKey, disabled = false) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleAction(actionType)}
      disabled={isLoading || disabled}
      className="h-8 px-2.5 text-xs"
      title={t(textKey)} // Add title for accessibility/tooltip
    >
      {isLoading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        React.createElement(icon, { className: "mr-1.5 h-3.5 w-3.5" })
      )}
      {t(textKey)} {/* Translate button text */}
    </Button>
  );

  switch (workflow?.current_stage) {
    case "ready_for_enrollment":
      return renderButton("select_class", CheckSquare, "assignClassButton");

    case "enrollment_complete":
      return (
        <span className="text-xs text-muted-foreground italic">
          {t("status.completed")} {/* Translate status text */}
        </span>
      );

    case "awaiting_promotion_decision":
      return (
        <span className="text-xs text-muted-foreground italic">
          {t("status.pendingDecision")} {/* Translate status text */}
        </span>
      );

    default:
      // Optionally render a default state or null
      // return <span className="text-xs text-muted-foreground italic">{t('status.unknown')}</span>;
      return null;
  }
}
