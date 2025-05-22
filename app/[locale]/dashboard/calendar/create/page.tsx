"use client";

import React from "react";
import { useRouter } from "@/i18n/routing";
import EventForm from "../_components/EventsForm";

const CreateAnnouncement = () => {
  const router = useRouter();

  return <EventForm onSuccess={() => router.push("/dashboard/calendar")} />;
};

export default CreateAnnouncement;
