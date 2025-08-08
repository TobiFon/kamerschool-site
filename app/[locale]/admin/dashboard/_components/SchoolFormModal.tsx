// frontend/webapp/src/app/admin/dashboard/schools/_components/SchoolFormModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { School } from "@/types/auth";
import { useTranslations } from "next-intl";
import { SchoolForm } from "./school-form";

interface SchoolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School | null; // null for create, School object for edit
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function SchoolFormModal({
  isOpen,
  onClose,
  school,
  onSubmit,
  isSubmitting,
}: SchoolFormModalProps) {
  const t = useTranslations("AdminSchoolManagement.modal");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            {school ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {school ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <SchoolForm
            initialData={school}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
