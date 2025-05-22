// FILE: components/transfers/TransferActions.tsx
"use client";
import React, { JSX } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  CheckCheck,
  Send,
  Ban,
  Eye,
  UserCog,
} from "lucide-react"; // Added UserCog for admin
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransferRequest } from "@/types/transfers";
import { useQuery } from "@tanstack/react-query";
import { fetchSchool } from "@/lib/auth";

interface TransferActionsProps {
  request: TransferRequest;
  onActionClick: (actionType: string, request: TransferRequest) => void;
  userSchoolId?: number | null; // User's current school ID
  // isUserSuperuser?: boolean; // Optional: if you have a simple way to pass this
}

function TransferActions({
  request,
  onActionClick,
}: // isUserSuperuser = false, // Default to false
TransferActionsProps) {
  const t = useTranslations("TransfersTab.actions");
  const status = request.status;

  const handleAction = (actionType: string) => {
    onActionClick(actionType, request);
  };
  const {
    data: schoolData,
    isLoading: schoolIsLoading,
    error: schoolDataError,
  } = useQuery({
    queryKey: ["school"],
    queryFn: () => fetchSchool(),
  });
  const userSchoolId = schoolData?.id;

  // --- Visibility Logic ---
  // For simplicity, this example doesn't explicitly use isUserSuperuser.
  // Backend permissions will ultimately enforce rules.
  // Frontend shows options based on common roles. Superuser would see more due to backend permissiveness.

  const isUserFromSchool = userSchoolId === request.from_school_id;
  const isUserToSchool = userSchoolId === request.to_school_id;

  // Cancel: Pending request, user is from the sending school OR a superuser (implicitly allowed by backend)
  const canCancel = status === "pending" && isUserFromSchool;

  // Review: Pending request, user is from the receiving school OR a superuser
  const canReview = status === "pending" && isUserToSchool;

  // Complete: Approved request, user is from the receiving school OR a superuser
  const canComplete = status === "approved" && isUserToSchool;

  // Fallback for superusers or if no specific role matches, show all relevant actions
  // This simplified approach relies on the backend to deny unauthorized actions.
  // A more explicit frontend for superuser would be:
  // const canCancelForSuperuser = status === "pending";
  // const canReviewForSuperuser = status === "pending";
  // const canCompleteForSuperuser = status === "approved";
  // if (isUserSuperuser) { canCancel = canCancelForSuperuser; ... }

  // Let's refine to what each school role should see.
  // If userSchoolId is not provided, or doesn't match, they see nothing unless they are superuser.
  // The current setup will hide actions if userSchoolId doesn't match.
  // If you want superusers to see all actions regardless of their schoolId,
  // you'd need an `isUserSuperuser` prop and adjust logic.

  const availableActions: JSX.Element[] = [];

  // View Details (Generic, could be always available based on base permission)
  // For now, let's assume 'view' is handled by clicking the row or a dedicated icon.
  // If needed: availableActions.push(<DropdownMenuItem key="view" onClick={() => handleAction('view')}><Eye className="mr-2 h-4 w-4" /><span>{t('viewDetails')}</span></DropdownMenuItem>);

  if (canReview) {
    availableActions.push(
      <DropdownMenuItem
        key="review"
        onClick={() => handleAction("review")}
        className="text-yellow-600 focus:text-yellow-700 focus:bg-yellow-50 dark:text-yellow-400 dark:focus:bg-yellow-900/50 dark:focus:text-yellow-300"
      >
        <CheckCheck className="mr-2 h-4 w-4" />
        <span>{t("review")}</span>
      </DropdownMenuItem>
    );
  }

  if (canComplete) {
    if (availableActions.length > 0 && (canReview || canCancel)) {
      // Add separator if other actions might appear before it
      // availableActions.push(<DropdownMenuSeparator key="sep-before-complete" />);
    }
    availableActions.push(
      <DropdownMenuItem
        key="complete"
        onClick={() => handleAction("complete")}
        className="text-green-600 focus:text-green-700 focus:bg-green-50 dark:text-green-400 dark:focus:bg-green-900/50 dark:focus:text-green-300"
      >
        <Send className="mr-2 h-4 w-4" />
        <span>{t("complete")}</span>
      </DropdownMenuItem>
    );
  }

  if (canCancel) {
    if (availableActions.length > 0 && (canReview || canComplete)) {
      // Add separator if other actions might appear before it
      // No, separator logic should be more robust.
      // Let's add separators explicitly where they make sense.
    }
    availableActions.push(
      <DropdownMenuItem
        key="cancel"
        onClick={() => handleAction("cancel")}
        className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-900/50 dark:focus:text-red-300"
      >
        <Ban className="mr-2 h-4 w-4" />
        <span>{t("cancel")}</span>
      </DropdownMenuItem>
    );
  }

  // Re-evaluating separator logic based on distinct roles:
  // from_school only sees cancel.
  // to_school sees review, then later complete.
  // A superuser might see all.
  // The current logic means a from_school user sees only "Cancel".
  // A to_school user sees only "Review" (if pending) or "Complete" (if approved).
  // This seems to align with the request. No separators needed if only one action is visible per role.

  // If no specific actions are available for the school user, show a message or nothing.
  if (availableActions.length === 0) {
    // If you want to indicate that a superuser might have actions:
    // if (isUserSuperuser) {
    //   // Potentially add all actions a superuser might take, e.g., admin override
    //   // For now, assume superuser actions are just broader versions of the above.
    // } else {
    return (
      // Render a disabled item or null if no actions should be shown for this user
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled>
            <span className="sr-only">{t("openMenu")}</span>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
      </DropdownMenu>
    );
    // }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          disabled={availableActions.length === 0}
        >
          <span className="sr-only">{t("openMenu")}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableActions.length > 0 ? (
          availableActions
        ) : (
          <DropdownMenuItem disabled>{t("noActions")}</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TransferActions;
