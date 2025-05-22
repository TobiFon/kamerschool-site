"use client";

import { ClassFee } from "@/types/fees"; // Corrected import path
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";

interface ClassFeeDataTableProps {
  columns: ColumnDef<ClassFee, any>[];
  data: ClassFee[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
}

export function ClassFeeDataTable({
  // Standardized name
  columns,
  data,
  pagination,
  onPageChange,
}: ClassFeeDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      onPageChange={onPageChange}
    />
  );
}
