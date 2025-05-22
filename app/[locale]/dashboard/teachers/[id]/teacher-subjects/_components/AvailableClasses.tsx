"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  School,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AvailableClassesProps {
  availableClasses: any[];
  classFilter: string;
  setClassFilter: (value: string) => void;
  subjectFilter: string;
  setSubjectFilter: (value: string) => void;
  expandedClassId: number | null;
  toggleClassExpansion: (classId: number) => void;
  getFilteredSubjects: (subjects: any[]) => any[];
  isSubjectAssigned: (classId: number, subjectId: number) => boolean;
  isSubjectToAdd: (classId: number, subjectId: number) => boolean;
  handleAddSubject: (classId: number, subjectId: number) => void;
  t: (key: string) => string;
}

const AvailableClasses: React.FC<AvailableClassesProps> = ({
  availableClasses,
  classFilter,
  setClassFilter,
  subjectFilter,
  setSubjectFilter,
  expandedClassId,
  toggleClassExpansion,
  getFilteredSubjects,
  isSubjectAssigned,
  isSubjectToAdd,
  handleAddSubject,
  t,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <School className="mr-2 h-5 w-5 text-primary" />
          {t("availableClasses")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder={t("searchClasses")}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="mt-2">
          <Input
            placeholder={t("searchSubjects")}
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full mb-4"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <div className="space-y-2">
          {availableClasses.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <School className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">{t("noClassesFound")}</h3>
              <p className="text-muted-foreground mt-1">
                {t("tryDifferentSearch")}
              </p>
            </div>
          ) : (
            availableClasses.map((cls) => {
              const filteredSubjects = getFilteredSubjects(cls.subjects);
              return (
                <Collapsible
                  key={cls.id}
                  open={expandedClassId === cls.id}
                  onOpenChange={() => toggleClassExpansion(cls.id)}
                  className="border rounded-md overflow-hidden"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex justify-between items-center p-3 h-auto"
                    >
                      <div className="flex items-center">
                        <School className="h-4 w-4 mr-2" />
                        <span>{cls.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {filteredSubjects.length} {t("subjects")}
                        </Badge>
                      </div>
                      {expandedClassId === cls.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 border-t space-y-2">
                      {filteredSubjects.length === 0 ? (
                        <div className="py-4 text-center">
                          <p className="text-muted-foreground">
                            {t("noSubjectsMatchFilter")}
                          </p>
                        </div>
                      ) : (
                        filteredSubjects.map((subject) => {
                          const isAssigned = isSubjectAssigned(
                            cls.id,
                            subject.subject_id
                          );
                          const isToAdd = isSubjectToAdd(
                            cls.id,
                            subject.subject_id
                          );
                          const isDisabled =
                            subject.teacher_id !== null && !isAssigned;
                          return (
                            <div
                              key={`${cls.id}-${subject.subject_id}`}
                              className={`flex items-center justify-between p-2 rounded-md ${
                                isAssigned || isToAdd
                                  ? "bg-primary/10 border border-primary/20"
                                  : "border"
                              } ${isDisabled ? "opacity-60" : ""}`}
                            >
                              <div>
                                <div className="font-medium">
                                  {subject.subject_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {subject.subject_code} -{" "}
                                  {subject.mandatory
                                    ? t("mandatory")
                                    : t("optional")}{" "}
                                  - {t("coefficient")}: {subject.coefficient}
                                </div>
                                {subject.teacher_id && !isAssigned && (
                                  <div className="text-xs text-red-500">
                                    {t("assignedTo")}: {subject.teacher_name}
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant={
                                  isAssigned || isToAdd ? "outline" : "default"
                                }
                                onClick={() =>
                                  handleAddSubject(cls.id, subject.subject_id)
                                }
                                disabled={isDisabled && !isAssigned}
                              >
                                {isAssigned || isToAdd ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailableClasses;
