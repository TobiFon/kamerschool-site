"use client";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import PageHeader from "./_components/PageHeader";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  MessageCircle,
  Calendar as CalendarIcon,
  UserPlus,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchSchoolMetrics } from "@/queries/schoolmetrix";
import { fetchCalendarEvents } from "@/queries/events";
import { fetchTeachers, fetchTeacherPerformance } from "@/queries/teachers";
import { QuickActions } from "./_components/QuickAction";
import AttendanceDashboard from "./_components/AttendanceOverviewCard";
import { fetchAnnouncements } from "@/queries/announcments";
import { TeacherPerformanceCard } from "./_components/TeacherPerformance";
import { ClassPerformanceCard } from "./_components/ClassPerformance";
import SchoolPerformanceOverview from "./_components/StudentPerformanceOverview";
import {
  EnhancedAnnouncements,
  EnhancedCalendar,
} from "./_components/AnnouncmentsandEvents";
import { useRouter } from "@/i18n/routing";
import { fetchSchoolPerformance } from "@/queries/anaytics";
import { fetchSchool } from "@/lib/auth";
import EnhancedMetricsGrid from "./_components/MetricsCard";

// register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Dashboard() {
  const t = useTranslations("dashboard");
  const [timeScope, setTimeScope] = useState("sequence");
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined); // Initialize as undefined
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setSelectedDate(new Date()); // Set date only on client after mount
  }, []);

  const {
    data: schoolMetrics,
    isLoading: schoolMetricsLoading, // Renamed to avoid confusion
    error: schoolMetricsError,
  } = useQuery({
    queryKey: ["schoolMetrics"],
    queryFn: fetchSchoolMetrics,
  });
  const {
    data: performanceOverview,
    isLoading: performanceLoading,
    error: performanceError,
  } = useQuery({
    queryKey: ["performanceOverview", timeScope],
    queryFn: () => fetchSchoolPerformance({ timeScope }),
  });

  const {
    data: announcementsData,
    isLoading: announcementsLoading,
    error: announcementsError,
  } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });
  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: fetchCalendarEvents,
  });

  const {
    data: teachersData,
    isLoading: teachersLoading,
    error: teachersError,
  } = useQuery({
    queryKey: ["teachers"],
    queryFn: fetchTeachers,
  });

  const teacherPerformanceQueries = useQueries({
    queries:
      teachersData?.map((teacher) => ({
        queryKey: ["teacherPerformance", teacher.id],
        queryFn: () => fetchTeacherPerformance(teacher.id),
      })) || [],
  });

  const {
    data: schoolData,
    isLoading: schoolDataIsLoading, // Renamed for clarity
    error: schoolDataError,
  } = useQuery({
    queryKey: ["school"],
    queryFn: () => fetchSchool(),
  });

  const isTeachersPerformanceLoading = teacherPerformanceQueries.some(
    (query) => query.isLoading
  );
  const teachersPerformanceError = teacherPerformanceQueries.find(
    (query) => query.error
  )?.error;

  const handleTimeChange = (newTimeScope: string) => {
    setTimeScope(newTimeScope);
  };

  const eventsForSelectedDate =
    eventsData?.results.filter((event) => {
      const eventStartDate = new Date(event.start_date);
      if (!selectedDate) return false;
      return (
        eventStartDate.getFullYear() === selectedDate.getFullYear() &&
        eventStartDate.getMonth() === selectedDate.getMonth() &&
        eventStartDate.getDate() === selectedDate.getDate()
      );
    }) || [];

  const quickActions = [
    {
      label: t("quickActions.addClass"),
      icon: <Plus className="h-4 w-4" />,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
      onClick: () => router.push("/dashboard/classes/create/"),
    },
    {
      label: t("quickActions.sendAnnouncement"),
      icon: <MessageCircle className="h-4 w-4" />,
      className: "bg-emerald-600 hover:bg-emerald-700 text-white",
      onClick: () => router.push("/dashboard/announcements/create/"),
    },
    {
      label: t("quickActions.addStudent"),
      icon: <UserPlus className="h-4 w-4" />,
      className: "bg-purple-600 hover:bg-purple-700 text-white",
      onClick: () => console.log("add student clicked"),
    },
    {
      label: t("quickActions.scheduleEvent"),
      icon: <CalendarIcon className="h-4 w-4" />,
      className: "bg-orange-600 hover:bg-orange-700 text-white",
      onClick: () => router.push("/dashboard/calendar/create/"),
    },
  ];

  // Determine title and subtitle safely for PageHeader
  let headerTitle = ""; // Default for SSR and initial client render
  let headerSubtitle: string | undefined = undefined; // Default

  if (isMounted) {
    // Only after the component has mounted on the client,
    // we use the actual loading states and data.
    if (schoolDataIsLoading) {
      headerTitle = t("loading"); // Or a more specific "Loading school name..."
    } else if (schoolDataError) {
      headerTitle = t("error.generic"); // Or a more specific error message
    } else if (schoolData) {
      headerTitle = schoolData.name || ""; // Fallback to empty string if name is null/undefined
      headerSubtitle = schoolData.email || undefined;
    } else {
      // Not loading, no error, but no schoolData (e.g., fetch returned null)
      headerTitle = ""; // Or "School information not available"
    }
  }
  // On the server, and on the client's first render pass (before useEffect),
  // isMounted is false, so headerTitle will be "" and headerSubtitle will be undefined.
  // This ensures consistency.

  return (
    <div className="p-6 space-y-8 bg-gray-50">
      <PageHeader title={headerTitle} subtitle={headerSubtitle} />
      <QuickActions actions={quickActions} />
      {/* Use schoolMetricsLoading for its specific section */}
      {isMounted && schoolMetricsLoading ? ( // Guard with isMounted if its initial state can vary
        <div className="text-center text-gray-500">{t("loading")}</div>
      ) : schoolMetricsError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("error.title")}</AlertTitle>
          <AlertDescription>{schoolMetricsError.message}</AlertDescription>
        </Alert>
      ) : isMounted && schoolMetrics ? ( // Only render if mounted and data is available
        <EnhancedMetricsGrid metrics={schoolMetrics} />
      ) : !isMounted ? (
        <div className="text-center text-gray-500">{t("loading")}</div> // Placeholder during SSR / initial client render for this section
      ) : null}{" "}
      {/* Or some other placeholder if needed */}
      <SchoolPerformanceOverview
        performanceData={performanceOverview}
        isLoading={performanceLoading}
        error={performanceError}
        onTimeChange={handleTimeChange}
        timeScope={timeScope}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <TeacherPerformanceCard
          teacherEffectiveness={performanceOverview?.teacher_effectiveness}
        />
        <ClassPerformanceCard timeScope={timeScope} />
      </div>
      <AttendanceDashboard />
      <div className="grid gap-6 lg:grid-cols-2">
        <EnhancedAnnouncements
          announcementsData={announcementsData}
          announcementsLoading={announcementsLoading}
          announcementsError={announcementsError}
        />
        <EnhancedCalendar
          selectedDate={selectedDate} // Now initialized as undefined, set after mount
          setSelectedDate={setSelectedDate}
          eventsData={eventsData}
          eventsLoading={eventsLoading}
          eventsError={eventsError}
          eventsForSelectedDate={eventsForSelectedDate}
        />
      </div>
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t("powered")}
        </p>
      </div>
    </div>
  );
}
