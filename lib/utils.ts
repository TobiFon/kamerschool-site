import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { format as formatDateFns, parseISO, isValid, parse } from "date-fns"; // Import necessary date-fns functions
import { enUS, fr } from "date-fns/locale"; // Import locales if needed for formatting

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const adaptApiData = (apiData, timeScope) => {
  if (!apiData) return null;

  // Determine period information based on time scope
  let periodInfo;
  switch (timeScope) {
    case "sequence":
      periodInfo = apiData.sequence_info || { name: "Current Sequence" };
      break;
    case "term":
      periodInfo = apiData.term_info || { name: "Current Term" };
      break;
    case "year":
      periodInfo = apiData.year_info || { name: "Current Year" };
      break;
    default:
      periodInfo = { name: "Current Period" };
  }

  // Handle trend analysis for different scopes
  let trends = [];
  if (timeScope === "sequence" && apiData.trend_analysis) {
    // For sequence, trend_analysis is an object comparing current to previous sequence
    trends = [
      {
        period_name: apiData.trend_analysis.previous_sequence || "Previous",
        average: apiData.trend_analysis.previous_average || 0,
      },
      {
        period_name: "Current",
        average: apiData.trend_analysis.current_average || 0,
      },
    ];
  } else if (apiData.trend_analysis && Array.isArray(apiData.trend_analysis)) {
    // For term or year, assume trend_analysis is an array of periods
    trends = apiData.trend_analysis.map((item) => ({
      period_name: item.period_name || "Period",
      average: item.avg_score || 0,
      pass_rate: item.pass_rate ? item.pass_rate / 100 : undefined,
    }));
  }

  return {
    school_name: apiData.school_info?.name || "School Report",
    period_name: periodInfo.name,
    average: apiData.overall_performance?.average || 0,
    pass_rate: apiData.overall_performance?.pass_rate / 100 || 0,
    attendance_rate: 0.95, // Placeholder; consider removing if not provided by backend
    total_students: apiData.overall_performance?.total_students || 0,
    total_classes: apiData.class_performance?.length || 0,
    top_score: apiData.overall_performance?.highest_average || 0,
    lowest_average: apiData.overall_performance?.lowest_average || 0, // Added missing field
    grade_distribution: {
      Excellent: apiData.grade_distribution?.excellent || 0,
      Good: apiData.grade_distribution?.good || 0,
      Average: apiData.grade_distribution?.average || 0,
      BelowAverage: apiData.grade_distribution?.below_average || 0,
    },
    trends,
    subject_summary:
      apiData.subject_performance?.map((subject) => ({
        subject_name: subject.subject_name,
        average: subject.avg_score,
        pass_rate: subject.pass_rate / 100,
        std_dev: subject.std_dev, // Added missing field
      })) || [],
    class_summary:
      apiData.class_performance?.map((cls) => ({
        class_name: cls.class_name,
        average: cls.avg_score,
        pass_rate: cls.pass_rate / 100,
        student_count: cls.student_count, // Added missing field
        std_dev: cls.std_dev, // Added missing field
        is_top_class: apiData.top_classes?.some(
          (top) => top.class_id === cls.class_id
        ),
      })) || [],
    top_students: apiData.top_students || [],
    top_classes: apiData.top_classes || [],
    areas_for_improvement: [
      ...(apiData.actionable_insights?.underperforming_classes
        ?.slice(0, 3)
        .map(
          (cls) =>
            `${cls.class_name} has a pass rate of ${cls.pass_rate.toFixed(1)}%`
        ) || []),
      ...(apiData.actionable_insights?.underperforming_subjects
        ?.slice(0, 3)
        .map(
          (subj) =>
            `${subj.subject_name} has a pass rate of ${subj.pass_rate.toFixed(
              1
            )}%`
        ) || []),
    ],
    strengths: [
      `Top subject: ${
        apiData.subject_performance?.[0]?.subject_name || "N/A"
      } (Avg: ${apiData.subject_performance?.[0]?.avg_score.toFixed(1) || 0})`,
      `Top class: ${apiData.top_classes?.[0]?.class_name || "N/A"} (Avg: ${
        apiData.top_classes?.[0]?.avg_score.toFixed(1) || 0
      })`,
    ],
    std_deviation: apiData.statistical_distribution?.std_dev || 0,
    percentile_25: apiData.statistical_distribution?.percentile_25 || 0,
    percentile_50: apiData.statistical_distribution?.percentile_50 || 0,
    percentile_75: apiData.statistical_distribution?.percentile_75 || 0,
    interquartile_range:
      apiData.statistical_distribution?.interquartile_range || 0,
    outstanding_classes: apiData.actionable_insights?.outstanding_classes || [],
    concerning_classes: apiData.actionable_insights?.concerning_classes || [],
    intervention_needed:
      apiData.actionable_insights?.intervention_needed || false,
    // Newly added fields from backend
    demographic_breakdown: apiData.demographic_breakdown || {
      sex: [],
      age_groups: [],
    },
    trend_analysis: apiData.trend_analysis,
    teacher_effectiveness: apiData.teacher_effectiveness || [],
    at_risk_students: apiData.predictive_analytics?.at_risk_students || [],
  };
};

