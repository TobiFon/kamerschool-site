import React from "react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassSubject } from "@/types/class";
import { Teacher } from "@/types/teachers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TimetableControlsProps {
  classSubjects: ClassSubject[];
  teachers: Teacher[];
  selectedClassSubjectId: string;
  selectedTeacherId: string;
  selectedNumPeriods: number;
  entryNotes: string;
  onControlsChange: (newState: {
    classSubjectId?: string;
    teacherId?: string;
    numPeriods?: number;
    notes?: string;
  }) => void;
  isLoading: boolean; // True if subjects or teachers are loading
}

const TimetableControls: React.FC<TimetableControlsProps> = ({
  classSubjects,
  teachers,
  selectedClassSubjectId,
  selectedTeacherId,
  selectedNumPeriods,
  entryNotes,
  onControlsChange,
  isLoading,
}) => {
  const t = useTranslations("Timetable.Controls");
  const tCommon = useTranslations("Common");

  const handleSubjectChange = (value: string) => {
    onControlsChange({ classSubjectId: value });
    // Note: The logic to auto-select the default teacher when subject changes
    // is handled in the parent TimetableEditor component's handleControlsChange callback.
  };

  const handleTeacherChange = (value: string) => {
    onControlsChange({ teacherId: value });
  };

  const handleNumPeriodsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    // Allow values between 1 and maybe 6? Adjust max as needed. Default to 1 if invalid.
    const numPeriods = !isNaN(value) && value > 0 && value <= 6 ? value : 1;
    onControlsChange({ numPeriods });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onControlsChange({ notes: e.target.value });
  };

  // Find the default teacher name for the selected subject
  const selectedSubjectData = classSubjects.find(
    (cs) => String(cs.id) === selectedClassSubjectId
  );
  const defaultTeacherName = selectedSubjectData?.teacher_name;

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Class Subject Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="class-subject-select">
            {t("subjectLabel")} <span className="text-destructive">*</span>
          </Label>
          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={selectedClassSubjectId}
              onValueChange={handleSubjectChange}
              disabled={isLoading || classSubjects.length === 0}
              name="class-subject-select"
            >
              <SelectTrigger id="class-subject-select">
                <SelectValue placeholder={t("subjectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {classSubjects.map((cs) => (
                  <SelectItem key={cs.id} value={String(cs.id)}>
                    {cs.subject_name} ({cs.subject_code})
                    {cs.teacher_name && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({t("defaultTeacher")}: {cs.teacher_name})
                      </span>
                    )}
                  </SelectItem>
                ))}
                {classSubjects.length === 0 && !isLoading && (
                  <SelectItem value="no-subjects" disabled>
                    {tCommon("noDataAvailable")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
          {selectedClassSubjectId &&
            defaultTeacherName &&
            selectedTeacherId !== String(selectedSubjectData?.teacher) && (
              <p className="text-xs text-muted-foreground px-1">
                {t("defaultTeacherNote", { name: defaultTeacherName })}
              </p>
            )}
        </div>

        {/* Teacher Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="teacher-select">
            {t("teacherLabel")}{" "}
            <span className="text-muted-foreground text-xs">
              ({tCommon("optional")})
            </span>
          </Label>
          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={selectedTeacherId}
              onValueChange={handleTeacherChange}
              disabled={isLoading || teachers.length === 0}
              name="teacher-select"
            >
              <SelectTrigger id="teacher-select">
                <SelectValue placeholder={t("teacherPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("teacherNone")}</SelectItem>{" "}
                {/* Option for no specific teacher */}
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
                {teachers.length === 0 && !isLoading && (
                  <SelectItem value="no-teachers" disabled>
                    {tCommon("noDataAvailable")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground px-1">
            {t("teacherHelpText")}
          </p>
        </div>

        {/* Number of Periods */}
        <div className="space-y-1.5">
          <Label htmlFor="num-periods-input">{t("numPeriodsLabel")}</Label>
          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Input
              id="num-periods-input"
              type="number"
              min="1"
              max="6" // Adjust max as needed
              step="1"
              value={selectedNumPeriods}
              onChange={handleNumPeriodsChange}
              disabled={isLoading}
            />
          )}
          <p className="text-xs text-muted-foreground px-1">
            {t("numPeriodsHelpText")}
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
          {" "}
          {/* Span across more cols on smaller screens? */}
          <Label htmlFor="entry-notes-textarea">
            {t("notesLabel")}{" "}
            <span className="text-muted-foreground text-xs">
              ({tCommon("optional")})
            </span>
          </Label>
          {isLoading ? (
            <Skeleton className="h-9 w-full" /> // Use h-9 to match input height
          ) : (
            <Textarea
              id="entry-notes-textarea"
              placeholder={t("notesPlaceholder")}
              value={entryNotes}
              onChange={handleNotesChange}
              className="h-9 resize-none" // Match input height, prevent resize
              rows={1} // Single line initially
              disabled={isLoading}
            />
          )}
          {/* No help text needed usually */}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimetableControls;
