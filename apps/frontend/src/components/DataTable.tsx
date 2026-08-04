'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number, globalIndex: number) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  predicate: (item: any) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKeys?: string[];
  searchPlaceholder?: string;
  filters?: FilterOption[];
  initialItemsPerPage?: number;
  itemsPerPageOptions?: number[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKeys = ['name', 'email'],
  searchPlaceholder = 'Search records...',
  filters = [],
  initialItemsPerPage = 10,
  itemsPerPageOptions = [5, 10, 20, 50, 100],
  loading = false,
  emptyMessage = 'No records found matching your criteria.',
  keyExtractor,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterKey, setActiveFilterKey] = useState<string>(filters[0]?.key || 'ALL');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matches = searchKeys.some((key) => {
          const val = item[key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      // 2. Custom Filter Predicate
      if (activeFilterKey !== 'ALL') {
        const activeFilter = filters.find((f) => f.key === activeFilterKey);
        if (activeFilter && !activeFilter.predicate(item)) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, searchKeys, activeFilterKey, filters]);

  // Sort Logic
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination Math
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, safeCurrentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value, 10);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const startRecord = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-border/50 shadow-sm">
        {/* Search Input */}
        <div className="flex items-center gap-2 w-full md:w-80 bg-background border border-border px-3 py-2 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Filter Badges */}
        {filters.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  setActiveFilterKey(filter.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilterKey === filter.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card hover:bg-muted text-muted-foreground border border-border/40'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-border/50">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading data...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm font-medium">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-card/40">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={`py-3.5 px-4 font-semibold uppercase tracking-wider text-xs text-muted-foreground ${
                        col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''
                      } ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      <div
                        className={`inline-flex items-center gap-1.5 ${
                          col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span>{col.label}</span>
                        {col.sortable && (
                          <ArrowUpDown className={`h-3 w-3 ${sortKey === col.key ? 'text-brand font-bold' : 'opacity-40'}`} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedData.map((row, idx) => {
                  const globalIdx = (safeCurrentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={keyExtractor(row)} className="hover:bg-card/20 transition-colors">
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`py-3.5 px-4 ${
                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {col.render ? col.render(row, idx, globalIdx) : row[col.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination Controls */}
        <div className="p-4 border-t border-border bg-card/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
          {/* Items Per Page & Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="bg-background border border-border rounded-lg px-2 py-1 outline-none text-foreground font-semibold"
              >
                {itemsPerPageOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span>entries per page</span>
            </div>

            <span className="hidden md:inline-block text-muted-foreground/60">|</span>

            <span>
              Showing <strong className="text-foreground">{startRecord}</strong> to{' '}
              <strong className="text-foreground">{endRecord}</strong> of{' '}
              <strong className="text-foreground">{totalItems}</strong> records
            </span>
          </div>

          {/* Pagination Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:hover:bg-background transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:hover:bg-background transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-foreground">
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:hover:bg-background transition-colors"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-30 disabled:hover:bg-background transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
