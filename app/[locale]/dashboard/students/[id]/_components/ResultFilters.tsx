"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Calendar, CalendarDays, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  fetchAcademicYears,
  fetchTerms,
  fetchSequences,
} from "@/queries/results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcademicYear } from "@/types/transfers";

interface ResultFiltersProps {
  initialAcademicYearId?: string | null;
  initialTermId?: string | null;
  initialSequenceId?: string | null;
  onFilterChange: (filters: {
    academicYearId: string | null;
    termId: string | null;
    sequenceId: string | null;
  }) => void;
  // Optional: Pass studentId if filters should be limited by student's history
  // studentId: string | number;
}

const ResultFilters: React.FC<ResultFiltersProps> = ({
  initialAcademicYearId,
  initialTermId,
  initialSequenceId,
  onFilterChange,
}) => {
  const t = useTranslations("Results.Filters");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<
    string | null
  >(initialAcademicYearId ?? null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(
    initialTermId ?? null
  );
  const [selectedSequence, setSelectedSequence] = useState<string | null>(
    initialSequenceId ?? null
  );

  // Fetch Academic Years
  const { data: academicYears, isLoading: isLoadingYears } = useQuery<
    AcademicYear[]
  >({
    queryKey: ["academicYears"],
    queryFn: fetchAcademicYears,
    staleTime: Infinity, // Years change infrequently
  });

  // Fetch Terms based on selected Year
  const { data: terms, isLoading: isLoadingTerms } = useQuery({
    queryKey: ["terms", selectedAcademicYear],
    queryFn: () => fetchTerms(Number(selectedAcademicYear)),
    enabled: !!selectedAcademicYear, // Only run if year is selected
    staleTime: 5 * 60 * 1000, // Cache terms for 5 mins
  });

  // Fetch Sequences based on selected Term
  const { data: sequences, isLoading: isLoadingSequences } = useQuery({
    queryKey: ["sequences", selectedTerm],
    queryFn: () => fetchSequences(Number(selectedTerm)),
    enabled: !!selectedTerm, // Only run if term is selected
    staleTime: 1 * 60 * 1000, // Cache sequences for 1 min
  });

  // Effect to set initial default (e.g., active year) if no initial prop provided
  useEffect(() => {
    if (
      !initialAcademicYearId &&
      !selectedAcademicYear &&
      academicYears?.length
    ) {
      const activeYear =
        academicYears.find((y) => y.is_active) ?? academicYears[0];
      if (activeYear) {
        setSelectedAcademicYear(String(activeYear.id));
      }
    }
  }, [academicYears, initialAcademicYearId, selectedAcademicYear]);

  // Effect to trigger filter change callback when selections update
  useEffect(() => {
    onFilterChange({
      academicYearId: selectedAcademicYear,
      termId: selectedTerm,
      sequenceId: selectedSequence,
    });
  }, [selectedAcademicYear, selectedTerm, selectedSequence, onFilterChange]);

  // Handlers to reset subsequent filters when a higher-level one changes
  const handleYearChange = (value: string) => {
    setSelectedAcademicYear(value);
    setSelectedTerm(null); // Reset term
    setSelectedSequence(null); // Reset sequence
  };

  const handleTermChange = (value: string) => {
    setSelectedTerm(value);
    setSelectedSequence(null); // Reset sequence
  };

  const handleSequenceChange = (value: string) => {
    setSelectedSequence(value);
  };

  // --- Render Helper for Select ---
  const renderSelect = (
    id: string,
    label: string,
    icon: React.ReactNode,
    placeholder: string,
    value: string | null,
    onChange: (value: string) => void,
    options:
      | { id: number | string; name: string; is_active?: boolean }[]
      | undefined,
    isLoading: boolean,
    disabled: boolean = false
  ) => (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-muted-foreground flex items-center"
      >
        {icon}
        {label}
      </label>
      <Select
        value={value ?? ""}
        onValueChange={onChange}
        disabled={isLoading || disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full bg-background border-border h-9 shadow-sm text-sm"
        >
          {isLoading ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              {t("loading")}
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent className="bg-background border-border shadow-lg">
          {!options || options.length === 0 ? (
            <SelectItem
              value="no-options"
              disabled
              className="text-muted-foreground italic"
            >
              {t("noOptions")}
            </SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem key={option.id} value={String(option.id)}>
                <div className="flex items-center justify-between w-full">
                  <span>{option.name}</span>
                  {option.is_active && (
                    <Badge
                      variant="success"
                      className="ml-2 text-xs px-1.5 py-0.5"
                    >
                      {t("current")}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card className="mb-6 shadow-sm border bg-card">
      <CardHeader className="py-3 px-4 border-b bg-muted/40">
        <CardTitle className="text-base font-semibold text-card-foreground">
          {t("selectPeriod")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Academic Year */}
          {renderSelect(
            "academic-year",
            t("academicYear"),
            <Calendar className="h-4 w-4 mr-1.5 text-primary/80" />,
            t("selectYear"),
            selectedAcademicYear,
            handleYearChange,
            academicYears,
            isLoadingYears
          )}

          {/* Term */}
          {renderSelect(
            "term",
            t("term"),
            <CalendarDays className="h-4 w-4 mr-1.5 text-primary/80" />,
            t("selectTerm"),
            selectedTerm,
            handleTermChange,
            terms,
            isLoadingTerms,
            !selectedAcademicYear // Disabled if no year selected
          )}

          {/* Sequence */}
          {renderSelect(
            "sequence",
            t("sequence"),
            <ClipboardList className="h-4 w-4 mr-1.5 text-primary/80" />,
            t("selectSequence"),
            selectedSequence,
            handleSequenceChange,
            sequences,
            isLoadingSequences,
            !selectedTerm // Disabled if no term selected
          )}
        </div>
        {/* Optional: Add a button to explicitly fetch latest */}
        <div className="mt-3 text-right">
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0 text-muted-foreground hover:text-primary"
            onClick={() => {
              // Reset all selects to trigger latest fetch via onFilterChange
              setSelectedAcademicYear(null);
              setSelectedTerm(null);
              setSelectedSequence(null);
            }}
          >
            {t("fetchLatest")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultFilters;
