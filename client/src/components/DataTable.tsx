import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemoryDumpDetails, SensorData } from "@/lib/types";
import { Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps {
  memoryDump: {
    id: number;
    status: string;
  } | null;
}

export default function DataTable({ memoryDump }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: dumpDetails, isLoading } = useQuery<MemoryDumpDetails>({
    queryKey: ['/api/memory-dumps', memoryDump?.id],
    enabled: memoryDump?.status === 'completed',
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  if (!memoryDump) {
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Binary Memory Dump Analysis
              </CardTitle>
              <p className="text-slate-400 text-sm">Raw sensor data and measurements</p>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <p className="text-slate-400 text-lg">Select a memory dump to view detailed analysis</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const handleExportCSV = () => {
    if (!dumpDetails?.sensorData) return;

    const headers = [
      'Timestamp', 'Temp (°F)', 'Battery (V)', 'Shock Z (g)', 
      'Motor Avg (A)', 'Gamma', 'Flow Status', 'Reset'
    ];
    
    const csvContent = [
      headers.join(','),
      ...dumpDetails.sensorData.map(row => [
        new Date(row.rtd).toISOString(),
        row.tempMP?.toFixed(1) || '',
        row.batteryVoltMP?.toFixed(2) || '',
        row.shockZ?.toFixed(1) || '',
        row.motorAvg?.toFixed(1) || '',
        row.gamma || '',
        row.flowStatus || '',
        row.resetMP || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural_drill_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

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
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-dark-600 rounded-lg w-1/4"></div>
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-16 bg-dark-600 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!dumpDetails?.sensorData) {
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
                <p className="text-slate-400 text-lg">No sensor data available for this dump</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const sensorData = dumpDetails.sensorData;
  const totalPages = Math.ceil(sensorData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sensorData.slice(startIndex, endIndex);

  const formatValue = (value: number | undefined | null, decimals: number = 1): string => {
    return value != null ? value.toFixed(decimals) : '-';
  };

  const getValueColor = (value: number | undefined | null, thresholds: { high?: number; low?: number }): string => {
    if (value == null) return 'text-gray-40';
    if (thresholds.high && value > thresholds.high) return 'text-red-50';
    if (thresholds.low && value < thresholds.low) return 'text-red-50';
    return 'text-gray-30';
  };

  return (
    <section>
      <div className="gradient-border">
        <Card className="bg-dark-800/50 backdrop-blur-xl border-0 overflow-hidden">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  Binary Memory Dump Analysis
                </CardTitle>
                <p className="text-slate-400 text-sm mt-1">Raw sensor data extracted from binary dump ({sensorData.length.toLocaleString()} records)</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleExportCSV}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50 backdrop-blur-sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-80 hover:bg-transparent">
                  <TableHead className="text-gray-10 font-medium">Timestamp</TableHead>
                  <TableHead className="text-gray-10 font-medium">Temp (°F)</TableHead>
                  <TableHead className="text-gray-10 font-medium">Battery (V)</TableHead>
                  <TableHead className="text-gray-10 font-medium">Shock Z (g)</TableHead>
                  <TableHead className="text-gray-10 font-medium">Motor Avg (A)</TableHead>
                  <TableHead className="text-gray-10 font-medium">Gamma</TableHead>
                  <TableHead className="text-gray-10 font-medium">Flow Status</TableHead>
                  <TableHead className="text-gray-10 font-medium">Reset</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((row) => (
                  <TableRow key={row.id} className="border-gray-80 hover:bg-gray-80/50">
                    <TableCell className="font-mono text-xs text-gray-30">
                      {new Date(row.rtd).toLocaleString()}
                    </TableCell>
                    <TableCell className={getValueColor(row.tempMP, { high: 130, low: 100 })}>
                      {formatValue(row.tempMP, 1)}
                    </TableCell>
                    <TableCell className={getValueColor(row.batteryVoltMP, { high: 15.5, low: 11.5 })}>
                      {formatValue(row.batteryVoltMP, 2)}
                    </TableCell>
                    <TableCell className={getValueColor(row.shockZ, { high: 6.0 })}>
                      {formatValue(row.shockZ, 1)}
                    </TableCell>
                    <TableCell className={getValueColor(row.motorAvg, { high: 2.0 })}>
                      {formatValue(row.motorAvg, 1)}
                    </TableCell>
                    <TableCell className={getValueColor(row.gamma, { high: 45, low: 15 })}>
                      {row.gamma || '-'}
                    </TableCell>
                    <TableCell className="text-gray-30">
                      {row.flowStatus || '-'}
                    </TableCell>
                    <TableCell className="text-gray-30">
                      {row.resetMP || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-xs text-gray-40">
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, sensorData.length)} of {sensorData.length} records
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-gray-80 border-gray-70 text-gray-10 hover:bg-gray-70 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="px-2">Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-gray-80 border-gray-70 text-gray-10 hover:bg-gray-70 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
