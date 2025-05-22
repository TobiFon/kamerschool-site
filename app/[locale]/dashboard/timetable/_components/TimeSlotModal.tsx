"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; // For is_break

import { TimeSlot, TimeSlotFormData } from "@/types/timetable";
import { createTimeSlot, updateTimeSlot } from "@/queries/timetable";
import { getBackendErrorMessage } from "@/lib/utils";

const timeSlotSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(50, "Name too long"),
    // HTML input type="time" returns "HH:MM"
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time (HH:MM)"),
    end_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time (HH:MM)"),
    order: z.coerce
      .number()
      .int()
      .min(0, "Order must be a non-negative number"),
    is_break: z.boolean().default(false),
    school_id: z.number().positive().optional().nullable(), // For superuser context if needed
  })
  .refine(
    (data) => {
      // Ensure times are valid before comparison
      const [startH, startM] = data.start_time.split(":").map(Number);
      const [endH, endM] = data.end_time.split(":").map(Number);
      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM))
        return true; // Let regex catch it first
      return startH * 60 + startM < endH * 60 + endM;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    }
  );

type TimeSlotFormValues = z.infer<typeof timeSlotSchema>;

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  existingTimeSlot?: TimeSlot | null;
  schoolId: number; // ID of the current school (for context, though backend may derive it)
}

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({
  isOpen,
  onClose,
  existingTimeSlot,
  schoolId,
}) => {
  const t = useTranslations("Timetable.TimeSlots.Modal");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const isEditMode = !!existingTimeSlot;

  const form = useForm<TimeSlotFormValues>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: useMemo(
      () => ({
        name: "",
        start_time: "08:00", // Sensible default
        end_time: "08:45", // Sensible default
        order: 0,
        is_break: false,
        school_id: schoolId, // Default to current school, backend might override for non-superusers
      }),
      [schoolId]
    ),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && existingTimeSlot) {
        form.reset({
          name: existingTimeSlot.name,
          start_time: existingTimeSlot.start_time.substring(0, 5), // "HH:MM:SS" -> "HH:MM"
          end_time: existingTimeSlot.end_time.substring(0, 5),
          order: existingTimeSlot.order,
          is_break: existingTimeSlot.is_break,
          school_id: schoolId, // Or existingTimeSlot.school if it was present
        });
      } else {
        form.reset({
          // Reset to defaults for add mode
          name: "",
          start_time: "08:00",
          end_time: "08:45",
          order: 0,
          is_break: false,
          school_id: schoolId,
        });
      }
    }
  }, [isOpen, isEditMode, existingTimeSlot, form, schoolId]);

  const mutation = useMutation<TimeSlot, Error, TimeSlotFormValues>({
    mutationFn: async (formData) => {
      const payload: TimeSlotFormData = {
        name: formData.name,
        // Backend expects HH:MM:SS, but HTML input type="time" provides HH:MM.
        // If your backend strictly needs seconds, append ":00".
        // Assuming backend TimeField can handle "HH:MM" and store as "HH:MM:00".
        start_time: formData.start_time, // Stays as "HH:MM"
        end_time: formData.end_time, // Stays as "HH:MM"
        order: formData.order,
        is_break: formData.is_break,
        school_id: schoolId, // For superuser context
      };
      // For superusers, school_id might be passed.
      // For regular school admins, the backend TimeSlotViewSet.perform_create
      // and serializer.save(school=user_school) should handle setting the school.
      // So, we might not need to send school_id from here if the user is not a superuser.
      // If the form has school_id (e.g., for a superuser admin UI), include it:
      // if (formData.school_id) payload.school_id = formData.school_id;

      if (isEditMode && existingTimeSlot?.id) {
        return updateTimeSlot(existingTimeSlot.id, payload);
      } else {
        // The createTimeSlot service method expects a School instance, not ID.
        // The TimeSlotSerializer on backend handles `school_id` for `write_only=True`.
        // So for creation, ensure the `TimeSlotSerializer.create` on backend can handle `school_id`
        // or that `perform_create` in the ViewSet sets the school instance.
        // Our serializer's create calls the service. The service expects a school instance.
        // This means the frontend form (if for superuser) would need a school_id,
        // and the serializer's validated_data would pass it.
        // For a normal school admin, the perform_create in ViewSet sets the school.
        // Let's assume the serializer on backend handles 'school_id' in validated_data.
        return createTimeSlot(
          payload as TimeSlotFormData & { school_id: number }
        ); // Assuming school_id in payload if needed
      }
    },
    onSuccess: () => {
      toast.success(isEditMode ? t("updateSuccess") : t("createSuccess"));
      queryClient.invalidateQueries({ queryKey: ["timeSlots", schoolId] }); // Use schoolId in key if list is filtered
      onClose(true);
    },
    onError: (error) => {
      toast.error(
        getBackendErrorMessage(error) ||
          (isEditMode ? t("updateError") : t("createError"))
      );
    },
  });

  const onSubmit = (values: TimeSlotFormValues) => {
    mutation.mutate(values);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editTitle") : t("addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t("editDescription") : t("addDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="time-slot-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("nameLabel")} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("startTimeLabel")}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("endTimeLabel")}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("orderLabel")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={t("orderPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("orderDescription")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_break"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                  <div className="space-y-0.5">
                    <FormLabel>{t("isBreakLabel")}</FormLabel>
                    <FormDescription>{t("isBreakDescription")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="mt-2 pt-4 border-t">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={mutation.isLoading}
            >
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="time-slot-form"
            disabled={mutation.isLoading || !form.formState.isDirty}
          >
            {mutation.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? tCommon("saveChanges") : tCommon("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotModal;
