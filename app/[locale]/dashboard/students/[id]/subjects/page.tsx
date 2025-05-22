"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

// Import query functions
import { fetchStudentById } from "@/queries/students";
import {
  fetchClassSubjects,
  fetchStudentSubjectEnrollments,
  bulkUpdateStudentSubjects,
} from "@/queries/subjects";
import StudentSubjectsHeader from "./_components/StudentSubjectHeader";
import AvailableSubjectsSelection from "./_components/AvailableSubjectsSelection";
import SelectedStudentSubjectsList from "./_components/SelectedStudentSubjectList";

const StudentSubjectsPage = () => {
  const t = useTranslations("Students");
  const router = useRouter();
  const params = useParams();
  const studentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();

  const [selectedClassSubjectIds, setSelectedClassSubjectIds] = useState<
    Set<number>
  >(new Set());
  const [filter, setFilter] = useState("");

  // 1. Fetch Student Data (to get current class ID)
  const {
    data: studentData,
    isLoading: studentLoading,
    isError: studentError,
    error: studentErrorMsg,
  } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudentById(studentId),
    enabled: !!studentId,
  });

  const currentClassId = studentData?.class_id;

  // 2. Fetch Available Class Subjects (for the student's current class)
  const {
    data: availableClassSubjects = [],
    isLoading: subjectsLoading,
    isError: subjectsError,
  } = useQuery({
    queryKey: ["classSubjectsForClass", currentClassId],
    queryFn: () =>
      fetchClassSubjects(currentClassId ? currentClassId.toString() : ""),
    enabled: !!currentClassId,
  });

  // 3. Fetch Student's Current Enrollments
  const {
    data: currentEnrollments = [],
    isLoading: enrollmentsLoading,
    isError: enrollmentsError,
  } = useQuery({
    queryKey: ["studentSubjectEnrollments", studentId],
    queryFn: () => fetchStudentSubjectEnrollments(studentId),
    enabled: !!studentId,
  });

  // Find mandatory subjects
  const mandatorySubjects = useMemo(() => {
    return availableClassSubjects
      .filter((subject) => subject.mandatory)
      .map((subject) => subject.id);
  }, [availableClassSubjects]);

  // Initialize selected state based on current enrollments and ensure mandatory subjects are included
  useEffect(() => {
    if (currentEnrollments.length > 0 || mandatorySubjects.length > 0) {
      const initialIds = new Set(
        currentEnrollments.map((enrollment) => enrollment.class_subject)
      );

      // Add all mandatory subjects
      mandatorySubjects.forEach((id) => initialIds.add(id));

      setSelectedClassSubjectIds(initialIds);
    }
  }, [currentEnrollments, mandatorySubjects]);

  // Mutation for saving
  const bulkUpdateMutation = useMutation({
    mutationFn: (payload: { studentId: string; classSubjectIds: number[] }) => {
      // Ensure all mandatory subjects are included
      const allRequiredIds = [
        ...new Set([...payload.classSubjectIds, ...mandatorySubjects]),
      ];

      return bulkUpdateStudentSubjects(payload.studentId, allRequiredIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["studentSubjectEnrollments", studentId],
      });
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      toast.success(t("subjectsUpdatedSuccessTitle"), {
        description: t("subjectsUpdatedSuccessDesc"),
      });
    },
    onError: (error: any) => {
      toast.error(t("subjectsUpdatedErrorTitle"), {
        description: error.message || t("subjectsUpdatedErrorDesc"),
      });
    },
  });

  // Handler to add a subject
  const addSubject = (classSubject) => {
    setSelectedClassSubjectIds((prev) => new Set(prev).add(classSubject.id));
    toast.success(`${classSubject.subject_name} ${t("subjectAddedToast")}`, {
      duration: 2000,
    });
  };

  // Handler to remove a subject - prevent removing mandatory subjects
  const removeSubject = (classSubjectId: number) => {
    // Don't allow removing mandatory subjects
    if (mandatorySubjects.includes(classSubjectId)) {
      toast.error(t("cannotRemoveMandatorySubject"), {
        duration: 3000,
      });
      return;
    }

    setSelectedClassSubjectIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(classSubjectId);
      return newSet;
    });
  };

  // Memoize the subjects currently selected by the user (based on IDs)
  const selectedSubjectsDetails = useMemo(() => {
    return availableClassSubjects.filter((cs) =>
      selectedClassSubjectIds.has(cs.id)
    );
  }, [availableClassSubjects, selectedClassSubjectIds]);

  // Filter available subjects based on search and exclude selected
  const displayableAvailableSubjects = useMemo(() => {
    const lowerFilter = filter.toLowerCase();
    return availableClassSubjects
      .filter((cs) => !selectedClassSubjectIds.has(cs.id))
      .filter(
        (cs) =>
          cs.subject_name.toLowerCase().includes(lowerFilter) ||
          cs.subject_code.toLowerCase().includes(lowerFilter) ||
          (cs.teacher_name &&
            cs.teacher_name.toLowerCase().includes(lowerFilter))
      );
  }, [availableClassSubjects, selectedClassSubjectIds, filter]);

  // Handler to save changes
  const handleSave = () => {
    if (!studentId) return;
    const idsToSave = Array.from(selectedClassSubjectIds);
    bulkUpdateMutation.mutate({ studentId, classSubjectIds: idsToSave });
  };

  const isLoading =
    studentLoading ||
    subjectsLoading ||
    enrollmentsLoading ||
    bulkUpdateMutation.isPending;
  const isError = studentError || subjectsError || enrollmentsError;

  if (isLoading && !studentData) {
    return (
      <div className="container mx-auto max-w-7xl py-16">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-gray-500 font-medium">{t("loadingStudentData")}</p>
        </div>
      </div>
    );
  }

  if (isError || !studentData) {
    const errorMsg =
      studentErrorMsg instanceof Error
        ? studentErrorMsg.message
        : t("errorLoadingStudentData");
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
        </Button>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-orange-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {t("errorLoadingData")}
              </h2>
              <p className="text-gray-600 mb-4 max-w-md">
                {errorMsg}
                {subjectsError && " Failed to load subjects."}
                {enrollmentsError && " Failed to load enrollments."}
              </p>
              <Button
                onClick={() => router.push("/dashboard/students")}
                className="mt-2"
              >
                {t("returnToStudents")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 sm:px-6">
      <StudentSubjectsHeader
        studentData={studentData}
        onBack={() => router.push(`/dashboard/students/${studentId}`)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Available Subjects */}
        <div className="lg:col-span-7">
          <AvailableSubjectsSelection
            availableClassSubjects={displayableAvailableSubjects}
            filter={filter}
            setFilter={setFilter}
            addSubject={addSubject}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: Selected Subjects */}
        <div className="lg:col-span-5">
          <SelectedStudentSubjectsList
            selectedSubjects={selectedSubjectsDetails}
            removeSubject={removeSubject}
            onSave={handleSave}
            onCancel={() => router.push(`/dashboard/students/${studentId}`)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentSubjectsPage;
