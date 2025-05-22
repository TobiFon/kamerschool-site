import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function EnrollmentTabs({ tabs = [], activeTab, onTabChange }) {
  const gridColsClass = `grid-cols-${
    tabs.length > 4 ? Math.ceil(tabs.length / 2) : tabs.length
  }`; // Basic responsive grid
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mb-6 w-full">
      <TabsList
        className={`grid w-full ${gridColsClass} md:grid-cols-${tabs.length}`}
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="text-xs sm:text-sm">
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default EnrollmentTabs;
