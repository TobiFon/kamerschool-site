"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/form";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const ENROLLMENT_STATUS_CHOICES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "transferred_in", label: "Transferred In" },
  { value: "transferred_out", label: "Transferred Out" },
  { value: "withdrawn", label: "Withdrawn" },
];

const editEnrollmentSchema = z.object({
  assigned_class_id: z
    .number({ coerce: true })
    .positive({ message: "Class selection is required." }),
  status: z.string().min(1, { message: "Status is required." }),
  notes: z.string().optional(),
});

function EditEnrollmentModal({
  isOpen,
  onClose,
  onSubmit, // Function to call with (enrollmentId, updateData)
  enrollment, // The enrollment record being edited
  classes = [], // All available classes for dropdown
  isLoading,
}) {
  const form = useForm({
    resolver: zodResolver(editEnrollmentSchema),
    defaultValues: {
      assigned_class_id: "",
      status: "",
      notes: "",
    },
  });

  // Ensure we have valid enrollment data to work with
  const validEnrollment = enrollment || {};
  const validStudent = validEnrollment.student || {};
  const validAssignedClass = validEnrollment.assigned_class || {};

  const studentName =
    validStudent.full_name ||
    `${validStudent.first_name || ""} ${validStudent.last_name || ""}`.trim() ||
    "Student";

  const academicYearName =
    validEnrollment.academic_year_name ||
    validEnrollment.academic_year?.name ||
    "Year";

  // Filter classes to ensure we only have valid entries
  const validClasses = classes.filter((cls) => cls && cls.id);

  // Populate form with existing enrollment data when modal opens or enrollment changes
  useEffect(() => {
    if (isOpen && validEnrollment) {
      form.reset({
        assigned_class_id: validAssignedClass.id || "",
        status: validEnrollment.status || "pending", // Default to pending if no status
        notes: validEnrollment.notes || "",
      });
    } else if (!isOpen) {
      form.reset({ assigned_class_id: "", status: "", notes: "" }); // Clear form on close
    }
  }, [isOpen, validEnrollment, form]);

  const handleFormSubmit = (values) => {
    if (!validEnrollment.id) return;

    // Prepare only the fields that are actually being submitted for update
    const updateData = {
      assigned_class_id: parseInt(values.assigned_class_id, 10), // Ensure it's a number with base 10
      status: values.status,
      notes: values.notes,
    };

    // Filter out unchanged values compared to the original enrollment
    const changedData = Object.entries(updateData).reduce(
      (acc, [key, value]) => {
        // Special check for assigned_class_id vs enrollment.assigned_class.id
        if (key === "assigned_class_id" && value !== validAssignedClass.id) {
          acc[key] = value;
        } else if (
          key !== "assigned_class_id" &&
          value !== validEnrollment[key]
        ) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    if (Object.keys(changedData).length > 0) {
      onSubmit(validEnrollment.id, changedData);
    } else {
      // No changes detected, maybe just close the modal or show a message
      console.log("No changes detected in enrollment.");
      onClose(); // Close modal if no changes
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Enrollment: {studentName}</DialogTitle>
          <DialogDescription>
            Modify enrollment details for {academicYearName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 pt-2"
          >
            {/* Display Student Info */}
            <div className="p-3 rounded-md border bg-muted/50 text-sm space-y-1">
              <p>
                <strong>Student:</strong> {studentName} (
                {validStudent.matricule || "No ID"})
              </p>
              <p>
                <strong>Academic Year:</strong> {academicYearName}
              </p>
            </div>

            {/* Assigned Class */}
            <FormField
              control={form.control}
              name="assigned_class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Class *</FormLabel>
                  <ShadSelect
                    onValueChange={(value) =>
                      field.onChange(value ? parseInt(value, 10) : "")
                    } // Ensure value is number or empty string
                    value={
                      field.value !== "" && field.value !== undefined
                        ? String(field.value)
                        : "placeholder"
                    } // Convert to string for Select value
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>
                        Select a class
                      </SelectItem>
                      {validClasses
                        .sort((a, b) =>
                          (a.full_name || "").localeCompare(b.full_name || "")
                        )
                        .map((cls) => (
                          <SelectItem key={cls.id} value={String(cls.id)}>
                            {cls.full_name || `Class ${cls.id}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </ShadSelect>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <ShadSelect
                    onValueChange={field.onChange}
                    value={field.value || "placeholder"}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>
                        Select a status
                      </SelectItem>
                      {ENROLLMENT_STATUS_CHOICES.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value || "unknown"}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </ShadSelect>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes regarding this enrollment (optional)..."
                      {...field}
                      rows={4}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditEnrollmentModal;
