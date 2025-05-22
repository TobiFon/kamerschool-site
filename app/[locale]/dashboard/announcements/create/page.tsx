"use client";

import React from "react";
import { useRouter } from "@/i18n/routing";
import AnnouncementForm from "../_components/AnnouncementForm";

const CreateAnnouncement = () => {
  const router = useRouter();

  return (
    <AnnouncementForm
      onSuccess={() => router.push("/dashboard/announcements")}
    />
  );
};

export default CreateAnnouncement;
