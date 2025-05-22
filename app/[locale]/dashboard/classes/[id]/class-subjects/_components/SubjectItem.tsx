// components/SubjectItem.tsx
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, CheckCircle2 } from "lucide-react";
import {
  Subject,
  getSubjectBadgeColor,
  getDefaultMandatoryStatus,
} from "@/lib/subjectUtils";

interface SubjectItemProps {
  subject: Subject;
  isSelected: boolean;
  onAdd: (subject: Subject) => void;
  educationSystem: string;
}

const SubjectItem: React.FC<SubjectItemProps> = ({
  subject,
  isSelected,
  onAdd,
  educationSystem,
}) => {
  const t = useTranslations("Classes");

  return (
    <Card
      className={`border hover:border-primary hover:shadow-sm transition-all ${
        isSelected ? "bg-gray-50 border-gray-300" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-900">{subject.name}</h3>
            <div className="flex items-center mt-1 gap-2">
              <Badge
                className={`text-xs ${getSubjectBadgeColor(subject.code)}`}
              >
                {subject.code}
              </Badge>
              {getDefaultMandatoryStatus(subject, educationSystem) && (
                <Badge variant="secondary" className="text-xs">
                  {t("core")}
                </Badge>
              )}
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelected ? "ghost" : "outline"}
                  size="sm"
                  className={
                    isSelected
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-primary"
                  }
                  onClick={() => onAdd(subject)}
                  disabled={isSelected}
                >
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSelected ? t("alreadyAdded") : t("addSubject")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectItem;
