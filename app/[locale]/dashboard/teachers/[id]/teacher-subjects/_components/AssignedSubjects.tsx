"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Book, School, Search, Trash, X, Plus } from "lucide-react";

interface AssignedSubjectsProps {
  assignedSubjects: any[];
  subjectFilter: string;
  setSubjectFilter: (value: string) => void;
  isSubjectToRemove: (subjectId: number) => boolean;
  handleRemoveSubject: (subjectId: number) => void;
  subjectsToAdd: {
    school_class: string;
    subject: string;
    subject_id: number;
    class_id: number;
  }[];
  setSubjectsToAdd: (subjects: any[]) => void;
  t: (key: string) => string;
}

const AssignedSubjects: React.FC<AssignedSubjectsProps> = ({
  assignedSubjects,
  subjectFilter,
  setSubjectFilter,
  isSubjectToRemove,
  handleRemoveSubject,
  subjectsToAdd,
  setSubjectsToAdd,
  t,
}) => {
  const filteredAssignedSubjects = assignedSubjects.filter(
    (subject) =>
      !subjectFilter ||
      subject.subject.toLowerCase().includes(subjectFilter.toLowerCase()) ||
      subject.school_class.toLowerCase().includes(subjectFilter.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Book className="mr-2 h-5 w-5 text-primary" />
          {t("assignedSubjects")}
          <Badge variant="outline" className="ml-2">
            {assignedSubjects.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder={t("searchAssignedSubjects")}
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        {assignedSubjects.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Book className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">{t("noAssignedSubjects")}</h3>
            <p className="text-muted-foreground mt-1">
              {t("selectSubjectsFromList")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssignedSubjects.map((subject) => {
              const isMarkedForRemoval = isSubjectToRemove(subject.id);
              return (
                <div
                  key={subject.id}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    isMarkedForRemoval ? "opacity-50 bg-red-50" : ""
                  }`}
                >
                  <div>
                    <div className="font-medium">{subject.subject}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <School className="h-3 w-3 mr-1" />
                      {subject.school_class}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {subject.mandatory ? t("mandatory") : t("optional")} -{" "}
                      {t("coefficient")}: {subject.coefficient}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isMarkedForRemoval ? "default" : "outline"}
                    className={
                      isMarkedForRemoval
                        ? "bg-red-500 hover:bg-red-600"
                        : "text-red-500"
                    }
                    onClick={() => handleRemoveSubject(subject.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Additions */}
        {subjectsToAdd.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-2 text-sm flex items-center">
              <Plus className="h-4 w-4 mr-1 text-green-500" />
              {t("pendingAdditions")}
            </h3>
            <div className="space-y-2">
              {subjectsToAdd.map((subject, idx) => (
                <div
                  key={`add-${idx}`}
                  className="flex items-center justify-between p-3 rounded-md border border-green-200 bg-green-50"
                >
                  <div>
                    <div className="font-medium">{subject.subject}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <School className="h-3 w-3 mr-1" />
                      {subject.school_class}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500"
                    onClick={() => {
                      setSubjectsToAdd(
                        subjectsToAdd.filter((_, i) => i !== idx)
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignedSubjects;
