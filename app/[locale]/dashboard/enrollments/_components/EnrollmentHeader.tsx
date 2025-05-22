// components/EnrollmentHeader.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

function EnrollmentHeader({
  academicYears = [],
  selectedAcademicYear,
  onYearChange,
  onNewStudentClick,
  isLoading,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Enrollment Management
      </h1>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-10 w-full sm:w-[250px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select
            value={selectedAcademicYear ? String(selectedAcademicYear) : "none"}
            onValueChange={(value) =>
              onYearChange(value === "none" ? null : value)
            }
            disabled={academicYears.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select an Academic Year</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={String(year.id)}>
                  {year.name} {year.is_active ? "(Active)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button onClick={onNewStudentClick} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> New Student
        </Button>
      </div>
    </div>
  );
}

export default EnrollmentHeader;
