// src/app/[locale]/dashboard/finance/_components/datatables/FeeTypeDataTable.tsx

"use client";

import { FeeType } from "@/types/fees"; // Corrected import path
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";

interface FeeTypeDataTableProps {
  columns: ColumnDef<FeeType, any>[];
  data: FeeType[];
}

export function FeeTypeDataTable({ columns, data }: FeeTypeDataTableProps) {
  // No pagination for Fee Types assumed
  return <DataTable columns={columns} data={data} />;
}
