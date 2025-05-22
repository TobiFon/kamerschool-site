"use client";

import React from "react";
import { useRouter } from "@/i18n/routing";
import { useQuery } from "@tanstack/react-query";
import { fetchAnnouncementById } from "@/queries/announcments";
import AnnouncementForm from "../../_components/AnnouncementForm";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const EditAnnouncement = () => {
  const router = useRouter();
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["announcement", id],
    queryFn: () => fetchAnnouncementById(Number(id)),
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (error || !data)
    return (
      <div className="text-center text-red-500">Error loading announcement</div>
    );

  return (
    <AnnouncementForm
      initialData={data}
      onSuccess={() => router.push("/dashboard/announcements")}
    />
  );
};

export default EditAnnouncement;
