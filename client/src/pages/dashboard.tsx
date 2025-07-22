import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import FileUpload from "@/components/FileUpload";
import HealthSummary from "@/components/HealthSummary";
import DataVisualization from "@/components/DataVisualization";
import DataTable from "@/components/DataTable";
import { DeviceReport } from "@/components/DeviceReport";
import { MemoryDump } from "@/lib/types";

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

  const { data: memoryDumps = [], refetch: refetchDumps } = useQuery({
    queryKey: ['/api/memory-dumps'],
  });

  // Auto-select the most recent completed dump
  useEffect(() => {
    if (memoryDumps.length > 0 && !selectedDump) {
      const completedDump = memoryDumps.find((dump: MemoryDump) => dump.status === 'completed');
      if (completedDump) {
        setSelectedDump(completedDump);
      }
    }
  }, [memoryDumps, selectedDump]);

  const formatTime = (date: Date) => {
    return date.toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-90 border-b border-gray-80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-ibm-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-mono text-sm font-bold">ND</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-10">Neural Drill Memory Dump Visualizer</h1>
              <p className="text-sm text-gray-40">Tool Health Check & Analysis Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-30">
              <span className="w-2 h-2 bg-green-50 rounded-full"></span>
              <span>System Status: Operational</span>
            </div>
            <span className="text-sm text-gray-40 font-mono">{formatTime(currentTime)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* File Upload Section */}
        <FileUpload 
          onUploadComplete={() => {
            refetchDumps();
          }}
          memoryDumps={memoryDumps}
          onSelectDump={setSelectedDump}
        />

        {/* Tool Health Summary */}
        {selectedDump && <HealthSummary memoryDump={selectedDump} />}

        {/* Device Report Information */}
        {selectedDump && <DeviceReport memoryDump={selectedDump} />}

        {/* Data Visualization */}
        {selectedDump && <DataVisualization memoryDump={selectedDump} />}

        {/* Data Table */}
        {selectedDump && <DataTable memoryDump={selectedDump} />}
      </main>
    </div>
  );
}
