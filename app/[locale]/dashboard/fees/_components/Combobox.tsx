// src/components/ui/combobox.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce"; // Import debounce hook

interface ComboboxOption {
  value: number;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: number | null; // The selected ID
  onChange: (value: number | null) => void; // Callback with the selected ID or null
  onInputChange?: (value: string) => void; // Callback for search term changes
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  onInputChange,
  placeholder = "Select option...",
  loading = false,
  disabled = false,
  emptyMessage = "No option found.",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  React.useEffect(() => {
    if (onInputChange) {
      onInputChange(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onInputChange]);

  const selectedLabel = React.useMemo(() => {
    return options.find((option) => option.value === value)?.label;
  }, [options, value]);

  const handleSelect = (currentValue: string) => {
    const selectedOption = options.find(
      (option) => String(option.value) === currentValue
    );
    onChange(selectedOption ? selectedOption.value : null);
    setOpen(false);
    setInputValue("");
  };

  // Clear input value if popover is closed without selection
  React.useEffect(() => {
    if (!open) {
      setInputValue("");
      // Optionally refetch initial options if search term was cleared
      if (onInputChange && debouncedSearchTerm !== "") {
        // onInputChange(""); // Trigger refetch with empty search
      }
    }
  }, [open, onInputChange, debouncedSearchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled || loading}
        >
          <span className="truncate">
            {value ? selectedLabel : placeholder}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          {" "}
          {/* Let API handle filtering */}
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={setInputValue}
            disabled={disabled}
          />
          <CommandList>
            {loading &&
              !options.length &&
              inputValue === debouncedSearchTerm && ( // Show loading indicator correctly
                <div className="py-6 text-center text-sm">Loading...</div>
              )}
            {!loading && !options.length && debouncedSearchTerm && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            {!loading &&
              !options.length &&
              !debouncedSearchTerm &&
              !inputValue && ( // Show empty only if no options and no search
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={String(option.value)} // CommandItem value is usually string
                  onSelect={handleSelect}
                  disabled={disabled}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
