import React, { useRef, useState } from "react";
import { Download, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface CsvImportExportProps {
  studentScores: Array<{
    student_subject_id: number;
    student_id: number;
    student_name: string;
    score: number | null;
    is_absent: boolean;
    error?: string;
  }>;
  onImport: (
    importedScores: Array<{
      studentId: number;
      score: number | null;
      isAbsent: boolean | string;
    }>
  ) => void;
  fileName: string;
}

const CsvImportExport: React.FC<CsvImportExportProps> = ({
  studentScores,
  onImport,
  fileName,
}) => {
  const t = useTranslations("Results");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const exportToCsv = () => {
    // Headers with instructions
    const headerRow = [
      "Serial",
      "Student ID",
      "Student Name",
      "Score (0-20)",
      "Absent (Yes/No)",
    ];

    // Include instructions row
    const instructionsRow = [
      "Do not modify",
      "Do not modify",
      "Do not modify",
      "Enter score between 0-20",
      "Enter Yes or No",
    ];

    const csvRows = [
      headerRow.join(","),
      instructionsRow.join(","),
      ...studentScores.map((student, index) =>
        [
          index + 1,
          student.student_id,
          `"${student.student_name.replace(/"/g, '""')}"`,
          student.is_absent ? "" : student.score === null ? "" : student.score,
          student.is_absent ? "Yes" : "No",
        ].join(",")
      ),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split("\n").filter((row) => row.trim());

        // Ensure we have at least a header row and one data row
        if (rows.length < 3) {
          // At least header, instructions, and one data row
          const error = t("invalidCsvFormat");
          setImportError(error);
          toast.error(t("importError"), { description: error });
          return;
        }

        // Parse the header row to find column indices
        const headerRow = parseCSVRow(rows[0]);

        // Always skip the header and instructions rows (first two rows)
        const dataStartRow = 2;

        // Find the indices of required columns
        const scoreIndex = findColumnIndex(headerRow, ["score"]);
        const absentIndex = findColumnIndex(headerRow, ["absent"]);
        const studentIdIndex = findColumnIndex(headerRow, [
          "student id",
          "studentid",
          "id",
        ]);

        if (scoreIndex === -1 || studentIdIndex === -1) {
          const error = t("missingRequiredColumns");
          setImportError(error);
          toast.error(t("importError"), { description: error });
          return;
        }

        // Validate and parse the data rows
        const importedScores = [];
        const errors = [];

        for (let i = dataStartRow; i < rows.length; i++) {
          if (!rows[i].trim()) continue;

          const fields = parseCSVRow(rows[i]);

          if (
            fields.length <= Math.max(studentIdIndex, scoreIndex, absentIndex)
          ) {
            errors.push(`Row ${i + 1}: ${t("invalidRowFormat")}`);
            continue;
          }

          const studentIdRaw = fields[studentIdIndex].trim();
          const studentId = parseInt(studentIdRaw);

          if (isNaN(studentId)) {
            errors.push(
              `Row ${i + 1}: ${t("invalidStudentId", { id: studentIdRaw })}`
            );
            continue;
          }

          const scoreRaw = fields[scoreIndex].trim();
          let score: number | null = null;

          if (scoreRaw !== "") {
            score = parseFloat(scoreRaw);
            if (isNaN(score)) {
              errors.push(
                `Row ${i + 1}: ${t("invalidScoreFormat", { score: scoreRaw })}`
              );
              continue;
            }

            // Validate score range (0-20)
            if (score < 0 || score > 20) {
              errors.push(
                `Row ${i + 1}: ${t("scoreOutOfRange", {
                  min: 0,
                  max: 20,
                  score: score,
                })}`
              );
              continue;
            }
          }

          // Parse absence status
          let isAbsent = false;
          if (absentIndex !== -1 && fields[absentIndex]) {
            const absentValue = fields[absentIndex].trim().toLowerCase();
            isAbsent =
              absentValue === "yes" ||
              absentValue === "y" ||
              absentValue === "true";
          }

          // If score is empty and not marked as absent, check logic
          if (score === null && !isAbsent) {
            // Either automatically mark as absent or add a warning
            // For now, we'll keep it as is and let validation handle it
          }

          importedScores.push({
            studentId,
            score: isAbsent ? null : score,
            isAbsent,
          });
        }

        // Show errors if any
        if (errors.length > 0) {
          const errorMessage =
            errors.slice(0, 3).join("\n") +
            (errors.length > 3
              ? `\n${t("andMoreErrors", { count: errors.length - 3 })}`
              : "");
          setImportError(errorMessage);
          toast.error(t("importError"), {
            description: t("multipleErrors", { count: errors.length }),
          });
          return;
        }

        if (importedScores.length === 0) {
          setImportError(t("noValidDataFound"));
          toast.error(t("importError"), { description: t("noValidDataFound") });
          return;
        }

        onImport(importedScores);
        toast.success(t("importSuccess"), {
          description: t("scoresImported", { count: importedScores.length }),
        });
      } catch (error) {
        console.error("Error parsing CSV:", error);
        setImportError(t("invalidCsvFormat"));
        toast.error(t("importError"), { description: t("invalidCsvFormat") });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Helper function to parse CSV row properly handling quoted fields
  const parseCSVRow = (row: string): string[] => {
    const fields: string[] = [];
    let fieldValue = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
          // Handle escaped quotes (two double quotes in a row)
          fieldValue += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        fields.push(fieldValue);
        fieldValue = "";
      } else {
        fieldValue += char;
      }
    }

    // Add the last field
    fields.push(fieldValue);
    return fields;
  };

  // Helper function to find column index by possible names
  const findColumnIndex = (
    headers: string[],
    possibleNames: string[]
  ): number => {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      if (possibleNames.some((name) => header.includes(name.toLowerCase()))) {
        return i;
      }
    }
    return -1;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={exportToCsv}
          className="flex items-center"
        >
          <Download className="mr-2 h-4 w-4" /> {t("exportAsCsv")}
        </Button>
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={importFromCsv}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center"
          >
            <Upload className="mr-2 h-4 w-4" /> {t("importFromCsv")}
          </Button>
        </div>
      </div>

      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">
            {importError}
          </AlertDescription>
        </Alert>
      )}

      <Alert variant="outline" className="bg-muted/50">
        <AlertDescription>
          <p className="font-medium">{t("csvImportGuidelines")}</p>
          <ul className="list-disc ml-5 mt-2 text-sm">
            <li>{t("studentIdMustMatch")}</li>
            <li>{t("scoresMustBeBetween", { min: 0, max: 20 })}</li>
            <li>{t("markAbsentStudents")}</li>
            <li>{t("doNotChangeStudentIds")}</li>
            <li>{t("firstTwoRowsInstructions")}</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CsvImportExport;
