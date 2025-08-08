"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format, parseISO } from "date-fns"; // Use date-fns for parsing/formatting

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription, // Added for context
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription, // Optional: Add descriptions
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList, // Import CommandList for scrolling
} from "@/components/ui/command"; // Make sure Command components are imported
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Loader2, UserSearch, AlertOctagon } from "lucide-react";

// Utils and Types
import { cn, formatDate, getBackendErrorMessage } from "@/lib/utils";
import {
  DisciplineRecord,
  DisciplineRecordType,
  DisciplineRecordFormData,
} from "@/types/discipline";
import { StudentSimple } from "@/types/students"; // Type for student lookup results
import { useDebounce } from "@/hooks/useDebounce"; // Import debounce hook

// API Query Functions
import {
  createDisciplineRecord,
  fetchDisciplineRecordById,
  fetchDisciplineRecordTypes,
  updateDisciplineRecord,
} from "@/queries/discipline";
import {
  buildUrl,
  fetchStudentById,
  searchStudentsForLookup,
} from "@/queries/students"; // Query for student search
import { authFetch } from "@/lib/auth";
import CustomCalendar from "./CustomCalendar";

const DisciplineSeverity = {
  LOW: "low" as const,
  MEDIUM: "medium" as const,
  HIGH: "high" as const,
  INFO: "info" as const,
  NA: "n/a" as const,
};

export type DisciplineSeverity =
  (typeof DisciplineSeverity)[keyof typeof DisciplineSeverity];
export { DisciplineSeverity };
const disciplineRecordSchema = z.object({
  student: z // Student ID (number or string converted to number)
    .union([z.number().positive("Student is required."), z.string()]) // Allow string initially
    .refine(
      (val) => val !== null && val !== undefined && String(val).trim() !== "",
      {
        message: "Student is required.",
      }
    )
    .transform((val) => (typeof val === "string" ? val.trim() : val)) // Trim string
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Invalid student selection.", // More specific error if not a number > 0
    }),
  record_type: z // Record Type ID (number or string converted to number)
    .union([z.number().positive("Record type is required."), z.string()])
    .refine(
      (val) => val !== null && val !== undefined && String(val).trim() !== "",
      {
        message: "Record type is required.",
      }
    )
    .transform((val) => (typeof val === "string" ? val.trim() : val))
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Invalid record type selection.",
    }),
  date_occurred: z
    .date({
      required_error: "Date occurred is required.",
      invalid_type_error: "Invalid date format.",
    })
    .max(new Date(), { message: "Date cannot be in the future." }), // Add future date validation
  time_occurred: z // Optional time as string HH:MM or HH:MM:SS
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, {
      message: "Invalid time format (HH:MM or HH:MM:SS).",
    })
    .optional()
    .nullable()
    .or(z.literal("")), // Allow empty string from input
  severity: z // Optional severity, allow null or empty string
    .nativeEnum(DisciplineSeverity, {
      errorMap: () => ({ message: "Invalid severity choice." }),
    }) // Validate against enum keys
    .nullable()
    .optional()
    .or(z.literal("")), // Allow empty string from select
  description: z
    .string()
    .trim() // Trim whitespace
    .min(5, { message: "Description must be at least 5 characters." })
    .max(1000, { message: "Description cannot exceed 1000 characters." }),
  action_taken: z
    .string()
    .trim()
    .max(500, { message: "Action taken cannot exceed 500 characters." })
    .optional()
    .nullable()
    .or(z.literal("")), // Allow empty string
});

// Type for the validated form data based on the Zod schema
type DisciplineFormValues = z.infer<typeof disciplineRecordSchema>;

// Define severity choices matching backend model (can be moved to types/constants)
const SEVERITY_OPTIONS: { value: DisciplineSeverity | ""; labelKey: string }[] =
  [
    { value: "none", labelKey: "selectSeverityOptional" },
    { value: "high", labelKey: "high" },
    { value: "medium", labelKey: "medium" },
    { value: "low", labelKey: "low" },
    { value: "info", labelKey: "info" },
    { value: "n/a", labelKey: "na" },
  ];

interface DisciplineRecordModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  recordId?: number | null; // null for Add mode, number for Edit mode
  studentId?: number | string | null; // Optional: Pre-fill student if opened from student page/tab
}