export const getTrend = (data, metricName) => {
  if (!data.trends || data.trends.length < 2) return undefined;
  const currentValue = parseFloat(data[metricName]) || 0;
  const previousValue =
    parseFloat(data.trends[data.trends.length - 2][metricName]) || 0;
  if (previousValue === 0) return undefined;
  const trendPercentage =
    ((currentValue - previousValue) / previousValue) * 100;
  return parseFloat(trendPercentage.toFixed(1));
};

export const formatPercentage = (value) => {
  const parsedValue = parseFloat(value);
  return isNaN(parsedValue) ? "0" : parsedValue.toFixed(1);
};

export const formatCount = (value) => {
  const parsedValue = parseInt(value);
  return isNaN(parsedValue) ? "0" : parsedValue.toLocaleString();
};
// Type definitions for better type safety
interface ExportDataItem {
  [key: string]: string | number;
}

export const exportToCSV = (data: ExportDataItem[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          // Handle values with commas by enclosing in quotes
          const value = row[header]?.toString() || "";
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

interface SchoolData {
  name?: string;
  active_academic_year?: string;
  email?: string;
  city?: string;
  logo?: string;
}

export const exportToPDF = (
  data: ExportDataItem[],
  filename: string,
  classTitle: string,
  schoolData: SchoolData = {},
  t
) => {
  if (!data.length) return;

  // Create a new PDF document - keeping landscape as in original
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Define colors like in the second function
  const COLORS = {
    primary: [60, 90, 150], // Main color for headers
    lightGray: [248, 249, 250], // For alternate rows
  };

  const margin = {
    left: 15,
    right: 15,
    top: 12,
    bottom: 15,
  };

  let yPosition = margin.top;

  // Default values if school data is missing - using translation like second function
  const schoolName = schoolData.name || t("schoolName");
  const academicYear =
    schoolData.active_academic_year || t("currentAcademicYear");
  const schoolEmail = schoolData.email || "";
  const schoolCity = schoolData.city || "";

  // School name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 7;

  // Academic year
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    t("academicYearLabel", { academicYear }),
    doc.internal.pageSize.getWidth() / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 4;

  // Contact information (if available)
  if (schoolEmail || schoolCity) {
    const contactInfo = [schoolCity, schoolEmail].filter(Boolean).join(" • ");
    doc.setFontSize(8);
    doc.text(contactInfo, doc.internal.pageSize.getWidth() / 2, yPosition, {
      align: "center",
    });
    yPosition += 8;
  } else {
    yPosition += 4;
  }

  // Add class title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(classTitle, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  // Extend the data with additional columns for scores and attendance
  // Keep this unchanged as specifically requested
  const extendedData = data.map((item) => {
    return {
      ...item,
      "": "",
      " ": "",
      "  ": "",
      "   ": "",
      "    ": "",
      "     ": "",
      "      ": "",
    };
  });

  // Format the data for autotable
  const headers = Object.keys(extendedData[0]);
  const rows = extendedData.map((item) =>
    headers.map((header) => item[header])
  );

  // Generate the table with styling similar to the second function
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: yPosition,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: margin.left, right: margin.right },
    columnStyles: {
      // Make specific columns narrower or wider - keeping as in original
      SN: { cellWidth: 10 },
      "Student ID": { cellWidth: 20 },
      Gender: { cellWidth: 15 },
      Age: { cellWidth: 10 },
      "Term 1": { cellWidth: 15 },
      "Term 2": { cellWidth: 15 },
      "Term 3": { cellWidth: 15 },
      Attendance: { cellWidth: 20 },
      "Final Grade": { cellWidth: 15 },
    },
    didDrawPage: (data) => {
      // Header on each page using new styling
      doc.setFontSize(7);
      doc.text(schoolName, margin.left, doc.internal.pageSize.getHeight() - 8);

      // Page numbers at the bottom like in second function
      doc.text(
        t("page", { page: doc.getNumberOfPages() }),
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );

      // Date generated at bottom right
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      doc.text(
        t("generated", { date: dateStr }),
        doc.internal.pageSize.getWidth() - margin.right,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  // Save the PDF
  doc.save(`${filename}.pdf`);
};

interface ExportDataItem {
  [key: string]: any;
}

interface SchoolData {
  name?: string;
  active_academic_year?: string;
  email?: string;
  city?: string;
}
export const exportAttendanceToPDF = (
  data: ExportDataItem[],
  filename: string,
  title: string,
  schoolData: SchoolData = {}
) => {
  if (!data.length) return;

  // Create a new PDF document - use A4 in landscape for more space
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Define status styles with better colors and reliable indicators
  const STATUS_STYLES = {
    present: { color: [46, 184, 92] }, // Green
    absent: { color: [229, 57, 53] }, // Red
    late: { color: [255, 152, 0] }, // Orange
    excused: { color: [33, 150, 243] }, // Blue
  };

  let yPosition = 15; // Starting position for header

  // Default values if school data is missing
  const schoolName = schoolData.name || "School Name";
  const academicYear =
    schoolData.active_academic_year || "Current Academic Year";
  const schoolEmail = schoolData.email || "";
  const schoolCity = schoolData.city || "";

  // Add small school name in top left corner
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(schoolName, 10, 8);

  // Add class name in top right corner
  doc.text(
    title.split("-")[0].trim(),
    doc.internal.pageSize.getWidth() - 10,
    8,
    {
      align: "right",
    }
  );

  // School name (centered)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 7;

  // Academic year
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Academic Year: ${academicYear}`,
    doc.internal.pageSize.getWidth() / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 4;

  // Contact information (if available)
  if (schoolEmail || schoolCity) {
    const contactInfo = [schoolCity, schoolEmail].filter(Boolean).join(" • ");
    doc.setFontSize(8);
    doc.text(contactInfo, doc.internal.pageSize.getWidth() / 2, yPosition, {
      align: "center",
    });
    yPosition += 6;
  }

  // Add title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  // Add horizontal line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.2);
  doc.line(
    10,
    yPosition - 3,
    doc.internal.pageSize.getWidth() - 10,
    yPosition - 3
  );

  // Add colored legend for attendance status
  yPosition += 4;
  doc.setFontSize(7); // Smaller font size for legend
  doc.setFont("helvetica", "normal");

  // Draw legend - only symbols without background
  let legendX = 15;
  const legendItems = Object.entries(STATUS_STYLES);
  const legendRadius = 2.5; // Smaller size of legend indicator
  const legendSpacing = 30; // Reduced space between legend items

  legendItems.forEach(([status, style], index) => {
    // Draw colored symbol based on status
    doc.setFillColor(...style.color);

    const x = legendX + legendRadius;
    const y = yPosition;

    if (status === "present") {
      // Draw a circle with a checkmark
      doc.circle(x, y, legendRadius, "F");

      // Draw checkmark in white
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(x - 1, y, x - 0.3, y + 1);
      doc.line(x - 0.3, y + 1, x + 1.5, y - 1.5);
    } else if (status === "absent") {
      // Draw a circle with an X
      doc.circle(x, y, legendRadius, "F");

      // Draw X in white
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(x - 1.2, y - 1.2, x + 1.2, y + 1.2);
      doc.line(x + 1.2, y - 1.2, x - 1.2, y + 1.2);
    } else if (status === "late") {
      // Draw a circle with a clock indicator
      doc.circle(x, y, legendRadius, "F");

      // Draw clock hand indicators in white
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(x, y, x, y - 1.5);
      doc.line(x, y, x + 1, y + 0.5);
    } else if (status === "excused") {
      // Draw a rounded square
      doc.roundedRect(
        x - legendRadius,
        y - legendRadius,
        legendRadius * 2,
        legendRadius * 2,
        1,
        1,
        "F"
      );

      // Add a dash in the middle
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(x - 1.2, y, x + 1.2, y);
    }

    // Add text
    doc.setTextColor(0, 0, 0);
    doc.text(
      status.charAt(0).toUpperCase() + status.slice(1),
      x + legendRadius + 3,
      y + 1
    );

    legendX += legendSpacing; // Reduced space between legend items
  });

  doc.setTextColor(0, 0, 0); // Reset text color
  yPosition += 6;

  // Extract all column headers
  const columns = Object.keys(data[0]);

  // Custom cell renderer - will draw empty cells for status cells
  const willDrawCell = (data) => {
    // Process all cells normally
    return true;
  };

  // Custom cell content drawing function
  const didDrawCell = (data) => {
    const cellValue = data.cell.raw;

    // Check if this is a status cell
    if (["present", "absent", "late", "excused"].includes(cellValue)) {
      const style = STATUS_STYLES[cellValue];
      const x = data.cell.x + data.cell.width / 2;
      const y = data.cell.y + data.cell.height / 2;
      const radius = 2.5; // Size of the indicator

      // Clear the cell text by covering it with white rectangle
      doc.setFillColor(255, 255, 255);
      doc.rect(
        data.cell.x,
        data.cell.y,
        data.cell.width,
        data.cell.height,
        "F"
      );

      // Draw status indicator based on status type
      doc.setFillColor(...style.color);

      if (cellValue === "present") {
        // Draw a circle with a checkmark
        doc.circle(x, y, radius, "F");

        // Draw checkmark in white
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(x - 1, y, x - 0.3, y + 1);
        doc.line(x - 0.3, y + 1, x + 1.5, y - 1.5);
      } else if (cellValue === "absent") {
        // Draw a circle with an X
        doc.circle(x, y, radius, "F");

        // Draw X in white
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(x - 1.2, y - 1.2, x + 1.2, y + 1.2);
        doc.line(x + 1.2, y - 1.2, x - 1.2, y + 1.2);
      } else if (cellValue === "late") {
        // Draw a circle with a clock indicator
        doc.circle(x, y, radius, "F");

        // Draw clock hand indicators in white
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(x, y, x, y - 1.5);
        doc.line(x, y, x + 1, y + 0.5);
      } else if (cellValue === "excused") {
        // Draw a different shape for excused - maybe a rounded square
        doc.roundedRect(
          x - radius,
          y - radius,
          radius * 2,
          radius * 2,
          1,
          1,
          "F"
        );

        // Add a dash in the middle
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(x - 1.2, y, x + 1.2, y);
      }

      // Return false to prevent default rendering
      return false;
    }

    // Allow normal text rendering for other cells
    return true;
  };

  // Generate auto table
  autoTable(doc, {
    startY: yPosition,
    head: [columns],
    body: data.map((item) => columns.map((col) => item[col])),
    headStyles: {
      fillColor: [60, 90, 150],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      halign: "center",
      textColor: [0, 0, 0], // Default text color
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 }, // SN
      1: { halign: "left", cellWidth: 40 }, // Name
      2: { halign: "center", cellWidth: 25 }, // Student ID
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 10, right: 10 },
    willDrawCell: willDrawCell,
    didDrawCell: didDrawCell,
    didDrawPage: (data) => {
      // Reset to black text color for footer
      doc.setTextColor(0, 0, 0);

      // Add small school name in top left corner of each page
      doc.setFontSize(8);
      doc.text(schoolName, 10, 8);

      // Add class name in top right corner of each page
      doc.text(
        title.split("-")[0].trim(),
        doc.internal.pageSize.getWidth() - 10,
        8,
        {
          align: "right",
        }
      );

      // Add page number at the bottom
      doc.setFontSize(8);
      doc.text(
        `Page ${doc.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );

      // Add creation date
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      doc.text(
        `Generated on: ${dateStr}`,
        doc.internal.pageSize.getWidth() - 15,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    },
  });

  // Save the PDF
  doc.save(`${filename}.pdf`);
};

// Utility function to create a default avatar SVG using school initials
export const getSchoolInitialsAvatar = (
  schoolName: string = "School Name"
): string => {
  const initials = schoolName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  // Base64 encoded SVG with initials
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#4a86e8" />
    <text x="50" y="50" font-family="Arial" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
export const getInitials = (
  firstName?: string | null,
  lastName?: string | null
): string => {
  const firstInitial = firstName?.charAt(0) || "";
  const lastInitial = lastName?.charAt(0) || "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
};
// lib/utils.ts
export function formatDate(
  dateString: string,
  locale: string = "en-US"
): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error("Invalid date format:", dateString);
    return dateString; // Fallback to original string if formatting fails
  }
}

