import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import FileUpload from "@/components/FileUpload";
import DataVisualization from "@/components/DataVisualization";
import { DeviceReport } from "@/components/DeviceReport";
import { DeviceStatusReport } from "@/components/DeviceStatusReport";
import { DataTable } from "@/components/DataTable";
import DataComparison from "@/components/DataComparison";
import { HealthSummary } from "@/components/HealthSummary";
import type { MemoryDump } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, XCircle, Clock, FileText, BarChart3, Activity, Zap, FolderOpen } from "lucide-react";

export default function Dashboard() {
  const [selectedDump, setSelectedDump] = useState<MemoryDump | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: memoryDumps = [], refetch: refetchDumps } = useQuery<MemoryDump[]>({
    queryKey: ['/api/memory-dumps'],
    refetchInterval: 2000, // Refetch every 2 seconds to show processing status
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always fresh data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-select the most recent completed dump (ALWAYS use latest uploads)
  useEffect(() => {
    if (memoryDumps.length > 0) {
      const completedDumps = memoryDumps.filter((dump: MemoryDump) => dump.status === 'completed');
      if (completedDumps.length > 0) {
        // Sort by upload time and select the most recent - FORCE refresh for different files
        const mostRecentDump = completedDumps.sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )[0];

        // ALWAYS update to newest dump, even if same ID, in case data changed
        const shouldUpdate = !selectedDump || 
                            selectedDump.id !== mostRecentDump.id ||
                            selectedDump.filename !== mostRecentDump.filename ||
                            new Date(selectedDump.uploadedAt).getTime() !== new Date(mostRecentDump.uploadedAt).getTime();

        if (shouldUpdate) {
          setSelectedDump(mostRecentDump);
          console.log(`Auto-selected most recent dump: ${mostRecentDump.filename} (ID: ${mostRecentDump.id}) uploaded at ${mostRecentDump.uploadedAt}`);
        }
      }
    }
  }, [memoryDumps, selectedDump]);

  const formatTime = (date: Date) => {
    return date.toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  };

  const completedDumps = memoryDumps.filter((dump: MemoryDump) => dump.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto p-8 space-y-12">
        <header className="text-center space-y-6 py-8">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-6">
              <img 
                src="/attached_assets/ChatGPT Image Jul 22, 2025, 02_49_56 AM_1753170653088.png" 
                alt="The Tool Dump Logo" 
                className="h-16 w-17 object-contain"
                onError={(e) => {
                  // Fallback to SVG icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden h-16 w-16 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm border border-blue-500/30">
                <svg 
                  viewBox="0 0 100 100" 
                  className="h-10 w-10 text-blue-400"
                  fill="currentColor"
                >
                  <path d="M20 15 L80 15 C85 15 90 20 90 25 L90 30 L85 30 L85 25 C85 23 83 20 80 20 L20 20 C17 20 15 23 15 25 L15 70 C15 73 17 75 20 75 L80 75 C83 75 85 73 85 70 L85 65 L90 65 L90 70 C90 80 85 85 80 85 L20 85 C10 85 5 80 5 70 L5 25 C5 20 10 15 20 15 Z"/>
                  <circle cx="25" cy="35" r="3"/>
                  <circle cx="35" cy="35" r="3"/>
                  <path d="M45 32 L45 38 M50 32 L50 38 M55 32 L55 38"/>
                  <path d="M25 45 L35 55 M35 45 L45 55 M50 45 L60 55"/>
                  <circle cx="65" cy="50" r="2"/>
                  <circle cx="75" cy="50" r="2"/>
                </svg>
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                The Tool Dump
              </h1>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
            <p className="text-2xl text-slate-300 font-light">Advanced Binary Dump Analysis & Visualization Platform</p>
          </div>
        </header>

        <div className="space-y-12">
          <section className="glass-morphism rounded-2xl p-8">
            <FileUpload 
              onUploadComplete={() => {
                refetchDumps();
              }}
              memoryDumps={memoryDumps}
              onSelectDump={setSelectedDump}
            />
          </section>

          <section className="gradient-border">
            <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl p-8">
              <DataTable memoryDump={selectedDump}/>
            </div>
          </section>

          {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          {completedDumps.length > 0 ? (
            <Tabs defaultValue={completedDumps.length > 1 ? "combined" : completedDumps[0]?.id.toString()} className="w-full">
              <TabsList className="grid w-full grid-cols-auto bg-dark-800/50 backdrop-blur-xl border border-slate-700/50">
                {/* Combined Report Tab - only show if multiple files */}
                {completedDumps.length > 1 && (
                  <TabsTrigger 
                    value="combined" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:text-purple-400"
                  >
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Combined Report</span>
                    </div>
                  </TabsTrigger>
                )}

                {/* Individual File Tabs */}
                {completedDumps.map((dump) => (
                  <TabsTrigger 
                    key={dump.id} 
                    value={dump.id.toString()}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-blue-400"
                  >
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-4 h-4" />
                      <span>{dump.filename?.split('_')[1] || `File ${dump.id}`}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Combined Report Content */}
              {completedDumps.length > 1 && (
                <TabsContent value="combined" className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Combined Analysis
                      </h2>
                      <p className="text-slate-400 text-sm">Cross-file comparison and analysis of {completedDumps.length} files</p>
                    </div>
                  </div>
                  <DataComparison memoryDumps={completedDumps} />
                  <HealthSummary memoryDumps={completedDumps} />
                </TabsContent>
              )}

              {/* Individual File Content */}
              {completedDumps.map((dump) => (
                <TabsContent key={dump.id} value={dump.id.toString()} className="space-y-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        {dump.filename || `Memory Dump ${dump.id}`}
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Individual analysis report • {dump.fileType} • {new Date(dump.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Device Report */}
                  <DeviceReport memoryDump={dump} />

                  {/* Device Status Report */}
                  <DeviceStatusReport memoryDump={dump} />

                  {/* Data Visualization */}
                  <DataVisualization memoryDump={dump} />

                  {/* Data Table */}
                  <DataTable memoryDump={dump} />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <div className="glass-morphism rounded-xl p-8 max-w-md mx-auto">
                <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No Data Available</h3>
                <p className="text-slate-400">Upload binary files to begin analysis</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}