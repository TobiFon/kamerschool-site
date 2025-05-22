import React from "react";
import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubjectSelectorProps {
  classSubjects: any[]; // Assuming classSubjects is an array of objects with id, subject_name, coefficient
  selectedSubject: string;
  onValueChange: (value: string) => void;
}

const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  classSubjects,
  selectedSubject,
  onValueChange,
}) => {
  const t = useTranslations("Results");

  return (
    <div className="w-full md:w-1/3">
      <label className="text-sm font-medium mb-1 block text-gray-700 flex items-center">
        <BookOpen className="h-4 w-4 mr-2 text-primary/80" />
        {t("selectSubject")}
      </label>
      <Select value={selectedSubject} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-white border-gray-200 h-10 shadow-sm hover:border-primary/50 transition-colors">
          <SelectValue placeholder={t("selectSubject")} />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 shadow-lg">
          {classSubjects?.map((subject) => (
            <SelectItem key={subject.id} value={subject.id.toString()}>
              <div className="flex items-center justify-between w-full">
                <span>{subject.subject_name}</span>
                {subject.coefficient > 1 && (
                  <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                    {t("coefficient")}: {subject.coefficient}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SubjectSelector;
