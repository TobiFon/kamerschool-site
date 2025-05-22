// src/app/[locale]/dashboard/finance/_components/FinanceHeader.tsx
"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase } from "lucide-react";
import { School } from "@/types/auth";
import { useRouter } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge"; // Import Badge component

interface FinanceHeaderProps {
  schoolData?: School | null;
}

const FinanceHeader: React.FC<FinanceHeaderProps> = ({ schoolData }) => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const router = useRouter();

  const handleGoBack = () => router.push("/dashboard");

  return (
    <div className="bg-background border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto h-20 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label={tc("goBack")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center">
            <div className="bg-primary/10 p-2 rounded-full mr-3">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>

            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                {t("financeManagement")}
              </h1>

              {schoolData && (
                <div className="flex items-center mt-0.5">
                  <Badge
                    variant="outline"
                    className="font-normal text-xs bg-muted/50 hover:bg-muted text-muted-foreground"
                  >
                    {schoolData.name_abrev || schoolData.name}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-1 text-xs font-medium border-primary/20 hover:bg-primary/5 hover:text-primary"
          >
            <span className="text-xs">{tc("fiscalYear")}</span>
            <span className="font-semibold">{new Date().getFullYear()}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinanceHeader;
