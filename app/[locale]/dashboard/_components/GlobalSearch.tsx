"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { SearchResultItem } from "./SearchResults";
import { searchKeys } from "@/queries/search";
import { SearchResponse, SearchResult } from "@/types/search";
import { authFetch } from "@/lib/auth";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

const MINIMUM_SEARCH_LENGTH = 2;
const DEBOUNCE_DELAY = 300;

async function searchGlobal(query: string): Promise<SearchResponse> {
  if (!query.trim() || query.length < MINIMUM_SEARCH_LENGTH) {
    return {
      announcements: [],
      calendar_events: [],
      classes: [],
      students: [],
    };
  }

  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/search/`);
    url.searchParams.set("q", query.trim());

    const res = await authFetch(url.toString());
    if (!res.ok) {
      throw new Error(`Search failed: ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}

export function GlobalSearch() {
  const t = useTranslations("search");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const debouncedSearch = useDebounce(inputValue, DEBOUNCE_DELAY);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, isFetching } = useQuery<SearchResponse>({
    queryKey: searchKeys.query(debouncedSearch),
    queryFn: () => searchGlobal(debouncedSearch),
    enabled: debouncedSearch.length >= MINIMUM_SEARCH_LENGTH && isOpen,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useOnClickOutside(containerRef, () => setIsOpen(false));

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setIsOpen(false);
      setInputValue("");

      const routes = {
        announcement: "/dashboard/announcements/",
        calendar_event: "/dashboard/calendar/",
        class: "/dashboard/classes/",
        student: "/dashboard/students/",
      };

      const route = routes[result.type];
      if (route) {
        router.push(`${route}${result.id}`);
      }
    },
    [router]
  );

  const clearSearch = useCallback(() => {
    setInputValue("");
    inputRef.current?.focus();
  }, []);

  const hasResults = Boolean(
    data &&
      Object.values(data).some(
        (category) => Array.isArray(category) && category.length > 0
      )
  );

  return (
    <div className="relative w-full max-w-2xl z-[9999999]" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={t("searchPlaceholder")}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          aria-expanded={isOpen}
          role="combobox"
          aria-controls="search-results"
          className="pl-10 pr-12"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isFetching && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {inputValue && (
            <button
              onClick={clearSearch}
              className="rounded-full p-1 hover:bg-muted transition-colors"
              aria-label={t("clearSearch")}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute top-full w-full mt-2 rounded-md border bg-popover shadow-lg z-50"
          role="dialog"
          aria-label={t("searchResults")}
        >
          <Command className="w-full" id="search-results">
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}

              {error && (
                <CommandEmpty className="text-destructive">
                  {t("error")}
                </CommandEmpty>
              )}

              {!isLoading &&
                !error &&
                inputValue.length < MINIMUM_SEARCH_LENGTH && (
                  <CommandEmpty>
                    {t("enterMinCharacters", { count: MINIMUM_SEARCH_LENGTH })}
                  </CommandEmpty>
                )}

              {!isLoading &&
                !error &&
                inputValue.length >= MINIMUM_SEARCH_LENGTH &&
                !hasResults && <CommandEmpty>{t("noResults")}</CommandEmpty>}

              {hasResults &&
                Object.entries(data || {}).map(([key, results]) => {
                  if (!Array.isArray(results) || !results.length) return null;

                  return (
                    <CommandGroup key={key} heading={t(key)}>
                      {results.map((result) => (
                        <SearchResultItem
                          key={`${result.type}-${result.id}`}
                          result={result}
                          onSelect={handleSelect}
                        />
                      ))}
                    </CommandGroup>
                  );
                })}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
