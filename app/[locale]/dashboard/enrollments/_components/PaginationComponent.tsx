"use client"; // Ensure client component directive if not inherited
import React from "react";
import { useTranslations } from "next-intl"; // Import useTranslations
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationComponent({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
  totalCount = 0,
  pageSize = 10,
  // Optional: Pass translated labels directly if needed for more complex scenarios
  // previousLabel = "Previous",
  // nextLabel = "Next",
  // showingLabel = "Showing",
  // ofLabel = "of",
  // itemsLabel = "items",
  // pageLabel = "Page",
  // noItemsLabel = "No items found",
}) {
  const t = useTranslations("PaginationComponent"); // Initialize hook

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
      <div>
        {totalCount > 0 ? (
          <span>
            {/* Translate dynamic string */}
            {t("showingItems", {
              start: startItem,
              end: endItem,
              total: totalCount,
            })}
          </span>
        ) : (
          <span>{t("noItems")}</span> // Translate static string
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          aria-label={t("previousAriaLabel")} // Translate aria-label
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">{t("previousSrLabel")}</span>{" "}
          {/* Translate screen-reader text */}
        </Button>
        <span>
          {/* Translate dynamic string */}
          {t("pageInfo", { current: currentPage, total: totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          aria-label={t("nextAriaLabel")} // Translate aria-label
        >
          <span className="sr-only">{t("nextSrLabel")}</span>{" "}
          {/* Translate screen-reader text */}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
