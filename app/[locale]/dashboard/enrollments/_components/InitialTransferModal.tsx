"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// Ensure correct import paths for types and query functions
import { StudentSimple } from "@/types/students"; // Adjust path

import { searchStudentsForLookup } from "@/queries/students"; // Adjust path
import { searchSchoolsForLookup } from "@/queries/transfers"; // Adjust path
import { AcademicYear } from "@/types/transfers";
import { CommandLoading } from "cmdk";

// Schema Creator - using translations for error messages
const createInitiateSchema = (t: Function) =>
  z.object({
    student_id: z.number({ required_error: t("validation.studentRequired") }),
    to_school_id: z
      .string()
      .min(1, { message: t("validation.toSchoolRequired") }), // Keep as string for Select/Popover value consistency
    effective_academic_year_id: z
      .string()
      .min(1, { message: t("validation.yearRequired") }), // Keep as string
    reason: z.string().min(5, { message: t("validation.reasonRequired") }),
    from_school_notes: z.string().optional(),
  });

// Props interface
interface InitiateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    student_id: number;
    to_school_id: number;
    effective_academic_year_id: number;
    reason: string;
    from_school_notes?: string;
  }) => void; // onSubmit expects parsed data
  isLoading: boolean;
  academicYears: AcademicYear[];
}

function InitiateTransferModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  academicYears = [],
}: InitiateTransferModalProps) {
  const t = useTranslations("TransfersTab.modals.initiate");
  const tc = useTranslations("Common"); // Common translations
  const initiateSchema = useMemo(() => createInitiateSchema(t), [t]);

  const form = useForm<z.infer<typeof initiateSchema>>({
    resolver: zodResolver(initiateSchema),
    defaultValues: {
      student_id: undefined,
      to_school_id: "",
      effective_academic_year_id: "",
      reason: "",
      from_school_notes: "",
    },
  });

  // Student Search State
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<
    StudentSimple[]
  >([]);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [selectedStudentDisplay, setSelectedStudentDisplay] = useState<
    string | null
  >(null);

  // School Search State
  const [schoolSearchOpen, setSchoolSearchOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [schoolSearchResults, setSchoolSearchResults] = useState([]);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [selectedSchoolDisplay, setSelectedSchoolDisplay] = useState<
    string | null
  >(null);

  // --- Student Search Debounce Effect ---
  useEffect(() => {
    if (!studentSearchOpen) return;

    const handler = setTimeout(async () => {
      if (studentSearchQuery.trim().length > 1) {
        // Trim whitespace and check length
        setIsSearchingStudent(true);
        try {
          const results = await searchStudentsForLookup(
            studentSearchQuery.trim()
          );
          setStudentSearchResults(results);
        } catch (error) {
          console.error("Error searching students:", error);
          toast.error(tc("error"), {
            description: t("errors.studentSearchFailed"),
          });
          setStudentSearchResults([]);
        } finally {
          setIsSearchingStudent(false);
        }
      } else {
        setStudentSearchResults([]); // Clear results if query is too short
        setIsSearchingStudent(false);
      }
    }, 500); // Debounce time

    return () => clearTimeout(handler); // Cleanup timer on unmount or query change
  }, [studentSearchQuery, studentSearchOpen, t, tc]);

  // --- School Search Debounce Effect ---
  useEffect(() => {
    if (!schoolSearchOpen) return;

    const handler = setTimeout(async () => {
      // Search immediately or require input? Current: search immediately on open/type
      setIsSearchingSchool(true);
      try {
        const results = await searchSchoolsForLookup(schoolSearchQuery.trim());
        setSchoolSearchResults(results);
      } catch (error) {
        console.error("Error searching schools:", error);
        toast.error(tc("error"), {
          description: t("errors.schoolSearchFailed"),
        });
        setSchoolSearchResults([]);
      } finally {
        setIsSearchingSchool(false);
      }
    }, 500); // Debounce time

    return () => clearTimeout(handler); // Cleanup timer
  }, [schoolSearchQuery, schoolSearchOpen, t, tc]);

  // --- Reset Form and Search States Effect ---
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSelectedStudentDisplay(null);
      setStudentSearchQuery("");
      setStudentSearchResults([]);
      setStudentSearchOpen(false); // Close popover on modal close
      setSelectedSchoolDisplay(null);
      setSchoolSearchQuery("");
      setSchoolSearchResults([]);
      setSchoolSearchOpen(false); // Close popover on modal close
    }
  }, [isOpen, form]);

  // --- Selection Handlers ---
  const handleStudentSelect = (student: StudentSimple) => {
    form.setValue("student_id", student.id, { shouldValidate: true });
    setSelectedStudentDisplay(
      `${student.full_name} (${student.matricule || tc("noId")})`
    );
    setStudentSearchOpen(false);
    setStudentSearchQuery(""); // Clear search input after selection
  };

  const handleSchoolSelect = (school) => {
    form.setValue("to_school_id", String(school.id), { shouldValidate: true }); // Set as string
    setSelectedSchoolDisplay(
      `${school.name} (${school.city || tc("notAvailableShort")})`
    );
    setSchoolSearchOpen(false);
    setSchoolSearchQuery(""); // Clear search input
  };

  // --- Form Submission Handler ---
  const handleFormSubmit = (values: z.infer<typeof initiateSchema>) => {
    // Parse string IDs to numbers before submitting
    onSubmit({
      student_id: values.student_id, // Already number from schema
      to_school_id: parseInt(values.to_school_id, 10),
      effective_academic_year_id: parseInt(
        values.effective_academic_year_id,
        10
      ),
      reason: values.reason,
      from_school_notes: values.from_school_notes || undefined, // Send undefined if empty
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="pr-6">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {/* Scrollable Form Area */}
        <div className="flex-grow overflow-y-auto pr-2 pl-1 py-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              {/* Student Search Field */}
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("labels.student")} *</FormLabel>
                    <Popover
                      open={studentSearchOpen}
                      onOpenChange={setStudentSearchOpen}
                      modal={true}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={studentSearchOpen}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedStudentDisplay ??
                              t("placeholders.studentSelect")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                        <Command
                          shouldFilter={false} // We handle filtering via API
                        >
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <CommandInput
                              placeholder={t("placeholders.studentSearch")}
                              value={studentSearchQuery}
                              onValueChange={setStudentSearchQuery}
                              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                            />
                          </div>
                          <CommandList>
                            {isSearchingStudent && (
                              <CommandLoading>
                                <Loader2 className="h-4 w-4 animate-spin mx-auto my-2" />
                              </CommandLoading>
                            )}
                            {!isSearchingStudent &&
                              studentSearchResults.length === 0 &&
                              studentSearchQuery.trim().length > 1 && (
                                <CommandEmpty>
                                  {t("placeholders.studentNotFound")}
                                </CommandEmpty>
                              )}
                            {!isSearchingStudent &&
                              studentSearchResults.length === 0 &&
                              studentSearchQuery.trim().length <= 1 && (
                                <CommandEmpty>
                                  {t("placeholders.typeToSearchStudent")}
                                </CommandEmpty>
                              )}
                            {!isSearchingStudent &&
                              studentSearchResults.map((student) => (
                                <CommandItem
                                  key={student.id}
                                  value={`${student.full_name} ${
                                    student.matricule || ""
                                  }`} // Value for potential filtering/search within Command
                                  onSelect={() => handleStudentSelect(student)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === student.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    {student.full_name}
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({student.matricule || tc("noId")})
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target School Search Field */}
              <FormField
                control={form.control}
                name="to_school_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("labels.toSchool")} *</FormLabel>
                    <Popover
                      open={schoolSearchOpen}
                      onOpenChange={setSchoolSearchOpen}
                      modal={true}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={schoolSearchOpen}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedSchoolDisplay ??
                              t("placeholders.toSchoolSelect")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                        <Command shouldFilter={false}>
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <CommandInput
                              placeholder={t("placeholders.schoolSearch")}
                              value={schoolSearchQuery}
                              onValueChange={setSchoolSearchQuery}
                              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                            />
                          </div>
                          <CommandList>
                            {isSearchingSchool && (
                              <CommandLoading>
                                <Loader2 className="h-4 w-4 animate-spin mx-auto my-2" />
                              </CommandLoading>
                            )}
                            {!isSearchingSchool &&
                              schoolSearchResults.length === 0 &&
                              schoolSearchQuery.trim() && (
                                <CommandEmpty>
                                  {t("placeholders.schoolNotFound")}
                                </CommandEmpty>
                              )}
                            {!isSearchingSchool &&
                              schoolSearchResults.length === 0 &&
                              !schoolSearchQuery.trim() && (
                                <CommandEmpty>
                                  {t("placeholders.typeToSearchSchool")}
                                </CommandEmpty>
                              )}
                            {!isSearchingSchool &&
                              schoolSearchResults.map((school) => (
                                <CommandItem
                                  key={school.id}
                                  value={school.name}
                                  onSelect={() => handleSchoolSelect(school)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === String(school.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {school.name}{" "}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({school.city || tc("notAvailableShort")})
                                  </span>
                                </CommandItem>
                              ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Effective Year */}
              <FormField
                control={form.control}
                name="effective_academic_year_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.effectiveYear")} *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("placeholders.yearSelect")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.length === 0 && (
                          <SelectItem value="loading" disabled>
                            {tc("loading")}
                          </SelectItem>
                        )}
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={String(year.id)}>
                            {year.name}{" "}
                            {year.is_active ? `(${tc("active")})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.reason")} *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("placeholders.reason")}
                        {...field}
                        rows={4}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optional Notes */}
              <FormField
                control={form.control}
                name="from_school_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("labels.notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("placeholders.notes")}
                        {...field}
                        rows={2}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Submit button is outside the scrollable div in the footer */}
            </form>
          </Form>
        </div>

        {/* Footer sticks to bottom */}
        <DialogFooter className="border-t mt-auto pt-4">
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={isLoading}>
              {tc("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="submit" // This button needs to trigger the form submission
            onClick={form.handleSubmit(handleFormSubmit)} // Trigger form submit manually
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submitButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InitiateTransferModal;
