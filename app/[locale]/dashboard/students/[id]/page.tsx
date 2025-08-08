// src/app/[locale]/dashboard/students/[id]/page.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation"; // Use next/navigation
import { useRouter } from "@/i18n/routing"; // For navigation
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertTriangle,
  Home,
  CalendarDays,
  ArrowLeft,
  GraduationCap,
  Info,
  BarChartHorizontal,
  DollarSign,
  AlertOctagon,
  LayoutGrid, // Added LayoutGrid for timetable icon
  // UserCheck, UserX, Edit // Keep if used elsewhere
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import { fetchStudentById, fetchStudentOverview } from "@/queries/students";
import { StudentOverview, Student } from "@/types/students";
import Header from "./_components/Header";
import OverviewTab from "./_components/OverviewTab";
import EditStudentModal from "./_components/EditStudentModal";
import ResultsTab from "./_components/ResultsTab";
import AnalyticsTab from "./_components/AnalyticsTab";
import AttendanceTab from "./_components/AttendanceTab";
import FeesTab from "./_components/FeesTab";
import DisciplineTab from "./_components/DisciplineTab";
import StudentTimetableTab from "./_components/StudentTimeTableTab";

const StudentDetailPage = () => {
  const t = useTranslations("Students");
  const tTabs = useTranslations("Students.Tabs");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: studentOverviewDataForPage,
    isLoading: isLoadingOverviewForPage,
    error: errorOverviewForPage,
    refetch: refetchOverviewForPage,
    isError: isErrorOverviewForPage,
  } = useQuery<StudentOverview, Error>({
    queryKey: ["studentOverviewForPage", studentId],
    queryFn: () => fetchStudentOverview(studentId),
    enabled: !!studentId,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  const { data: studentData, isLoading: isLoadingStudent } = useQuery<
    Student,
    Error
  >({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudentById(studentId),
    enabled: !!studentId,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  const handleGoBack = () => router.push("/dashboard/students");

  const handleOpenEditModal = () => {
    if (studentData) setIsEditModalOpen(true);
    else toast.info(t("loadingStudentDataTryAgain"));
  };

  const handleCloseEditModal = () => setIsEditModalOpen(false);
  const handleEditSuccess = () => {
    handleCloseEditModal();
    toast.success(t("updateSuccessMessage"));
    refetchOverviewForPage();
    queryClient.invalidateQueries({ queryKey: ["student", studentId] });
    queryClient.invalidateQueries({
      queryKey: ["studentOverviewTabData", studentId, null],
    });
  };

  const isLoadingPage = isLoadingOverviewForPage && !studentOverviewDataForPage;
  const isErrorPage = isErrorOverviewForPage;
  const errorPage = errorOverviewForPage;

  if (isLoadingPage) {
    /* ... Loading Spinner ... */
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-lg">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 animate-pulse"></div>
            <Loader2 className="absolute inset-0 m-auto h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <span className="text-xl font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
            {t("loadingStudentDetails")}
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("fetchingData")}
          </p>
        </div>
      </div>
    );
  }
  if (isErrorPage) {
    /* ... Error Display ... */
    return (
      <div className="container mx-auto px-6 py-16 bg-slate-50 dark:bg-gray-950 max-w-4xl">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToList")}
          </Button>
        </div>
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30 overflow-hidden shadow-lg">
          <div className="h-2 bg-red-500"></div>
          <CardContent className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mb-6" />
              <h2 className="text-2xl font-semibold text-red-800 dark:text-red-300 mb-3">
                {t("errors.fetchErrorTitle")}
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-6 text-base max-w-md mx-auto">
                {errorPage instanceof Error
                  ? errorPage.message
                  : t("errors.fetchErrorGeneric")}
              </p>
              <Button
                onClick={() => refetchOverviewForPage()}
                variant="destructive"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!isLoadingPage && !studentOverviewDataForPage) {
    /* ... Not Found Display ... */
    return (
      <div className="container mx-auto px-6 py-16 bg-slate-50 dark:bg-gray-950 max-w-4xl">
        <Button variant="outline" onClick={handleGoBack} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToList")}
        </Button>
        <Card className="border-yellow-200 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/30 overflow-hidden shadow-lg">
          <div className="h-2 bg-yellow-400"></div>
          <CardContent className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <Info className="h-16 w-16 text-yellow-500 dark:text-yellow-400 mb-6" />
              <h2 className="text-2xl font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                {t("errors.studentNotFoundTitle")}
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 text-base max-w-md mx-auto">
                {t("errors.studentNotFoundMessage")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-gray-950 min-h-screen pb-20">
      <Header
        studentData={studentOverviewDataForPage}
        onEditClick={handleOpenEditModal}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-[-70px] relative">
        <div className="bg-white dark:bg-gray-900 p-3 pt-4 px-4 sm:p-4 sm:pt-5 sm:px-6 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid sm:inline-flex grid-cols-2 sm:grid-cols-none gap-1 p-1.5 h-auto bg-slate-100 dark:bg-gray-800 rounded-lg mb-8 overflow-x-auto no-scrollbar">
              {/* Existing Tab Triggers */}
              <TabsTrigger
                value="overview"
                className="py-2.5 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Home className="h-4 w-4" />
                {tTabs("overview")}
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="py-2.5 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <GraduationCap className="h-4 w-4" />
                {tTabs("results")}
              </TabsTrigger>
              {/* New Timetable Tab Trigger */}

              <TabsTrigger
                value="analytics"
                className="py-2.5 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <BarChartHorizontal className="h-4 w-4" />
                {tTabs("analytics")}
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="py-2.5 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <CalendarDays className="h-4 w-4" />
                {tTabs("attendance")}
              </TabsTrigger>
              <TabsTrigger
                value="fees"
                className="py-2.5 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <DollarSign className="h-4 w-4" />
                {tTabs("fees")}
              </TabsTrigger>
              <TabsTrigger
                value="discipline"
                className="py-2.5 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <AlertOctagon className="h-4 w-4" />
                {tTabs("discipline")}
              </TabsTrigger>
              <TabsTrigger
                value="timetable"
                className="py-2.5 px-4 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-gray-950 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <LayoutGrid className="h-4 w-4" />
                {tTabs("timetable")}
              </TabsTrigger>
            </TabsList>

            <div className="mt-2 pb-2 min-h-[400px]">
              <TabsContent
                value="overview"
                className="m-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <OverviewTab studentId={studentId} />
              </TabsContent>
              <TabsContent
                value="results"
                className="m-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <ResultsTab studentId={studentId} studentData={studentData} />
              </TabsContent>
              {/* New Timetable Tab Content */}
              <TabsContent
                value="timetable"
                className="m-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <StudentTimetableTab studentId={studentId} />
              </TabsContent>
              <TabsContent
                value="analytics"
                className="m-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <AnalyticsTab studentId={studentId} />
              </TabsContent>
              <TabsContent value="attendance" className="m-0">
                <AttendanceTab studentId={studentId} />
              </TabsContent>
              <TabsContent
                value="fees"
                className="m-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <FeesTab studentId={studentId} />
              </TabsContent>
              <TabsContent
                value="discipline"
                className="m-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <DisciplineTab studentId={studentId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      {isEditModalOpen && studentData && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          studentData={studentData}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default StudentDetailPage;
