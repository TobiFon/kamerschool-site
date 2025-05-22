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
import { Plus, Hash, UserCircle, LockIcon } from "lucide-react";

interface AvailableSubjectItemProps {
  classSubject: any;
  onAdd: () => void;
}

const AvailableSubjectItem: React.FC<AvailableSubjectItemProps> = ({
  classSubject,
  onAdd,
}) => {
  const t = useTranslations("Students");
  const isMandatory = classSubject.mandatory;

  return (
    <Card className="border border-gray-200 hover:border-primary/30 hover:bg-gray-50/50 hover:shadow-sm transition-all bg-white">
      <CardContent className="p-3.5">
        <div className="flex justify-between items-center">
          {/* Left side: Subject Info */}
          <div className="flex-1 mr-2 space-y-1.5">
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900">
                {classSubject.subject_name}
              </h3>
              {isMandatory && (
                <Badge
                  variant="outline"
                  className="ml-2 px-1.5 py-0 text-xs font-medium text-blue-600 bg-blue-50 border-blue-200"
                >
                  <LockIcon className="h-3 w-3 mr-1" />
                  {t("mandatory")}
                </Badge>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-600">
              <Badge
                variant="outline"
                className="px-1.5 py-0.5 text-gray-600 bg-gray-50"
              >
                {classSubject.subject_code}
              </Badge>

              {classSubject.teacher_name && (
                <span className="flex items-center">
                  <UserCircle className="h-3 w-3 mr-1 text-gray-400" />
                  {classSubject.teacher_name}
                </span>
              )}

              <span className="flex items-center text-gray-500">
                <Hash className="h-3 w-3 mr-1 text-gray-400" />
                {t("coefficientShort")}: {classSubject.coefficient}
              </span>
            </div>
          </div>

          {/* Right side: Add Button */}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-primary border-primary/20 hover:bg-primary/5 h-8 w-8 flex-shrink-0 rounded-full"
                  onClick={onAdd}
                  aria-label={t("addSubjectTooltip")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("addSubjectTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailableSubjectItem;
