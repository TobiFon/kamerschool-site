"use client";

import React from "react";
import { useParams } from "next/navigation";
import EditTeacherForm from "./EditTeacherForm";

export default function EditTeacherPage() {
  const params = useParams();
  const teacherId = params.id as string;

  return <EditTeacherForm teacherId={teacherId} />;
}
