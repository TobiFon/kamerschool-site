import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  RowInput,
  CellHookData,
  HookData,
  CellDef,
  ColumnInput,
} from "jspdf-autotable";
import {
  StudentDetailedResultsResponse,
  SubjectResult,
  Student,
  SequenceDetail,
  TermDetail,
} from "@/types/students";
import { School } from "@/types/auth"; // Ensure you have this type defined

// Helper types
type TranslationFunction = (key: string, values?: any) => string;
type ColorTuple = [number, number, number];

// --- Constants ---
const PDF_COLORS = {
  primary: [30, 41, 59] as ColorTuple, // Dark Slate (Used for headers)
  secondary: [71, 85, 105] as ColorTuple, // Medium Slate Gray
  text: [17, 24, 39] as ColorTuple, // Darkest Text Gray (Used for main body text)
  lightText: [100, 116, 139] as ColorTuple, // Lighter Slate Gray
  accent: [37, 99, 235] as ColorTuple, // Blue
  border: [203, 213, 225] as ColorTuple, // Light Gray Border
  lightBorder: [226, 232, 240] as ColorTuple, // Even Lighter Border
  lightBg: [248, 250, 252] as ColorTuple, // Very Light Background (Used for alternate rows)
  white: [255, 255, 255] as ColorTuple,
  absent: [249, 115, 22] as ColorTuple, // Orange-500
  passed: [22, 163, 74] as ColorTuple, // Green-600
  failed: [220, 38, 38] as ColorTuple, // Red-600
};
const FONT_SIZES = {
  hugeTitle: 16,
  largeTitle: 14,
  title: 12,
  subTitle: 10,
  header: 9, // For table headers
  body: 9, // For table body text
  small: 8,
  tiny: 7.5,
  micro: 6.5,
  overallSummaryHeader: 9, // Aligned with general table header
  overallSummaryBody: 9, // Aligned with general table body
};
const MARGINS = { left: 15, right: 15, top: 15, bottom: 15 };
const SECTION_SPACING = 8;
const HEADING_TO_TABLE_SPACING = 3;

// --- Helper Functions ---

/** Calculates the height of text, considering line breaks */
const getTextHeight = (
  doc: jsPDF,
  text: string | string[],
  fontSize: number,
  maxWidth?: number
): number => {
  const lines =
    typeof text === "string" && maxWidth
      ? doc.splitTextToSize(text, maxWidth)
      : Array.isArray(text)
        ? text
        : [text];
  const numLines = lines.length > 0 ? lines.length : 1;
  const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
  return numLines * lineHeight * (fontSize / doc.getFontSize());
};

