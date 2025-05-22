"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Student {
  student_id: number;
  matricule: string;
  name: string;
}

export function useRecordAttendance(classId: string) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [existingAttendance, setExistingAttendance] = useState<
    Record<number, any> | undefined
  >(undefined);

  // Helper function to prepare existing attendance data for a specific date
  const prepareExistingAttendanceData = (weeklyData: any, date: string) => {
    if (!weeklyData?.students) return {};

    const attendanceMap: Record<number, any> = {};

    weeklyData.students.forEach((student: any) => {
      const recordForDate = student.attendance[date];
      if (recordForDate) {
        attendanceMap[student.student_id] = {
          status: recordForDate.status,
          remarks: recordForDate.remarks || "",
        };
      }
    });

    return attendanceMap;
  };

  // Function to open dialog for creating new attendance
  const openCreateDialog = () => {
    setSelectedDate(undefined);
    setExistingAttendance(undefined);
    setIsDialogOpen(true);
  };

  // Function to open dialog for editing existing attendance
  const openEditDialog = (date: string, weeklyData: any) => {
    setSelectedDate(date);
    setExistingAttendance(prepareExistingAttendanceData(weeklyData, date));
    setIsDialogOpen(true);
  };

  // Extract students from weekly data (for use when editing)
  const extractStudentsFromWeeklyData = (weeklyData: any): Student[] => {
    if (!weeklyData?.students) return [];

    return weeklyData.students.map((student: any) => ({
      student_id: student.student_id,
      matricule: student.matricule,
      name: student.name,
    }));
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    selectedDate,
    existingAttendance,
    openCreateDialog,
    openEditDialog,
    extractStudentsFromWeeklyData,
  };
}
