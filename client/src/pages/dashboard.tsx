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
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="container mx-auto p-8 space-y-12">
        <header className="text-center space-y-6 py-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Neural Drill Analytics
            </h1>
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

          <section className="glass-morphism rounded-2xl p-8">
            <DataTable memoryDump={selectedDump}/>
          </section>

          {selectedDump && (
            <section className="space-y-8">
              <HealthSummary memoryDump={selectedDump} />
            </section>
          )}

          {selectedDump && (
            <section className="space-y-8">
              <DeviceReport memoryDump={selectedDump} />
            </section>
          )}

          {selectedDump && (
            <section className="space-y-8">
              <DataVisualization memoryDump={selectedDump} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}