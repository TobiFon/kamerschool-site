"use client";
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { createPromotionDecisions } from "@/queries/promotions";

const PromotionDecisions = ({ academicYearId, classId }) => {
  const t = useTranslations("Promotions");
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: () => createPromotionDecisions(academicYearId, classId),
    onSuccess: () => alert(t("decisionsCreated")),
    onError: (err) => setError(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("promotionDecisions")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isLoading || !classId}
          className="w-full sm:w-auto"
        >
          {mutation.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("createDecisions")
          )}
        </Button>
        {error && (
          <div className="flex items-center text-red-600 mt-4">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionDecisions;
