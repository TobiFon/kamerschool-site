"use client";

import { StudentFee } from "@/types/fees"; // Corrected import path
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";

interface StudentFeeDataTableProps {
  columns: ColumnDef<StudentFee, any>[];
  data: StudentFee[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
}

export function StudentFeeDataTable({
  // Standardized name
  columns,
  data,
  pagination,
  onPageChange,
}: StudentFeeDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      onPageChange={onPageChange}
    />
  );
}
