"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Import fetch functions
import {
  fetchTeacher,
  fetchAvailableClassSubjects,
  updateTeacherClassSubjects,
} from "@/queries/teachers";
import ErrorDisplay from "./_components/ErrorDisplay";
import TeacherSubjectsHeader from "./_components/TeacherSubjectHeader";
import AvailableClasses from "./_components/AvailableClasses";
import AssignedSubjects from "./_components/AssignedSubjects";

// TypeScript interfaces
export interface ClassSubject {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_code: string;
  teacher_id: number | null;
  teacher_name: string | null;
  coefficient: number;
  mandatory: boolean;
}

export interface Class {
  id: number;
  name: string;
  subjects: ClassSubject[];
}

export interface TeacherClassSubject {
  id: number;
  school_class: string;
  subject: string;
  coefficient: number;
  mandatory: boolean;
}

const TeacherClassSubjectsPage = () => {
  const t = useTranslations("TeacherSubjects");
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const teacherId = params.id;

  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [expandedClassId, setExpandedClassId] = useState<number | null>(null);
  const [assignedSubjects, setAssignedSubjects] = useState<
    TeacherClassSubject[]
  >([]);
  const [subjectsToAdd, setSubjectsToAdd] = useState<
    {
      school_class: string;
      subject: string;
      subject_id: number;
      class_id: number;
    }[]
  >([]);
  const [subjectsToRemove, setSubjectsToRemove] = useState<number[]>([]);

  // Fetch teacher data
  const {
    data: teacher,
    isLoading: isTeacherLoading,
    isError: isTeacherError,
  } = useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: () => fetchTeacher(teacherId),
  });

  // Fetch available classes with subjects
  const { data: availableClasses, isLoading: isClassesLoading } = useQuery({
    queryKey: ["availableClassSubjects"],
    queryFn: () => fetchAvailableClassSubjects(),
  });

  // Initialize assigned subjects from teacher data
  useEffect(() => {
    if (teacher?.class_subjects) {
      setAssignedSubjects(teacher.class_subjects);
    }
  }, [teacher]);

  // Update teacher class subjects mutation
  const updateMutation = useMutation({
    mutationFn: () => {
      // Transform the data to match what the backend expects
      const currentAssignmentIds = new Set(
        assignedSubjects
          .filter((s) => !subjectsToRemove.includes(s.id))
          .map((s) => `${s.school_class}:${s.subject}`)
      );

      // Create a flat array of all class-subject pairs that should be assigned
      const payload = [
        ...subjectsToAdd.map((item) => ({
          school_class: item.class_id,
          subject: item.subject_id,
        })),
      ];

      // Add existing assignments that aren't being removed
      availableClasses?.forEach((cls) => {
        cls.subjects.forEach((subject) => {
          const classSubjectKey = `${cls.name}:${subject.subject_name}`;
          if (
            currentAssignmentIds.has(classSubjectKey) &&
            subject.teacher_id === parseInt(teacherId)
          ) {
            payload.push({
              school_class: cls.id,
              subject: subject.subject_id,
            });
          }
        });
      });

      return updateTeacherClassSubjects(teacherId, payload);
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["teacher", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["availableClassSubjects"] });
      queryClient.invalidateQueries({ queryKey: ["teachersList"] });

      toast.success(t("subjectsAssigned"), {
        description: t("subjectsAssignedDescription"),
      });
      setSubjectsToAdd([]);
      setSubjectsToRemove([]);
    },
    onError: (error: any) => {
      toast.error(t("errorAssigningSubjects"), {
        description: error.message,
      });
    },
  });

  // Helper functions
  const filteredClasses =
    availableClasses?.filter((cls) =>
      classFilter
        ? cls.name.toLowerCase().includes(classFilter.toLowerCase())
        : true
    ) || [];

  const toggleClassExpansion = (classId: number) => {
    setExpandedClassId(expandedClassId === classId ? null : classId);
  };

  const isSubjectAssigned = (classId: number, subjectId: number) => {
    const classObj = availableClasses?.find((c) => c.id === classId);
    const className = classObj?.name || "";
    const subjectName =
      classObj?.subjects.find((s) => s.subject_id === subjectId)
        ?.subject_name || "";
    return assignedSubjects.some(
      (s) => s.school_class === className && s.subject === subjectName
    );
  };

  const isSubjectToAdd = (classId: number, subjectId: number) => {
    return subjectsToAdd.some(
      (s) => s.class_id === classId && s.subject_id === subjectId
    );
  };

  const isSubjectToRemove = (subjectId: number) => {
    return subjectsToRemove.includes(subjectId);
  };

  const handleAddSubject = (classId: number, subjectId: number) => {
    const classObj = availableClasses?.find((c) => c.id === classId);
    const subjectObj = classObj?.subjects.find(
      (s) => s.subject_id === subjectId
    );

    if (classObj && subjectObj) {
      if (
        isSubjectAssigned(classId, subjectId) &&
        isSubjectToRemove(subjectObj.id)
      ) {
        setSubjectsToRemove(
          subjectsToRemove.filter((id) => id !== subjectObj.id)
        );
      } else if (!isSubjectAssigned(classId, subjectId)) {
        const newSubject = {
          school_class: classObj.name,
          subject: subjectObj.subject_name,
          subject_id: subjectId,
          class_id: classId,
        };
        if (!isSubjectToAdd(classId, subjectId)) {
          setSubjectsToAdd([...subjectsToAdd, newSubject]);
        }
      }
    }
  };

  const handleRemoveSubject = (subjectId: number) => {
    const subjectToRemove = assignedSubjects.find((s) => s.id === subjectId);
    if (subjectToRemove) {
      const addedSubject = subjectsToAdd.find(
        (s) =>
          s.school_class === subjectToRemove.school_class &&
          s.subject === subjectToRemove.subject
      );
      if (addedSubject) {
        setSubjectsToAdd(
          subjectsToAdd.filter(
            (s) =>
              !(
                s.school_class === subjectToRemove.school_class &&
                s.subject === subjectToRemove.subject
              )
          )
        );
      } else {
        if (!isSubjectToRemove(subjectId)) {
          setSubjectsToRemove([...subjectsToRemove, subjectId]);
        }
      }
    }
  };

  const handleSave = () => {
    if (subjectsToAdd.length === 0 && subjectsToRemove.length === 0) {
      toast.info(t("noChanges"), {
        description: t("noChangesDescription"),
      });
      return;
    }
    updateMutation.mutate();
  };

  const getFilteredSubjects = (subjects: any[]) => {
    return subjects.filter((subject) =>
      subjectFilter
        ? subject.subject_name
            .toLowerCase()
            .includes(subjectFilter.toLowerCase())
        : true
    );
  };

  const isLoading =
    isTeacherLoading || isClassesLoading || updateMutation.isLoading;

  if (isTeacherLoading || isClassesLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-10 text-center">
        <div className="flex items-center justify-center h-64">
          {/* Loader from lucide-react */}
          <svg
            className="h-8 w-8 animate-spin text-primary"
            viewBox="0 0 24 24"
          />
        </div>
      </div>
    );
  }

  if (isTeacherError) {
    return <ErrorDisplay t={t} router={router} />;
  }

  const hasPendingChanges =
    subjectsToAdd.length > 0 || subjectsToRemove.length > 0;

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <TeacherSubjectsHeader
        teacher={teacher}
        teacherId={teacherId}
        isLoading={isLoading}
        hasPendingChanges={hasPendingChanges}
        handleSave={handleSave}
        t={t}
        router={router}
        assignedCount={assignedSubjects.length}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6">
          <AvailableClasses
            availableClasses={filteredClasses}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            subjectFilter={subjectFilter}
            setSubjectFilter={setSubjectFilter}
            expandedClassId={expandedClassId}
            toggleClassExpansion={toggleClassExpansion}
            getFilteredSubjects={getFilteredSubjects}
            isSubjectAssigned={isSubjectAssigned}
            isSubjectToAdd={isSubjectToAdd}
            handleAddSubject={handleAddSubject}
            t={t}
          />
        </div>
        <div className="lg:col-span-6">
          <AssignedSubjects
            assignedSubjects={assignedSubjects}
            subjectFilter={subjectFilter}
            setSubjectFilter={setSubjectFilter}
            isSubjectToRemove={isSubjectToRemove}
            handleRemoveSubject={handleRemoveSubject}
            subjectsToAdd={subjectsToAdd}
            setSubjectsToAdd={setSubjectsToAdd}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherClassSubjectsPage;
