"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { bulkCreateClassSubjects, fetchSubjects } from "@/queries/subjects";
import { fetchClassById } from "@/queries/class";
import {
  Subject,
  ClassSubject,
  getDefaultMandatoryStatus,
} from "@/lib/subjectUtils";
import SubjectSelection from "./_components/SubjectSelection";
import ClassSubjectsHeader from "./_components/ClassSubjectHeader";
import SelectedSubjectsList from "./_components/SelectSubjectList";

const ClassSubjectsPage = () => {
  const t = useTranslations("Classes");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<ClassSubject[]>([]);
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Fetch available subjects and class data
  const { data: allSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
  });

  const {
    data: classData,
    isLoading: isClassDataLoading,
    isError: isClassDataError,
  } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClassById(classId),
  });

  // Initialize selected subjects from the fetched class data
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
    }
  }, [classData]);

  const bulkCreateMutation = useMutation({
    mutationFn: (payload: { classId: string; subjects: ClassSubject[] }) =>
      bulkCreateClassSubjects(payload.classId, payload.subjects),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classSubjects", classId] });
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
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

  // Extract education system details from class data
  const educationSystemCode = classData?.education_system?.code || "";
  const educationSystemName = classData?.education_system?.name || "";
  const isEnglish = educationSystemCode?.startsWith("en_");
  const isFrench = educationSystemCode?.startsWith("fr_");
  const isGeneral = educationSystemCode?.includes("_gen");
  const isTechnical = educationSystemCode?.includes("_tech");

  // Get the school level that matches our Subject model
  const mapClassLevelToSchoolLevel = () => {
    const level = classData?.level?.toLowerCase() || "";

    // Map class levels to school levels in the Subject model
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
  };

  const schoolLevel = mapClassLevelToSchoolLevel();

  // Build subject categories based on education system
  const getSubjectCategories = () => {
    const baseCategories = [
      {
        id: "all",
        name: t("allSubjects"),
        icon: <BookOpen className="h-4 w-4 mr-2" />,
      },
    ];

    if (isEnglish && isGeneral) {
      if (schoolLevel === "secondary") {
        return [
          ...baseCategories,
          {
            id: "core",
            name: t("coreSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "sciences",
            name: t("scienceSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "languages",
            name: t("languageSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "humanities",
            name: t("humanitiesSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "optional",
            name: t("optionalSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
        ];
      } else {
        return [
          ...baseCategories,
          {
            id: "core",
            name: t("coreSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "sciences",
            name: t("scienceSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "languages",
            name: t("languageSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "humanities",
            name: t("humanitiesSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "optional",
            name: t("optionalSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
        ];
      }
    } else if (isEnglish && isTechnical) {
      if (schoolLevel === "secondary") {
        return [
          ...baseCategories,
          {
            id: "core",
            name: t("coreSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "building",
            name: t("buildingTradeSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "electrical",
            name: t("electricalTradeSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "mechanical",
            name: t("mechanicalTradeSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "business",
            name: t("businessSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "homeeconomics",
            name: t("homeEconomicsSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
        ];
      } else {
        return [
          ...baseCategories,
          {
            id: "core",
            name: t("coreSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "civil",
            name: t("civilEngineeringSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "electrical",
            name: t("electricalEngineeringSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "mechanical",
            name: t("mechanicalEngineeringSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "business",
            name: t("businessSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "homeeconomics",
            name: t("homeEconomicsSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
        ];
      }
    } else if (isFrench && isGeneral) {
      return [
        ...baseCategories,
        {
          id: "core",
          name: t("coreSubjects"),
          icon: <BookOpen className="h-4 w-4 mr-2" />,
        },
        {
          id: "sciences",
          name: t("scienceSubjects"),
          icon: <BookOpen className="h-4 w-4 mr-2" />,
        },
        {
          id: "languages",
          name: t("languageSubjects"),
          icon: <BookOpen className="h-4 w-4 mr-2" />,
        },
        {
          id: "humanities",
          name: t("humanitiesSubjects"),
          icon: <BookOpen className="h-4 w-4 mr-2" />,
        },
        {
          id: "optional",
          name: t("optionalSubjects"),
          icon: <BookOpen className="h-4 w-4 mr-2" />,
        },
      ];
    } else if (isFrench && isTechnical) {
      if (schoolLevel === "secondary") {
        return [
          ...baseCategories,
          {
            id: "core",
            name: t("coreSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "services",
            name: t("serviceSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "building",
            name: t("buildingSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "maintenance",
            name: t("maintenanceSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "fashion",
            name: t("fashionSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "agriculture",
            name: t("agricultureSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
        ];
      } else {
        return [
          ...baseCategories,
          {
            id: "core",
            name: t("coreSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "stmg",
            name: t("stmgSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "sthr",
            name: t("sthrSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "sti2d",
            name: t("sti2dSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "stl",
            name: t("stlSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "st2s",
            name: t("st2sSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
          {
            id: "bacpro",
            name: t("bacProSubjects"),
            icon: <BookOpen className="h-4 w-4 mr-2" />,
          },
        ];
      }
    }
    return baseCategories;
  };

  const subjectCategories = getSubjectCategories();
  const [subjectCategory, setSubjectCategory] = useState(
    subjectCategories[0].id
  );

  // Filter available subjects based on:
  // 1. Class's education system
  // 2. Class's school level
  // 3. Category selection
  // 4. Search filter
  const displayableSubjects = useMemo(() => {
    if (!allSubjects) return [];

    // First filter by education system and school level
    let filteredSubjects = allSubjects.filter((subject) => {
      // Match by education system code and school level
      return (
        subject.education_system?.code === educationSystemCode &&
        subject.school_level === schoolLevel
      );
    });

    // Then filter by selected category
    if (subjectCategory !== "all") {
      if (isEnglish && isGeneral) {
        if (subjectCategory === "core") {
          filteredSubjects = filteredSubjects.filter((s) =>
            ["English Language", "Mathematics", "French"].some((core) =>
              s.name.includes(core)
            )
          );
        } else if (subjectCategory === "sciences") {
          filteredSubjects = filteredSubjects.filter((s) =>
            ["Biology", "Chemistry", "Physics", "Science"].some((sci) =>
              s.name.includes(sci)
            )
          );
        } else if (subjectCategory === "languages") {
          filteredSubjects = filteredSubjects.filter((s) =>
            ["English", "French", "Language", "Literature"].some((lang) =>
              s.name.includes(lang)
            )
          );
        } else if (subjectCategory === "humanities") {
          filteredSubjects = filteredSubjects.filter((s) =>
            [
              "History",
              "Geography",
              "Religious",
              "Citizenship",
              "Economics",
            ].some((hum) => s.name.includes(hum))
          );
        } else if (subjectCategory === "optional") {
          filteredSubjects = filteredSubjects.filter((s) =>
            ["Art", "Music", "Physical Education"].some((opt) =>
              s.name.includes(opt)
            )
          );
        }
      } else if (isEnglish && isTechnical) {
        // Filter by technical subcategories
        if (subjectCategory === "core") {
          filteredSubjects = filteredSubjects.filter(
            (s) =>
              s.code.startsWith("T05") ||
              s.code.startsWith("T07") ||
              s.code.startsWith("301")
          );
        } else if (
          subjectCategory === "building" ||
          subjectCategory === "civil"
        ) {
          filteredSubjects = filteredSubjects.filter(
            (s) =>
              s.code.startsWith("5001") ||
              s.code.startsWith("50") ||
              s.code.startsWith("60")
          );
        } else if (subjectCategory === "electrical") {
          filteredSubjects = filteredSubjects.filter(
            (s) => s.code.startsWith("51") || s.code.startsWith("61")
          );
        } else if (subjectCategory === "mechanical") {
          filteredSubjects = filteredSubjects.filter(
            (s) => s.code.startsWith("52") || s.code.startsWith("62")
          );
        } else if (subjectCategory === "business") {
          filteredSubjects = filteredSubjects.filter(
            (s) => s.code.startsWith("53") || s.code.startsWith("63")
          );
        } else if (subjectCategory === "homeeconomics") {
          filteredSubjects = filteredSubjects.filter(
            (s) => s.code.startsWith("54") || s.code.startsWith("65")
          );
        }
      } else if (isFrench && isGeneral) {
        // Filter by French general subcategories
        if (subjectCategory === "core") {
          filteredSubjects = filteredSubjects.filter(
            (s) => s.code.startsWith("100") || s.code.startsWith("F100")
          );
        } else if (subjectCategory === "sciences") {
          filteredSubjects = filteredSubjects.filter(
            (s) => s.code.startsWith("110") || s.code.startsWith("F110")
          );
        } else if (subjectCategory === "languages") {
          filteredSubjects = filteredSubjects.filter(
            (s) =>
              s.code.startsWith("F10") &&
              (s.name.toLowerCase().includes("anglais") ||
                s.name.toLowerCase().includes("espagnol") ||
                s.name.toLowerCase().includes("allemand"))
          );
        } else if (subjectCategory === "humanities") {
          filteredSubjects = filteredSubjects.filter(
            (s) =>
              s.code.startsWith("F100") ||
              s.code.includes("Histoire") ||
              s.code.includes("Géographie")
          );
        } else if (subjectCategory === "optional") {
          filteredSubjects = filteredSubjects.filter(
            (s) => s.name.includes("Option") || s.code.includes("OPT")
          );
        }
      } else if (isFrench && isTechnical) {
        if (schoolLevel === "secondary") {
          // Filter by French technical secondary subcategories
          if (subjectCategory === "core") {
            filteredSubjects = filteredSubjects.filter((s) =>
              s.code.startsWith("FT10")
            );
          } else if (subjectCategory === "services") {
            filteredSubjects = filteredSubjects.filter(
              (s) => s.code.includes("530") || s.code.includes("540")
            );
          } else if (subjectCategory === "building") {
            filteredSubjects = filteredSubjects.filter(
              (s) => s.code.includes("500") || s.code.includes("501")
            );
          } else if (subjectCategory === "maintenance") {
            filteredSubjects = filteredSubjects.filter(
              (s) => s.code.includes("520") || s.code.includes("521")
            );
          } else if (subjectCategory === "fashion") {
            filteredSubjects = filteredSubjects.filter(
              (s) => s.code.includes("540") || s.code.includes("541")
            );
          } else if (subjectCategory === "agriculture") {
            filteredSubjects = filteredSubjects.filter(
              (s) => s.code.includes("55") || s.code.includes("CAPA")
            );
          }
        } else {
          // Filter by French technical high school subcategories
          if (subjectCategory === "core") {
            filteredSubjects = filteredSubjects.filter(
              (s) => s.code.startsWith("BP") || s.code.startsWith("BTECH")
            );
          } else if (subjectCategory === "stmg") {
            filteredSubjects = filteredSubjects.filter((s) =>
              s.code.includes("STMG")
            );
          } else if (subjectCategory === "sthr") {
            filteredSubjects = filteredSubjects.filter((s) =>
              s.code.includes("STHR")
            );
          } else if (subjectCategory === "sti2d") {
            filteredSubjects = filteredSubjects.filter((s) =>
              s.code.includes("STI2D")
            );
          } else if (subjectCategory === "stl") {
            filteredSubjects = filteredSubjects.filter((s) =>
              s.code.includes("STL")
            );
          } else if (subjectCategory === "st2s") {
            filteredSubjects = filteredSubjects.filter((s) =>
              s.code.includes("ST2S")
            );
          } else if (subjectCategory === "bacpro") {
            filteredSubjects = filteredSubjects.filter(
              (s) => s.code.startsWith("BP") && !s.code.startsWith("BPEPS")
            );
          }
        }
      }
    }

    // Apply search filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filteredSubjects = filteredSubjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(lowerFilter) ||
          subject.code.toLowerCase().includes(lowerFilter)
      );
    }

    return filteredSubjects;
  }, [
    allSubjects,
    subjectCategory,
    filter,
    educationSystemCode,
    schoolLevel,
    isEnglish,
    isFrench,
    isGeneral,
    isTechnical,
  ]);

  // When a subject is added, mark it as new and prepend it to the list
  const addSubject = (subject: Subject) => {
    if (selectedSubjects.some((s) => s.subject_id === subject.id)) return;
    const newSubject = {
      subject: subject.id,
      subject_id: subject.id,
      subject_name: subject.name,
      subject_code: subject.code,
      coefficient: 1,
      mandatory: getDefaultMandatoryStatus(subject, educationSystemCode),
      isNew: true,
    };
    setSelectedSubjects([newSubject, ...selectedSubjects]);
    toast.success(`${subject.name} added`);
  };

  const removeSubject = (subjectId: string) => {
    setSelectedSubjects(
      selectedSubjects.filter((s) => s.subject_id !== subjectId)
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
    const newSubjects = displayableSubjects
      .filter(
        (subject) => !selectedSubjects.some((s) => s.subject_id === subject.id)
      )
      .map((subject) => ({
        subject: subject.id,
        subject_id: subject.id,
        subject_name: subject.name,
        subject_code: subject.code,
        coefficient: 1,
        mandatory: getDefaultMandatoryStatus(subject, educationSystemCode),
        isNew: true,
      }));
    if (newSubjects.length > 0) {
      setSelectedSubjects([...newSubjects, ...selectedSubjects]);
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
    subjectsLoading || bulkCreateMutation.isLoading || isClassDataLoading;

  if (isClassDataLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-10 text-center">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isClassDataError) {
    return (
      <div className="container mx-auto max-w-7xl py-10 text-center">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                {t("errorLoadingClass")}
              </h2>
              <p className="text-red-600 mb-4 max-w-md">
                {t("unableToLoadClassData")}
              </p>
              <Button
                onClick={() => router.push("/dashboard/classes")}
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

      {/* Display the education system information */}
      <div className="bg-slate-50 p-4 mb-6 rounded-lg border border-slate-200">
        <h3 className="font-medium text-slate-800 mb-1">Education System</h3>
        <p className="text-slate-600">
          {educationSystemName} (
          {schoolLevel === "high_school"
            ? "High School Level"
            : "Secondary Level"}
          )
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <SubjectSelection
            categories={subjectCategories}
            selectedCategory={subjectCategory}
            onSelectCategory={setSubjectCategory}
            filter={filter}
            setFilter={setFilter}
            displayableSubjects={displayableSubjects}
            selectedSubjects={selectedSubjects}
            addSubject={addSubject}
            addAllFilteredSubjects={addAllFilteredSubjects}
            isLoading={isLoading}
            educationSystem={educationSystemCode}
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
