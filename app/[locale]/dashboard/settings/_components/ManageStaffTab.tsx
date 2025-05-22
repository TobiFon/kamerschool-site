"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import {
  fetchStaffList,
  inviteStaff,
  updateStaffMember,
  resetStaffPassword,
  deleteStaffMember,
} from "@/queries/schools";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Edit, MoreHorizontal, RefreshCw, Trash, UserPlus } from "lucide-react";
import { EditStaffForm } from "./EditStaffForm";
import { InviteStaffForm } from "./InviteStaffForm";
import { DataTable } from "../../fees/_components/data-table";

export function ManageStaffTab() {
  const t = useTranslations("settingsPage.staff");
  const tActions = useTranslations("settingsPage.staff.actions");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Fetch Staff List
  const {
    data: staffData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["staffList"],
    queryFn: fetchStaffList,
  });

  // --- Mutations ---

  const invalidateStaffList = () => {
    queryClient.invalidateQueries({ queryKey: ["staffList"] });
  };

  const inviteMutation = useMutation({
    mutationFn: inviteStaff,
    onSuccess: (data) => {
      toast.success(tCommon("success"), {
        description: t("inviteDialog.success", {
          username: data.username || "N/A",
          password: data.temporary_password || "Check Email",
        }),
        duration: 10000, // Longer duration for credentials
      });
      invalidateStaffList();
      setIsInviteDialogOpen(false);
    },
    onError: (error) => {
      let description = t("inviteDialog.errorGeneral");
      if (error instanceof Error && error.message === "StaffExists") {
        description = t("inviteDialog.errorExists");
      } else if (error instanceof Error) {
        description = `${t("inviteDialog.errorGeneral")}: ${error.message}`;
      }
      toast.error(tCommon("error"), { description });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ staffId, data }) => updateStaffMember(staffId, data),
    onSuccess: () => {
      toast.success(tCommon("success"), {
        description: t("editDialog.success"),
      });
      invalidateStaffList();
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error) => {
      toast.error(tCommon("error"), {
        description: `${t("editDialog.error")}: ${error.message}`,
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetStaffPassword,
    onSuccess: (data) => {
      toast.success(tCommon("success"), {
        description: t("resetSuccess", {
          password: data.temporary_password || "Check Email",
        }),
        duration: 10000,
      });
      invalidateStaffList();
      setIsResetConfirmOpen(false);
      setSelectedStaff(null);
    },
    onError: (error) => {
      toast.error(tCommon("error"), {
        description: `${t("resetError")}: ${error.message}`,
      });
      setIsResetConfirmOpen(false);
      setSelectedStaff(null);
    },
  });

  const deleteMutation = useMutation<void, Error, number | string>({
    mutationFn: deleteStaffMember,
    onSuccess: () => {
      toast.success(tCommon("success"), { description: t("deleteSuccess") });
      invalidateStaffList();
      setIsDeleteConfirmOpen(false);
      setSelectedStaff(null);
    },
    onError: (error) => {
      toast.error(tCommon("error"), {
        description: `${t("deleteError")}: ${error.message}`,
      });
      setIsDeleteConfirmOpen(false); // Close confirm dialog on error too
      setSelectedStaff(null);
    },
  });

  // --- Actions Handlers ---
  const handleEdit = (staff: any) => {
    setSelectedStaff(staff);
    setIsEditDialogOpen(true);
  };
  const handleResetPassword = (staff: any) => {
    setSelectedStaff(staff);
    setIsResetConfirmOpen(true);
  };
  const handleDelete = (staff: any) => {
    setSelectedStaff(staff);
    setIsDeleteConfirmOpen(true);
  };

  // --- Table Columns ---
  const columns = useMemo(
    () => [
      {
        accessorKey: "user_full_name", // Or 'position' if preferred as primary identifier
        header: t("table.name"),
        cell: ({ row }) =>
          row.original.position || row.original.user_username || "N/A",
      },
      { accessorKey: "user_email", header: t("table.email") },
      { accessorKey: "position", header: t("table.position") },
      {
        accessorKey: "permission_level",
        header: t("table.permissions"),
        cell: ({ row }) => {
          const level = row.original.permission_level;
          return t(`inviteDialog.permissionOptions.${level}` as any) || level; // Use translation key
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">{t("table.actions")}</div>,
        cell: ({ row }) => {
          const staff = row.original;
          return (
            <div className="text-right">
              <AlertDialog
                open={isResetConfirmOpen && selectedStaff?.id === staff.id}
                onOpenChange={setIsResetConfirmOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tCommon("areYouSure")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("confirmReset", {
                        name:
                          selectedStaff?.position ||
                          selectedStaff?.user_username ||
                          "",
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedStaff(null)}>
                      {tCommon("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        selectedStaff &&
                        resetPasswordMutation.mutate(selectedStaff.id)
                      }
                      disabled={resetPasswordMutation.isPending}
                    >
                      {resetPasswordMutation.isPending ? (
                        <Icons.spinner className="animate-spin mr-2" />
                      ) : null}
                      {tActions("resetPassword")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog
                open={isDeleteConfirmOpen && selectedStaff?.id === staff.id}
                onOpenChange={setIsDeleteConfirmOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tCommon("areYouSure")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("confirmDelete", {
                        name:
                          selectedStaff?.position ||
                          selectedStaff?.user_username ||
                          "",
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedStaff(null)}>
                      {tCommon("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() =>
                        selectedStaff && deleteMutation.mutate(selectedStaff.id)
                      }
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Icons.spinner className="animate-spin mr-2" />
                      ) : null}
                      {tActions("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(staff)}>
                    <Edit className="mr-2 h-4 w-4" /> {tActions("edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleResetPassword(staff)}>
                    <RefreshCw className="mr-2 h-4 w-4" />{" "}
                    {tActions("resetPassword")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(staff)}
                    className="text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" /> {tActions("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      t,
      tActions,
      tCommon,
      handleEdit,
      handleResetPassword,
      handleDelete,
      isResetConfirmOpen,
      isDeleteConfirmOpen,
      selectedStaff,
      resetPasswordMutation,
      deleteMutation,
    ] // Dependencies
  );

  // --- Render ---
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive">
        {tCommon("error")} {tCommon("fetchFailed", { item: t("title") })}
      </div>
    );
  }

  const staffList = staffData?.results || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {tCommon("manageItemsHint", { item: t("title").toLowerCase() })}
          </CardDescription>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("inviteButton")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("inviteDialog.title")}</DialogTitle>
            </DialogHeader>
            <InviteStaffForm
              onSubmit={inviteMutation.mutate}
              isLoading={inviteMutation.isPending}
              onCancel={() => setIsInviteDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Edit Staff Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("editDialog.title")}</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <EditStaffForm
                staffMember={selectedStaff}
                onSubmit={(data) =>
                  editMutation.mutate({ staffId: selectedStaff.id, data })
                }
                isLoading={editMutation.isPending}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedStaff(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <DataTable columns={columns} data={staffList} />
      </CardContent>
    </Card>
  );
}
