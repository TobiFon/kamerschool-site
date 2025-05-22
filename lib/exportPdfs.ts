import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SchoolData {
  name?: string;
  active_academic_year?: string;
  email?: string;
  city?: string;
}

interface ExportScoreItem {
  SN: number;
  Name: string;
  Score: string;
  Rank: number;
  Status: string; // "Pass" or "Fail"
  Published: string; // "Yes" or "No"
  Absent: boolean; // true or false
}

/** Export subject scores to PDF with translations */
export const exportSubjectScoresToPDF = (
  t: (key: string) => string,
  data: ExportScoreItem[],
  filename: string,
  title: string,
  schoolData: SchoolData = {},
  passingScore: number = 10
) => {
  if (!data.length) return;

  // Create a new PDF document - A4 in landscape
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Define colors
  const COLORS = {
    primary: [60, 90, 150],
    pass: [46, 184, 92],
    fail: [229, 57, 53],
    published: [33, 150, 243],
    unpublished: [255, 152, 0],
    accent1: [212, 175, 55],
    accent2: [192, 192, 192],
    accent3: [205, 127, 50],
    lightGray: [248, 249, 250],
  };

  // Margins
  const margin = {
    left: 10,
    right: 10,
    top: 15,
    bottom: 20,
  };

  let yPosition = margin.top;

  // School header info
  const schoolName = schoolData.name || t("school_name");
  const academicYear =
    schoolData.active_academic_year || t("current_academic_year");
  const schoolEmail = schoolData.email || "";
  const schoolCity = schoolData.city || "";

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${t("academic_year")}: ${academicYear}`,
    doc.internal.pageSize.getWidth() / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 5;

  if (schoolEmail || schoolCity) {
    const contactInfo = [schoolCity, schoolEmail].filter(Boolean).join(" • ");
    doc.setFontSize(10);
    doc.text(contactInfo, doc.internal.pageSize.getWidth() / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;
  } else {
    yPosition += 5;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  // Assuming title is passed untranslated; translate if it's a key
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 10;

  // Process data with translated status values
  const processedData = data.map((item) => {
    const rank = isNaN(item.Rank) ? "-" : item.Rank;
    return {
      SN: item.SN,
      Name: item.Name,
      Score:
        typeof item.Score === "string" ? item.Score : item.Score.toFixed(2),
      Rank: rank,
      Status: parseFloat(item.Score) >= passingScore ? t("pass") : t("fail"),
      Published: item.Published === "Yes" ? t("yes") : t("no"),
      Absent: item.Absent === true ? t("yes") : t("no"),
    };
  });

  processedData.forEach((item, index) => {
    item.SN = index + 1;
  });

  const tableColumns = [
    { header: t("serial_number"), dataKey: "SN" },
    { header: t("student_name"), dataKey: "Name" },
    { header: t("score"), dataKey: "Score" },
    { header: t("rank"), dataKey: "Rank" },
    { header: t("status"), dataKey: "Status" },
    { header: t("published"), dataKey: "Published" },
    { header: t("absent"), dataKey: "Absent" },
  ];

  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin.left - margin.right;
  const columnWidths = {
    SN: 0.05,
    Name: 0.35,
    Score: 0.1,
    Rank: 0.1,
    Status: 0.1,
    Published: 0.15,
    Absent: 0.15,
  };

  // Custom cell drawing
  const didDrawCell = (data) => {
    if (data.section === "head") return true;
    if (!data.column) return true;

    const column = tableColumns[data.column.index]?.dataKey;
    const cellValue = data.cell.raw;
    if (cellValue === undefined || cellValue === null) return true;

    const { x, y, width, height } = data.cell;

    const fillBackground = () => {
      const isAlternate = data.row.index % 2 === 1;
      const bgColor = isAlternate ? COLORS.lightGray : [255, 255, 255];
      doc.setFillColor(...bgColor);
      doc.rect(x, y, width, height, "F");
    };

    if (column === "Status") {
      const isPassing = cellValue === t("pass");
      fillBackground();
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    } else if (column === "Published") {
      const isPublished = cellValue === t("yes");
      fillBackground();
      doc.setTextColor(
        ...(isPublished ? COLORS.published : COLORS.unpublished)
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      return false;
    } else if (column === "Absent") {
      const isAbsent = cellValue === t("yes");
      fillBackground();
      doc.setTextColor(
        isAbsent ? COLORS.fail[0] : 0,
        isAbsent ? COLORS.fail[1] : 0,
        isAbsent ? COLORS.fail[2] : 0
      );
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      return false;
    } else if (column === "Score") {
      const score = parseFloat(cellValue);
      const isPassing = !isNaN(score) && score >= passingScore;
      fillBackground();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    } else if (column === "Rank") {
      const rank = cellValue;
      fillBackground();
      if (!isNaN(parseInt(rank))) {
        const rankNum = parseInt(rank);
        doc.setFont("helvetica", rankNum <= 3 ? "bold" : "normal");
        doc.setFontSize(9);
        if (rankNum === 1) {
          doc.setTextColor(...COLORS.accent1);
        } else if (rankNum === 2) {
          doc.setTextColor(...COLORS.accent2);
        } else if (rankNum === 3) {
          doc.setTextColor(...COLORS.accent3);
        } else {
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
      }
      doc.text(rank.toString(), x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    }
    return true;
  };

  const columnStylesObj: any = {};
  tableColumns.forEach((col) => {
    const ratio = columnWidths[col.dataKey] || 0.1;
    columnStylesObj[col.dataKey] = {
      cellWidth: usableWidth * ratio,
      halign: col.dataKey === "Name" ? "left" : "center",
    };
  });

  autoTable(doc, {
    startY: yPosition,
    columns: tableColumns,
    body: processedData,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
    },
    columnStyles: columnStylesObj,
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: margin.left, right: margin.right },
    didDrawCell: didDrawCell,
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.text(
        `${t("page")} ${doc.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.setFontSize(8);
      doc.text(schoolName, margin.left, doc.internal.pageSize.getHeight() - 10);

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      doc.text(
        `${t("generated")}: ${dateStr}`,
        doc.internal.pageSize.getWidth() - margin.right,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    },
  });

  // Summary statistics
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const scores = processedData
    .map((item) => parseFloat(item.Score))
    .filter((score) => !isNaN(score));
  const passCount = processedData.filter(
    (item) => item.Status === t("pass")
  ).length;
  const absentCount = processedData.filter(
    (item) => item.Absent === t("yes")
  ).length;
  const avgScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin.left, finalY - 5, pageWidth - margin.right, finalY - 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(t("summary_statistics"), margin.left, finalY);

  const summaryData = [
    [
      { content: t("total_students"), style: { fontStyle: "bold" } },
      { content: processedData.length.toString(), style: {} },
    ],
    [
      { content: t("pass_rate"), style: { fontStyle: "bold" } },
      {
        content: `${((passCount / processedData.length) * 100).toFixed(1)}%`,
        style: {},
      },
    ],
    [
      { content: t("average_score"), style: { fontStyle: "bold" } },
      { content: avgScore.toFixed(2), style: {} },
    ],
    [
      { content: t("absent"), style: { fontStyle: "bold" } },
      { content: absentCount.toString(), style: {} },
    ],
  ];

  autoTable(doc, {
    startY: finalY + 5,
    body: summaryData,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: 40 },
    },
    margin: { left: margin.left },
  });

  doc.save(`${filename}.pdf`);
};

