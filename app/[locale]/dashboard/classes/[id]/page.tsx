"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { fetchClassById } from "@/queries/class";
import Header from "./_components/Header";
import OverviewTab from "./_components/OverviewTab";
import StudentsTab from "./_components/StudentsTab";
import SubjectsTab from "./_components/SubjectsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchSchool } from "@/lib/auth";
import WeeklyAttendanceTab from "./_components/WeelyAttendance";

const ClassDetailPage = () => {
  const t = useTranslations("Classes");
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch class data
  const { data, isLoading, error } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClassById(classId),
  });

  const {
    data: schoolData,
    isLoading: schoolIsLoading,
    error: schoolError,
  } = useQuery({
    queryKey: ["school"],
    queryFn: () => fetchSchool(),
  });

  const classData = data;

  const handleGoBack = () => router.push("/dashboard/classes");

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="text-xl font-medium text-gray-700">
            {t("loadingClass")}
          </span>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="container mx-auto px-6 py-12 bg-gray-50">
        <Button variant="ghost" onClick={handleGoBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToClasses")}
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <Info className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              {t("errorLoadingClassDetails")}
            </h2>
            <p className="text-sm text-red-600">{t("errorTryAgain")}</p>
            <Button
              variant="outline"
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => window.location.reload()}
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
      <Header
        classData={classData}
        onGoBack={handleGoBack}
        schoolData={schoolData}
      />
      <div className="container mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 border-b w-full rounded-none bg-transparent h-auto justify-start">
            <TabsTrigger
              value="overview"
              className="rounded-none pb-3 px-4 font-medium"
            >
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="rounded-none pb-3 px-4 font-medium"
            >
              {t("attendance")}
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="rounded-none pb-3 px-4 font-medium"
            >
              {t("students")}
            </TabsTrigger>
            <TabsTrigger
              value="subjects"
              className="rounded-none pb-3 px-4 font-medium"
            >
              {t("subjects")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab
              classData={classData}
              onViewAllStudents={() => setActiveTab("students")}
            />
          </TabsContent>
          <TabsContent value="attendance">
            <WeeklyAttendanceTab classId={classId} schoolData={schoolData} />
          </TabsContent>
          <TabsContent value="students">
            <StudentsTab classData={classData} schoolData={schoolData} />
          </TabsContent>
          <TabsContent value="subjects">
            <SubjectsTab classData={classData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClassDetailPage;
