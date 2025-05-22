"use client";

import React from "react";
import { useRouter } from "@/i18n/routing";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import EventForm from "../../_components/EventsForm";
import { FetchCalendarEvent } from "@/queries/events";

const EditAnnouncement = () => {
  const router = useRouter();
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-events", id],
    queryFn: () => FetchCalendarEvent(Number(id)),
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (error || !data)
    return <div className="text-center text-red-500">Error loading </div>;

  return (
    <EventForm
      initialData={data}
      onSuccess={() => router.push("/dashboard/calendar")}
    />
  );
};

export default EditAnnouncement;
