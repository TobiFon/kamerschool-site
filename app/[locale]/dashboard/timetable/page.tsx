"use client";

import React, { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, ListFilter } from "lucide-react";
import TimeSlotsManager from "./_components/TimetableSlotManager";
import ClassTimetablesOverview from "./_components/ClassTimeTableOverview";
import TimetableEditor from "./_components/TimeTableEditor";
import PageHeader from "../_components/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser"; // Import the hook

const TimetableManagementPage = () => {
  const t = useTranslations("Timetable.Management");
  const queryClient = useQueryClient();
  const { canEdit } = useCurrentUser(); // Get user permission status

  const [activeTab, setActiveTab] = useState<
    "timeSlots" | "classTimetables" | "editor"
  >("classTimetables");

  const [editingTimetableId, setEditingTimetableId] = useState<number | null>(
    null
  );

  // --- Handlers to switch tabs/views ---
  const handleViewTimetableEditor = useCallback((timetableId: number) => {
    setEditingTimetableId(timetableId);
    setActiveTab("editor");
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditingTimetableId(null);
    setActiveTab("classTimetables");
    queryClient.invalidateQueries({ queryKey: ["classTimetables"] });
    if (editingTimetableId) {
      queryClient.invalidateQueries({
        queryKey: ["classTimetableDetail", editingTimetableId],
      });
    }
  }, [editingTimetableId, queryClient]);

  const handleTabChange = (value: string) => {
    // Prevent switching to disabled tabs, although the UI should already prevent it.
    if (value === "timeSlots" && !canEdit) {
      return;
    }
    setActiveTab(value as any);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <PageHeader title={t("pageTitle")} />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:w-[450px]">
          <TabsTrigger value="classTimetables">
            <ListFilter className="h-4 w-4 mr-2" /> {t("classTimetablesTab")}
          </TabsTrigger>
          {/* Disable the Time Slots tab if the user cannot edit */}
          <TabsTrigger value="timeSlots" disabled={!canEdit}>
            <Clock className="h-4 w-4 mr-2" /> {t("timeSlotsTab")}
          </TabsTrigger>
          {/* The "editor" tab will not have a visible trigger; it's activated programmatically */}
        </TabsList>

        <TabsContent value="timeSlots" className="mt-4">
          <TimeSlotsManager />
        </TabsContent>

        <TabsContent value="classTimetables" className="mt-4">
          <ClassTimetablesOverview
            onViewTimetable={handleViewTimetableEditor}
          />
        </TabsContent>

        {/* Editor Tab Content - Only shown when editingTimetableId is set */}
        {activeTab === "editor" && editingTimetableId && (
          <TabsContent value="editor" forceMount={true} className="mt-4">
            <TimetableEditor
              timetableId={editingTimetableId}
              onClose={handleCloseEditor}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TimetableManagementPage;
