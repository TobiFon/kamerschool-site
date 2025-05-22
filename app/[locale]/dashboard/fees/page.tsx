"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchSchool } from "@/lib/auth";
import { School } from "@/types/auth";
import LoadingErrorState from "./_components/LoadingErrorState";
import DashboardTab from "./_components/FeesDashboard";
import FeeTypesTab from "./_components/FeesTypeTable";
import ClassFeesTab from "./_components/ClassFeesTab";
import StudentFeesTab from "./_components/StudentsFeeTab";
import PaymentsTab from "./_components/PaymentsTab";
import { Card } from "@/components/ui/card";
import PageHeader from "../_components/PageHeader";

const FinancePage = () => {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const [activeTab, setActiveTab] = useState("dashboard");

  const {
    data: schoolData,
    isLoading: schoolIsLoading,
    error: schoolError,
  } = useQuery<School, Error>({
    queryKey: ["schoolDataFinance"],
    queryFn: fetchSchool,
    staleTime: Infinity,
  });

  // Handle loading state for essential school data
  if (schoolIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/20">
        <LoadingErrorState isLoading={true} message={tc("loadingSchoolData")} />
      </div>
    );
  }

  // Handle error fetching essential school data
  if (schoolError || !schoolData) {
    return (
      <div className="container mx-auto px-4 py-8 bg-muted/20 min-h-screen">
        <LoadingErrorState
          error={schoolError || new Error(t("errorLoadingSchool"))}
        />
      </div>
    );
  }

  // Main page structure
  return (
    <div className="bg-muted/20 container mx-auto px-4 py-8">
      {/* Pass only schoolData */}
      <PageHeader title={t("financeManagement")} />
      <div className="container mx-auto px-4 md:px-6 pt-8">
        <Card className="border shadow-sm bg-background rounded-lg overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="px-4 md:px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border-b rounded-none bg-transparent p-0 h-auto mb-6 gap-2 md:gap-6">
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent pb-3 px-1 sm:px-2 font-medium transition-all"
                >
                  {t("dashboard")}
                </TabsTrigger>
                <TabsTrigger
                  value="feeTypes"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent pb-3 px-1 sm:px-2 font-medium transition-all"
                >
                  {t("feeTypes")}
                </TabsTrigger>
                <TabsTrigger
                  value="classFees"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent pb-3 px-1 sm:px-2 font-medium transition-all"
                >
                  {t("classFees")}
                </TabsTrigger>
                <TabsTrigger
                  value="studentFees"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent pb-3 px-1 sm:px-2 font-medium transition-all"
                >
                  {t("studentFees")}
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none border-b-2 border-transparent pb-3 px-1 sm:px-2 font-medium transition-all"
                >
                  {t("payments")}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content Panels */}
            <div className="px-4 md:px-6 pb-6">
              <TabsContent value="dashboard" className="mt-0 pt-2">
                <DashboardTab school={schoolData} />
              </TabsContent>
              <TabsContent value="feeTypes" className="mt-0 pt-2">
                <FeeTypesTab />
              </TabsContent>
              <TabsContent value="classFees" className="mt-0 pt-2">
                <ClassFeesTab school={schoolData} />
              </TabsContent>
              <TabsContent value="studentFees" className="mt-0 pt-2">
                <StudentFeesTab school={schoolData} />
              </TabsContent>
              <TabsContent value="payments" className="mt-0 pt-2">
                <PaymentsTab school={schoolData} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default FinancePage;