const DisciplineRecordModal: React.FC<DisciplineRecordModalProps> = ({
  isOpen,
  onClose,
  recordId,
  studentId,
}) => {
  const t = useTranslations("Discipline.Modal");
  const tSeverity = useTranslations("Discipline.Severity");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const isEditMode = recordId !== null && recordId !== undefined;

  // --- State ---
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  // State to hold the *display* info of the selected student
  const [selectedStudentDisplay, setSelectedStudentDisplay] = useState<{
    name: string;
    matricule: string | null;
  } | null>(null);
  const [isStudentPopoverOpen, setIsStudentPopoverOpen] = useState(false); // Control popover state

  // Debounce the search term to avoid excessive API calls
  const debouncedStudentSearchTerm = useDebounce(studentSearchTerm, 300); // 300ms delay

  // --- Form Initialization ---
  const form = useForm<DisciplineFormValues>({
    resolver: zodResolver(disciplineRecordSchema),
    // Default values should match the Zod schema structure
    defaultValues: useMemo(
      () => ({
        student: studentId ? String(studentId) : "", // Pre-fill if available, otherwise empty string
        record_type: "",
        date_occurred: new Date(),
        time_occurred: "", // Use empty string for optional fields
        severity: "", // Use empty string for optional fields
        description: "",
        action_taken: "", // Use empty string for optional fields
      }),
      [studentId]
    ), // Recalculate defaults if prefilledId changes (though modal usually remounts)
  });

  // --- Data Fetching ---

  // Fetch existing record data in EDIT mode
  const {
    data: existingRecord,
    isLoading: isLoadingRecord,
    isError: isErrorRecord,
    error: errorRecord, // Capture error object
    refetch: refetchRecord, // Function to refetch record data
  } = useQuery<DisciplineRecord, Error>({
    queryKey: ["disciplineRecord", recordId],
    queryFn: () => fetchDisciplineRecordById(recordId!), // Use non-null assertion as enabled logic covers it
    enabled: isOpen && isEditMode, // Fetch only when modal is open and in edit mode
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Retry once on error
  });

  // Fetch active discipline record types for the dropdown
  const {
    data: recordTypes,
    isLoading: isLoadingTypes,
    isError: isErrorTypes,
  } = useQuery<DisciplineRecordType[], Error>({
    queryKey: ["disciplineRecordTypes", "active"], // Simple key for active types
    queryFn: () => fetchDisciplineRecordTypes({ is_active: true }), // Uses the specific API endpoint
    enabled: isOpen, // Fetch when modal opens
    staleTime: 10 * 60 * 1000, // Cache types for 10 mins
    retry: 1,
  });

  // --- Student Lookup Query ---
  // Fetch students based on the debounced search term
  const { data: studentOptions, isLoading: isLoadingStudents } = useQuery<
    StudentSimple[],
    Error
  >({
    // Use debounced term in query key to trigger refetch only after delay
    queryKey: ["studentLookup", debouncedStudentSearchTerm],
    queryFn: () => searchStudentsForLookup(debouncedStudentSearchTerm), // Use the dedicated lookup function
    // Enable only when modal is open and debounced search term is long enough
    enabled: isOpen && debouncedStudentSearchTerm.length >= 2,
    staleTime: 60 * 1000, // Cache search results for 1 minute
    keepPreviousData: true, // Show previous results while new ones load
  });

  // --- Prefetch Student Info if ID is Prefilled ---
  // If opened from student tab, we have the ID but maybe not the name/matricule initially.
  const { data: prefilledStudentInfo, isLoading: isLoadingPrefilledStudent } =
    useQuery<StudentSimple, Error>({
      queryKey: ["studentSimple", studentId],
      // A hypothetical function to get basic student info by ID
      // You might need to create this backend endpoint/serializer or adapt an existing one
      queryFn: () => fetchStudentById(studentId as string),
      enabled: isOpen && !!studentId && !isEditMode && !selectedStudentDisplay, // Only fetch if prefilled, not in edit, and display not yet set
      staleTime: 5 * 60 * 1000,
    });

  // --- Form Population and Reset Logic ---

  // Effect to reset the form when the modal opens or switches between add/edit
  useEffect(() => {
    if (isOpen) {
      // Reset form to defaults (handles prefilled ID)
      form.reset({
        student: studentId ? String(studentId) : "",
        record_type: "",
        date_occurred: new Date(),
        time_occurred: "",
        severity: "",
        description: "",
        action_taken: "",
      });
      setSelectedStudentDisplay(null); // Clear student display info
      setStudentSearchTerm(""); // Clear search term
      setIsStudentPopoverOpen(false); // Ensure popover is closed initially

      // If prefilled ID exists, try to set initial display text
      if (studentId && prefilledStudentInfo) {
        setSelectedStudentDisplay({
          name: `${prefilledStudentInfo.full_name || ""}`.trim(),
          matricule: prefilledStudentInfo.matricule || null,
        });
      }
    }
  }, [isOpen, recordId, studentId, form, prefilledStudentInfo]); // Add form and prefilledStudentInfo

  // Effect to populate form when existing record data loads in EDIT mode
  useEffect(() => {
    if (isOpen && isEditMode && existingRecord) {
      form.setValue("student", String(existingRecord.student));
      form.setValue("record_type", String(existingRecord.record_type));
      // Ensure date is parsed correctly (backend sends string YYYY-MM-DD)
      // Add time offset handling if needed, otherwise parseISO assumes local implicitly usually
      form.setValue("date_occurred", parseISO(existingRecord.date_occurred));
      // Handle time: backend sends HH:MM:SS or null
      form.setValue(
        "time_occurred",
        existingRecord.time_occurred
          ? existingRecord.time_occurred.substring(0, 5)
          : ""
      ); // Use HH:MM format for input
      form.setValue("severity", existingRecord.severity || ""); // Use empty string if null
      form.setValue("description", existingRecord.description || "");
      form.setValue("action_taken", existingRecord.action_taken || "");

      // Set initial student display text using info from the loaded record
      setSelectedStudentDisplay({
        name:
          existingRecord.student_name ||
          `Student ID: ${existingRecord.student}`, // Use name from record, fallback to ID
        matricule: existingRecord.student_matricule || null,
      });
    }
  }, [isOpen, isEditMode, existingRecord, form]); // Dependency array includes form

  useEffect(() => {
    // Function to close calendar dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const calendarElements = document.querySelectorAll(".calendar-dropdown");
      calendarElements.forEach((element) => {
        if (element && !element.contains(event.target as Node)) {
          // Close the calendar
          // This approach assumes your CustomCalendar component exposes a way to close it
          // Or you might need to modify the CustomCalendar to use a ref and expose a close method
        }
      });
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  // --- Mutations (Create/Update) ---
  const mutation = useMutation<
    DisciplineRecord, // Type of response on success
    Error, // Type of error
    DisciplineFormValues // Type of variables passed to mutationFn
  >({
    mutationFn: async (formData) => {
      // 1. Prepare the payload conforming to DisciplineRecordFormData
      const payload: DisciplineRecordFormData = {
        student: Number(formData.student), // Convert student ID to number
        record_type: Number(formData.record_type), // Convert type ID to number
        date_occurred: format(formData.date_occurred, "yyyy-MM-dd"), // Format date to YYYY-MM-DD string
        // Handle optional fields, converting empty strings to null
        time_occurred: formData.time_occurred || null,
        severity: formData.severity || null,
        description: formData.description,
        action_taken: formData.action_taken || null,
      };

      // 2. Call the appropriate API function
      if (isEditMode) {
        // Ensure recordId is valid before calling update
        if (!recordId) throw new Error("Record ID is missing for update.");
        return updateDisciplineRecord(recordId, payload);
      } else {
        return createDisciplineRecord(payload);
      }
    },
    onSuccess: (data) => {
      // 'data' here is the created/updated record from the backend
      toast.success(isEditMode ? t("updateSuccess") : t("createSuccess"));
      queryClient.invalidateQueries({ queryKey: ["disciplineRecords"] }); // Invalidate the main list query
      queryClient.invalidateQueries({
        queryKey: ["studentDiscipline", String(data.student)],
      }); // Invalidate specific student's list query
      onClose(true); // Close modal and signal refresh
    },
    onError: (error) => {
      toast.error(
        getBackendErrorMessage(error) ||
          (isEditMode ? t("updateError") : t("createError"))
      );
      // Keep modal open on error for user to correct
    },
  });

  // --- Form Submission Handler ---
  const onSubmit = (values: DisciplineFormValues) => {
    // Zod schema validation runs automatically via resolver
    // If validation passes, call the mutation
    console.log("Form values submitted:", values); // Debugging
    mutation.mutate(values);
  };

  // --- Render Logic ---

  // Handle loading state for edit mode initial data fetch
  if (isOpen && isEditMode && isLoadingRecord) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-10 flex justify-center items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin " />
            <span>{tCommon("loading")}...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle error state for edit mode initial data fetch
  if (isOpen && isEditMode && isErrorRecord) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertOctagon /> {tCommon("error")}
            </DialogTitle>
            <DialogDescription className="text-destructive">
              {t("fetchError")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-sm text-destructive-foreground bg-destructive/10 border border-destructive rounded">
            {getBackendErrorMessage(errorRecord) ||
              "An unexpected error occurred."}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => refetchRecord()}>
              {tCommon("retry")}
            </Button>
            <Button variant="outline" onClick={() => onClose()}>
              {tCommon("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render the main modal content if not loading/erroring on edit fetch
  if (!isOpen) return null;

  return (
    // Control dialog open state, onClose is called when clicking outside or X
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editTitle") : t("addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? t("editDescription") : t("addDescription")}
          </DialogDescription>
        </DialogHeader>

        {/* Wrap form content in Form provider */}
        <Form {...form}>
          {/* Use a HTML form element for submission */}
          <form
            id="discipline-record-form" // Add ID for associating footer button
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 overflow-y-auto px-1 py-2 flex-grow custom-scrollbar" // Allow scrolling
          >
            {/* --- Student Selection Field --- */}
            <FormField
              control={form.control}
              name="student"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("studentLabel")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover
                    open={isStudentPopoverOpen}
                    onOpenChange={setIsStudentPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isStudentPopoverOpen}
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground" // Style if no value
                          )}
                        >
                          {/* Display selected student info or placeholder */}
                          {field.value && selectedStudentDisplay
                            ? `${selectedStudentDisplay.name}${
                                selectedStudentDisplay.matricule
                                  ? ` (${selectedStudentDisplay.matricule})`
                                  : ""
                              }`
                            : t("selectStudentPlaceholder")}
                          {isLoadingPrefilledStudent &&
                            !selectedStudentDisplay && (
                              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                            )}
                          <UserSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command shouldFilter={false}>
                        {" "}
                        {/* We control filtering via API */}
                        <CommandInput
                          placeholder={t("searchStudentPlaceholder")}
                          value={studentSearchTerm}
                          onValueChange={setStudentSearchTerm} // Update search term state
                          disabled={isLoadingStudents}
                        />
                        {/* Wrap results in CommandList for scrolling */}
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingStudents
                              ? tCommon("loading")
                              : debouncedStudentSearchTerm.length < 2
                                ? t("typeToSearch")
                                : t("noStudentFound")}
                          </CommandEmpty>
                          <CommandGroup
                            heading={
                              studentOptions && studentOptions.length > 0
                                ? t("suggestions")
                                : undefined
                            }
                          >
                            {isLoadingStudents &&
                              debouncedStudentSearchTerm.length >= 2 && (
                                <CommandItem
                                  disabled
                                  className="flex items-center justify-center py-4"
                                >
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                                  {tCommon("loading")}...
                                </CommandItem>
                              )}
                            {/* Map over student options fetched from API */}
                            {studentOptions?.map((student) => (
                              <CommandItem
                                // Value used for internal Command filtering (if enabled), but we rely on onSelect
                                value={`${student.full_name || ""} ${
                                  student.matricule || ""
                                }`}
                                key={student.id}
                                onSelect={() => {
                                  // Update form value with the selected student's ID (as string)
                                  form.setValue("student", String(student.id), {
                                    shouldValidate: true, // Trigger validation
                                    shouldDirty: true, // Mark field as dirty
                                  });
                                  // Update display state
                                  setSelectedStudentDisplay({
                                    name: `${student.full_name || ""}`.trim(),
                                    matricule: student.matricule || null,
                                  });
                                  setStudentSearchTerm(""); // Clear search input
                                  setIsStudentPopoverOpen(false); // Close the popover
                                }}
                              >
                                {/* Display student name and matricule */}
                                {`${student.full_name || ""}`.trim()}
                                {student.matricule && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({student.matricule})
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage /> {/* Display validation errors */}
                </FormItem>
              )}
            />

            {/* --- Record Type Selection Field --- */}
            <FormField
              control={form.control}
              name="record_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("recordTypeLabel")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value); // Update form value
                      const selectedType = recordTypes?.find(
                        (rt) => String(rt.id) === value
                      );
                      if (selectedType?.default_severity) {
                        form.setValue(
                          "severity",
                          selectedType.default_severity,
                          { shouldValidate: true }
                        );
                      }
                    }}
                    value={String(field.value || "")}
                    disabled={
                      isLoadingTypes || !recordTypes || recordTypes.length === 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingTypes ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                            {tCommon("loading")}...
                          </div>
                        ) : (
                          // This placeholder is shown when field.value is "" or undefined/null
                          <SelectValue
                            placeholder={t("selectTypePlaceholder")}
                          />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* REMOVED THIS LINE: <SelectItem value="" disabled>{t("selectTypePlaceholder")}</SelectItem> */}
                      {/* Map over fetched record types */}
                      {recordTypes?.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name} ({type.category_display})
                        </SelectItem>
                      ))}
                      {/* Message if no types are available */}
                      {(!recordTypes || recordTypes.length === 0) &&
                        !isLoadingTypes && (
                          <SelectItem value="no-types" disabled>
                            {" "}
                            {/* value="no-types" is okay as it's disabled */}
                            {isErrorTypes
                              ? tCommon("error")
                              : t("noTypesAvailable")}
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- Date and Time Fields --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Occurred */}
              <FormField
                control={form.control}
                name="date_occurred"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      {t("dateOccurredLabel")}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <CustomCalendar
                        value={field.value}
                        onChange={(date) => {
                          field.onChange(date);
                          form.trigger("date_occurred"); // Trigger validation
                        }}
                        disableFutureDates={true}
                        minDate={new Date("2000-01-01")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Time Occurred */}
              <FormField
                control={form.control}
                name="time_occurred"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("timeOccurredLabel")}{" "}
                      <span className="text-muted-foreground">
                        {tCommon("optional")}
                      </span>
                    </FormLabel>
                    <FormControl>
                      {/* Use input type="time" */}
                      <Input type="time" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />{" "}
                    {/* Show validation errors if time format is wrong */}
                  </FormItem>
                )}
              />
            </div>

            {/* --- Severity Selection Field --- */}
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("severityLabel")}{" "}
                    <span className="text-muted-foreground">
                      {tCommon("optional")}
                    </span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""} // Controlled value, handles "" state
                  >
                    <FormControl>
                      <SelectTrigger>
                        {/* This placeholder is shown when field.value is "" */}
                        <SelectValue
                          placeholder={t("selectSeverityPlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Filter out the option with empty value before mapping */}
                      {SEVERITY_OPTIONS.filter(
                        (option) => option.value !== ""
                      ).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {/* Display translated severity label */}
                          {tSeverity(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- Description Textarea --- */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("descriptionLabel")}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descriptionPlaceholder")}
                      className="resize-y min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("descriptionHelpText")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- Action Taken Textarea --- */}
            <FormField
              control={form.control}
              name="action_taken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("actionTakenLabel")}{" "}
                    <span className="text-muted-foreground">
                      {tCommon("optional")}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("actionTakenPlaceholder")}
                      className="resize-y min-h-[60px]"
                      {...field}
                      value={field.value ?? ""} // Handle null value
                    />
                  </FormControl>
                  <FormDescription>{t("actionTakenHelpText")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {/* --- Modal Footer with Actions --- */}
        <DialogFooter className="mt-4 pt-4 border-t">
          <DialogClose asChild>
            {/* Close button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={mutation.isLoading}
            >
              {tCommon("cancel")}
            </Button>
          </DialogClose>
          {/* Submit button (linked to form via ID) */}
          <Button
            type="submit"
            form="discipline-record-form" // Associate with the form
            disabled={mutation.isLoading || !form.formState.isDirty} // Disable if submitting or form unchanged
          >
            {mutation.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditMode ? tCommon("saveChanges") : t("addButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisciplineRecordModal;
