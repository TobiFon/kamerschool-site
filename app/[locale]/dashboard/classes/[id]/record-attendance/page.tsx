"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  recordClassAttendance,
  fetchDailyAttendance,
} from "@/queries/attendance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check, Clock, FileText, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statusColors = {
  present: "bg-emerald-500 text-white",
  absent: "bg-rose-500 text-white",
  late: "bg-amber-500 text-white",
  excused: "bg-blue-500 text-white",
};

const statusIcons = {
  present: <Check className="h-3 w-3" />,
  absent: <X className="h-3 w-3" />,
  late: <Clock className="h-3 w-3" />,
  excused: <FileText className="h-3 w-3" />,
};

interface StudentAttendanceInput {
  student_id: number;
  matricule: string;
  name: string;
  status: "present" | "absent" | "late" | "excused";
  remarks: string;
}

interface RecordAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  AcademicYear: string;
  students: Array<{
    student_id: number;
    matricule: string;
    name: string;
  }>;
  date?: string;
  onSuccess?: () => void;
}

const RecordAttendanceDialog: React.FC<RecordAttendanceDialogProps> = ({
  open,
  onOpenChange,
  classId,
  className,
  students,
  date: initialDate,
  onSuccess,
  AcademicYear,
}) => {
  const t = useTranslations("attendance");
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(
    initialDate ? parseISO(initialDate) : new Date()
  );
  const [attendanceData, setAttendanceData] = useState<
    StudentAttendanceInput[]
  >([]);
  const [filterText, setFilterText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Compute the formatted date to use in queries and local storage keys
  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";

  // Local storage key for unsaved attendance data
  const storageKey = `recordAttendanceDialog_${classId}_${AcademicYear}_${formattedDate}`;

  const { data: existingData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["attendance", "daily", classId, formattedDate],
    queryFn: () => fetchDailyAttendance(classId, formattedDate),
    enabled: !!formattedDate && open,
    refetchOnWindowFocus: false,
  });

  // Helper function to initialize attendance data from students and any existing record
  const initializeAttendance = () => {
    setIsLoading(true);
    const sortedStudents = [...students].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const initialData = sortedStudents.map((student) => {
      const existingRecord = existingData?.students?.find(
        (s) => s.student_id === student.student_id
      )?.attendance;
      return {
        student_id: student.student_id,
        matricule: student.matricule,
        name: student.name,
        status: existingRecord?.status || "present",
        remarks: existingRecord?.remarks || "",
      };
    });
    setAttendanceData(initialData);
    setIsLoading(false);
  };

  // On open or when date/students change, try to restore unsaved attendance data from localStorage.
  // If none exists, initialize the data.
  useEffect(() => {
    if (open && date && students.length > 0) {
      const savedAttendance = localStorage.getItem(storageKey);
      if (savedAttendance) {
        try {
          setAttendanceData(JSON.parse(savedAttendance));
        } catch (error) {
          console.error("Error parsing saved attendance data:", error);
          initializeAttendance();
        }
      } else {
        initializeAttendance();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date, students, existingData]);

  // Persist unsaved changes to localStorage on every change.
  useEffect(() => {
    if (open && date) {
      localStorage.setItem(storageKey, JSON.stringify(attendanceData));
    }
  }, [attendanceData, open, date, storageKey]);

  const mutation = useMutation({
    mutationFn: ({
      date,
      students,
    }: {
      date: string;
      students: Array<{
        student_id: number;
        status: "present" | "absent" | "late" | "excused";
        remarks?: string;
      }>;
    }) => recordClassAttendance(classId, date, students),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance", "weekly", classId],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance", "daily", classId],
      });

      // Clear saved attendance data after successful submission.
      localStorage.removeItem(storageKey);

      toast.success(t("attendanceRecorded"), {
        description: t("attendanceRecordedSuccess"),
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(t("error"), {
        description: error.message || t("attendanceRecordedError"),
      });
    },
  });

  const filteredStudents = attendanceData.filter(
    (student) =>
      student.name.toLowerCase().includes(filterText.toLowerCase()) ||
      student.matricule.toLowerCase().includes(filterText.toLowerCase())
  );

  const updateStudentStatus = (
    studentId: number,
    status: "present" | "absent" | "late" | "excused"
  ) => {
    setAttendanceData((current) =>
      current.map((student) =>
        student.student_id === studentId ? { ...student, status } : student
      )
    );
  };

  const updateStudentRemarks = (studentId: number, remarks: string) => {
    setAttendanceData((current) =>
      current.map((student) =>
        student.student_id === studentId ? { ...student, remarks } : student
      )
    );
  };

  const bulkUpdateStatus = (
    status: "present" | "absent" | "late" | "excused"
  ) => {
    const studentIds = filteredStudents.map((student) => student.student_id);
    setAttendanceData((current) =>
      current.map((student) =>
        studentIds.includes(student.student_id)
          ? { ...student, status }
          : student
      )
    );
  };

  const handleSubmit = () => {
    if (!date) {
      toast.error(t("error"), {
        description: t("selectDate"),
      });
      return;
    }

    const formattedDate = format(date, "yyyy-MM-dd");

    const submitData = attendanceData.map((student) => ({
      student_id: student.student_id,
      status: student.status,
      remarks: student.remarks,
    }));

    mutation.mutate({ date: formattedDate, students: submitData });
  };

  const isEditing = existingData?.recorded_count > 0;

  const dateChangeHandler = (newDate: Date | undefined) => {
    setDate(newDate);
    setCalendarOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("updateAttendance") : t("recordAttendance")}
          </DialogTitle>
          <DialogDescription>
            {className} • {date ? format(date, "MMMM d, yyyy") : ""}
            {isEditing && (
              <Badge variant="outline" className="ml-2">
                {t("existingRecords")}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 my-2">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block text-gray-700">
              {t("date")}
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>{t("selectDate")}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={dateChangeHandler}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <Input
              placeholder={t("searchStudents")}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t("bulkActions")}:</span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => bulkUpdateStatus("present")}
              >
                <Check className="h-3.5 w-3.5" />
                {t("present")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={() => bulkUpdateStatus("absent")}
              >
                <X className="h-3.5 w-3.5" />
                {t("absent")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => bulkUpdateStatus("late")}
              >
                <Clock className="h-3.5 w-3.5" />
                {t("late")}
              </Button>
            </div>
          </div>

          <div className="border rounded-md flex-1 overflow-y-auto">
            {isLoading || isLoadingAttendance ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-t-2 border-b-2 border-gray-300 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-500">
                  {t("loadingData")}...
                </span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16">#</TableHead>
                    <TableHead className="w-1/3">{t("student")}</TableHead>
                    <TableHead className="w-1/4">{t("status")}</TableHead>
                    <TableHead>{t("remarks")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-gray-500"
                      >
                        {filterText ? t("noStudentsFound") : t("noStudents")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-gray-500">
                            {student.matricule}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={student.status}
                            onValueChange={(
                              value: "present" | "absent" | "late" | "excused"
                            ) => updateStudentStatus(student.student_id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                      statusColors[student.status]
                                    }`}
                                  >
                                    {statusIcons[student.status]}
                                  </span>
                                  <span>{t(student.status)}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.present}`}
                                  >
                                    {statusIcons.present}
                                  </span>
                                  <span>{t("present")}</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="absent">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.absent}`}
                                  >
                                    {statusIcons.absent}
                                  </span>
                                  <span>{t("absent")}</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="late">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.late}`}
                                  >
                                    {statusIcons.late}
                                  </span>
                                  <span>{t("late")}</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="excused">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-6 w-6 rounded-full flex items-center justify-center ${statusColors.excused}`}
                                  >
                                    {statusIcons.excused}
                                  </span>
                                  <span>{t("excused")}</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            placeholder={t("optionalRemarks")}
                            value={student.remarks}
                            onChange={(e) =>
                              updateStudentRemarks(
                                student.student_id,
                                e.target.value
                              )
                            }
                            className="min-h-0 h-10 resize-none"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Badge variant="outline" className="px-2">
              {filteredStudents.length} {t("studentsShown")}
            </Badge>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  mutation.isPending || isLoading || isLoadingAttendance
                }
                className="gap-2"
              >
                {mutation.isPending ? (
                  <span className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEditing ? t("updateAttendance") : t("saveAttendance")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordAttendanceDialog;
