"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableColumn<TData, TValue = unknown> = ColumnDef<TData, TValue>;

export type DataTableProps<TData, TValue = unknown> = {
  columns: DataTableColumn<TData, TValue>[];
  data: TData[];
  /** Initial page size. Must appear in `pageSizeOptions`. */
  defaultPageSize?: number;
  /** Page size choices offered by the "Rows per page" select. */
  pageSizeOptions?: number[];
  /** Default sorting, e.g. [{ id: "name", desc: false }]. */
  defaultSorting?: SortingState;
  /** Content shown when the table has no rows at all. */
  emptyMessage?: React.ReactNode;
  /** Content shown when search/sorting yield zero rows. */
  noResultsMessage?: React.ReactNode;
  /** Extra content rendered next to the page-size select. */
  toolbar?: React.ReactNode;
  /** Makes rows clickable; receives the click event target. */
  onRowClick?: (row: Row<TData>) => void;
  /** Optional per-row class name. */
  rowClassName?: (row: Row<TData>) => string | undefined;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

export function DataTable<TData, TValue>({
  columns,
  data,
  defaultPageSize = 10,
  pageSizeOptions = [...DEFAULT_PAGE_SIZE_OPTIONS],
  defaultSorting = [],
  emptyMessage = "No records found.",
  noResultsMessage = "No results match your search or filters.",
  toolbar,
  onRowClick,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable<TData>({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase();
      if (!query) return true;
      const values = row
        .getAllCells()
        .map((cell) => cell.getValue())
        .map((value) => (value == null ? "" : String(value)).toLowerCase())
        .filter(Boolean);
      return values.some((value) => value.includes(query));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: defaultPageSize },
    },
  });

  const totalRows = table.getPreFilteredRowModel().rows.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const { pageSize, pageIndex } = table.getState().pagination;
  const firstRow = filteredRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, filteredRows);
  const columnCount = table.getVisibleFlatColumns().length;
  const rowModel = table.getRowModel();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search…"
            className="pl-9"
          />
        </div>
        {toolbar && (
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E1E6ED] bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const clickable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={clickable ? "select-none" : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          disabled={!clickable}
                          onClick={() =>
                            header.column.toggleSorting(sorted === "desc")
                          }
                          className={cn(
                            "inline-flex items-center gap-1 text-sm font-medium",
                            clickable
                              ? "rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
                              : "cursor-default text-foreground",
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {(sorted || clickable) && (
                            <span className="text-[#9AA3B2]">
                              {sorted === "asc" ? (
                                <ArrowUp className="size-3.5" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="size-3.5" />
                              ) : (
                                <ArrowUpDown className="size-3.5 opacity-50" />
                              )}
                            </span>
                          )}
                        </button>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rowModel.rows.length > 0 ? (
              rowModel.rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row),
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columnCount}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {totalRows === 0 ? emptyMessage : noResultsMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-[#E1E6ED] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Showing{" "}
              <span className="font-medium text-[#18202F]">{firstRow}</span> to{" "}
              <span className="font-medium text-[#18202F]">{lastRow}</span> of{" "}
              <span className="font-medium text-[#18202F]">{filteredRows}</span>{" "}
              rows
              {filteredRows < totalRows && (
                <span> (filtered from {totalRows})</span>
              )}
            </p>

            <Select
              value={String(pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger
                aria-label="Rows per page"
                className="h-8 w-[60px] px-2 text-xs"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="min-w-[90px] text-center text-xs text-muted-foreground">
              Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
