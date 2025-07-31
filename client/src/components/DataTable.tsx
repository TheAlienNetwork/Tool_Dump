import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MemoryDump, MemoryDumpDetails } from "@/lib/types";
import { Database, Activity, AlertTriangle } from "lucide-react";

interface DataTableProps {
  memoryDump: MemoryDump | null;
}

export default function DataTable({ memoryDump }: DataTableProps) {
  const { data: tableData, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/memory-dumps', memoryDump?.id, 'table-data', memoryDump?.filename, memoryDump?.uploadedAt],
    queryFn: async () => {
      if (!memoryDump?.id) throw new Error('No memory dump selected');

      const response = await fetch(`/api/memory-dumps/${memoryDump.id}/table-data/${encodeURIComponent(memoryDump.filename)}/${encodeURIComponent(memoryDump.uploadedAt)}`);
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

  // Sample first 100 records for table display (performance optimization)
  const displayData = tableData.slice(0, 100);
  const totalRecords = tableData.length;

  return (
    <section>
      <div className="gradient-border">
        <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Binary Memory Dump Analysis
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">Sensor data extracted from {memoryDump.filename}</p>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  Showing 100 of {totalRecords.toLocaleString()} records
                </Badge>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  {memoryDump.fileType} Data
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="glass-morphism rounded-xl p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300 font-semibold">Timestamp</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Temperature (°F)</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Battery Voltage</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Motor Current</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Flow Status</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Vibration Z</TableHead>
                      <TableHead className="text-slate-300 font-semibold">RPM Avg</TableHead>
                      <TableHead className="text-slate-300 font-semibold">Gamma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.map((record, index) => (
                      <TableRow key={`${record.rtd || Date.now()}-${index}-${record.tempMP || 'null'}`} className="border-slate-700 hover:bg-slate-800/30 transition-colors">
                        <TableCell className="text-slate-300 font-mono text-sm">
                          {record.rtd ? new Date(record.rtd).toLocaleString() : 'Invalid Date'}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {record.tempMP !== null && record.tempMP !== undefined && !isNaN(record.tempMP) && isFinite(record.tempMP) ? (
                            <Badge className={`${
                              record.tempMP > 130 ? 'bg-red-500/20 text-red-400' : 
                              record.tempMP > 100 ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {record.tempMP.toFixed(1)}°F
                            </Badge>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {record.batteryVoltMP !== null && record.batteryVoltMP !== undefined && !isNaN(record.batteryVoltMP) && isFinite(record.batteryVoltMP) ? (
                            <Badge className={`${
                              record.batteryVoltMP < 11.5 ? 'bg-red-500/20 text-red-400' : 
                              record.batteryVoltMP > 15.5 ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {record.batteryVoltMP.toFixed(2)}V
                            </Badge>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {record.motorAvg !== null && record.motorAvg !== undefined && !isNaN(record.motorAvg) && isFinite(record.motorAvg) ? (
                            <Badge className={`${
                              record.motorAvg > 2.0 ? 'bg-orange-500/20 text-orange-400' : 
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {record.motorAvg.toFixed(2)}A
                            </Badge>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {record.flowStatus ? (
                            <Badge className={`${
                              record.flowStatus === 'On' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {record.flowStatus}
                            </Badge>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {record.maxZ !== null && record.maxZ !== undefined && !isNaN(record.maxZ) && isFinite(record.maxZ) ? (
                            <Badge className={`${
                              Math.abs(record.maxZ) > 5 ? 'bg-red-500/20 text-red-400' : 
                              Math.abs(record.maxZ) > 2 ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {record.maxZ.toFixed(2)}g
                            </Badge>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {record.rotRpmAvg !== null && record.rotRpmAvg !== undefined && !isNaN(record.rotRpmAvg) && isFinite(record.rotRpmAvg) ? (
                            <Badge className="bg-cyan-500/20 text-cyan-400">
                              {record.rotRpmAvg.toFixed(0)} RPM
                            </Badge>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {record.gamma !== null && record.gamma !== undefined && !isNaN(record.gamma) && isFinite(record.gamma) ? (
                            <Badge className={`${
                              record.gamma > 45 ? 'bg-red-500/20 text-red-400' : 
                              record.gamma < 15 ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {record.gamma.toFixed(1)} cps
                            </Badge>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalRecords > 100 && (
                <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <p className="text-blue-400 text-sm font-medium">
                      Performance Note: Showing first 100 records of {totalRecords.toLocaleString()} total records for optimal display performance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}