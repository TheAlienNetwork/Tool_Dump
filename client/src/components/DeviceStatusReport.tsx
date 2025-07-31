import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MemoryDump } from "@/lib/types";
import { useState } from "react";
import { 
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Activity,
  Radio,
  Signal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  RotateCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Gauge
} from "lucide-react";

interface DeviceStatusReportProps {
  memoryDump: MemoryDump;
}

export function DeviceStatusReport({ memoryDump }: DeviceStatusReportProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    communication: true,
    hall: true,
    pulses: true,
    errors: true,
    diagnostics: true
  });

  const { data: statusData, isLoading, error } = useQuery({
    queryKey: ['/api/memory-dumps', memoryDump?.id, 'device-status', memoryDump?.filename, memoryDump?.uploadedAt],
    queryFn: async () => {
      if (!memoryDump?.id) throw new Error('No memory dump selected');

      const response = await fetch(`/api/memory-dumps/${memoryDump.id}/full-table-data/${encodeURIComponent(memoryDump.filename)}/${encodeURIComponent(memoryDump.uploadedAt)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch status data: ${response.statusText}`);
      }
      const data = await response.json();

      // Analyze data for status information
      const totalRecords = data.length;
      const communicationErrors = data.filter((record: any) => record.resetMP > 0).length;
      const hallStatusActive = data.filter((record: any) => record.motorHall > 0).length;
      const avgMotorHall = data.reduce((sum: number, record: any) => sum + (record.motorHall || 0), 0) / totalRecords;
      const totalPulses = data.reduce((sum: number, record: any) => sum + (record.motorHall || 0), 0);
      const pulseErrors = data.filter((record: any) => record.motorHall === 0 && record.motorAvg > 0).length;

      // Calculate delta values
      const tempDeltas = [];
      const voltageDeltas = [];
      const currentDeltas = [];

      for (let i = 1; i < data.length; i++) {
        tempDeltas.push(Math.abs(data[i].tempMP - data[i-1].tempMP));
        voltageDeltas.push(Math.abs(data[i].batteryVoltMP - data[i-1].batteryVoltMP));
        currentDeltas.push(Math.abs(data[i].batteryCurrMP - data[i-1].batteryCurrMP));
      }

      return {
        totalRecords,
        communicationErrors,
        hallStatusActive,
        avgMotorHall,
        totalPulses,
        pulseErrors,
        tempDeltas: {
          avg: tempDeltas.reduce((sum, val) => sum + val, 0) / tempDeltas.length,
          max: Math.max(...tempDeltas),
          spikes: tempDeltas.filter(delta => delta > 5).length
        },
        voltageDeltas: {
          avg: voltageDeltas.reduce((sum, val) => sum + val, 0) / voltageDeltas.length,
          max: Math.max(...voltageDeltas),
          spikes: voltageDeltas.filter(delta => delta > 0.5).length
        },
        currentDeltas: {
          avg: currentDeltas.reduce((sum, val) => sum + val, 0) / currentDeltas.length,
          max: Math.max(...currentDeltas),
          spikes: currentDeltas.filter(delta => delta > 0.1).length
        },
        lastRecord: data[data.length - 1],
        firstRecord: data[0]
      };
    },
    enabled: !!memoryDump?.id && memoryDump?.status === 'completed',
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 0,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isLoading) {
    return (
      <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Device Status Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="glass-morphism rounded-xl p-6 text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Analyzing device status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !statusData) {
    return (
      <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Device Status Report - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="glass-morphism rounded-xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-slate-400">Failed to load device status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Communication Status */}
      <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-400" />
              Communication Status
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('communication')}
              className="text-slate-400 hover:text-slate-300"
            >
              {expandedSections.communication ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.communication && (
          <CardContent>
            <div className="glass-morphism rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Active Records</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{statusData.totalRecords.toLocaleString()}</div>
                  <div className="text-green-300 text-sm">Total data points</div>
                </div>

                <div className={`rounded-lg p-4 border ${statusData.communicationErrors > 0 
                  ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20' 
                  : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {statusData.communicationErrors > 0 ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <span className={`text-sm font-medium ${statusData.communicationErrors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      Communication Errors
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${statusData.communicationErrors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {statusData.communicationErrors}
                  </div>
                  <div className={`text-sm ${statusData.communicationErrors > 0 ? 'text-red-300' : 'text-green-300'}`}>
                    Reset events detected
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Signal className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 text-sm font-medium">Error Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {((statusData.communicationErrors / statusData.totalRecords) * 100).toFixed(2)}%
                  </div>
                  <div className="text-blue-300 text-sm">Of total records</div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Hall Status & Pulses */}
      <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-purple-400" />
              Hall Status & Motor Pulses
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('hall')}
              className="text-slate-400 hover:text-slate-300"
            >
              {expandedSections.hall ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.hall && (
          <CardContent>
            <div className="glass-morphism rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">Hall Active</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">{statusData.hallStatusActive.toLocaleString()}</div>
                  <div className="text-purple-300 text-sm">Records with Hall signal</div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-lg p-4 border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-5 h-5 text-indigo-400" />
                    <span className="text-indigo-400 text-sm font-medium">Avg Hall Value</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-400">{statusData.avgMotorHall.toFixed(1)}</div>
                  <div className="text-indigo-300 text-sm">Average pulse count</div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-lg p-4 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400 text-sm font-medium">Total Pulses</span>
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">{statusData.totalPulses.toLocaleString()}</div>
                  <div className="text-cyan-300 text-sm">Cumulative count</div>
                </div>

                <div className={`rounded-lg p-4 border ${statusData.pulseErrors > 0 
                  ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20' 
                  : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {statusData.pulseErrors > 0 ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <span className={`text-sm font-medium ${statusData.pulseErrors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      Pulse Errors
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${statusData.pulseErrors > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {statusData.pulseErrors}
                  </div>
                  <div className={`text-sm ${statusData.pulseErrors > 0 ? 'text-red-300' : 'text-green-300'}`}>
                    Missing pulses detected
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Delta Analysis */}
      <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Delta Analysis & Anomalies
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('diagnostics')}
              className="text-slate-400 hover:text-slate-300"
            >
              {expandedSections.diagnostics ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {expandedSections.diagnostics && (
          <CardContent>
            <div className="glass-morphism rounded-xl p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Temperature Deltas */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Temperature Deltas
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-sm text-slate-400">Average Change</div>
                      <div className="text-lg font-bold text-orange-400">{statusData.tempDeltas.avg.toFixed(2)}°F</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-sm text-slate-400">Maximum Change</div>
                      <div className="text-lg font-bold text-orange-400">{statusData.tempDeltas.max.toFixed(2)}°F</div>
                    </div>
                    <div className={`rounded-lg p-3 ${statusData.tempDeltas.spikes > 0 
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-green-500/10 border border-green-500/20'}`}>
                      <div className="text-sm text-slate-400">Temperature Spikes</div>
                      <div className={`text-lg font-bold ${statusData.tempDeltas.spikes > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {statusData.tempDeltas.spikes}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voltage Deltas */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Voltage Deltas
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-sm text-slate-400">Average Change</div>
                      <div className="text-lg font-bold text-blue-400">{statusData.voltageDeltas.avg.toFixed(3)}V</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-sm text-slate-400">Maximum Change</div>
                      <div className="text-lg font-bold text-blue-400">{statusData.voltageDeltas.max.toFixed(3)}V</div>
                    </div>
                    <div className={`rounded-lg p-3 ${statusData.voltageDeltas.spikes > 0 
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-green-500/10 border border-green-500/20'}`}>
                      <div className="text-sm text-slate-400">Voltage Spikes</div>
                      <div className={`text-lg font-bold ${statusData.voltageDeltas.spikes > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {statusData.voltageDeltas.spikes}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Deltas */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Current Deltas
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-sm text-slate-400">Average Change</div>
                      <div className="text-lg font-bold text-purple-400">{statusData.currentDeltas.avg.toFixed(3)}A</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-sm text-slate-400">Maximum Change</div>
                      <div className="text-lg font-bold text-purple-400">{statusData.currentDeltas.max.toFixed(3)}A</div>
                    </div>
                    <div className={`rounded-lg p-3 ${statusData.currentDeltas.spikes > 0 
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-green-500/10 border border-green-500/20'}`}>
                      <div className="text-sm text-slate-400">Current Spikes</div>
                      <div className={`text-lg font-bold ${statusData.currentDeltas.spikes > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {statusData.currentDeltas.spikes}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6 bg-slate-700" />

              {/* Data Range Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600/50">
                  <h5 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    First Record
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Timestamp:</span>
                      <span className="text-slate-300">{new Date(statusData.firstRecord.rtd).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Temperature:</span>
                      <span className="text-slate-300">{statusData.firstRecord.tempMP?.toFixed(1)}°F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Battery:</span>
                      <span className="text-slate-300">{statusData.firstRecord.batteryVoltMP?.toFixed(2)}V</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600/50">
                  <h5 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Last Record
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Timestamp:</span>
                      <span className="text-slate-300">{new Date(statusData.lastRecord.rtd).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Temperature:</span>
                      <span className="text-slate-300">{statusData.lastRecord.tempMP?.toFixed(1)}°F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Battery:</span>
                      <span className="text-slate-300">{statusData.lastRecord.batteryVoltMP?.toFixed(2)}V</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default DeviceStatusReport;