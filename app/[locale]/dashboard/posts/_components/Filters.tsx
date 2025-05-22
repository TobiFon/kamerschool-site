"use client";
import { useTranslations } from "next-intl"; // Import useTranslations
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface FiltersProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  ordering: string;
  onOrderingChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function Filters({
  activeTab,
  onTabChange,
  ordering,
  onOrderingChange,
  search,
  onSearchChange,
}: FiltersProps) {
  const t = useTranslations("Filters"); // Fetch translations

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
            <TabsTrigger value="published">{t("tabs.published")}</TabsTrigger>
            <TabsTrigger value="drafts">{t("tabs.drafts")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <select
          className="ml-4 border rounded p-2 text-sm"
          value={ordering}
          onChange={(e) => onOrderingChange(e.target.value)}
        >
          <option value="-published_at">{t("ordering.newest")}</option>
          <option value="published_at">{t("ordering.oldest")}</option>
          <option value="-views_count">{t("ordering.mostViewed")}</option>
        </select>
      </div>
      <div className="relative">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}

export default Filters;
