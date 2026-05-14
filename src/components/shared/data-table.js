"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./empty-state";
import { Pagination } from "./pagination";
import { SearchBar } from "./search-bar";

export function DataTable({
  columns = [],
  data = [],
  searchableKeys = [],
  searchPlaceholder = "Search records",
  pageSize = 8,
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!query || searchableKeys.length === 0) return data;

    return data.filter((row) =>
      searchableKeys.some((key) =>
        String(row[key] ?? "")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    );
  }, [data, query, searchableKeys]);

  const pageCount = Math.max(Math.ceil(filteredData.length / pageSize), 1);
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <SearchBar
        className="max-w-sm"
        placeholder={searchPlaceholder}
        value={query}
        onChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
      />
      {paginatedData.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, rowIndex) => (
                <TableRow key={row.id ?? rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
