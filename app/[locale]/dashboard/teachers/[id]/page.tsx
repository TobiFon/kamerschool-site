// src/app/[locale]/dashboard/teachers/[id]/page.tsx
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Info, LayoutGrid } from "lucide-react"; // Added LayoutGrid for timetable icon
import { Card, CardContent } from "@/components/ui/card";
import { fetchSchool } from "@/lib/auth";
import { fetchTeacher } from "@/queries/teachers";
import TeacherHeader from "./_components/TeacherHeader";
import TeacherOverviewTab from "./_components/TeacherOverview";
import TeacherPerformanceTab from "./_components/TeacherPerformanceTab";
import TeacherSubjectsTab from "./_components/TeacherSubjects";
import TeacherTimetableTab from "./_components/TeachersTimetableTab";
import { getBackendErrorMessage } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const TeacherDetailPage = () => {
  const t = useTranslations("Teachers");
  const router = useRouter();
  const params = useParams();
  const teacherId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview"); // Default
  const { canEdit } = useCurrentUser();

  // Fetch teacher data
  const {
    data: teacherData, // Renamed for clarity
    isLoading: isLoadingTeacher, // Renamed for clarity
    error: errorTeacher, // Renamed for clarity
  } = useQuery({
    queryKey: ["teacher", teacherId, "details"],
    queryFn: () => fetchTeacher(teacherId),
    enabled: !!teacherId, // Ensure teacherId is available
  });

  const {
    data: schoolData,
    isLoading: isLoadingSchool, // Renamed for clarity
    error: errorSchool, // Renamed for clarity
  } = useQuery({
    queryKey: ["school"],
    queryFn: () => fetchSchool(),
  });

  // const teacherData = data; // No longer needed if using teacherData from query directly

  const handleGoBack = () => router.push("/dashboard/teachers");

  if (isLoadingTeacher || isLoadingSchool) {
    // Check both loadings
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="text-xl font-medium text-gray-700">
            {t("loadingTeacher")}
          </span>
        </div>
      </div>
    );
  }

  if (errorTeacher || !teacherData) {
    return (
      <div className="container mx-auto px-6 py-12 bg-gray-50">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="mb-6 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToTeachers")}
        </Button>
        <Card className="border-red-200 bg-red-50 shadow-md overflow-hidden">
          <CardContent className="p-8 text-center">
            <Info className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              {t("errorLoadingTeacherDetails")}
            </h2>
            <p className="text-sm text-red-600 mb-4">
              {getBackendErrorMessage(errorTeacher) || t("errorTryAgain")}
            </p>
            <Button
              variant="outline"
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => router.refresh()} // Use router.refresh for Next.js way
            >
              {t("refresh")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <TeacherHeader
        teacherData={teacherData}
        onGoBack={handleGoBack}
        schoolData={schoolData}
        canEdit={canEdit} // Pass schoolData, it might be undefined if still loading or error
      />

      <div className="container mx-auto px-4 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 border-b w-full rounded-none bg-transparent h-auto justify-start overflow-x-auto pb-0 no-scrollbar">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary pb-2 px-4 sm:px-6 font-medium transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {/* You can add an icon here if you like */}
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary pb-2 px-4 sm:px-6 font-medium transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {t("performance")}
            </TabsTrigger>
            <TabsTrigger
              value="subjects"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary pb-2 px-4 sm:px-6 font-medium transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {t("subjects")}
            </TabsTrigger>
            {/* New Timetable Tab Trigger */}
            <TabsTrigger
              value="timetable"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary pb-2 px-4 sm:px-6 font-medium transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <LayoutGrid className="h-4 w-4" />
              {t("timetableTabTitle")}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            {/* Pass teacherData if it's loaded */}
            {teacherData && <TeacherOverviewTab teacherData={teacherData} />}
          </TabsContent>

          <TabsContent
            value="performance"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            {teacherData && (
              <TeacherPerformanceTab teacherId={teacherData.id} />
            )}
          </TabsContent>

          <TabsContent
            value="subjects"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            {teacherData && (
              <TeacherSubjectsTab teacherData={teacherData} canEdit={canEdit} />
            )}
          </TabsContent>

          {/* New Timetable Tab Content */}
          <TabsContent
            value="timetable"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            {teacherData && <TeacherTimetableTab teacherId={teacherData.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherDetailPage;
