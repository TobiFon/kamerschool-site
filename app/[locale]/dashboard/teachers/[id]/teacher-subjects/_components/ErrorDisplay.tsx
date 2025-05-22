"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ErrorDisplayProps {
  t: (key: string) => string;
  router: any;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ t, router }) => {
  return (
    <div className="container mx-auto max-w-7xl py-10">
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              {t("errorLoadingTeacher")}
            </h2>
            <p className="text-red-600 mb-4 max-w-md">
              {t("unableToLoadTeacherData")}
            </p>
            <Button
              onClick={() => router.push("/dashboard/teachers")}
              className="mt-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToTeachers")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorDisplay;