export function formatRelativeTime(
  dateString: string,
  locale: string = "en-US"
): string {
  const date = new Date(dateString);
  const now = new Date();
  const differenceInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (differenceInSeconds < 60)
    return rtf.format(-differenceInSeconds, "second");
  if (differenceInSeconds < 3600)
    return rtf.format(-Math.floor(differenceInSeconds / 60), "minute");
  if (differenceInSeconds < 86400)
    return rtf.format(-Math.floor(differenceInSeconds / 3600), "hour");
  if (differenceInSeconds < 2592000)
    return rtf.format(-Math.floor(differenceInSeconds / 86400), "day");

  return formatDate(dateString, locale);
}

// Basic currency formatter (adjust locale and currency code as needed)
export function formatCurrency(
  amount: number | string | undefined | null,
  currency = "XAF", // Central African CFA franc
  locale = "fr-CM" // Cameroon French locale for formatting
): string {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    return "N/A"; // Or handle as needed
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0, // Adjust if decimals are needed
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch (error) {
    console.error("Currency formatting error:", error);
    // Fallback for environments without full Intl support or invalid codes
    return `${currency} ${numericAmount.toFixed(0)}`;
  }
}

// Format date for API (YYYY-MM-DD)
export function formatDateISO(date: Date | undefined | null): string | null {
  if (!date) return null;
  try {
    // Ensure correct timezone handling - often safest to use UTC components
    // but depends on backend expectations. Using local date components here.
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("ISO Date formatting error:", error);
    return null;
  }
}

