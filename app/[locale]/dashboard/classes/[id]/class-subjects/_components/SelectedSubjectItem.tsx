"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SelectedSubjectItemProps {
  subject: any;
  updateSubject: (field: string, value: any) => void;
  removeSubject: (subjectId: string) => void;
}

const SelectedSubjectItem: React.FC<SelectedSubjectItemProps> = ({
  subject,
  updateSubject,
  removeSubject,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded shadow-sm">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{subject.subject_name}</span>
          {subject.isNew && (
            <span className="text-xs text-green-600 border border-green-600 rounded px-1">
              New
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">{subject.subject_code}</div>
        <div className="mt-2 flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <label className="text-sm text-gray-700">Mandatory:</label>
            <input
              type="checkbox"
              checked={subject.mandatory}
              onChange={(e) =>
                updateSubject(subject.subject_id, "mandatory", e.target.checked)
              }
              className="h-4 w-4"
            />
          </div>
          <div className="flex items-center space-x-1">
            <label className="text-sm text-gray-700">Coefficient:</label>
            <input
              type="number"
              value={subject.coefficient}
              onChange={(e) =>
                updateSubject(
                  subject.subject_id,
                  "coefficient",
                  parseFloat(e.target.value)
                )
              }
              className="w-16 border rounded p-1"
              min="1"
            />
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeSubject(subject.subject_id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default SelectedSubjectItem;
