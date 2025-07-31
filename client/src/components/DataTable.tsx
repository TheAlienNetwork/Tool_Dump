
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Filter, Search } from "lucide-react";
import { MemoryDump, MemoryDumpDetails } from "@/lib/types";
import { Database, Activity, AlertTriangle } from "lucide-react";

interface DataTableProps {
  memoryDump: MemoryDump | null;
}

// Enhanced helper function to format values with units and handle N/A
function formatValue(value: number | string | null | undefined, type: string): string {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && (isNaN(value) || !isFinite(value)))) {
    return "N/A";
  }

  const numValue = Number(value);
  
  // Handle extremely small scientific notation values
  if (typeof numValue === 'number' && Math.abs(numValue) < 0.0001 && numValue !== 0) {
    return "~0.000";
  }

  switch (type) {
    case 'temperature':
      if (numValue < -100 || numValue > 1000) return "N/A";
      return `${numValue.toFixed(1)}°F (${((numValue - 32) * 5/9).toFixed(1)}°C)`;
    case 'voltage':
      if (Math.abs(numValue) < 0.001) return "0.000 V";
      return `${numValue.toFixed(3)} V`;
    case 'current':
      if (Math.abs(numValue) < 0.001) return "0.000 A";
      return `${numValue.toFixed(3)} A`;
    case 'gamma':
      if (numValue < 0) return "N/A";
      return `${numValue.toFixed(1)} cps`;
    case 'acceleration':
    case 'shock':
    case 'vibration':
      if (Math.abs(numValue) < 0.001) return "0.000 g";
      return `${numValue.toFixed(3)} g`;
    case 'rpm':
      if (numValue < 0) return "N/A";
      return `${Math.round(numValue)} RPM`;
    case 'percentage':
      return `${numValue.toFixed(1)}%`;
    case 'pressure':
      return `${numValue.toFixed(2)} psi`;
    case 'angle':
      return `${numValue.toFixed(2)}°`;
    case 'time':
      return `${numValue.toFixed(2)} s`;
    case 'flow':
      return numValue > 0 ? "Active" : "Inactive";
    default:
      if (typeof numValue === 'number') {
        if (Math.abs(numValue) < 0.001) return "0.000";
        return numValue.toFixed(3);
      }
      return String(value);
  }
}

export default function DataTable({ memoryDump }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Display 50 records per page
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Move useQuery to be always called (before any conditional returns)
  const { data: tableData, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/memory-dumps', memoryDump?.id, 'full-table-data', memoryDump?.filename, memoryDump?.uploadedAt],
    queryFn: async () => {
      if (!memoryDump?.id) throw new Error('No memory dump selected');

      const response = await fetch(`/api/memory-dumps/${memoryDump.id}/full-table-data/${encodeURIComponent(memoryDump.filename)}/${encodeURIComponent(memoryDump.uploadedAt)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch table data: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: memoryDump?.status === 'completed',
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always fetch fresh data for new dumps
    gcTime: 0, // Don't cache table data - always fresh
  });

  // Move all useMemo hooks here (before any conditional returns)
  const filteredData = useMemo(() => {
    if (!tableData) return [];
    let data = [...tableData];

    if (globalFilter) {
      data = data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(globalFilter.toLowerCase())
        )
      );
    }

    for (const column in columnFilters) {
      const filterValue = columnFilters[column];
      if (filterValue) {
        data = data.filter(item =>
          String(item[column]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    }

    return data;
  }, [tableData, globalFilter, columnFilters]);

  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      return sortDirection === "asc" ? aString.localeCompare(bString) : bString.localeCompare(aString);
    });

    return sorted;
  }, [filteredData, sortColumn, sortDirection]);

  const totalRecords = sortedData.length;
  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);
  const displayData = sortedData.slice(startIndex, endIndex);

  // Now handle conditional rendering after all hooks are defined
  if (!memoryDump) {
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Binary Memory Dump Analysis
              </CardTitle>
              <p className="text-slate-400 text-sm">Detailed sensor data table view</p>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Select a completed memory dump to view data table</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Binary Memory Dump Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-lg">Loading sensor data table...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (error || !tableData || tableData.length === 0) {
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Binary Memory Dump Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Error loading data table</p>
                <p className="text-slate-500 text-sm mt-2">
                  {error instanceof Error ? error.message : 'No sensor data available'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Pagination control functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToPrevPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  // CSV Export function
  const exportToCSV = () => {
    const headers = Object.keys(tableData[0]).join(',');
    const csv = [
      headers,
      ...tableData.map(item => Object.values(item).map(value => String(value).replace(/,/g, '')).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${memoryDump.filename}_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section>
      <div className="gradient-border">
        <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Complete Binary Memory Dump Analysis - All Data
            </CardTitle>
            <div className="flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-slate-400 text-sm">Complete sensor dataset from {memoryDump.filename} - All {totalRecords.toLocaleString()} records available</p>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  Page {currentPage}: {startIndex + 1}-{endIndex} of {totalRecords.toLocaleString()} records
                </Badge>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  {memoryDump.fileType} Complete Dataset
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                  50 per page
                </Badge>
              </div>
            </div>

            {/* Filtering and Export Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 mt-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Global Filter"
                  value={globalFilter}
                  onChange={(e) => {
                    setGlobalFilter(e.target.value);
                    setCurrentPage(1); // Reset page on filter
                  }}
                  className="bg-slate-800 border-slate-700 text-slate-300 focus:ring-blue-500 focus:border-blue-500 text-sm rounded-lg block w-full p-2.5"
                />
                <Button
                  onClick={exportToCSV}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="glass-morphism rounded-xl p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300 font-semibold">Record #</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Timestamp</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Temperature</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Battery Voltage</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Battery Current</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Motor Current</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Flow Status</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Gamma Radiation</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Max Vibration Z</TableHead>
                      <TableHead className="text-slate-300 font-semibold">RPM Average</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Acceleration X</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Acceleration Y</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Acceleration Z</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Shock X</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Shock Y</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Shock Z</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.map((record, index) => {
                      const actualIndex = startIndex + index + 1;
                      return (
                        <TableRow key={actualIndex} className="border-slate-700 hover:bg-slate-800/30">
                          <TableCell className="text-slate-300 font-mono text-sm font-bold">
                            #{actualIndex.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-slate-300 font-mono text-sm">
                            {record.rtd ? new Date(record.rtd).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.tempMP, 'temperature')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.batteryVoltMP, 'voltage')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.batteryCurrMP, 'current')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.motorAvg, 'current')}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <Badge className={record.flowStatus === 'On' || record.flowStatus === 'Active' || record.flowStatus > 0 ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}>
                              {formatValue(record.flowStatus, 'flow')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.gamma, 'gamma')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.maxZ, 'vibration')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.rotRpmAvg, 'rpm')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.accelAX, 'acceleration')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.accelAY, 'acceleration')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.accelAZ, 'acceleration')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.shockX, 'shock')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.shockY, 'shock')}
                          </TableCell>
                          <TableCell className="text-slate-300 font-medium">
                            {formatValue(record.shockZ, 'shock')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords.toLocaleString()} records
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    size="sm"
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    size="sm"
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400">Page</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-300 text-center focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-sm text-slate-400">of {totalPages.toLocaleString()}</span>
                  </div>
                  <Button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    size="sm"
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    size="sm"
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