/** Draws the footer on each page */
const drawFooter = (
  doc: jsPDF,
  pageNumber: number,
  pageCount: number,
  t: TranslationFunction,
  schoolName: string
) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(FONT_SIZES.small);
  doc.setTextColor(...PDF_COLORS.secondary);
  const footerY = pageHeight - MARGINS.bottom / 1.5;

  doc.text(
    `${t("Export.page")} ${pageNumber} / ${pageCount}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  const maxFooterSchoolNameWidth = pageWidth / 2 - MARGINS.left - 10;
  const truncatedSchoolName = doc.splitTextToSize(
    schoolName,
    maxFooterSchoolNameWidth
  )[0];
  doc.text(truncatedSchoolName, MARGINS.left, footerY, { align: "left" });

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  doc.text(
    `${t("Export.generated")}: ${dateStr}`,
    pageWidth - MARGINS.right,
    footerY,
    { align: "right" }
  );
};

/** Draws the main report header */
const drawHeader = (
  doc: jsPDF,
  currentY: number,
  t: TranslationFunction,
  schoolData: any,
  periodInfo: any
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - MARGINS.left - MARGINS.right;
  const naShort = t("Export.notAvailableShort", "N/A");

  const schoolName =
    schoolData.name || t("Export.unknownSchoolName", "School Name");
  const schoolMoto = schoolData.moto || "";
  const schoolPhone = schoolData.phone_number
    ? `${t("Export.telLabel", "Tel")}: ${schoolData.phone_number}`
    : "";
  const schoolEmail = schoolData.email
    ? `${t("Export.emailLabel", "Email")}: ${schoolData.email}`
    : "";

  const reportTitle = t("Export.reportCardTitle");
  const periodString = periodInfo?.name || t("Export.unknownPeriod", naShort);
  const academicYear =
    periodInfo?.academic_year_name ||
    schoolData.active_academic_year_name ||
    t("Export.unknownAcademicYear", naShort);
  const periodInfoText = `${periodString} (${academicYear})`;

  const leftMaxWidth = usableWidth * 0.6;
  const rightMaxWidth = usableWidth * 0.4;
  let leftY = currentY;
  let rightY = currentY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZES.hugeTitle);
  doc.setTextColor(...PDF_COLORS.primary);
  const schoolNameLines = doc.splitTextToSize(schoolName, leftMaxWidth);
  doc.text(schoolNameLines, MARGINS.left, leftY, { baseline: "top" });
  leftY += getTextHeight(doc, schoolNameLines, FONT_SIZES.hugeTitle);

  if (schoolMoto) {
    leftY += 1;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(FONT_SIZES.small);
    doc.setTextColor(...PDF_COLORS.secondary);
    const motoLines = doc.splitTextToSize(`"${schoolMoto}"`, leftMaxWidth);
    doc.text(motoLines, MARGINS.left, leftY, { baseline: "top" });
    leftY += getTextHeight(doc, motoLines, FONT_SIZES.small);
  }

  if (schoolPhone) {
    leftY += 1;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZES.small);
    doc.setTextColor(...PDF_COLORS.secondary);
    const phoneLines = doc.splitTextToSize(schoolPhone, leftMaxWidth);
    doc.text(phoneLines, MARGINS.left, leftY, { baseline: "top" });
    leftY += getTextHeight(doc, phoneLines, FONT_SIZES.small);
  }

  if (schoolEmail) {
    leftY += 1;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZES.small);
    doc.setTextColor(...PDF_COLORS.secondary);
    const emailLines = doc.splitTextToSize(schoolEmail, leftMaxWidth);
    doc.text(emailLines, MARGINS.left, leftY, { baseline: "top" });
    leftY += getTextHeight(doc, emailLines, FONT_SIZES.small);
  }

  const rightX = MARGINS.left + usableWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZES.largeTitle);
  doc.setTextColor(...PDF_COLORS.primary);
  const titleLines = doc.splitTextToSize(reportTitle, rightMaxWidth);
  doc.text(titleLines, rightX, rightY, {
    align: "right",
    maxWidth: rightMaxWidth,
    baseline: "top",
  });
  rightY += getTextHeight(doc, titleLines, FONT_SIZES.largeTitle) + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZES.subTitle);
  doc.setTextColor(...PDF_COLORS.secondary);
  const periodLines = doc.splitTextToSize(periodInfoText, rightMaxWidth);
  doc.text(periodLines, rightX, rightY, {
    align: "right",
    maxWidth: rightMaxWidth,
    baseline: "top",
  });
  rightY += getTextHeight(doc, periodLines, FONT_SIZES.subTitle);

  return Math.max(leftY, rightY) + SECTION_SPACING;
};

/** Draws the student information block */
const drawStudentInfo = (
  doc: jsPDF,
  currentY: number,
  t: TranslationFunction,
  studentFullData: Partial<Student> | null | undefined
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - MARGINS.left - MARGINS.right;
  const naShort = t("Export.notAvailableShort", "N/A");

  const studentName =
    studentFullData?.full_name ||
    (studentFullData
      ? `${studentFullData.first_name || ""} ${
          studentFullData.last_name || ""
        }`.trim()
      : t("Export.unknownStudent", "Unknown Student"));
  const studentMatricule = studentFullData?.matricule || naShort;
  const studentClass =
    studentFullData?.class_name || t("Export.unknownClass", "Unknown Class");
  const studentDob = studentFullData?.date_of_birth || naShort;
  const studentPob = studentFullData?.place_of_birth || naShort;
  const studentSex = studentFullData?.sex_display || naShort;

  const studentData = [
    { label: t("Export.studentLabel"), value: studentName, highlight: true },
    { label: t("Export.matriculeLabel"), value: studentMatricule },
    { label: t("Export.classLabel"), value: studentClass },
    { label: t("Export.dobLabel"), value: studentDob },
    { label: t("Export.pobLabel"), value: studentPob },
    { label: t("Export.sexLabel"), value: studentSex },
  ];

  const cardPadding = 4;
  const cardLineItemHeight = FONT_SIZES.body * 0.352778 * 1.3 + 3;
  const cardNumRows = Math.ceil(studentData.length / 2);
  const cardBlockHeight =
    cardNumRows * cardLineItemHeight + cardPadding * 2 - 3;

  doc.setFillColor(...PDF_COLORS.lightBg);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(
    MARGINS.left,
    currentY,
    usableWidth,
    cardBlockHeight,
    3,
    3,
    "FD"
  );

  const cardCol1X = MARGINS.left + cardPadding;
  const cardCol2X = MARGINS.left + usableWidth / 2 + cardPadding / 2;
  const cardValueMaxWidth = usableWidth / 2 - cardPadding * 2.5;

  studentData.forEach((item, index) => {
    const isCol1 = index % 2 === 0;
    const yPos =
      currentY + cardPadding + Math.floor(index / 2) * cardLineItemHeight;
    const labelX = isCol1 ? cardCol1X : cardCol2X;
    const labelWidth = doc.getTextWidth(item.label + ": ");
    const valueX = labelX + labelWidth + 1;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZES.body);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(item.label + ":", labelX, yPos, {
      align: "left",
      baseline: "top",
    });

    doc.setFont("helvetica", item.highlight ? "bold" : "normal");
    doc.setFontSize(FONT_SIZES.body);
    doc.setTextColor(
      ...(item.highlight ? PDF_COLORS.primary : PDF_COLORS.text)
    );
    const valueLines = doc.splitTextToSize(item.value, cardValueMaxWidth);
    doc.text(valueLines, valueX, yPos, {
      maxWidth: cardValueMaxWidth,
      baseline: "top",
    });
  });

  return currentY + cardBlockHeight + SECTION_SPACING;
};

/**
 * Generates a translated promotion remark string based on student's performance.
 */
const getTranslatedPromotionRemarks = (
  t: TranslationFunction,
  overallPerformance: any,
  subjectBreakdown: SubjectResult[] | null | undefined,
  passingScore: number
): string => {
  // [CORRECTED] Use `promotion_status_key` as confirmed by the JSON payload.
  const status = overallPerformance?.promotion_status_key;
  if (!status) {
    // Fallback to the old remarks field for backward compatibility or if key is missing.
    return overallPerformance.promotion_decision_remarks || "";
  }

  const passedSubjectsCount = Array.isArray(subjectBreakdown)
    ? subjectBreakdown.filter(
        (s) => s.score != null && Number(s.score) >= passingScore
      ).length
    : 0;

  const studentAverage =
    overallPerformance.average != null
      ? Number(overallPerformance.average).toFixed(2)
      : t("Export.notAvailableShort", "N/A");

  // [CORRECTED] Use lowercase, snake_case values for the switch cases.
  switch (status) {
    case "promoted":
      return t("PromotionRemarks.promoted");

    case "conditional_promotion":
      return t("PromotionRemarks.conditional", {
        subjects: passedSubjectsCount,
        average: studentAverage,
      });

    case "repeated":
      return t("PromotionRemarks.repeated", {
        subjects: passedSubjectsCount,
        average: studentAverage,
      });

    default:
      // If the status is unknown, fallback to the original text field.
      return overallPerformance.promotion_decision_remarks || "";
  }
};

/** Draws the overall performance summary table */
const drawOverallSummary = (
  doc: jsPDF,
  currentY: number,
  t: TranslationFunction,
  overallPerformance: any,
  subjectBreakdown: SubjectResult[] | null | undefined,
  passingScore: number,
  pageData: { count: number },
  schoolName: string,
  periodType: string
): number => {
  if (!overallPerformance) {
    return currentY;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - MARGINS.left - MARGINS.right;
  const naShort = t("Export.notAvailableShort", "N/A");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZES.title);
  doc.setTextColor(...PDF_COLORS.primary);
  const summaryTitleText = t("Export.overallSummary");
  doc.text(summaryTitleText, MARGINS.left, currentY, { baseline: "top" });
  const titleHeight = getTextHeight(doc, summaryTitleText, FONT_SIZES.title);
  const tableStartY = currentY + titleHeight + HEADING_TO_TABLE_SPACING;

  const summaryItems = [
    {
      key: "average",
      label: t("Export.averageScore"),
      value: `${
        overallPerformance.average != null
          ? Number(overallPerformance.average).toFixed(2)
          : naShort
      } / 20`,
      _rawValue: overallPerformance.average,
      isAverage: true,
    },
    {
      key: "rank",
      label: t("Export.classRank"),
      value:
        overallPerformance.rank != null && overallPerformance.class_size != null
          ? `${overallPerformance.rank} / ${overallPerformance.class_size}`
          : naShort,
    },
    {
      key: "totalPoints",
      label: t("Export.totalPoints"),
      value:
        overallPerformance.total_points != null
          ? Number(overallPerformance.total_points).toFixed(2)
          : naShort,
    },
    {
      key: "classAverage",
      label: t("Export.classAverage"),
      value:
        overallPerformance.class_average_overall != null
          ? Number(overallPerformance.class_average_overall).toFixed(2)
          : naShort,
    },
    {
      key: "totalCoef",
      label: t("Export.totalCoefficient"),
      value: overallPerformance.total_coefficient ?? naShort,
    },
    {
      key: "decision",
      label: t("Export.decision"),
      value:
        overallPerformance.average != null
          ? Number(overallPerformance.average) >= passingScore
            ? t("Export.passed")
            : t("Export.failed")
          : t("Export.unknown"),
      isDecision: true,
      _rawValue: overallPerformance.average,
    },
  ];

  const tableHeaders: CellDef[][] = [[]];
  const tableDataRow: { [key: string]: any } = {};
  const tableColumns: ColumnInput[] = [];
  const colWidths: { [key: string]: number } = {};
  const relativeWidths: { [key: string]: number } = {
    average: 0.22,
    rank: 0.18,
    totalPoints: 0.18,
    classAverage: 0.16,
    totalCoef: 0.13,
    decision: 0.13,
  };

  const totalRelativeWidth = Object.values(relativeWidths).reduce(
    (sum, w) => sum + w,
    0
  );
  summaryItems.forEach((item) => {
    const dataKey = item.key;
    tableHeaders[0].push({ content: item.label, dataKey });
    tableDataRow[dataKey] = item.value;
    tableDataRow[`_${dataKey}_raw`] = item._rawValue;
    tableDataRow[`_${dataKey}_isDecision`] = item.isDecision ?? false;
    tableDataRow[`_${dataKey}_isAverage`] = item.isAverage ?? false;
    const width = usableWidth * (relativeWidths[dataKey] / totalRelativeWidth);
    colWidths[dataKey] = width;
    tableColumns.push({ dataKey, header: item.label });
  });

  const tableBody: RowInput[] = [tableDataRow];
  const numberOfColumns = summaryItems.length;

  if (periodType === "year") {
    if (overallPerformance.promotion_status_display) {
      tableBody.push([
        {
          content: `${t(
            "Export.promotionStatusLabel",
            "Promotion Status"
          )}: ${overallPerformance.promotion_status_display}`,
          colSpan: numberOfColumns,
          styles: {
            halign: "left",
            fontStyle: "bold",
            fillColor: PDF_COLORS.lightBg,
            textColor: PDF_COLORS.primary,
            cellPadding: { top: 2, bottom: 2, left: 3 },
          },
        },
      ]);
    }

    const translatedRemarks = getTranslatedPromotionRemarks(
      t,
      overallPerformance,
      subjectBreakdown,
      passingScore
    );

    if (translatedRemarks.trim() !== "") {
      tableBody.push([
        {
          content: `${t(
            "Export.promotionRemarksLabel",
            "Promotion Remarks"
          )}: ${translatedRemarks}`,
          colSpan: numberOfColumns,
          styles: {
            halign: "left",
            fontStyle: "italic",
            fontSize: FONT_SIZES.small,
            fillColor: PDF_COLORS.white,
            textColor: PDF_COLORS.secondary,
            cellPadding: { top: 2, bottom: 2, left: 3 },
          },
        },
      ]);
    }
  }

  autoTable(doc, {
    startY: tableStartY,
    head: tableHeaders,
    body: tableBody,
    columns: tableColumns,
    theme: "grid",
    styles: {
      fontSize: FONT_SIZES.body,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      valign: "middle",
      halign: "center",
      lineWidth: 0.1,
      lineColor: PDF_COLORS.lightBorder,
    },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
      fontSize: FONT_SIZES.header,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 2, right: 1, bottom: 2, left: 1 },
    },
    bodyStyles: {
      fillColor: PDF_COLORS.white,
      textColor: PDF_COLORS.text,
      fontStyle: "bold",
    },
    columnStyles: colWidths,
    margin: { left: MARGINS.left, right: MARGINS.right },
    tableWidth: "auto",
    didParseCell: (data: CellHookData) => {
      if (data.section === "body" && data.row.index === 0 && data.row.raw) {
        const rowData = data.row.raw as any;
        const dataKey = data.column.dataKey as string;
        const isDecision = rowData[`_${dataKey}_isDecision`];
        const rawValue = rowData[`_${dataKey}_raw`];

        if (isDecision) {
          data.cell.styles.fontStyle = "bolditalic";
          if (rawValue != null) {
            data.cell.styles.textColor =
              rawValue >= passingScore ? PDF_COLORS.passed : PDF_COLORS.failed;
          } else {
            data.cell.styles.textColor = PDF_COLORS.secondary;
          }
        }
        const isAverage = rowData[`_${dataKey}_isAverage`];
        if (isAverage && rawValue != null) {
          if (rawValue < passingScore) {
            data.cell.styles.textColor = PDF_COLORS.failed;
          } else if (rawValue >= 16) {
            data.cell.styles.textColor = PDF_COLORS.accent;
          }
        }
      }
    },
    addPageContent: (hookData: HookData) => {
      if (hookData.pageNumber > pageData.count)
        pageData.count = hookData.pageNumber;
      drawFooter(doc, hookData.pageNumber, pageData.count, t, schoolName);
    },
  });

  return (doc as any).lastAutoTable.finalY + SECTION_SPACING;
};

/**
 * Generates a qualitative remark based on a score.
 */
const getSubjectRemark = (
  score: number | null | undefined,
  t: TranslationFunction
): string => {
  if (score === null || score === undefined) {
    return "";
  }
  if (score >= 18) return t("Remarks.excellent", "Excellent");
  if (score >= 16) return t("Remarks.veryGood", "Very Good");
  if (score >= 14) return t("Remarks.good", "Good");
  if (score >= 12) return t("Remarks.satisfactory", "Satisfactory");
  if (score >= 10) return t("Remarks.passing", "Passing");
  if (score >= 8) return t("Remarks.needsImprovement", "Needs Improvement");
  if (score >= 6) return t("Remarks.weak", "Weak");
  return t("Remarks.veryWeak", "Very Weak");
};

/** Draws the subject breakdown table */
const drawSubjectBreakdown = (
  doc: jsPDF,
  currentY: number,
  t: TranslationFunction,
  subjectBreakdown: SubjectResult[] | null | undefined,
  periodType: string,
  passingScore: number,
  pageData: { count: number },
  schoolName: string
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - MARGINS.left - MARGINS.right;
  const naShort = t("Export.notAvailableShort", "N/A");

  if (!Array.isArray(subjectBreakdown) || subjectBreakdown.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(FONT_SIZES.body);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(t("Export.noSubjectData"), MARGINS.left, currentY);
    return (
      currentY + getTextHeight(doc, "T", FONT_SIZES.body) + SECTION_SPACING
    );
  }
  const validSubjectBreakdown = subjectBreakdown;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZES.title);
  doc.setTextColor(...PDF_COLORS.primary);
  const subjectTitleText = t("Export.subjectBreakdown");
  doc.text(subjectTitleText, MARGINS.left, currentY, { baseline: "top" });
  const titleHeight = getTextHeight(doc, subjectTitleText, FONT_SIZES.title);
  const tableStartY = currentY + titleHeight + HEADING_TO_TABLE_SPACING;

  let dynamicColumns: {
    header: string;
    dataKey: string;
    rawDataKey: string;
    weightDataKey: string;
    absentDataKey: string;
    id: number | string;
    isSequenceDetail: boolean;
  }[] = [];

  if (periodType === "term" || periodType === "year") {
    const breakdownMap = new Map<
      string | number,
      { name: string; isSequence: boolean }
    >();
    validSubjectBreakdown.forEach((subj) => {
      const details =
        periodType === "term" ? subj.sequence_details : subj.term_details;
      (details as (SequenceDetail | TermDetail)[])?.forEach((detail) => {
        const id =
          periodType === "term"
            ? (detail as SequenceDetail).sequence_id
            : (detail as TermDetail).term_id;
        const name =
          periodType === "term"
            ? (detail as SequenceDetail).sequence_name
            : (detail as TermDetail).term_name;
        if (id != null && name != null && !breakdownMap.has(id)) {
          breakdownMap.set(id, { name, isSequence: periodType === "term" });
        }
      });
    });

    const sortedBreakdown = Array.from(breakdownMap.entries()).sort((a, b) =>
      a[1].name.localeCompare(b[1].name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );

    sortedBreakdown.forEach(([id, { name, isSequence }]) => {
      const baseKey = `${periodType}${id}`;
      dynamicColumns.push({
        header: name,
        dataKey: `${baseKey}_display`,
        rawDataKey: `${baseKey}_raw`,
        weightDataKey: `${baseKey}_weight`,
        absentDataKey: `${baseKey}_absent`,
        id: id,
        isSequenceDetail: isSequence,
      });
    });
  }

  const baseColumns: ColumnInput[] = [
    { header: t("Export.subject"), dataKey: "subject" },
    { header: t("Export.coefShort"), dataKey: "coef" },
  ];
  const dynamicTableColumns: ColumnInput[] = dynamicColumns.map((col) => ({
    header: col.header,
    dataKey: col.dataKey,
  }));
  const finalFixedColumns: ColumnInput[] = [
    { header: t("Export.finalScore"), dataKey: "score" },
    { header: t("Export.rankShort"), dataKey: "rank" },
    { header: t("Export.remarks"), dataKey: "remarks" },
  ];
  if (periodType === "sequence") {
    finalFixedColumns.push({
      header: t("Export.classAvgShort"),
      dataKey: "classAvg",
    });
  }
  finalFixedColumns.push({ header: t("Export.teacher"), dataKey: "teacher" });

  const allTableColumns: ColumnInput[] = [
    ...baseColumns,
    ...dynamicTableColumns,
    ...finalFixedColumns,
  ];

  const tableData = validSubjectBreakdown.map((subj: SubjectResult) => {
    const row: any = {
      subject: subj.subject_name || naShort,
      teacher: subj.teacher_name || "",
      coef: subj.coefficient ?? naShort,
      score: subj.score != null ? Number(subj.score).toFixed(2) : naShort,
      rank: subj.rank ?? naShort,
      classAvg:
        subj.class_average_subject != null
          ? Number(subj.class_average_subject).toFixed(2)
          : naShort,
      remarks: getSubjectRemark(subj.score ? Number(subj.score) : null, t),
      _scoreRaw: subj.score,
      _rankRaw: subj.rank,
      _subjectId: subj.subject_id,
    };

    dynamicColumns.forEach((col) => {
      const details =
        periodType === "term" ? subj.sequence_details : subj.term_details;
      const detail = (details as (SequenceDetail | TermDetail)[])?.find(
        (d) =>
          (periodType === "term"
            ? (d as SequenceDetail).sequence_id
            : (d as TermDetail).term_id) === col.id
      );

      if (detail) {
        const rawScore =
          periodType === "term"
            ? (detail as SequenceDetail).normalized_score
            : (detail as TermDetail).term_average_score;
        const isAbsent =
          periodType === "term" ? (detail as SequenceDetail).is_absent : false;

        row[col.rawDataKey] = rawScore;
        row[col.absentDataKey] = isAbsent;

        if (
          periodType === "term" &&
          detail &&
          "weight" in (detail as SequenceDetail)
        ) {
          row[col.weightDataKey] = (detail as SequenceDetail).weight;
        } else {
          row[col.weightDataKey] = null;
        }

        const displayScoreString = isAbsent
          ? t("Export.absentShort", "ABS")
          : rawScore != null
            ? Number(rawScore).toFixed(2)
            : naShort;
        row[col.dataKey] = displayScoreString;
      } else {
        row[col.dataKey] = naShort;
        row[col.rawDataKey] = null;
        row[col.weightDataKey] = null;
        row[col.absentDataKey] = false;
      }
    });
    return row;
  });

  const calculateColumnWidths = () => {
    const includeClassAvg = periodType === "sequence";
    let fixedWidthConfig: { [key: string]: number } = {
      subject: 0.2,
      coef: 0.05,
      score: 0.07,
      rank: 0.06,
      remarks: 0.16,
    };
    if (includeClassAvg) fixedWidthConfig["classAvg"] = 0.08;
    const teacherWidthPercent = 0.12;

    let totalFixedPercent =
      Object.values(fixedWidthConfig).reduce((sum, p) => sum + p, 0) +
      teacherWidthPercent;

    let dynamicColCount = dynamicColumns.length;
    let dynamicTotalPercent = Math.max(0, 1.0 - totalFixedPercent);

    if (dynamicColCount > 0 && dynamicTotalPercent < 0.05 * dynamicColCount) {
      dynamicTotalPercent = 0.05 * dynamicColCount;
      totalFixedPercent = 1.0 - dynamicTotalPercent;
    } else if (dynamicColCount === 0) {
      fixedWidthConfig["teacher"] = Math.max(
        teacherWidthPercent,
        1.0 - Object.values(fixedWidthConfig).reduce((sum, p) => sum + p, 0)
      );
      totalFixedPercent = 1.0;
      dynamicTotalPercent = 0;
    }

    const scaleFactor = 1.0 / (totalFixedPercent + dynamicTotalPercent);
    const colWidths: { [key: string]: number } = {};
    let calculatedTotalWidth = 0;

    Object.keys(fixedWidthConfig).forEach((key) => {
      colWidths[key] = usableWidth * fixedWidthConfig[key] * scaleFactor;
      calculatedTotalWidth += colWidths[key];
    });
    if (!colWidths["teacher"]) {
      colWidths["teacher"] = usableWidth * teacherWidthPercent * scaleFactor;
      calculatedTotalWidth += colWidths["teacher"];
    }

    let dynamicColWidth =
      dynamicColCount > 0
        ? (usableWidth * dynamicTotalPercent * scaleFactor) / dynamicColCount
        : 0;
    calculatedTotalWidth += dynamicColWidth * dynamicColCount;

    let adjustment =
      (usableWidth - calculatedTotalWidth) / allTableColumns.length;
    Object.keys(colWidths).forEach((key) => (colWidths[key] += adjustment));
    dynamicColWidth += adjustment;

    Object.keys(colWidths).forEach((key) => {
      if (colWidths[key] < 5) colWidths[key] = 5;
    });
    if (dynamicColWidth < 5 && dynamicColCount > 0) dynamicColWidth = 5;

    return { colWidths, dynamicColWidth };
  };

  const { colWidths, dynamicColWidth } = calculateColumnWidths();
  const columnStyles: { [key: string]: Partial<any> } = {
    subject: {
      cellWidth: colWidths["subject"],
      fontStyle: "bold",
      valign: "middle",
    },
    coef: { cellWidth: colWidths["coef"], halign: "center", valign: "middle" },
    score: {
      cellWidth: colWidths["score"],
      halign: "center",
      fontStyle: "bold",
      valign: "middle",
    },
    rank: { cellWidth: colWidths["rank"], halign: "center", valign: "middle" },
    remarks: {
      cellWidth: colWidths["remarks"],
      fontSize: FONT_SIZES.small,
      fontStyle: "italic",
      textColor: PDF_COLORS.secondary,
      halign: "left",
      valign: "middle",
    },
    ...(colWidths["classAvg"] && {
      classAvg: {
        cellWidth: colWidths["classAvg"],
        halign: "center",
        valign: "middle",
      },
    }),
    teacher: {
      cellWidth: colWidths["teacher"],
      fontSize: FONT_SIZES.small,
      textColor: PDF_COLORS.lightText,
      halign: "right",
      valign: "middle",
    },
  };

  dynamicColumns.forEach((col) => {
    columnStyles[col.dataKey] = {
      cellWidth: dynamicColWidth,
      halign: "center",
      fontSize: FONT_SIZES.tiny,
      valign: "middle",
    };
  });

  autoTable(doc, {
    startY: tableStartY,
    columns: allTableColumns,
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontSize: FONT_SIZES.header,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 2, right: 1, bottom: 2, left: 1 },
      lineWidth: 0.1,
      lineColor: PDF_COLORS.lightBorder,
    },
    bodyStyles: {
      fontSize: FONT_SIZES.body,
      cellPadding: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
      textColor: PDF_COLORS.text,
      lineWidth: 0.1,
      lineColor: PDF_COLORS.lightBorder,
      valign: "middle",
      overflow: "linebreak",
    },
    alternateRowStyles: { fillColor: PDF_COLORS.lightBg },
    columnStyles: columnStyles,
    margin: { left: MARGINS.left, right: MARGINS.right },
    tableWidth: "auto",
    didDrawCell: (data: CellHookData) => {
      if (data.section !== "body" || !data.row.raw) return;

      const rowData = data.row.raw as any;
      const columnKey = data.column.dataKey as string;
      const dynamicColInfo = dynamicColumns.find(
        (col) => col.dataKey === columnKey
      );

      if (dynamicColInfo) {
        let cellBgColor: ColorTuple =
          data.row.index % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.lightBg;
        doc.setFillColor(...cellBgColor);
        doc.rect(
          data.cell.x,
          data.cell.y,
          data.cell.width,
          data.cell.height,
          "F"
        );

        const rawScore = rowData[dynamicColInfo.rawDataKey];
        const weight = rowData[dynamicColInfo.weightDataKey];
        const isAbsent = rowData[dynamicColInfo.absentDataKey];
        const displayScoreString = rowData[columnKey] ?? naShort;

        let scoreColor = PDF_COLORS.text;
        let scoreFontStyle = "normal";

        if (isAbsent) {
          scoreColor = PDF_COLORS.absent;
          scoreFontStyle = "bolditalic";
        } else if (rawScore != null) {
          scoreColor =
            rawScore < passingScore ? PDF_COLORS.failed : PDF_COLORS.passed;
        }

        const hasWeight =
          dynamicColInfo.isSequenceDetail &&
          weight != null &&
          periodType === "term";
        const weightText = hasWeight ? ` (${Number(weight).toFixed(0)}%)` : "";
        const weightFontSize = FONT_SIZES.micro;
        const baseFontSize = data.cell.styles.fontSize || FONT_SIZES.tiny;

        doc.setFontSize(weightFontSize);
        const weightWidth = hasWeight ? doc.getTextWidth(weightText) : 0;
        doc.setFontSize(baseFontSize);

        const cellPadding = data.cell.padding("horizontal") / 2 || 1;
        const cellWidth = data.cell.width;
        const cellX = data.cell.x;
        const centerY = data.cell.y + data.cell.height / 2;

        const scoreAvailableWidth =
          cellWidth - weightWidth - cellPadding * 2 - (hasWeight ? 1 : 0);

        doc.setFont(data.cell.styles.font, scoreFontStyle);
        doc.setFontSize(baseFontSize);
        const scoreTextWidth = Math.min(
          doc.getTextWidth(displayScoreString),
          scoreAvailableWidth
        );
        let scoreX =
          cellX + cellPadding + (scoreAvailableWidth - scoreTextWidth) / 2;
        scoreX = Math.max(scoreX, cellX + cellPadding);

        const weightX = cellX + cellWidth - cellPadding;
        doc.setFont(data.cell.styles.font, scoreFontStyle);
        doc.setFontSize(baseFontSize);
        doc.setTextColor(...scoreColor);
        doc.text(displayScoreString, scoreX, centerY, {
          baseline: "middle",
          maxWidth: scoreAvailableWidth,
        });

        if (hasWeight) {
          doc.setFont(data.cell.styles.font, "normal");
          doc.setFontSize(weightFontSize);
          doc.setTextColor(...PDF_COLORS.lightText);
          doc.text(weightText, weightX, centerY, {
            align: "right",
            baseline: "middle",
          });
        }
        return false;
      } else {
        if (columnKey === "score") {
          const rawScore = rowData._scoreRaw;
          if (rawScore != null) {
            data.cell.styles.textColor =
              rawScore < passingScore ? PDF_COLORS.failed : PDF_COLORS.passed;
          } else {
            data.cell.styles.textColor = PDF_COLORS.secondary;
            data.cell.styles.fontStyle = "italic";
          }
        }
      }
    },
    addPageContent: (hookData: HookData) => {
      if (hookData.pageNumber > pageData.count)
        pageData.count = hookData.pageNumber;
      drawFooter(doc, hookData.pageNumber, pageData.count, t, schoolName);
    },
    willDrawPage: (hookData: HookData) => {
      if (hookData.pageNumber > pageData.count)
        pageData.count = hookData.pageNumber;
    },
  });

  return (doc as any).lastAutoTable.finalY;
};

/**
 * Draws a summary of passed subjects below the main table.
 */
const drawSubjectsSummary = (
  doc: jsPDF,
  currentY: number,
  t: TranslationFunction,
  subjectBreakdown: SubjectResult[] | null | undefined,
  passingScore: number
): number => {
  if (!Array.isArray(subjectBreakdown) || subjectBreakdown.length === 0) {
    return currentY;
  }

  const totalSubjects = subjectBreakdown.length;
  const passedSubjects = subjectBreakdown.filter(
    (subj) => subj.score != null && Number(subj.score) >= passingScore
  ).length;

  const summaryText = t("Export.subjectsPassed", {
    passed: passedSubjects,
    total: totalSubjects,
  });

  const yPos = currentY + 5; // Add a small gap after the table

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZES.body);
  doc.setTextColor(...PDF_COLORS.secondary);

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(summaryText, pageWidth - MARGINS.right, yPos, { align: "right" });

  return yPos + getTextHeight(doc, "T", FONT_SIZES.body);
};

/** Draws the remarks and signature lines */
const drawRemarksAndSignature = (
  doc: jsPDF,
  currentY: number,
  t: TranslationFunction,
  overallPerformance: any
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - MARGINS.left - MARGINS.right;

  const signatureAreaHeightEstimate = 30;
  const footerHeightEstimate = MARGINS.bottom + 5;
  const absoluteMaxY = pageHeight - footerHeightEstimate;
  let yPos = currentY;
  let remarksDrawn = false;

  if (overallPerformance?.remarks) {
    const remarksMaxY = absoluteMaxY - signatureAreaHeightEstimate / 1.5;
    const remarksAvailableHeight = Math.max(0, remarksMaxY - yPos);

    if (remarksAvailableHeight > 10) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FONT_SIZES.header);
      doc.setTextColor(...PDF_COLORS.primary);
      const remarksLabel = t("Export.remarksLabel");
      doc.text(remarksLabel + ":", MARGINS.left, yPos, { baseline: "top" });
      const labelHeight = getTextHeight(doc, "T", FONT_SIZES.header);
      yPos += labelHeight + 1.5;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(FONT_SIZES.body);
      doc.setTextColor(...PDF_COLORS.text);

      const lineHeight =
        (doc.getLineHeight() / doc.internal.scaleFactor) *
        (FONT_SIZES.body / doc.getFontSize());
      const maxLines = Math.max(
        0,
        Math.floor((remarksMaxY - yPos) / lineHeight)
      );

      if (maxLines > 0) {
        const lines = doc.splitTextToSize(
          overallPerformance.remarks,
          usableWidth
        );
        let linesToDraw = lines.slice(0, maxLines);
        if (lines.length > maxLines && linesToDraw.length > 0) {
          linesToDraw[maxLines - 1] =
            linesToDraw[maxLines - 1].substring(
              0,
              linesToDraw[maxLines - 1].length - 4
            ) + "...";
        }
        doc.text(linesToDraw, MARGINS.left, yPos, { baseline: "top" });
        yPos += linesToDraw.length * lineHeight;
        remarksDrawn = true;
      }
    }
  }
  yPos += remarksDrawn ? SECTION_SPACING / 2 : 0;

  const signatureMinY = yPos + 10;
  const signatureLineHeight = FONT_SIZES.small * 1.2 + 4;
  const totalSignatureBlockHeight = signatureLineHeight + 5;
  const signatureTargetY = absoluteMaxY - totalSignatureBlockHeight;
  const finalSignatureLineY = Math.max(signatureMinY, signatureTargetY);

  if (finalSignatureLineY < absoluteMaxY - signatureLineHeight) {
    doc.setDrawColor(...PDF_COLORS.secondary);
    doc.setLineWidth(0.3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZES.small);
    doc.setTextColor(...PDF_COLORS.secondary);

    const signatureLineWidth = usableWidth * 0.4;
    const signatureGap = usableWidth * 0.1;

    const deanSigLineXStart = MARGINS.left + usableWidth * 0.05;
    const deanSigLineXEnd = deanSigLineXStart + signatureLineWidth;
    doc.line(
      deanSigLineXStart,
      finalSignatureLineY,
      deanSigLineXEnd,
      finalSignatureLineY
    );
    const deanSigText = t("Export.deanOfStudiesSignature", "Dean of Studies");
    doc.text(
      deanSigText,
      deanSigLineXStart + signatureLineWidth / 2,
      finalSignatureLineY + 4,
      { align: "center" }
    );

    const principalSigLineXStart = deanSigLineXEnd + signatureGap;
    const principalSigLineXEnd = principalSigLineXStart + signatureLineWidth;
    doc.line(
      principalSigLineXStart,
      finalSignatureLineY,
      principalSigLineXEnd,
      finalSignatureLineY
    );
    const principalSigText = t("Export.principalSignature", "Principal");
    doc.text(
      principalSigText,
      principalSigLineXStart + signatureLineWidth / 2,
      finalSignatureLineY + 4,
      { align: "center" }
    );
    yPos = finalSignatureLineY + 4 + FONT_SIZES.small * 1.2;
  }
  return yPos;
};

// --- Main Export Function ---
export const exportReportCardToPDF = async (
  t: TranslationFunction,
  studentResults: StudentDetailedResultsResponse,
  studentFullData: Partial<Student> | null | undefined,
  filename: string,
  schoolData: Partial<School> | null | undefined,
  passingScore: number = 10
): Promise<Blob> => {
  if (!studentResults?.results || !studentResults.period_type) {
    throw new Error(
      t("Export.noDataError", "Cannot generate report: Missing results data.")
    );
  }
  if (!schoolData) {
    throw new Error(
      t(
        "Export.noSchoolDataError",
        "Cannot generate report: Missing school information."
      )
    );
  }

  const { results, period_type } = studentResults;
  const { period_info, overall_performance, subject_breakdown } = results;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let yPosition = MARGINS.top;
  const schoolName =
    schoolData.name || t("Export.unknownSchoolName", "School Name");
  const pageData = { count: 1 };

  yPosition = drawHeader(doc, yPosition, t, schoolData, period_info);
  yPosition = drawStudentInfo(doc, yPosition, t, studentFullData);

  yPosition = drawOverallSummary(
    doc,
    yPosition,
    t,
    overall_performance,
    subject_breakdown,
    passingScore,
    pageData,
    schoolName,
    period_type
  );

  const subjectTableFinalY = drawSubjectBreakdown(
    doc,
    yPosition,
    t,
    subject_breakdown,
    period_type,
    passingScore,
    pageData,
    schoolName
  );

  yPosition = drawSubjectsSummary(
    doc,
    subjectTableFinalY,
    t,
    subject_breakdown,
    passingScore
  );

  yPosition += SECTION_SPACING;

  const estimatedRemainingHeight = 35;
  const footerHeight = MARGINS.bottom + 5;
  if (
    yPosition + estimatedRemainingHeight >
    doc.internal.pageSize.getHeight() - footerHeight
  ) {
    doc.addPage();
    pageData.count++;
    yPosition = MARGINS.top;
    drawFooter(doc, pageData.count, pageData.count, t, schoolName);
  }

  yPosition = drawRemarksAndSignature(doc, yPosition, t, overall_performance);

  return doc.output("blob");
};
