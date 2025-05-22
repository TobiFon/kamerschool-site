// src/lib/timetablePDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ClassTimetable,
  TimeSlot,
  TeacherScheduleEntry,
} from "@/types/timetable";
import { Teacher } from "@/types/teachers"; // Assuming Teacher type includes 'name'
import {
  StudentTimetableResponse,
  StudentTimetableSlotEntry, // This is TimetableEntry
} from "@/types/timetable";
import { Student } from "@/types/students";

// Constants for days
const DAYS_OF_WEEK_PDF = [0, 1, 2, 3, 4, 5]; // Monday to Saturday

// Helper to format time
const formatPdfTime = (timeStr: string): string => {
  if (!timeStr || typeof timeStr !== "string") return "";
  return timeStr.substring(0, 5);
};

export interface SchoolDataForPdf {
  name?: string;
}

export interface PdfLabels {
  schoolNamePlaceholder: string;
  academicYearPrefix: string;
  classTimetableForPrefix: string;
  dayHeader: string;
  breakTime: string;
  pagePdf: (current: number, total: number) => string;
  generatedOn: (date: string) => string;
  pdfFileNamePrefix: string;
  days: { [dayIndex: number]: string };
}

export const exportTimetableToPDF = (
  timetableData: ClassTimetable,
  allGridTimeSlots: TimeSlot[],
  schoolData: SchoolDataForPdf,
  labels: PdfLabels
) => {
  if (!timetableData || !allGridTimeSlots || allGridTimeSlots.length === 0) {
    console.error("Missing data for PDF export of timetable.");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [30, 136, 229] as [number, number, number],
    secondary: [96, 125, 139] as [number, number, number],
    lightGrayBg: [245, 247, 250] as [number, number, number],
    darkText: [55, 71, 79] as [number, number, number],
    lightText: [117, 117, 117] as [number, number, number],
    whiteText: [255, 255, 255] as [number, number, number],
    borderColor: [200, 200, 200] as [number, number, number], // Slightly lighter border
    breakCellBg: [236, 239, 241] as [number, number, number],
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = { left: 10, right: 10, top: 12, bottom: 12 }; // Reduced top/bottom margin slightly for more content space
  let yPosition = margin.top;

  // --- HEADER SECTION ---
  doc.setFontSize(18); // School Name - Kept same or slightly smaller if needed for space
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text(
    schoolData.name || labels.schoolNamePlaceholder,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 6; // Slightly less space

  doc.setFontSize(10); // Academic Year - Kept same
  doc.setFont("helvetica", "normal");
  doc.setTextColor(
    COLORS.secondary[0],
    COLORS.secondary[1],
    COLORS.secondary[2]
  );
  const academicYearText = `${labels.academicYearPrefix}${timetableData.academic_year.name}`;
  doc.text(academicYearText, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 6; // Slightly less space

  doc.setFontSize(13); // Class Timetable Title - Slightly smaller to give more space to table
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.darkText[0], COLORS.darkText[1], COLORS.darkText[2]);
  const classTitleText = `${labels.classTimetableForPrefix}${timetableData.school_class.full_name}`;
  doc.text(classTitleText, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 7; // Slightly less space

  doc.setDrawColor(
    COLORS.borderColor[0],
    COLORS.borderColor[1],
    COLORS.borderColor[2]
  );
  doc.setLineWidth(0.2); // Thinner line
  doc.line(margin.left + 5, yPosition, pageWidth - margin.right - 5, yPosition); // Shorter line
  yPosition += 4; // Less space after line

  // --- TABLE ---
  const head = [
    [
      {
        content: labels.dayHeader,
        styles: { halign: "center", valign: "middle" },
      },
      ...allGridTimeSlots.map((ts) => ({
        content: `${ts.name}\n(${formatPdfTime(ts.start_time)}-${formatPdfTime(
          ts.end_time
        )})`,
        styles: { halign: "center", valign: "middle" },
      })),
    ],
  ];

  const body = DAYS_OF_WEEK_PDF.map((dayIndex) => {
    const dayName = labels.days[dayIndex] || `Day ${dayIndex + 1}`;
    const rowContent: any[] = [
      {
        content: dayName,
        styles: { fontStyle: "bold", valign: "middle", halign: "center" },
      },
    ];

    allGridTimeSlots.forEach((timeSlot) => {
      let cellContent: any = {
        content: "",
        styles: { valign: "middle", halign: "center" },
      };
      if (timeSlot.is_break) {
        cellContent.content = labels.breakTime;
        cellContent.styles.fontStyle = "italic";
        cellContent.styles.textColor = COLORS.lightText;
        cellContent.styles.fillColor = COLORS.breakCellBg;
        cellContent.styles.fontSize = 7.5; // Slightly larger break text
      } else {
        const entry = timetableData.entries?.find(
          (e) => e.day_of_week === dayIndex && e.time_slot.id === timeSlot.id
        );

        if (entry && entry.scheduled_subjects.length > 0) {
          cellContent.content = entry.scheduled_subjects
            .map((ss) => {
              let text = ss.class_subject.subject.name;
              const teacherName = ss.effective_teacher_name;
              if (teacherName) {
                // Show full teacher name if space allows, or just initial/last name
                text += `\n(T: ${teacherName})`;
              }
              return text;
            })
            .join("\n—\n"); // Added newline around separator for clarity
          cellContent.styles.fontSize = 7; // Increased font size for content
        }
        if (entry?.notes) {
          // Make notes more prominent or integrate differently if needed
          cellContent.content +=
            (cellContent.content ? "\n\n" : "") + `📝 ${entry.notes}`;
          // cellContent.styles.fontSize below will apply, or set specific for notes.
          // For notes, ensure the main content font size isn't too small.
          // If content fontSize is 7, notes could be 6 or 6.5
          // We will rely on the global cell style for notes if not explicitly set here
        }
      }
      rowContent.push(cellContent);
    });
    return rowContent;
  });

  autoTable(doc, {
    head: head,
    body: body,
    startY: yPosition,
    theme: "grid",
    tableWidth: "auto", // Let the table decide its width based on content and available space
    styles: {
      fontSize: 8, // INCREASED base font size for cells
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 }, // INCREASED cell padding
      lineWidth: 0.15,
      lineColor: COLORS.borderColor,
      textColor: COLORS.darkText,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.whiteText,
      fontStyle: "bold",
      fontSize: 8, // INCREASED head font size
      halign: "center",
      valign: "middle",
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 }, // INCREASED head cell padding
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGrayBg,
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold", fontSize: 8.5 }, // Day column: INCREASED width and font size
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8.5); // INCREASED footer font size
      doc.setTextColor(
        COLORS.lightText[0],
        COLORS.lightText[1],
        COLORS.lightText[2]
      );

      doc.text(
        labels.pagePdf(data.pageNumber, pageCount),
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - margin.bottom / 2, // Position slightly higher
        { align: "center" }
      );

      const genDate = new Date().toLocaleDateString();
      doc.text(
        labels.generatedOn(genDate),
        pageWidth - margin.right,
        doc.internal.pageSize.getHeight() - margin.bottom / 2, // Position slightly higher
        { align: "right" }
      );
    },
    margin: {
      // Keep margins, table will use available space
      top: margin.top,
      right: margin.right,
      bottom: margin.bottom,
      left: margin.left,
    },
    minCellHeight: 12, // INCREASED minimum row height to give content more vertical space
  });

  const fileName =
    `${labels.pdfFileNamePrefix}_${timetableData.school_class.full_name}_${timetableData.academic_year.name}`
      .replace(/[^a-z0-9_]/gi, "_")
      .toLowerCase();
  doc.save(fileName + ".pdf");
};

