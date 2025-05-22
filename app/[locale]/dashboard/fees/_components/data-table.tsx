// src/app/[locale]/dashboard/finance/_components/datatables/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  // If using row selection features:
  // RowSelectionState,
  // OnChangeFn,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
// Import Select components if using rows per page
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
  // Optional external state management for sorting/filtering
  sorting?: SortingState;
  onSortingChange?: React.Dispatch<React.SetStateAction<SortingState>>; // Or specific handler type
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: React.Dispatch<
    React.SetStateAction<ColumnFiltersState>
  >;
  // Optional row selection props
  // rowSelection?: RowSelectionState;
  // onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination,
  onPageChange,
  sorting: externalSorting,
  onSortingChange: setExternalSorting,
  columnFilters: externalFilters,
  onColumnFiltersChange: setExternalFilters,
}: // rowSelection: externalRowSelection, // Example
// onRowSelectionChange: setExternalRowSelection, // Example
DataTableProps<TData, TValue>) {
  const t = useTranslations("Common");

  // Internal state management (used if external state is not provided)
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    []
  );
  const [internalColumnFilters, setInternalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [internalRowSelection, setInternalRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Determine whether to use internal or external state
  const sorting = externalSorting ?? internalSorting;
  const setSorting = setExternalSorting ?? setInternalSorting;
  const columnFilters = externalFilters ?? internalColumnFilters;
  const setColumnFilters = setExternalFilters ?? setInternalColumnFilters;
  // const rowSelection = externalRowSelection ?? internalRowSelection;
  // const setRowSelection = setExternalRowSelection ?? setInternalRowSelection;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection: internalRowSelection, // Keep row selection internal for now unless needed externally
      columnFilters,
      // Pagination state is managed externally via props & pageCount
    },
    // enableRowSelection: true, // Enable if needed
    // onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // For client-side filtering UI helpers
    getPaginationRowModel: getPaginationRowModel(), // Basic pagination logic
    getSortedRowModel: getSortedRowModel(), // Basic sorting logic
    getFacetedRowModel: getFacetedRowModel(), // For filter components
    getFacetedUniqueValues: getFacetedUniqueValues(), // For filter components
    manualPagination: true, // Server handles pagination
    manualSorting: true, // Assume server handles sorting (important!)
    manualFiltering: true, // Assume server handles filtering (important!)
    pageCount: pagination?.totalPages ?? -1, // Let table know total pages (-1 if unknown)
    debugTable: process.env.NODE_ENV === "development", // Enable debug logs in dev
  });

  const handlePageChange = (newPage: number) => {
    if (
      onPageChange &&
      newPage >= 1 &&
      newPage <= (pagination?.totalPages ?? 1)
    ) {
      onPageChange(newPage);
      // Optional: Scroll to top of table after page change
      // window.scrollTo({ top: /* table top position */, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Optional: Table Toolbar (Filters, Column Visibility) - Build separately if needed */}
      {/* <DataTableToolbar table={table} /> */}

      <div className="rounded-md border overflow-hidden">
        {/* Added responsive wrapper */}
        <div className="overflow-x-auto">
          <Table className="min-w-full divide-y divide-gray-200">
            {" "}
            {/* Ensure min width */}
            {/* *** REMOVED WHITESPACE HERE *** */}
            <TableHeader className="bg-muted/50">
              {" "}
              {/* Use muted background */}
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap" // Style header
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }} // Set width if defined
                    >
                      {header.isPlaceholder ? null : (
                        <div // Sorting UI (optional)
                          className={cn(
                            "flex items-center gap-1",
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {/* Sorting indicator */}
                          {/* {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null} */}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-2 whitespace-nowrap text-sm text-foreground" // Style cell
                        style={{
                          width:
                            cell.column.getSize() !== 150
                              ? cell.column.getSize()
                              : undefined,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-2 pt-2 flex-wrap gap-4">
          <div className="flex-1 text-sm text-muted-foreground whitespace-nowrap">
            {/* Optional: Show total row count if available from backend */}
            {/* {pagination.totalCount} {t("totalRows")} */}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
            {/* Optional: Rows per page selector (less common with server-side pagination) */}
            <div className="flex w-[120px] items-center justify-center text-sm font-medium text-muted-foreground">
              {t("pageNumber", {
                current: pagination.currentPage,
                total: pagination.totalPages,
              })}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrev}
              >
                <span className="sr-only">{t("goToFirstPage")}</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                <span className="sr-only">{t("goToPreviousPage")}</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {/* Optional: Page number input */}
              {/* <Input type="number" value={pagination.currentPage} ... /> */}
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                <span className="sr-only">{t("goToNextPage")}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNext}
              >
                <span className="sr-only">{t("goToLastPage")}</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
