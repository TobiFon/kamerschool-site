"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface FilterOption {
  value: string | number; // Can be number or string ID
  label: string;
}

interface FilterConfigItem {
  id: string; // Corresponds to the key in the filters state object
  label: string;
  type: "search" | "select";
  placeholder?: string;
  options?: FilterOption[];
}

interface FilterControlsProps {
  filters: Record<string, string | number | undefined>; // Allow undefined/number
  setFilters: React.Dispatch<React.SetStateAction<any>>; // Use 'any' for flexibility or a more specific type
  config: FilterConfigItem[];
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  setFilters,
  config,
}) => {
  const t = useTranslations("Common");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Reset page to 1 when any filter changes, ensure value is string
    setFilters((prev: any) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // value from Select will be the string representation of the option's value
    // It WILL be "" if the placeholder/clear state is selected
    // Reset page to 1
    setFilters((prev: any) => ({
      ...prev,
      [name]: value || undefined,
      page: 1,
    })); // Set undefined if value is ""
  };

  const handleReset = () => {
    const initialFilters = config.reduce((acc, item) => {
      acc[item.id] = undefined; // Reset all configured filters to undefined
      return acc;
    }, {} as Record<string, any>); // Use 'any' or a specific type
    initialFilters.page = 1; // Ensure page is reset
    setFilters(initialFilters);
  };

  // Check if any configured filter has a defined value (not empty string or undefined)
  const hasActiveFilters = config.some(
    (item) => filters[item.id] !== undefined && filters[item.id] !== ""
  );

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 border rounded-md bg-background shadow-sm">
      {config.map((item) => (
        <div key={item.id} className="flex-grow min-w-[180px] md:min-w-[200px]">
          <Label
            htmlFor={item.id}
            className="text-xs font-medium text-muted-foreground"
          >
            {item.label}
          </Label>
          {item.type === "search" && (
            <Input
              id={item.id}
              name={item.id}
              placeholder={item.placeholder || t("search") + "..."}
              // Ensure value is a string for Input, default to empty string if undefined
              value={(filters[item.id] as string) || ""}
              onChange={handleInputChange}
              className="h-9 mt-1" // Added margin top
            />
          )}
          {item.type === "select" && (
            <Select
              name={item.id}
              // Ensure value is string for Select, use empty string for placeholder
              value={String(filters[item.id] || "")}
              onValueChange={(value) => handleSelectChange(item.id, value)}
            >
              <SelectTrigger className="h-9 mt-1">
                {/* Placeholder defined here is shown when value is "" */}
                <SelectValue placeholder={item.placeholder || t("selectAll")} />
              </SelectTrigger>
              <SelectContent>
                {/* Map the actual options */}
                {item.options?.map((option) => {
                  // Ensure the value passed is never actually an empty string for a real item
                  const itemValue = String(option.value);
                  return (
                    <SelectItem key={itemValue} value={itemValue}>
                      {option.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
      {/* Only show reset button if there are active filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          {t("resetFilters")}
        </Button>
      )}
    </div>
  );
};