// Constants for days (ensure these align with your day indexing)
const DAYS_OF_WEEK_PDF_TEACHER = [0, 1, 2, 3, 4, 5]; // Monday to Saturday

// Data expected for the PDF header
export interface SchoolDataForTeacherPdf {
  name?: string;
  // Add other school details if needed (e.g., logo)
}

// Labels needed for the PDF, to be provided by the translation function
export interface TeacherTimetablePdfLabels {
  schoolNamePlaceholder: string;
  academicYearPrefix: string;
  teacherScheduleForPrefix: string;
  dayHeader: string;
  // breakTime: string; // Not typically shown explicitly in teacher's personal schedule columns
  pagePdf: (current: number, total: number) => string;
  generatedOn: (date: string) => string;
  pdfFileNamePrefix: string;
  days: { [dayIndex: number]: string }; // e.g., { 0: "Monday", 1: "Tuesday", ... }
  noActivity: string; // Text for empty slots
}

export const exportTeacherTimetableToPDF = (
  teacher: Teacher, // Pass the full teacher object for their name
  scheduleEntries: TeacherScheduleEntry[],
  allGridTimeSlots: TimeSlot[], // These should be schedulable (non-break) slots
  currentAcademicYearName: string,
  schoolData: SchoolDataForTeacherPdf,
  labels: TeacherTimetablePdfLabels
) => {
  if (
    !teacher ||
    !scheduleEntries ||
    !allGridTimeSlots ||
    allGridTimeSlots.length === 0
  ) {
    console.error("Missing data for PDF export of teacher timetable.");
    // Consider a toast or alert here if called from UI
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [30, 136, 229] as [number, number, number], // Example: Blue
    secondary: [96, 125, 139] as [number, number, number], // Example: Blue Grey
    lightGrayBg: [245, 247, 250] as [number, number, number], // Light background for rows
    darkText: [55, 71, 79] as [number, number, number], // Dark text
    lightText: [117, 117, 117] as [number, number, number], // Lighter text for sub-info
    whiteText: [255, 255, 255] as [number, number, number], // Text on dark backgrounds
    borderColor: [200, 200, 200] as [number, number, number], // Grid border color
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = { left: 10, right: 10, top: 12, bottom: 12 };
  let yPosition = margin.top;

  // --- HEADER SECTION ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text(
    schoolData.name || labels.schoolNamePlaceholder,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(
    COLORS.secondary[0],
    COLORS.secondary[1],
    COLORS.secondary[2]
  );
  const academicYearText = `${labels.academicYearPrefix}${currentAcademicYearName}`;
  doc.text(academicYearText, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 6;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.darkText[0], COLORS.darkText[1], COLORS.darkText[2]);
  const teacherScheduleTitle = `${labels.teacherScheduleForPrefix}${teacher.name}`;
  doc.text(teacherScheduleTitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 7;

  doc.setDrawColor(
    COLORS.borderColor[0],
    COLORS.borderColor[1],
    COLORS.borderColor[2]
  );
  doc.setLineWidth(0.2);
  doc.line(margin.left + 5, yPosition, pageWidth - margin.right - 5, yPosition);
  yPosition += 4;

  // --- TABLE ---
  // Filter out break slots from columns, as teacher's schedule shows teaching periods.
  const schedulableTimeSlotsForGrid = allGridTimeSlots
    .filter((ts) => !ts.is_break)
    .sort(
      (a, b) => a.order - b.order || a.start_time.localeCompare(b.start_time)
    );

  const head = [
    [
      {
        content: labels.dayHeader,
        styles: { halign: "center", valign: "middle" },
      },
      ...schedulableTimeSlotsForGrid.map((ts) => ({
        content: `${ts.name}\n(${formatPdfTime(ts.start_time)}-${formatPdfTime(
          ts.end_time
        )})`,
        styles: { halign: "center", valign: "middle" },
      })),
    ],
  ];

  const body = DAYS_OF_WEEK_PDF_TEACHER.map((dayIndex) => {
    const dayName = labels.days[dayIndex] || `Day ${dayIndex + 1}`;
    const rowContent: any[] = [
      {
        content: dayName,
        styles: { fontStyle: "bold", valign: "middle", halign: "center" },
      },
    ];

    schedulableTimeSlotsForGrid.forEach((timeSlot) => {
      const entriesInThisSlot = scheduleEntries.filter(
        (entry) =>
          entry.day_of_week === dayIndex &&
          // TeacherScheduleEntry uses time_slot_name. Match based on that.
          entry.time_slot_name === timeSlot.name &&
          formatPdfTime(entry.start_time) ===
            formatPdfTime(timeSlot.start_time) &&
          formatPdfTime(entry.end_time) === formatPdfTime(timeSlot.end_time)
      );

      let cellText = "";
      if (entriesInThisSlot.length > 0) {
        cellText = entriesInThisSlot
          .map((se) => `${se.subject_name}\n(${se.school_class_name})`)
          .join("\n—\n"); // Separator for multiple classes/subjects in same slot for teacher
      } else {
        cellText = labels.noActivity; // Or simply ""
      }
      rowContent.push({
        content: cellText,
        styles: {
          valign: "middle",
          halign: "center",
          fontSize: entriesInThisSlot.length > 0 ? 7 : 6, // Smaller font for "-"
          textColor:
            entriesInThisSlot.length > 0 ? COLORS.darkText : COLORS.lightText,
        },
      });
    });
    return rowContent;
  });

  autoTable(doc, {
    head: head,
    body: body,
    startY: yPosition,
    theme: "grid",
    tableWidth: "auto",
    styles: {
      fontSize: 7.5, // Base font size for cells
      cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
      lineWidth: 0.15,
      lineColor: COLORS.borderColor,
      textColor: COLORS.darkText,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.whiteText,
      fontStyle: "bold",
      fontSize: 7.5, // Head font size
      halign: "center",
      valign: "middle",
      cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGrayBg,
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: "bold", fontSize: 8 }, // Day column
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(
        COLORS.lightText[0],
        COLORS.lightText[1],
        COLORS.lightText[2]
      );

      doc.text(
        labels.pagePdf(data.pageNumber, pageCount),
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - margin.bottom / 2,
        { align: "center" }
      );

      const genDate = new Date().toLocaleDateString(); // Consider a more universal date format
      doc.text(
        labels.generatedOn(genDate),
        pageWidth - margin.right,
        doc.internal.pageSize.getHeight() - margin.bottom / 2,
        { align: "right" }
      );
    },
    margin: {
      top: margin.top,
      right: margin.right,
      bottom: margin.bottom,
      left: margin.left,
    },
    minCellHeight: 10,
  });

  const fileName =
    `${labels.pdfFileNamePrefix}_${teacher.name}_${currentAcademicYearName}`
      .replace(/[^a-z0-9_]/gi, "_")
      .toLowerCase();
  doc.save(fileName + ".pdf");
};

// Data expected for the PDF header
export interface SchoolDataForStudentPdf {
  // Consistent with teacher's PDF
  name?: string;
}

// Labels needed for the PDF, to be provided by the translation function
export interface StudentTimetablePdfLabels {
  schoolNamePlaceholder: string;
  academicYearPrefix: string;
  studentScheduleForPrefix: string;
  classLabel: string;
  dayHeader: string;
  noActivity: string; // Text for empty slots
  pagePdf: (current: number, total: number) => string;
  generatedOn: (date: string) => string;
  pdfFileNamePrefix: string;
  days: { [dayIndex: number]: string }; // e.g., { 0: "Monday", 1: "Tuesday", ... }
}

// Constants for days (ensure these align with your day indexing)
const DAYS_OF_WEEK_PDF_STUDENT = [0, 1, 2, 3, 4, 5]; // Monday to Saturday

export const exportStudentTimetableToPDF = (
  studentDetails: Student, // For student's name
  timetableResponse: StudentTimetableResponse, // Contains entries and class_name
  allGridTimeSlots: TimeSlot[], // Schedulable (non-break) slots for columns
  // currentAcademicYearName: string, // Already in timetableResponse.academic_year_name
  schoolData: SchoolDataForStudentPdf,
  labels: StudentTimetablePdfLabels
) => {
  if (
    !studentDetails ||
    !timetableResponse ||
    !allGridTimeSlots ||
    allGridTimeSlots.length === 0
  ) {
    console.error("Missing data for PDF export of student timetable.");
    // Consider a toast or alert here if called from UI
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [22, 163, 74] as [number, number, number], // Example: Green for student
    secondary: [75, 85, 99] as [number, number, number], // Example: Gray
    lightGrayBg: [243, 244, 246] as [number, number, number],
    darkText: [17, 24, 39] as [number, number, number],
    lightText: [107, 114, 128] as [number, number, number],
    whiteText: [255, 255, 255] as [number, number, number],
    borderColor: [209, 213, 219] as [number, number, number],
  };

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = { left: 10, right: 10, top: 12, bottom: 12 };
  let yPosition = margin.top;

  // --- HEADER SECTION ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text(
    schoolData.name || labels.schoolNamePlaceholder,
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(
    COLORS.secondary[0],
    COLORS.secondary[1],
    COLORS.secondary[2]
  );
  const academicYearText = `${labels.academicYearPrefix}${timetableResponse.academic_year_name}`;
  doc.text(academicYearText, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.darkText[0], COLORS.darkText[1], COLORS.darkText[2]);
  const studentScheduleTitle = `${labels.studentScheduleForPrefix}${studentDetails.full_name}`;
  doc.text(studentScheduleTitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;

  if (timetableResponse.class_name) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(
      COLORS.secondary[0],
      COLORS.secondary[1],
      COLORS.secondary[2]
    );
    const classText = `${labels.classLabel}: ${timetableResponse.class_name}`;
    doc.text(classText, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 6;
  }

  doc.setDrawColor(
    COLORS.borderColor[0],
    COLORS.borderColor[1],
    COLORS.borderColor[2]
  );
  doc.setLineWidth(0.2);
  doc.line(margin.left + 5, yPosition, pageWidth - margin.right - 5, yPosition);
  yPosition += 4;

  // --- TABLE ---
  const schedulableTimeSlotsForGrid = allGridTimeSlots // Already filtered and sorted by parent
    .filter((ts) => !ts.is_break); // Ensure only non-breaks are columns

  const head = [
    [
      {
        content: labels.dayHeader,
        styles: { halign: "center", valign: "middle" },
      },
      ...schedulableTimeSlotsForGrid.map((ts) => ({
        content: `${ts.name}\n(${formatPdfTime(ts.start_time)}-${formatPdfTime(
          ts.end_time
        )})`,
        styles: { halign: "center", valign: "middle" },
      })),
    ],
  ];

  const studentScheduleEntries: StudentTimetableSlotEntry[] =
    timetableResponse.entries || [];

  const body = DAYS_OF_WEEK_PDF_STUDENT.map((dayIndex) => {
    const dayName = labels.days[dayIndex] || `Day ${dayIndex + 1}`;
    const rowContent: any[] = [
      {
        content: dayName,
        styles: { fontStyle: "bold", valign: "middle", halign: "center" },
      },
    ];

    schedulableTimeSlotsForGrid.forEach((timeSlot) => {
      const entryForCell = studentScheduleEntries.find(
        (e) => e.day_of_week === dayIndex && e.time_slot.id === timeSlot.id
      );

      let cellText = "";
      let cellStyleUpdate: any = {};

      if (entryForCell && entryForCell.scheduled_subjects.length > 0) {
        // Student's timetable usually shows one subject per slot (the one they are taking)
        // The backend already filters scheduled_subjects for the student.
        cellText = entryForCell.scheduled_subjects
          .map((ss) => {
            let text = ss.class_subject.subject.name;
            const teacherName = ss.effective_teacher_name; // Use effective teacher
            if (teacherName) {
              text += `\n(T: ${teacherName})`;
            }
            return text;
          })
          .join("\n—\n"); // Should typically be one entry, but handle multiple just in case

        if (entryForCell.notes) {
          cellText += (cellText ? "\n\n" : "") + `📝 ${entryForCell.notes}`;
          cellStyleUpdate.fontSize = 6.5; // Slightly smaller if notes are present
        }
      } else {
        cellText = labels.noActivity;
        cellStyleUpdate.textColor = COLORS.lightText;
        cellStyleUpdate.fontSize = 6;
      }
      rowContent.push({
        content: cellText,
        styles: { valign: "middle", halign: "center", ...cellStyleUpdate },
      });
    });
    return rowContent;
  });

  autoTable(doc, {
    head: head,
    body: body,
    startY: yPosition,
    theme: "grid",
    tableWidth: "auto",
    styles: {
      fontSize: 7, // Cell font size
      cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
      lineWidth: 0.15,
      lineColor: COLORS.borderColor,
      textColor: COLORS.darkText,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.whiteText,
      fontStyle: "bold",
      fontSize: 7, // Head font size
      halign: "center",
      valign: "middle",
      cellPadding: { top: 2.5, right: 1.5, bottom: 2.5, left: 1.5 },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGrayBg,
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: "bold", fontSize: 7.5 }, // Day column
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(
        COLORS.lightText[0],
        COLORS.lightText[1],
        COLORS.lightText[2]
      );
      doc.text(
        labels.pagePdf(data.pageNumber, pageCount),
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - margin.bottom / 2,
        { align: "center" }
      );
      const genDate = new Date().toLocaleDateString();
      doc.text(
        labels.generatedOn(genDate),
        pageWidth - margin.right,
        doc.internal.pageSize.getHeight() - margin.bottom / 2,
        { align: "right" }
      );
    },
    margin: {
      top: margin.top,
      right: margin.right,
      bottom: margin.bottom,
      left: margin.left,
    },
    minCellHeight: 10,
  });

  const fileName = `${
    labels.pdfFileNamePrefix
  }_${studentDetails.full_name.replace(
    /\s+/g,
    "_"
  )}_${timetableResponse.academic_year_name.replace(/[\s\/]+/g, "-")}`
    .replace(/[^a-z0-9_]/gi, "_")
    .toLowerCase();
  doc.save(fileName + ".pdf");
};
