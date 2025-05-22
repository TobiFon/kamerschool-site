"use client";
import React from "react";
import EditClassForm from "./EditClassForm";
import { useParams } from "next/navigation";

export default function EditClassPage() {
  const params = useParams();
  const id = params.id;

  return (
    <div className="container py-6 space-y-6">
      <EditClassForm classId={id} />
    </div>
  );
}
