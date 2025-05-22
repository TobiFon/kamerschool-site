"use client";

import { Payment } from "@/types/fees";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";

interface PaymentDataTableProps {
  columns: ColumnDef<Payment, any>[];
  data: Payment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
}

export function PaymentDataTable({
  // Standardized name
  columns,
  data,
  pagination,
  onPageChange,
}: PaymentDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      pagination={pagination}
      onPageChange={onPageChange}
    />
  );
}
