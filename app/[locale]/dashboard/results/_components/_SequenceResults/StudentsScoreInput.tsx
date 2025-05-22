import React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";

interface StudentScoresInputProps {
  studentScores: Array<{
    student_subject_id: number;
    student_id: number;
    student_name: string;
    score: number | null;
    is_absent: boolean;
    error?: string;
  }>;
  baseScore: number;
  onScoreChange: (studentSubjectId: number, value: string) => void;
  onAbsenceToggle: (studentSubjectId: number, isAbsent: boolean) => void;
}

const StudentScoresInput: React.FC<StudentScoresInputProps> = ({
  studentScores,
  baseScore,
  onScoreChange,
  onAbsenceToggle,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="rounded-md border shadow-sm">
      <div className="grid grid-cols-12 p-3 bg-primary/10 font-medium text-sm sticky top-0 z-10">
        <div className="col-span-1 flex items-center">#</div>
        <div className="col-span-5 flex items-center">{t("student")}</div>
        <div className="col-span-2 flex items-center">{t("studentId")}</div>
        <div className="col-span-2 flex items-center">
          {t("score")} / {baseScore}
        </div>
        <div className="col-span-2 flex items-center justify-center">
          {t("absent")}
        </div>
      </div>
      <Separator />
      <div className="max-h-[400px] overflow-y-auto">
        {studentScores.map((student, index) => (
          <div
            key={student.student_subject_id}
            className={`grid grid-cols-12 p-3 items-center border-b hover:bg-gray-50 transition-colors ${
              student.error ? "bg-red-50" : ""
            }`}
          >
            <div className="col-span-1 text-gray-500">{index + 1}</div>
            <div className="col-span-5 font-medium">{student.student_name}</div>
            <div className="col-span-2 text-gray-500">{student.student_id}</div>
            <div className="col-span-2">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={student.score === null ? "" : student.score}
                  onChange={(e) =>
                    onScoreChange(student.student_subject_id, e.target.value)
                  }
                  disabled={student.is_absent}
                  className={`w-20 ${
                    student.error ? "border-red-500 pr-8" : ""
                  }`}
                />
                {student.error && (
                  <div
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-red-500"
                    title={student.error}
                  >
                    <AlertCircle className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-center">
              <Switch
                checked={student.is_absent}
                onCheckedChange={(checked) =>
                  onAbsenceToggle(student.student_subject_id, checked)
                }
              />
            </div>
            {student.error && (
              <div className="col-span-12 text-xs text-red-500 mt-1 pl-1">
                {student.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentScoresInput;
