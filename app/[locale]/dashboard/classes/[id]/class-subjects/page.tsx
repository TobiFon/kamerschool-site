"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  bulkCreateClassSubjects,
  fetchUnpaginatedSubjects,
} from "@/queries/subjects";
import { fetchClassById } from "@/queries/class";
import {
  Subject,
  ClassSubject,
  getDefaultMandatoryStatus,
} from "@/lib/subjectUtils";
import SubjectSelection from "./_components/SubjectSelection";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ClassSubjectsHeader from "./_components/ClassSubjectHeader";
import SelectedSubjectsList from "./_components/SelectSubjectList";

const ClassSubjectsPage = () => {
  const t = useTranslations("Classes");
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [filter, setFilter] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<ClassSubject[]>([]);
  const { canEdit } = useCurrentUser();

  const {
    data: classData,
    isLoading: isClassDataLoading,
    isError: isClassDataError,
  } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClassById(classId),
  });

  const schoolLevel = useMemo(() => {
    if (!classData) return null;
    const level = classData.level?.toLowerCase() || "";
    if (
      [
        "lower_sixth",
        "upper_sixth",
        "seconde",
        "premiere",
        "terminale",
      ].includes(level)
    ) {
      return "high_school";
    }
    return "secondary";
  }, [classData]);

  const educationSystemCode = classData?.education_system?.code || null;

  // ✨ USE THE NEW DEDICATED QUERY FUNCTION
  const { data: availableSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["allSubjectsForClass", educationSystemCode, schoolLevel],
    queryFn: () =>
      fetchUnpaginatedSubjects({
        // ✨ CALLING THE NEW FUNCTION
        education_system: educationSystemCode!,
        school_level: schoolLevel!,
      }),
    enabled: !!educationSystemCode && !!schoolLevel,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (classData?.class_subjects) {
      const mappedSubjects = classData.class_subjects.map((subject: any) => ({
        id: subject.id,
        subject: subject.subject || subject.subject_id,
        subject_id: subject.subject_id || subject.subject,
        subject_name: subject.subject_name,
        subject_code: subject.subject_code || "",
        coefficient: subject.coefficient || 1,
        mandatory: subject.mandatory,
        isNew: false,
      }));
      setSelectedSubjects(mappedSubjects);
    } else {
      setSelectedSubjects([]);
    }
  }, [classData]);

  const bulkCreateMutation = useMutation({
    mutationFn: (payload: { classId: string; subjects: ClassSubject[] }) =>
      bulkCreateClassSubjects(payload.classId, payload.subjects),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
      queryClient.invalidateQueries({ queryKey: ["classSubjects", classId] });
      queryClient.invalidateQueries({ queryKey: ["subjectSequenceScores"] });

      queryClient.invalidateQueries({
        queryKey: ["studentSubjectEnrollments"],
      });

      toast.success(t("subjectsSaved"), {
        description: t("subjectsSavedDescription"),
      });
      router.push(`/dashboard/classes/${classId}`);
    },
    onError: (error: any) => {
      toast.error(t("errorSavingSubjects"), {
        description: error.message,
      });
    },
  });

  const displayableSubjects = useMemo(() => {
    // The response is now a simple array, no need for .results
    if (!availableSubjects || !Array.isArray(availableSubjects)) return [];

    let subjects = availableSubjects.filter(
      (sub) => !selectedSubjects.some((s) => s.subject_id === sub.id)
    );

    if (!filter) return subjects;

    const lowerFilter = filter.toLowerCase();
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(lowerFilter) ||
        subject.code.toLowerCase().includes(lowerFilter) ||
        subject.abbreviation?.toLowerCase().includes(lowerFilter)
    );
  }, [availableSubjects, filter, selectedSubjects]);

  const addSubject = (subject: Subject) => {
    if (selectedSubjects.some((s) => s.subject_id === subject.id)) return;
    const newSubject: ClassSubject = {
      subject: subject.id,
      subject_id: subject.id,
      subject_name: subject.name,
      subject_code: subject.code,
      coefficient: 1,
      mandatory: getDefaultMandatoryStatus(subject, educationSystemCode || ""),
      isNew: true,
    };
    setSelectedSubjects((prev) => [newSubject, ...prev]);
    toast.success(`${subject.name} added`);
  };

  const removeSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.filter((s) => s.subject_id !== subjectId)
    );
  };

  const updateSubject = (
    subjectId: string,
    field: keyof ClassSubject,
    value: any
  ) => {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.subject_id === subjectId ? { ...s, [field]: value } : s
      )
    );
  };

  const addAllFilteredSubjects = () => {
    const newSubjects = displayableSubjects.map((subject) => ({
      subject: subject.id,
      subject_id: subject.id,
      subject_name: subject.name,
      subject_code: subject.code,
      coefficient: 1,
      mandatory: getDefaultMandatoryStatus(subject, educationSystemCode || ""),
      isNew: true,
    }));
    if (newSubjects.length > 0) {
      setSelectedSubjects((prev) => [...newSubjects, ...prev]);
      toast.success(t("addedAllSubjects", { count: newSubjects.length }));
    }
  };

  const handleSave = () => {
    const preparedSubjects = selectedSubjects.map((subject) => ({
      ...subject,
      subject: subject.subject_id,
    }));
    bulkCreateMutation.mutate({ classId, subjects: preparedSubjects });
  };

  const isLoading =
    subjectsLoading || bulkCreateMutation.isPending || isClassDataLoading;

  if (isClassDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isClassDataError) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-destructive/90 mb-2">
                {t("errorLoadingClass")}
              </h2>
              <p className="text-destructive/80 mb-6 max-w-md">
                {t("unableToLoadClassData")}
              </p>
              <Button
                onClick={() => router.push("/dashboard/classes")}
                variant="destructive"
                className="mt-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToClasses")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <ClassSubjectsHeader
        classData={classData}
        onBack={() => router.push(`/dashboard/classes/${classId}`)}
      />

      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-medium text-slate-800">{t("educationProfile")}</h3>
        <p className="text-sm text-slate-600">
          {t("displayingSubjectsFor", {
            systemName: classData?.education_system?.name,
            levelName:
              schoolLevel === "high_school" ? "High School" : "Secondary",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <SubjectSelection
            filter={filter}
            setFilter={setFilter}
            displayableSubjects={displayableSubjects}
            addSubject={addSubject}
            addAllFilteredSubjects={addAllFilteredSubjects}
            isLoading={isLoading}
            educationSystem={educationSystemCode || ""}
          />
        </div>
        <div className="lg:col-span-5">
          <SelectedSubjectsList
            selectedSubjects={selectedSubjects}
            updateSubject={updateSubject}
            removeSubject={removeSubject}
            onSave={handleSave}
            onCancel={() => router.push(`/dashboard/classes/${classId}`)}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ClassSubjectsPage;
