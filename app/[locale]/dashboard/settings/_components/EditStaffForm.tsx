"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icons } from "@/components/icons";

const editSchema = z.object({
  position: z.string().min(2, "Position/Full name is required"),
  permission_level: z.enum(["read", "edit", "admin"]),
});

type EditFormData = z.infer<typeof editSchema>;

export function EditStaffForm({ staffMember, onSubmit, isLoading, onCancel }) {
  const t = useTranslations("settingsPage.staff.editDialog");
  const tInvite = useTranslations("settingsPage.staff.inviteDialog"); // Reuse permission options labels
  const tCommon = useTranslations("Common");

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      position: staffMember.position || "",
      permission_level: staffMember.permission_level || "read",
    },
  });

  const permissionOptions = [
    { value: "read", label: tInvite("permissionOptions.read") },
    { value: "edit", label: tInvite("permissionOptions.edit") },
    { value: "admin", label: tInvite("permissionOptions.admin") },
  ];

  // Function to handle form submission and map to UpdateStaffData
  const handleFormSubmit = (data: EditFormData) => {
    onSubmit({
      position: data.position,
      permission_level: data.permission_level,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="grid gap-4 py-4"
      >
        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fullName")}</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="permission_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("permissions")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon("selectPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {permissionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("cancelButton")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("saveButton")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