interface ExportSequenceResultItem {
  SN: number;
  Name: string;
  Average: number;
  Rank: number;
  Status: string; // "Pass" or "Fail"
  Published: string; // "Yes" or "No"
  SubjectScores?: {
    [subjectName: string]: {
      score?: number | string;
      rank?: number | string;
    };
  };
}

/** Export overall sequence results to PDF with translations */
export const exportSequenceOverallResultsToPDF = (
  t: (key: string) => string,
  data: ExportSequenceResultItem[],
  filename: string,
  title: string,
  schoolData: SchoolData = {},
  passingScore: number = 10,
  classStatistics = {}
) => {
  if (!data.length) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [60, 90, 150],
    pass: [46, 184, 92],
    fail: [229, 57, 53],
    published: [33, 150, 243],
    unpublished: [255, 152, 0],
    accent1: [212, 175, 55],
    accent2: [192, 192, 192],
    accent3: [205, 127, 50],
    lightGray: [248, 249, 250],
    excellent: [0, 120, 215],
    veryGood: [0, 176, 80],
    good: [112, 173, 71],
    average: [255, 192, 0],
    needsImprovement: [255, 100, 100],
  };

  const margin = {
    left: 10,
    right: 10,
    top: 15,
    bottom: 20,
  };

  let yPosition = margin.top;

  const schoolName = schoolData.name || t("school_name");
  const academicYear =
    schoolData.active_academic_year || t("current_academic_year");
  const schoolEmail = schoolData.email || "";
  const schoolCity = schoolData.city || "";

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${t("academic_year")}: ${academicYear}`,
    doc.internal.pageSize.getWidth() / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 5;

  if (schoolEmail || schoolCity) {
    const contactInfo = [schoolCity, schoolEmail].filter(Boolean).join(" • ");
    doc.setFontSize(10);
    doc.text(contactInfo, doc.internal.pageSize.getWidth() / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;
  } else {
    yPosition += 5;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 10;

  const processedData = data.map((item, index) => {
    const rank = isNaN(item.Rank) ? "-" : item.Rank;
    return {
      SN: index + 1,
      Name: item.Name,
      Average:
        typeof item.Average === "number"
          ? item.Average.toFixed(2)
          : item.Average,
      Rank: rank,
      Status:
        parseFloat(item.Average.toString()) >= passingScore
          ? t("pass")
          : t("fail"),
      Published: item.Published === "Yes" ? t("yes") : t("no"),
    };
  });

  const tableColumns = [
    { header: t("serial_number"), dataKey: "SN" },
    { header: t("student_name"), dataKey: "Name" },
    { header: t("average"), dataKey: "Average" },
    { header: t("rank"), dataKey: "Rank" },
    { header: t("status"), dataKey: "Status" },
    { header: t("published"), dataKey: "Published" },
  ];

  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin.left - margin.right;
  const columnWidths = {
    SN: 0.05,
    Name: 0.4,
    Average: 0.15,
    Rank: 0.1,
    Status: 0.15,
    Published: 0.15,
  };

  const didDrawCell = (data) => {
    if (data.section === "head") return true;
    if (!data.column) return true;

    const column = tableColumns[data.column.index]?.dataKey;
    const cellValue = data.cell.raw;
    if (cellValue === undefined || cellValue === null) return true;

    const { x, y, width, height } = data.cell;

    const fillBackground = () => {
      const isAlternate = data.row.index % 2 === 1;
      const bgColor = isAlternate ? COLORS.lightGray : [255, 255, 255];
      doc.setFillColor(...bgColor);
      doc.rect(x, y, width, height, "F");
    };

    if (column === "Status") {
      const isPassing = cellValue === t("pass");
      fillBackground();
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    } else if (column === "Published") {
      const isPublished = cellValue === t("yes");
      fillBackground();
      doc.setTextColor(
        ...(isPublished ? COLORS.published : COLORS.unpublished)
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      return false;
    } else if (column === "Average") {
      const score = parseFloat(cellValue);
      const isPassing = !isNaN(score) && score >= passingScore;
      fillBackground();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    } else if (column === "Rank") {
      const rank = cellValue;
      fillBackground();
      if (!isNaN(parseInt(rank))) {
        const rankNum = parseInt(rank);
        doc.setFont("helvetica", rankNum <= 3 ? "bold" : "normal");
        doc.setFontSize(9);
        if (rankNum === 1) {
          doc.setTextColor(...COLORS.accent1);
        } else if (rankNum === 2) {
          doc.setTextColor(...COLORS.accent2);
        } else if (rankNum === 3) {
          doc.setTextColor(...COLORS.accent3);
        } else {
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
      }
      doc.text(rank.toString(), x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    }
    return true;
  };

  const columnStylesObj = {};
  tableColumns.forEach((col) => {
    const ratio = columnWidths[col.dataKey] || 0.1;
    columnStylesObj[col.dataKey] = {
      cellWidth: usableWidth * ratio,
      halign: col.dataKey === "Name" ? "left" : "center",
    };
  });

  autoTable(doc, {
    startY: yPosition,
    columns: tableColumns,
    body: processedData,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
    },
    columnStyles: columnStylesObj,
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: margin.left, right: margin.right },
    didDrawCell: didDrawCell,
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.text(
        `${t("page")} ${doc.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.setFontSize(8);
      doc.text(schoolName, margin.left, doc.internal.pageSize.getHeight() - 10);

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      doc.text(
        `${t("generated")}: ${dateStr}`,
        doc.internal.pageSize.getWidth() - margin.right,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const averages = processedData
    .map((item) => parseFloat(item.Average))
    .filter((score) => !isNaN(score));
  const passCount = processedData.filter(
    (item) => item.Status === t("pass")
  ).length;
  const avgScore =
    averages.length > 0
      ? averages.reduce((a, b) => a + b, 0) / averages.length
      : 0;

  const excellentCount = classStatistics.excellent_count || 0;
  const veryGoodCount = classStatistics.very_good_count || 0;
  const goodCount = classStatistics.good_count || 0;
  const averageCount = classStatistics.average_count || 0;
  const needsImprovementCount = classStatistics.needs_improvement_count || 0;

  const highestAverage =
    classStatistics.highest_average || Math.max(...averages, 0).toFixed(2);
  const lowestAverage =
    classStatistics.lowest_average || Math.min(...averages, 0).toFixed(2);

  const sortedStudents = [...processedData].sort(
    (a, b) => parseFloat(b.Average) - parseFloat(a.Average)
  );
  const topStudents = sortedStudents.slice(0, 3);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin.left, finalY - 5, pageWidth - margin.right, finalY - 5);

  const leftColX = margin.left;
  const rightColX = pageWidth / 2 + 10;
  let statsY = finalY + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(t("performance_summary"), leftColX, finalY);
  statsY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("general_statistics"), leftColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(`${t("total_students")}: ${processedData.length}`, leftColX, statsY);
  statsY += 5;

  doc.text(
    `${t("pass_rate")}: ${((passCount / processedData.length) * 100).toFixed(
      1
    )}%`,
    leftColX,
    statsY
  );
  statsY += 5;

  doc.text(`${t("class_average")}: ${avgScore.toFixed(2)}`, leftColX, statsY);
  statsY += 5;

  doc.text(`${t("highest_average")}: ${highestAverage}`, leftColX, statsY);
  statsY += 5;

  doc.text(`${t("lowest_average")}: ${lowestAverage}`, leftColX, statsY);
  statsY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("top_performing_students"), leftColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  topStudents.forEach((student, index) => {
    const rank = parseInt(student.Rank);
    if (rank <= 3) {
      const medalColor =
        rank === 1
          ? COLORS.accent1
          : rank === 2
          ? COLORS.accent2
          : COLORS.accent3;
      doc.setTextColor(...medalColor);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${rank}. ${student.Name}: ${student.Average}`,
        leftColX,
        statsY
      );
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      statsY += 5;
    }
  });

  statsY = finalY + 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("performance_distribution"), rightColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const totalStudents = processedData.length || 1;

  doc.setTextColor(...COLORS.excellent);
  doc.text(
    `${t("excellent")} (≥16): ${excellentCount} (${(
      (excellentCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.veryGood);
  doc.text(
    `${t("very_good")} (14-15.9): ${veryGoodCount} (${(
      (veryGoodCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.good);
  doc.text(
    `${t("good")} (12-13.9): ${goodCount} (${(
      (goodCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.average);
  doc.text(
    `${t("average")} (10-11.9): ${averageCount} (${(
      (averageCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.needsImprovement);
  doc.text(
    `${t("needs_improvement")} (<10): ${needsImprovementCount} (${(
      (needsImprovementCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 10;

  doc.setTextColor(0, 0, 0);

  if (
    excellentCount ||
    veryGoodCount ||
    goodCount ||
    averageCount ||
    needsImprovementCount
  ) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(t("performance_distribution_chart"), rightColX, statsY);
    statsY += 10;

    const chartWidth = 100;
    const chartHeight = 10;
    const chartX = rightColX;
    const chartY = statsY;

    const totalCount =
      excellentCount +
      veryGoodCount +
      goodCount +
      averageCount +
      needsImprovementCount;
    if (totalCount > 0) {
      const excellentWidth = (excellentCount / totalCount) * chartWidth;
      const veryGoodWidth = (veryGoodCount / totalCount) * chartWidth;
      const goodWidth = (goodCount / totalCount) * chartWidth;
      const averageWidth = (averageCount / totalCount) * chartWidth;
      const needsImprovementWidth =
        (needsImprovementCount / totalCount) * chartWidth;

      let currentX = chartX;

      if (excellentCount > 0) {
        doc.setFillColor(...COLORS.excellent);
        doc.rect(currentX, chartY, excellentWidth, chartHeight, "F");
        currentX += excellentWidth;
      }

      if (veryGoodCount > 0) {
        doc.setFillColor(...COLORS.veryGood);
        doc.rect(currentX, chartY, veryGoodWidth, chartHeight, "F");
        currentX += veryGoodWidth;
      }

      if (goodCount > 0) {
        doc.setFillColor(...COLORS.good);
        doc.rect(currentX, chartY, goodWidth, chartHeight, "F");
        currentX += goodWidth;
      }

      if (averageCount > 0) {
        doc.setFillColor(...COLORS.average);
        doc.rect(currentX, chartY, averageWidth, chartHeight, "F");
        currentX += averageWidth;
      }

      if (needsImprovementCount > 0) {
        doc.setFillColor(...COLORS.needsImprovement);
        doc.rect(currentX, chartY, needsImprovementWidth, chartHeight, "F");
      }

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.rect(chartX, chartY, chartWidth, chartHeight, "S");
    }
  }

  doc.save(`${filename}.pdf`);
};

/** Export sequence subject scores to PDF with translations */
export const exportSequenceSubjectScoresToPDF = (
  t: (key: string) => string,
  data: ExportSequenceResultItem[],
  subjectNames: string[],
  filename: string,
  title: string,
  schoolData: SchoolData = {},
  passingScore: number = 10
) => {
  if (!data.length || !subjectNames.length) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [60, 90, 150],
    pass: [46, 184, 92],
    fail: [229, 57, 53],
    published: [33, 150, 243],
    unpublished: [255, 152, 0],
    accent1: [212, 175, 55],
    accent2: [192, 192, 192],
    accent3: [205, 127, 50],
    lightGray: [248, 249, 250],
  };

  const margin = {
    left: 8,
    right: 8,
    top: 12,
    bottom: 15,
  };

  let yPosition = margin.top;

  const schoolName = schoolData.name || t("school_name");
  const academicYear =
    schoolData.active_academic_year || t("current_academic_year");
  const schoolEmail = schoolData.email || "";
  const schoolCity = schoolData.city || "";

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${t("academic_year")}: ${academicYear}`,
    doc.internal.pageSize.getWidth() / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 4;

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

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  const tableHeaders = [
    [
      { content: t("serial_number") },
      { content: t("student_name") },
      ...subjectNames.map((subject) => ({
        content: `${subject} /20`, // Subject names are dynamic, not translated
        styles: {
          halign: "center",
          fillColor: COLORS.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      })),
    ],
  ];

  const subjectStats = subjectNames.map((subject) => {
    const scores = data
      .map((item) => item.SubjectScores?.[subject]?.score)
      .filter((score) => score !== undefined && score !== "-")
      .map((score) => parseFloat(score));

    if (!scores.length)
      return { subject, avg: 0, highest: 0, lowest: 0, passing: 0 };

    const sum = scores.reduce((acc, score) => acc + score, 0);
    const avg = sum / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passing = scores.filter((score) => score >= passingScore).length;
    const passingPercentage = (passing / scores.length) * 100;

    return {
      subject,
      avg: avg.toFixed(1),
      highest: highest.toFixed(1),
      lowest: lowest.toFixed(1),
      passing,
      total: scores.length,
      passingPercentage: passingPercentage.toFixed(1),
    };
  });

  const tableData = data.map((item, index) => {
    const rowData = [index + 1, item.Name];

    subjectNames.forEach((subject) => {
      const subjectData = item.SubjectScores?.[subject] || {};
      rowData.push(subjectData.score !== undefined ? subjectData.score : "-");
    });

    return rowData;
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin.left - margin.right;
  const snWidth = usableWidth * 0.04;
  const nameWidth = usableWidth * 0.18;
  const remainingWidth = usableWidth - snWidth - nameWidth;
  const subjectWidth = remainingWidth / subjectNames.length;

  const colWidths = [
    snWidth,
    nameWidth,
    ...subjectNames.map(() => subjectWidth),
  ];

  const didDrawCell = (data) => {
    if (data.section === "head") return true;
    if (data.row.section !== "body") return true;
    if (data.cell.raw === undefined || data.cell.raw === null) return true;

    const { x, y, width, height } = data.cell;
    const cellValue = data.cell.raw.toString();
    const colIndex = data.column.index;

    const isAlternate = data.row.index % 2 === 1;
    const bgColor = isAlternate ? COLORS.lightGray : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(x, y, width, height, "F");

    if (colIndex <= 1) {
      doc.setFont("helvetica", colIndex === 0 ? "normal" : "bold");
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      const align = colIndex === 0 ? "center" : "left";
      const xPos = colIndex === 0 ? x + width / 2 : x + 2;
      doc.text(cellValue, xPos, y + height / 2, {
        align: align,
        baseline: "middle",
      });
      return false;
    }

    if (colIndex >= 2 && cellValue !== "-") {
      const score = parseFloat(cellValue);
      const isPassing = !isNaN(score) && score >= passingScore;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      return false;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(cellValue, x + width / 2, y + height / 2, {
      align: "center",
      baseline: "middle",
    });
    return false;
  };

  autoTable(doc, {
    startY: yPosition,
    head: tableHeaders,
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "left" },
    },
    didDrawCell: didDrawCell,
    margin: { left: margin.left, right: margin.right },
    tableWidth: "auto",
    styles: {
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    columnWidth: (i) => colWidths[i],
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.text(
        `${t("page")} ${doc.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
      doc.setFontSize(7);
      doc.text(schoolName, margin.left, doc.internal.pageSize.getHeight() - 8);

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      doc.text(
        `${t("generated")}: ${dateStr}`,
        doc.internal.pageSize.getWidth() - margin.right,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin.left, finalY - 4, pageWidth - margin.right, finalY - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(t("subject_statistics"), margin.left, finalY);

  const statsHeaders = [
    [
      { content: t("subject") },
      { content: t("avg_score") },
      { content: t("highest") },
      { content: t("lowest") },
      { content: t("pass_rate") },
    ],
  ];

  const statsData = subjectStats.map((stat) => [
    stat.subject,
    stat.avg,
    stat.highest,
    stat.lowest,
    `${stat.passing}/${stat.total} (${stat.passingPercentage}%)`,
  ]);

  const sortedSubjects = [...subjectStats].sort(
    (a, b) => parseFloat(b.avg) - parseFloat(a.avg)
  );
  const bestSubject = sortedSubjects[0];
  const worstSubject = sortedSubjects[sortedSubjects.length - 1];

  autoTable(doc, {
    startY: finalY + 2,
    head: statsHeaders,
    body: statsData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    margin: { left: margin.left, right: margin.right },
    tableWidth: "auto",
  });

  const statsFinalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(t("summary"), margin.left, statsFinalY);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  let summaryY = statsFinalY + 5;
  doc.text(
    `• ${t("strongest_subject")}: ${bestSubject.subject} (${t("average")}: ${
      bestSubject.avg
    }/20)`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;
  doc.text(
    `• ${t("weakest_subject")}: ${worstSubject.subject} (${t("average")}: ${
      worstSubject.avg
    }/20)`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;

  const totalScores = data.length * subjectNames.length;
  const totalPassingScores = subjectStats.reduce(
    (acc, stat) => acc + stat.passing,
    0
  );
  const overallPassRate = ((totalPassingScores / totalScores) * 100).toFixed(1);

  doc.text(
    `• ${t("overall_pass_rate")}: ${overallPassRate}%`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;

  const highestPassRate = sortedSubjects.sort(
    (a, b) => parseFloat(b.passingPercentage) - parseFloat(a.passingPercentage)
  )[0];
  const lowestPassRate = sortedSubjects.sort(
    (a, b) => parseFloat(a.passingPercentage) - parseFloat(b.passingPercentage)
  )[0];

  doc.text(
    `• ${t("highest_pass_rate")}: ${highestPassRate.subject} (${
      highestPassRate.passingPercentage
    }%)`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;
  doc.text(
    `• ${t("lowest_pass_rate")}: ${lowestPassRate.subject} (${
      lowestPassRate.passingPercentage
    }%)`,
    margin.left + 4,
    summaryY
  );

  doc.save(`${filename}.pdf`);
};

export const exportTermOverallResultsToPDF = (
  t,
  data,
  filename,
  title,
  schoolData = {},
  passingScore = 10,
  classStatistics = {}
) => {
  if (!data.length) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [60, 90, 150],
    pass: [46, 184, 92],
    fail: [229, 57, 53],
    published: [33, 150, 243],
    unpublished: [255, 152, 0],
    accent1: [212, 175, 55],
    accent2: [192, 192, 192],
    accent3: [205, 127, 50],
    lightGray: [248, 249, 250],
    excellent: [0, 120, 215],
    veryGood: [0, 176, 80],
    good: [112, 173, 71],
    average: [255, 192, 0],
    needsImprovement: [255, 100, 100],
  };

  const margin = {
    left: 10,
    right: 10,
    top: 15,
    bottom: 20,
  };

  let yPosition = margin.top;

  const schoolName = schoolData.name || t("school_name");
  const academicYear =
    schoolData.active_academic_year || t("current_academic_year");
  const schoolEmail = schoolData.email || "";
  const schoolCity = schoolData.city || "";

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${t("academic_year")}: ${academicYear}`,
    doc.internal.pageSize.getWidth() / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 5;

  if (schoolEmail || schoolCity) {
    const contactInfo = [schoolCity, schoolEmail].filter(Boolean).join(" • ");
    doc.setFontSize(10);
    doc.text(contactInfo, doc.internal.pageSize.getWidth() / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;
  } else {
    yPosition += 5;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 10;

  const processedData = data.map((item, index) => {
    const rank = isNaN(item.Rank) ? "-" : item.Rank;
    return {
      SN: index + 1,
      Name: item.Name,
      Average:
        typeof item.Average === "number"
          ? item.Average.toFixed(2)
          : item.Average,
      Rank: rank,
      Status:
        parseFloat(item.Average.toString()) >= passingScore
          ? t("pass")
          : t("fail"),
      Published: item.Published === "Yes" ? t("yes") : t("no"),
    };
  });

  const tableColumns = [
    { header: t("serial_number"), dataKey: "SN" },
    { header: t("student_name"), dataKey: "Name" },
    { header: t("average"), dataKey: "Average" },
    { header: t("rank"), dataKey: "Rank" },
    { header: t("status"), dataKey: "Status" },
    { header: t("published"), dataKey: "Published" },
  ];

  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin.left - margin.right;
  const columnWidths = {
    SN: 0.05,
    Name: 0.4,
    Average: 0.15,
    Rank: 0.1,
    Status: 0.15,
    Published: 0.15,
  };

  const didDrawCell = (data) => {
    if (data.section === "head") return true;
    if (!data.column) return true;

    const column = tableColumns[data.column.index]?.dataKey;
    const cellValue = data.cell.raw;
    if (cellValue === undefined || cellValue === null) return true;

    const { x, y, width, height } = data.cell;

    const fillBackground = () => {
      const isAlternate = data.row.index % 2 === 1;
      const bgColor = isAlternate ? COLORS.lightGray : [255, 255, 255];
      doc.setFillColor(...bgColor);
      doc.rect(x, y, width, height, "F");
    };

    if (column === "Status") {
      const isPassing = cellValue === t("pass");
      fillBackground();
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    } else if (column === "Published") {
      const isPublished = cellValue === t("yes");
      fillBackground();
      doc.setTextColor(
        ...(isPublished ? COLORS.published : COLORS.unpublished)
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      return false;
    } else if (column === "Average") {
      const score = parseFloat(cellValue);
      const isPassing = !isNaN(score) && score >= passingScore;
      fillBackground();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    } else if (column === "Rank") {
      const rank = cellValue;
      fillBackground();
      if (!isNaN(parseInt(rank))) {
        const rankNum = parseInt(rank);
        doc.setFont("helvetica", rankNum <= 3 ? "bold" : "normal");
        doc.setFontSize(9);
        if (rankNum === 1) {
          doc.setTextColor(...COLORS.accent1);
        } else if (rankNum === 2) {
          doc.setTextColor(...COLORS.accent2);
        } else if (rankNum === 3) {
          doc.setTextColor(...COLORS.accent3);
        } else {
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
      }
      doc.text(rank.toString(), x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    }
    return true;
  };

  const columnStylesObj = {};
  tableColumns.forEach((col) => {
    const ratio = columnWidths[col.dataKey] || 0.1;
    columnStylesObj[col.dataKey] = {
      cellWidth: usableWidth * ratio,
      halign: col.dataKey === "Name" ? "left" : "center",
    };
  });

  autoTable(doc, {
    startY: yPosition,
    columns: tableColumns,
    body: processedData,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
    },
    columnStyles: columnStylesObj,
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: margin.left, right: margin.right },
    didDrawCell: didDrawCell,
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.text(
        `${t("page")} ${doc.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.setFontSize(8);
      doc.text(schoolName, margin.left, doc.internal.pageSize.getHeight() - 10);

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      doc.text(
        `${t("generated")}: ${dateStr}`,
        doc.internal.pageSize.getWidth() - margin.right,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const averages = processedData
    .map((item) => parseFloat(item.Average))
    .filter((score) => !isNaN(score));
  const passCount = processedData.filter(
    (item) => item.Status === t("pass")
  ).length;
  const avgScore =
    averages.length > 0
      ? averages.reduce((a, b) => a + b, 0) / averages.length
      : 0;

  const excellentCount = classStatistics.excellent_count || 0;
  const veryGoodCount = classStatistics.very_good_count || 0;
  const goodCount = classStatistics.good_count || 0;
  const averageCount = classStatistics.average_count || 0;
  const needsImprovementCount = classStatistics.needs_improvement_count || 0;

  const highestAverage =
    classStatistics.highest_average || Math.max(...averages, 0).toFixed(2);
  const lowestAverage =
    classStatistics.lowest_average || Math.min(...averages, 0).toFixed(2);

  const sortedStudents = [...processedData].sort(
    (a, b) => parseFloat(b.Average) - parseFloat(a.Average)
  );
  const topStudents = sortedStudents.slice(0, 3);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin.left, finalY - 5, pageWidth - margin.right, finalY - 5);

  const leftColX = margin.left;
  const rightColX = pageWidth / 2 + 10;
  let statsY = finalY + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(t("performance_summary"), leftColX, finalY);
  statsY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("general_statistics"), leftColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(`${t("total_students")}: ${processedData.length}`, leftColX, statsY);
  statsY += 5;

  doc.text(
    `${t("pass_rate")}: ${((passCount / processedData.length) * 100).toFixed(
      1
    )}%`,
    leftColX,
    statsY
  );
  statsY += 5;

  doc.text(`${t("class_average")}: ${avgScore.toFixed(2)}`, leftColX, statsY);
  statsY += 5;

  doc.text(`${t("highest_average")}: ${highestAverage}`, leftColX, statsY);
  statsY += 5;

  doc.text(`${t("lowest_average")}: ${lowestAverage}`, leftColX, statsY);
  statsY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("top_performing_students"), leftColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  topStudents.forEach((student, index) => {
    const rank = parseInt(student.Rank);
    if (rank <= 3) {
      const medalColor =
        rank === 1
          ? COLORS.accent1
          : rank === 2
          ? COLORS.accent2
          : COLORS.accent3;
      doc.setTextColor(...medalColor);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${rank}. ${student.Name}: ${student.Average}`,
        leftColX,
        statsY
      );
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      statsY += 5;
    }
  });

  statsY = finalY + 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("performance_distribution"), rightColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const totalStudents = processedData.length || 1;

  doc.setTextColor(...COLORS.excellent);
  doc.text(
    `${t("excellent")} (≥16): ${excellentCount} (${(
      (excellentCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.veryGood);
  doc.text(
    `${t("very_good")} (14-15.9): ${veryGoodCount} (${(
      (veryGoodCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.good);
  doc.text(
    `${t("good")} (12-13.9): ${goodCount} (${(
      (goodCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.average);
  doc.text(
    `${t("average")} (10-11.9): ${averageCount} (${(
      (averageCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.needsImprovement);
  doc.text(
    `${t("needs_improvement")} (<10): ${needsImprovementCount} (${(
      (needsImprovementCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 10;

  doc.setTextColor(0, 0, 0);

  if (
    excellentCount ||
    veryGoodCount ||
    goodCount ||
    averageCount ||
    needsImprovementCount
  ) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(t("performance_distribution_chart"), rightColX, statsY);
    statsY += 10;

    const chartWidth = 100;
    const chartHeight = 10;
    const chartX = rightColX;
    const chartY = statsY;

    const totalCount =
      excellentCount +
      veryGoodCount +
      goodCount +
      averageCount +
      needsImprovementCount;
    if (totalCount > 0) {
      const excellentWidth = (excellentCount / totalCount) * chartWidth;
      const veryGoodWidth = (veryGoodCount / totalCount) * chartWidth;
      const goodWidth = (goodCount / totalCount) * chartWidth;
      const averageWidth = (averageCount / totalCount) * chartWidth;
      const needsImprovementWidth =
        (needsImprovementCount / totalCount) * chartWidth;

      let currentX = chartX;

      if (excellentCount > 0) {
        doc.setFillColor(...COLORS.excellent);
        doc.rect(currentX, chartY, excellentWidth, chartHeight, "F");
        currentX += excellentWidth;
      }

      if (veryGoodCount > 0) {
        doc.setFillColor(...COLORS.veryGood);
        doc.rect(currentX, chartY, veryGoodWidth, chartHeight, "F");
        currentX += veryGoodWidth;
      }

      if (goodCount > 0) {
        doc.setFillColor(...COLORS.good);
        doc.rect(currentX, chartY, goodWidth, chartHeight, "F");
        currentX += goodWidth;
      }

      if (averageCount > 0) {
        doc.setFillColor(...COLORS.average);
        doc.rect(currentX, chartY, averageWidth, chartHeight, "F");
        currentX += averageWidth;
      }

      if (needsImprovementCount > 0) {
        doc.setFillColor(...COLORS.needsImprovement);
        doc.rect(currentX, chartY, needsImprovementWidth, chartHeight, "F");
      }

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.rect(chartX, chartY, chartWidth, chartHeight, "S");
    }
  }

  doc.save(`${filename}.pdf`);
};

export const exportTermSubjectScoresToPDF = (
  t,
  data,
  filename,
  title,
  schoolData = {},
  passingScore = 10
) => {
  if (!data.length) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [60, 90, 150],
    pass: [46, 184, 92],
    fail: [229, 57, 53],
    published: [33, 150, 243],
    unpublished: [255, 152, 0],
    accent1: [212, 175, 55],
    accent2: [192, 192, 192],
    accent3: [205, 127, 50],
    lightGray: [248, 249, 250],
  };

  const margin = {
    left: 15,
    right: 15,
    top: 12,
    bottom: 15,
  };

  let yPosition = margin.top;

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

  // Contact info (if any)
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

  // Title (passed as parameter)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  // Calculate statistics
  const scores = data
    .map((item) => parseFloat(item.Score))
    .filter((score) => !isNaN(score));
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const avgScore = scores.length ? (sum / scores.length).toFixed(1) : "0.0";
  const highestScore = scores.length ? Math.max(...scores).toFixed(1) : "0.0";
  const lowestScore = scores.length ? Math.min(...scores).toFixed(1) : "0.0";
  const passingCount = scores.filter((score) => score >= passingScore).length;
  const passRate = scores.length
    ? ((passingCount / scores.length) * 100).toFixed(1)
    : "0.0";

  const absent = data.filter((item) => item.Absent).length;
  // Note: For Published we check against translated "yes" since tableData will be translated too.
  const published = data.filter((item) => item.Published === "Yes").length;
  const publishRate = data.length
    ? ((published / data.length) * 100).toFixed(1)
    : "0.0";

  // Define table headers using translation
  const tableHeaders = [
    [
      { content: "SN" },
      { content: t("studentName") },
      {
        content: t("scoreUnit", { max: 20 }),
        styles: {
          halign: "center",
          fillColor: COLORS.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      },
      { content: t("rank") },
      { content: t("status") },
      { content: t("published") },
    ],
  ];

  // Prepare table data (translate status and published fields)
  const tableData = data.map((item) => [
    item.SN,
    item.Name,
    item.Score,
    item.Rank,
    parseFloat(item.Score) >= passingScore ? t("pass") : t("fail"),
    item.Published === "Yes" ? t("yes") : t("no"),
  ]);

  // Calculate column widths
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin.left - margin.right;

  const snWidth = usableWidth * 0.06;
  const nameWidth = usableWidth * 0.36;
  const scoreWidth = usableWidth * 0.15;
  const rankWidth = usableWidth * 0.13;
  const statusWidth = usableWidth * 0.15;
  const publishWidth = usableWidth * 0.15;

  const colWidths = [
    snWidth,
    nameWidth,
    scoreWidth,
    rankWidth,
    statusWidth,
    publishWidth,
  ];

  // Custom cell drawing function
  const didDrawCell = (data) => {
    if (data.section === "head") return true;
    if (data.row.section !== "body") return true;
    if (data.cell.raw === undefined || data.cell.raw === null) return true;

    const { x, y, width, height } = data.cell;
    const cellValue = data.cell.raw.toString();
    const colIndex = data.column.index;

    // Alternate row background
    const isAlternate = data.row.index % 2 === 1;
    const bgColor = isAlternate ? COLORS.lightGray : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(x, y, width, height, "F");

    // For SN and Name columns
    if (colIndex <= 1) {
      doc.setFont("helvetica", colIndex === 0 ? "normal" : "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const align = colIndex === 0 ? "center" : "left";
      const xPos = colIndex === 0 ? x + width / 2 : x + 2;
      doc.text(cellValue, xPos, y + height / 2, { align, baseline: "middle" });
      return false;
    }

    // For Score column
    if (colIndex === 2) {
      const score = parseFloat(cellValue);
      const isPassing = !isNaN(score) && score >= passingScore;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      return false;
    }

    // For Status column
    if (colIndex === 4) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(
        ...(cellValue === t("pass") ? COLORS.pass : COLORS.fail)
      );
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      return false;
    }

    // For Published column
    if (colIndex === 5) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(
        ...(cellValue === t("yes") ? COLORS.published : COLORS.unpublished)
      );
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      return false;
    }

    // Default cell styling
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(cellValue, x + width / 2, y + height / 2, {
      align: "center",
      baseline: "middle",
    });
    return false;
  };

  // Create the table with autoTable
  autoTable(doc, {
    startY: yPosition,
    head: tableHeaders,
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "left" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
    },
    didDrawCell,
    margin: { left: margin.left, right: margin.right },
    tableWidth: "auto",
    styles: { overflow: "linebreak", cellWidth: "wrap" },
    columnWidth: (i) => colWidths[i],
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.text(
        t("page", { page: doc.getNumberOfPages() }),
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
      doc.setFontSize(7);
      doc.text(schoolName, margin.left, doc.internal.pageSize.getHeight() - 8);

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

  const finalY = doc.lastAutoTable.finalY + 8;

  // Draw a line before statistics
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin.left, finalY - 4, pageWidth - margin.right, finalY - 4);

  // Subject statistics title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(t("subjectStatistics"), margin.left, finalY);

  // Statistics table headers and data
  const statsHeaders = [
    [
      { content: t("averageScore") },
      { content: t("highestScore") },
      { content: t("lowestScore") },
      { content: t("passRate") },
      { content: t("publishRate") },
    ],
  ];

  const statsData = [
    [
      `${avgScore}/20`,
      `${highestScore}/20`,
      `${lowestScore}/20`,
      `${passingCount}/${scores.length} (${passRate}%)`,
      `${published}/${data.length} (${publishRate}%)`,
    ],
  ];

  autoTable(doc, {
    startY: finalY + 2,
    head: statsHeaders,
    body: statsData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
      halign: "center",
    },
    margin: { left: margin.left, right: margin.right },
    tableWidth: "auto",
  });

  const statsFinalY = doc.lastAutoTable.finalY + 8;

  // Summary section
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(t("summary"), margin.left, statsFinalY);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  let summaryY = statsFinalY + 5;
  doc.text(`• ${t("averageScore")}: ${avgScore}/20`, margin.left + 4, summaryY);
  summaryY += 4;
  doc.text(
    `• ${t("passRate")}: ${passRate}% (${passingCount} ${t("outOf")} ${
      scores.length
    })`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;
  doc.text(
    `• ${t("absentStudents")}: ${absent} (${(
      (absent / data.length) *
      100
    ).toFixed(1)}%)`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;
  doc.text(
    `• ${t("publishedResults")}: ${published} (${publishRate}%)`,
    margin.left + 4,
    summaryY
  );

  doc.save(`${filename}.pdf`);
};

export const exportYearlyOverallResultsToPDF = (
  t,
  data,
  filename,
  title,
  schoolData = {},
  passingScore = 10,
  classStatistics = {}
) => {
  if (!data.length) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [60, 90, 150],
    pass: [46, 184, 92],
    fail: [229, 57, 53],
    published: [33, 150, 243],
    unpublished: [255, 152, 0],
    accent1: [212, 175, 55],
    accent2: [192, 192, 192],
    accent3: [205, 127, 50],
    lightGray: [248, 249, 250],
    excellent: [0, 120, 215],
    veryGood: [0, 176, 80],
    good: [112, 173, 71],
    average: [255, 192, 0],
    needsImprovement: [255, 100, 100],
  };

  const margin = {
    left: 10,
    right: 10,
    top: 15,
    bottom: 20,
  };

  let yPosition = margin.top;

  const schoolName = schoolData.name || t("school_name");
  const academicYear =
    schoolData.active_academic_year || t("current_academic_year");
  const schoolEmail = schoolData.email || "";
  const schoolCity = schoolData.city || "";

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${t("academic_year")}: ${academicYear}`,
    doc.internal.pageSize.getWidth() / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 5;

  if (schoolEmail || schoolCity) {
    const contactInfo = [schoolCity, schoolEmail].filter(Boolean).join(" • ");
    doc.setFontSize(10);
    doc.text(contactInfo, doc.internal.pageSize.getWidth() / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;
  } else {
    yPosition += 5;
  }

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 10;

  const processedData = data.map((item, index) => {
    const rank = isNaN(item.Rank) ? "-" : item.Rank;
    return {
      SN: index + 1,
      Name: item.Name,
      Average:
        typeof item.Average === "number"
          ? item.Average.toFixed(2)
          : item.Average,
      Rank: rank,
      Status:
        parseFloat(item.Average.toString()) >= passingScore
          ? t("pass")
          : t("fail"),
      Published: item.Published === "Yes" ? t("yes") : t("no"),
    };
  });

  const tableColumns = [
    { header: t("serial_number"), dataKey: "SN" },
    { header: t("student_name"), dataKey: "Name" },
    { header: t("yearly_average"), dataKey: "Average" },
    { header: t("class_rank"), dataKey: "Rank" },
    { header: t("status"), dataKey: "Status" },
    { header: t("published"), dataKey: "Published" },
  ];

  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin.left - margin.right;
  const columnWidths = {
    SN: 0.05,
    Name: 0.4,
    Average: 0.15,
    Rank: 0.1,
    Status: 0.15,
    Published: 0.15,
  };

  const didDrawCell = (data) => {
    if (data.section === "head") return true;
    if (!data.column) return true;

    const column = tableColumns[data.column.index]?.dataKey;
    const cellValue = data.cell.raw;
    if (cellValue === undefined || cellValue === null) return true;

    const { x, y, width, height } = data.cell;

    const fillBackground = () => {
      const isAlternate = data.row.index % 2 === 1;
      const bgColor = isAlternate ? COLORS.lightGray : [255, 255, 255];
      doc.setFillColor(...bgColor);
      doc.rect(x, y, width, height, "F");
    };

    if (column === "Status") {
      const isPassing = cellValue === t("pass");
      fillBackground();
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    } else if (column === "Published") {
      const isPublished = cellValue === t("yes");
      fillBackground();
      doc.setTextColor(
        ...(isPublished ? COLORS.published : COLORS.unpublished)
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      return false;
    } else if (column === "Average") {
      const score = parseFloat(cellValue);
      const isPassing = !isNaN(score) && score >= passingScore;
      fillBackground();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    } else if (column === "Rank") {
      const rank = cellValue;
      fillBackground();
      if (!isNaN(parseInt(rank))) {
        const rankNum = parseInt(rank);
        doc.setFont("helvetica", rankNum <= 3 ? "bold" : "normal");
        doc.setFontSize(9);
        if (rankNum === 1) {
          doc.setTextColor(...COLORS.accent1);
        } else if (rankNum === 2) {
          doc.setTextColor(...COLORS.accent2);
        } else if (rankNum === 3) {
          doc.setTextColor(...COLORS.accent3);
        } else {
          doc.setTextColor(0, 0, 0);
        }
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
      }
      doc.text(rank.toString(), x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      return false;
    }
    return true;
  };

  const columnStylesObj = {};
  tableColumns.forEach((col) => {
    const ratio = columnWidths[col.dataKey] || 0.1;
    columnStylesObj[col.dataKey] = {
      cellWidth: usableWidth * ratio,
      halign: col.dataKey === "Name" ? "left" : "center",
    };
  });

  autoTable(doc, {
    startY: yPosition,
    columns: tableColumns,
    body: processedData,
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle",
    },
    columnStyles: columnStylesObj,
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: margin.left, right: margin.right },
    didDrawCell: didDrawCell,
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.text(
        `${t("page")} ${doc.getNumberOfPages()}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.setFontSize(8);
      doc.text(schoolName, margin.left, doc.internal.pageSize.getHeight() - 10);

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      doc.text(
        `${t("generated")}: ${dateStr}`,
        doc.internal.pageSize.getWidth() - margin.right,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const averages = processedData
    .map((item) => parseFloat(item.Average))
    .filter((score) => !isNaN(score));
  const passCount = processedData.filter(
    (item) => item.Status === t("pass")
  ).length;
  const avgScore =
    averages.length > 0
      ? averages.reduce((a, b) => a + b, 0) / averages.length
      : 0;

  const excellentCount = classStatistics.excellent_count || 0;
  const veryGoodCount = classStatistics.very_good_count || 0;
  const goodCount = classStatistics.good_count || 0;
  const averageCount = classStatistics.average_count || 0;
  const needsImprovementCount = classStatistics.needs_improvement_count || 0;

  const highestAverage =
    classStatistics.highest_average || Math.max(...averages, 0).toFixed(2);
  const lowestAverage =
    classStatistics.lowest_average || Math.min(...averages, 0).toFixed(2);

  const sortedStudents = [...processedData].sort(
    (a, b) => parseFloat(b.Average) - parseFloat(a.Average)
  );
  const topStudents = sortedStudents.slice(0, 3);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin.left, finalY - 5, pageWidth - margin.right, finalY - 5);

  const leftColX = margin.left;
  const rightColX = pageWidth / 2 + 10;
  let statsY = finalY + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(t("yearly_performance_summary"), leftColX, finalY);
  statsY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("general_statistics"), leftColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(`${t("total_students")}: ${processedData.length}`, leftColX, statsY);
  statsY += 5;

  doc.text(
    `${t("yearly_pass_rate")}: ${(
      (passCount / processedData.length) *
      100
    ).toFixed(1)}%`,
    leftColX,
    statsY
  );
  statsY += 5;

  doc.text(
    `${t("yearly_class_average")}: ${avgScore.toFixed(2)}`,
    leftColX,
    statsY
  );
  statsY += 5;

  doc.text(
    `${t("highest_yearly_average")}: ${highestAverage}`,
    leftColX,
    statsY
  );
  statsY += 5;

  doc.text(`${t("lowest_yearly_average")}: ${lowestAverage}`, leftColX, statsY);
  statsY += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("top_performing_students"), leftColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  topStudents.forEach((student, index) => {
    const rank = parseInt(student.Rank);
    if (rank <= 3) {
      const medalColor =
        rank === 1
          ? COLORS.accent1
          : rank === 2
          ? COLORS.accent2
          : COLORS.accent3;
      doc.setTextColor(...medalColor);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${rank}. ${student.Name}: ${student.Average}`,
        leftColX,
        statsY
      );
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      statsY += 5;
    }
  });

  statsY = finalY + 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(t("yearly_performance_distribution"), rightColX, statsY);
  statsY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const totalStudents = processedData.length || 1;

  doc.setTextColor(...COLORS.excellent);
  doc.text(
    `${t("excellent")} (≥16): ${excellentCount} (${(
      (excellentCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.veryGood);
  doc.text(
    `${t("very_good")} (14-15.9): ${veryGoodCount} (${(
      (veryGoodCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.good);
  doc.text(
    `${t("good")} (12-13.9): ${goodCount} (${(
      (goodCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.average);
  doc.text(
    `${t("average")} (10-11.9): ${averageCount} (${(
      (averageCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 5;

  doc.setTextColor(...COLORS.needsImprovement);
  doc.text(
    `${t("needs_improvement")} (<10): ${needsImprovementCount} (${(
      (needsImprovementCount / totalStudents) *
      100
    ).toFixed(1)}%)`,
    rightColX,
    statsY
  );
  statsY += 10;

  doc.setTextColor(0, 0, 0);

  if (
    excellentCount ||
    veryGoodCount ||
    goodCount ||
    averageCount ||
    needsImprovementCount
  ) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(t("yearly_performance_distribution_chart"), rightColX, statsY);
    statsY += 10;

    const chartWidth = 100;
    const chartHeight = 10;
    const chartX = rightColX;
    const chartY = statsY;

    const totalCount =
      excellentCount +
      veryGoodCount +
      goodCount +
      averageCount +
      needsImprovementCount;
    if (totalCount > 0) {
      const excellentWidth = (excellentCount / totalCount) * chartWidth;
      const veryGoodWidth = (veryGoodCount / totalCount) * chartWidth;
      const goodWidth = (goodCount / totalCount) * chartWidth;
      const averageWidth = (averageCount / totalCount) * chartWidth;
      const needsImprovementWidth =
        (needsImprovementCount / totalCount) * chartWidth;

      let currentX = chartX;

      if (excellentCount > 0) {
        doc.setFillColor(...COLORS.excellent);
        doc.rect(currentX, chartY, excellentWidth, chartHeight, "F");
        currentX += excellentWidth;
      }

      if (veryGoodCount > 0) {
        doc.setFillColor(...COLORS.veryGood);
        doc.rect(currentX, chartY, veryGoodWidth, chartHeight, "F");
        currentX += veryGoodWidth;
      }

      if (goodCount > 0) {
        doc.setFillColor(...COLORS.good);
        doc.rect(currentX, chartY, goodWidth, chartHeight, "F");
        currentX += goodWidth;
      }

      if (averageCount > 0) {
        doc.setFillColor(...COLORS.average);
        doc.rect(currentX, chartY, averageWidth, chartHeight, "F");
        currentX += averageWidth;
      }

      if (needsImprovementCount > 0) {
        doc.setFillColor(...COLORS.needsImprovement);
        doc.rect(currentX, chartY, needsImprovementWidth, chartHeight, "F");
      }

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.rect(chartX, chartY, chartWidth, chartHeight, "S");
    }
  }

  doc.save(`${filename}.pdf`);
};

export const exportYearlySubjectScoresToPDF = (
  t,
  data,
  filename,
  title,
  schoolData = {},
  passingScore = 10
) => {
  if (!data.length) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const COLORS = {
    primary: [60, 90, 150],
    pass: [46, 184, 92],
    fail: [229, 57, 53],
    published: [33, 150, 243],
    unpublished: [255, 152, 0],
    accent1: [212, 175, 55],
    accent2: [192, 192, 192],
    accent3: [205, 127, 50],
    lightGray: [248, 249, 250],
  };

  const margin = {
    left: 15,
    right: 15,
    top: 12,
    bottom: 15,
  };

  let yPosition = margin.top;

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

  // Contact info (if any)
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

  // Title (passed as parameter)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.getWidth() / 2, yPosition, {
    align: "center",
  });
  yPosition += 8;

  // Calculate statistics
  const scores = data
    .map((item) => parseFloat(item.Score))
    .filter((score) => !isNaN(score));
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const avgScore = scores.length ? (sum / scores.length).toFixed(1) : "0.0";
  const highestScore = scores.length ? Math.max(...scores).toFixed(1) : "0.0";
  const lowestScore = scores.length ? Math.min(...scores).toFixed(1) : "0.0";
  const passingCount = scores.filter((score) => score >= passingScore).length;
  const passRate = scores.length
    ? ((passingCount / scores.length) * 100).toFixed(1)
    : "0.0";

  const absent = data.filter((item) => item.Absent).length;
  // Note: For Published we check against translated "yes" since tableData will be translated too.
  const published = data.filter((item) => item.Published === "Yes").length;
  const publishRate = data.length
    ? ((published / data.length) * 100).toFixed(1)
    : "0.0";

  // Define table headers using translation
  const tableHeaders = [
    [
      { content: "SN" },
      { content: t("studentName") },
      {
        content: t("scoreUnit", { max: 20 }),
        styles: {
          halign: "center",
          fillColor: COLORS.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      },
      { content: t("yearlyRank") },
      { content: t("status") },
      { content: t("published") },
    ],
  ];

  // Prepare table data (translate status and published fields)
  const tableData = data.map((item) => [
    item.SN,
    item.Name,
    item.Score,
    item.Rank,
    parseFloat(item.Score) >= passingScore ? t("pass") : t("fail"),
    item.Published === "Yes" ? t("yes") : t("no"),
  ]);

  // Calculate column widths
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin.left - margin.right;

  const snWidth = usableWidth * 0.06;
  const nameWidth = usableWidth * 0.36;
  const scoreWidth = usableWidth * 0.15;
  const rankWidth = usableWidth * 0.13;
  const statusWidth = usableWidth * 0.15;
  const publishWidth = usableWidth * 0.15;

  const colWidths = [
    snWidth,
    nameWidth,
    scoreWidth,
    rankWidth,
    statusWidth,
    publishWidth,
  ];

  // Custom cell drawing function
  const didDrawCell = (data) => {
    if (data.section === "head") return true;
    if (data.row.section !== "body") return true;
    if (data.cell.raw === undefined || data.cell.raw === null) return true;

    const { x, y, width, height } = data.cell;
    const cellValue = data.cell.raw.toString();
    const colIndex = data.column.index;

    // Alternate row background
    const isAlternate = data.row.index % 2 === 1;
    const bgColor = isAlternate ? COLORS.lightGray : [255, 255, 255];
    doc.setFillColor(...bgColor);
    doc.rect(x, y, width, height, "F");

    // For SN and Name columns
    if (colIndex <= 1) {
      doc.setFont("helvetica", colIndex === 0 ? "normal" : "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const align = colIndex === 0 ? "center" : "left";
      const xPos = colIndex === 0 ? x + width / 2 : x + 2;
      doc.text(cellValue, xPos, y + height / 2, { align, baseline: "middle" });
      return false;
    }

    // For Score column
    if (colIndex === 2) {
      const score = parseFloat(cellValue);
      const isPassing = !isNaN(score) && score >= passingScore;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...(isPassing ? COLORS.pass : COLORS.fail));
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      return false;
    }

    // For Status column
    if (colIndex === 4) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(
        ...(cellValue === t("pass") ? COLORS.pass : COLORS.fail)
      );
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      return false;
    }

    // For Published column
    if (colIndex === 5) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(
        ...(cellValue === t("yes") ? COLORS.published : COLORS.unpublished)
      );
      doc.text(cellValue, x + width / 2, y + height / 2, {
        align: "center",
        baseline: "middle",
      });
      return false;
    }

    // Default cell styling
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(cellValue, x + width / 2, y + height / 2, {
      align: "center",
      baseline: "middle",
    });
    return false;
  };

  // Create the table with autoTable
  autoTable(doc, {
    startY: yPosition,
    head: tableHeaders,
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    columnStyles: {
      0: { halign: "center" },
      1: { halign: "left" },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center" },
    },
    didDrawCell,
    margin: { left: margin.left, right: margin.right },
    tableWidth: "auto",
    styles: { overflow: "linebreak", cellWidth: "wrap" },
    columnWidth: (i) => colWidths[i],
    didDrawPage: (data) => {
      doc.setFontSize(7);
      doc.text(
        t("page", { page: doc.getNumberOfPages() }),
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
      doc.setFontSize(7);
      doc.text(schoolName, margin.left, doc.internal.pageSize.getHeight() - 8);

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

  const finalY = doc.lastAutoTable.finalY + 8;

  // Draw a line before statistics
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin.left, finalY - 4, pageWidth - margin.right, finalY - 4);

  // Subject statistics title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(t("yearlySubjectStatistics"), margin.left, finalY);

  // Statistics table headers and data
  const statsHeaders = [
    [
      { content: t("yearlyAverageScore") },
      { content: t("yearlyHighestScore") },
      { content: t("yearlyLowestScore") },
      { content: t("yearlyPassRate") },
      { content: t("yearlyPublishRate") },
    ],
  ];

  const statsData = [
    [
      `${avgScore}/20`,
      `${highestScore}/20`,
      `${lowestScore}/20`,
      `${passingCount}/${scores.length} (${passRate}%)`,
      `${published}/${data.length} (${publishRate}%)`,
    ],
  ];

  autoTable(doc, {
    startY: finalY + 2,
    head: statsHeaders,
    body: statsData,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
      halign: "center",
    },
    margin: { left: margin.left, right: margin.right },
    tableWidth: "auto",
  });

  const statsFinalY = doc.lastAutoTable.finalY + 8;

  // Summary section
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(t("yearlySummary"), margin.left, statsFinalY);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  let summaryY = statsFinalY + 5;
  doc.text(
    `• ${t("yearlyAverageScore")}: ${avgScore}/20`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;
  doc.text(
    `• ${t("yearlyPassRate")}: ${passRate}% (${passingCount} ${t("outOf")} ${
      scores.length
    })`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;
  doc.text(
    `• ${t("yearlyAbsentStudents")}: ${absent} (${(
      (absent / data.length) *
      100
    ).toFixed(1)}%)`,
    margin.left + 4,
    summaryY
  );
  summaryY += 4;
  doc.text(
    `• ${t("yearlyPublishedResults")}: ${published} (${publishRate}%)`,
    margin.left + 4,
    summaryY
  );

  doc.save(`${filename}.pdf`);
};