// Add other utils like exportToCSV, exportToPDF from your example if needed
// export function exportToCSV(...) {}
// export function exportToPDF(...) {}

// Helper to parse backend validation errors (example structure)
export function getBackendErrorMessage(error: any): string {
  if (
    typeof error?.response?.data === "object" &&
    error.response.data !== null
  ) {
    // Look for common DRF error structures
    if (error.response.data.detail) {
      return error.response.data.detail;
    }
    // Flatten field errors
    const fieldErrors = Object.values(error.response.data).flat().join(" ");
    if (fieldErrors) {
      return fieldErrors;
    }
  }
  return error?.message || "An unknown error occurred";
}

// --- NEW formatTime function ---
export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return ""; // Return empty string if no time provided

  // Expected backend formats: "HH:MM:SS" or "HH:MM"
  const formatsToTry = ["HH:mm:ss", "HH:mm"];
  let parsedDate: Date | null = null;

  for (const fmt of formatsToTry) {
    // We need a base date to parse time correctly with date-fns parse
    const baseDate = new Date(2000, 0, 1); // Arbitrary date
    parsedDate = parse(
      `${formatDateFns(baseDate, "yyyy-MM-dd")} ${timeString}`,
      `yyyy-MM-dd ${fmt}`,
      new Date()
    );
    if (isValid(parsedDate)) {
      break; // Found a valid format
    }
  }

  if (!parsedDate || !isValid(parsedDate)) {
    console.warn(`Could not parse time string: ${timeString}`);
    return timeString; // Return original string if parsing fails
  }

  // Use locale-aware time format (short version, e.g., "h:mm a" or "HH:mm")
  const browserLocale =
    typeof navigator !== "undefined" ? navigator.language : "en-US";
  const locale = browserLocale.startsWith("fr") ? fr : enUS;

  try {
    return formatDateFns(parsedDate, "p", { locale });
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString; // Fallback to original string
  }
}
// --- END formatTime function ---
