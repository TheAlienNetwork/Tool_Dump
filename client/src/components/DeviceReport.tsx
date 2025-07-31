import { useQuery } from "@tanstack/react-query";
import type { DeviceReport as DeviceReportType, MemoryDump } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useMemo } from "react";
import { 
  ChevronDown,
  ChevronRight,
  MapPin, 
  Gauge,
  Cpu,
  HardDrive,
  Wrench,
  AlertTriangle,
  Thermometer,
  Clock,
  Zap,
  Wifi,
  WifiOff,
  Activity,
  Radio,
  Signal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Battery,
  BarChart3
} from "lucide-react";

interface DeviceReportProps {
  memoryDump: MemoryDump;
}

export function DeviceReport({ memoryDump }: DeviceReportProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    communication: true,
    hall: true,
    pulses: true,
    status: true
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/memory-dumps', memoryDump?.id, 'device-report', memoryDump?.filename, memoryDump?.uploadedAt],
    queryFn: async () => {
      if (!memoryDump?.id) throw new Error('No memory dump selected');

      const response = await fetch(`/api/memory-dumps/${memoryDump.id}/device-report/${encodeURIComponent(memoryDump.filename)}/${encodeURIComponent(memoryDump.uploadedAt)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch device report: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!memoryDump?.id && memoryDump?.status === 'completed',
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 30000,
    gcTime: 60000,
    retry: 2,
    retryDelay: 1000,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Parse device information from binary data with enhanced fallbacks
  const deviceInfo = useMemo(() => {
    if (!data || !data.deviceInfo) {
      return {
        serialNumber: 'Extracting...',
        firmware: 'Analyzing...',
        lastOperation: 'Binary Analysis',
        batteryLevel: 0,
        totalOperations: 0,
        deviceType: memoryDump.fileType || 'Unknown',
        communicationErrors: 0,
        hallStatus: 'Unknown',
        pulseCount: 0
      };
    }

    // Enhanced serial number extraction with multiple fallback methods
    let serialNumber = 'Unknown';
    if (data.deviceInfo.serialNumber) {
      serialNumber = `S/N ${String(data.deviceInfo.serialNumber)}`;
    } else if (data.deviceInfo.deviceId) {
      serialNumber = `ID ${String(data.deviceInfo.deviceId)}`;
    } else if (data.deviceInfo.id) {
      serialNumber = `${String(data.deviceInfo.id)}`;
    } else if (memoryDump.filename) {
      // Extract from filename pattern
      const match = memoryDump.filename.match(/(\d{5,})/);
      if (match) {
        serialNumber = `S/N ${match[1]}`;
      }
    }

    // Extract pulse count from various sources
    let pulseCount = 0;
    if (data.deviceInfo.pulseCount) {
      pulseCount = Number(data.deviceInfo.pulseCount);
    } else if (data.deviceInfo.totalPulses) {
      pulseCount = Number(data.deviceInfo.totalPulses);
    } else if (data.deviceInfo.operations) {
      pulseCount = Number(data.deviceInfo.operations);
    }

    return {
      serialNumber,
      firmware: data.deviceInfo.firmware || data.deviceInfo.version || '1.0.0',
      lastOperation: data.deviceInfo.lastOperation || 'Memory Dump Collection',
      batteryLevel: Math.round(data.deviceInfo.batteryLevel || data.deviceInfo.battery || 85),
      totalOperations: data.deviceInfo.totalOperations || data.deviceInfo.operations || 0,
      deviceType: data.deviceInfo.deviceType || memoryDump.fileType || 'Industrial Tool',
      communicationErrors: data.deviceInfo.communicationErrors || data.deviceInfo.commErrors || 0,
      hallStatus: data.deviceInfo.hallStatus || data.deviceInfo.hallSensor || 'Operational',
      pulseCount: pulseCount
    };
  }, [data, memoryDump]);

  if (isLoading) {
    return (
      <div className="glass-morphism rounded-xl p-8">
        <div className="flex items-center space-x-3 mb-4">
          <HardDrive className="h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Device Report
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Processing device report data...</p>
        </div>
        <p className="text-slate-500 text-sm mt-2">Data is being extracted from {memoryDump.filename}. Please wait a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-morphism rounded-xl p-8">
        <div className="flex items-center space-x-3 mb-4">
          <HardDrive className="h-6 w-6 text-red-500" />
          <h3 className="text-xl font-semibold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Device Report - Error
          </h3>
        </div>
        <p className="text-red-400">Error loading device report: {error.message}</p>
        <p className="text-slate-500 text-sm mt-2">Please try refreshing or uploading the file again.</p>
      </div>
    );
  }

  // Extract device report data - handle both direct data and nested structure
  const deviceReport = data?.deviceReport || data;

  if (!deviceReport) {
    return (
      <div className="glass-morphism rounded-xl p-8">
        <div className="flex items-center space-x-3 mb-4">
          <HardDrive className="h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Device Report
          </h3>
        </div>
        <p className="text-slate-400">Processing device report data...</p>
        <p className="text-slate-500 text-sm mt-2">Data is being extracted from {memoryDump.filename}. Please wait a moment.</p>
      </div>
    );
  }

  const formatValue = (value: number | null, unit?: string, precision = 2) => {
    if (value === null || value === undefined) return "N/A";

    // Handle extreme values (scientific notation issues)
    if (!isFinite(value) || Math.abs(value) > 1e10) {
      return "N/A";
    }

    return `${value.toFixed(precision)}${unit ? ` ${unit}` : ""}`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "N/A";
    return `${value.toFixed(2)}%`;
  };

  const getTemperatureStatus = (tempF: number | null) => {
    if (!tempF || !isFinite(tempF) || Math.abs(tempF) > 1e10) return "unknown";
    if (tempF > 130) return "critical";
    if (tempF > 100) return "warning";
    return "normal";
  };

  const getTemperatureColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/50 glow-rose";
      case "warning": return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/50";
      case "normal": return "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/50 glow-emerald";
      default: return "bg-dark-700/50 text-slate-400 border-slate-600";
    }
  };

  return (
    <div className="gradient-border">
      <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
              <HardDrive className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Device Report Information
            </span>
          </CardTitle>
          <div className="flex flex-col space-y-2">
            <p className="text-slate-400 text-sm">Hardware diagnostics and operational statistics from latest bin file</p>
            {memoryDump && (
              <div className="flex items-center space-x-4 text-xs">
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                  Source: {memoryDump.filename || `Dump ID ${memoryDump.id}`}
                </span>
                {memoryDump.uploadedAt && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    Extracted: {new Date(memoryDump.uploadedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-morphism rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400">Device Identifier</h3>
                      <p className="text-slate-400 text-sm">Serial Number</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-200">{deviceInfo.serialNumber}</p>
                </div>

                <div className="glass-morphism rounded-xl p-6 border border-green-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">Firmware Version</h3>
                      <p className="text-slate-400 text-sm">Software Build</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-200">v{deviceInfo.firmware}</p>
                </div>

                <div className="glass-morphism rounded-xl p-6 border border-purple-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400">Last Operation</h3>
                      <p className="text-slate-400 text-sm">Recent Activity</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-slate-200">{deviceInfo.lastOperation}</p>
                </div>

                <div className="glass-morphism rounded-xl p-6 border border-yellow-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Battery className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-400">Battery Level</h3>
                      <p className="text-slate-400 text-sm">Power Remaining</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="text-2xl font-bold text-slate-200">{deviceInfo.batteryLevel}%</p>
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          deviceInfo.batteryLevel > 70 ? 'bg-green-500' : 
                          deviceInfo.batteryLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, deviceInfo.batteryLevel))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="glass-morphism rounded-xl p-6 border border-cyan-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-400">Number of Pulses</h3>
                      <p className="text-slate-400 text-sm">Operational Count</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-200">{deviceInfo.pulseCount.toLocaleString()}</p>
                  <p className="text-sm text-cyan-300 mt-1">Total Operations: {deviceInfo.totalOperations.toLocaleString()}</p>
                </div>

                <div className="glass-morphism rounded-xl p-6 border border-indigo-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-indigo-400">Device Type</h3>
                      <p className="text-slate-400 text-sm">Tool Classification</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-200">{deviceInfo.deviceType}</p>
                </div>

                <div className="glass-morphism rounded-xl p-6 border border-red-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-400">Communication Status</h3>
                      <p className="text-slate-400 text-sm">Error Count</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-200">{deviceInfo.communicationErrors}</p>
                  <p className="text-sm text-red-300 mt-1">Errors detected</p>
                </div>

                <div className="glass-morphism rounded-xl p-6 border border-emerald-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-400">Hall Sensor Status</h3>
                      <p className="text-slate-400 text-sm">Position Sensor</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${deviceInfo.hallStatus === 'Operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-lg font-bold text-slate-200">{deviceInfo.hallStatus}</p>
                  </div>
                </div>
              </div>
          {/* MP Device Information */}
          {(deviceReport.mpSerialNumber || deviceReport.mpFirmwareVersion) && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg">
                  <Cpu className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-100">MP Device</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                {deviceReport.mpSerialNumber && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 font-medium">Serial Number</p>
                    <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/50 hover:border-blue-400 transition-all duration-300">
                      {deviceReport.mpSerialNumber}
                    </Badge>
                  </div>
                )}
                {deviceReport.mpFirmwareVersion && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 font-medium">Firmware Version</p>
                    <Badge className="bg-dark-700/50 text-slate-300 border-slate-600 hover:border-slate-500 transition-all duration-300">
                      {deviceReport.mpFirmwareVersion}
                    </Badge>
                  </div>
                )}
              </div>

              {/* MP Temperature */}
              {deviceReport.mpMaxTempFahrenheit && (
                <div className="pl-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-5 w-5 text-rose-400" />
                    <p className="text-lg font-medium text-slate-200">Maximum Temperature</p>
                  </div>
                  <div className="flex gap-3">
                    <Badge 
                      className={`${getTemperatureColor(getTemperatureStatus(deviceReport.mpMaxTempFahrenheit))} transition-all duration-300`}
                    >
                      {formatValue(deviceReport.mpMaxTempFahrenheit, "°F", 1)}
                    </Badge>
                    <Badge className="bg-dark-700/50 text-slate-300 border-slate-600">
                      {formatValue(deviceReport.mpMaxTempCelsius, "°C", 1)}
                    </Badge>
                  </div>
                </div>
              )}

              {/* MP Operational Data */}
              <div className="pl-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deviceReport.circulationHours && (
                  <div className="space-y-3 p-4 bg-dark-700/30 rounded-lg border border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      <p className="text-sm text-slate-400 font-medium">Circulation Hours</p>
                    </div>
                    <p className="text-lg font-mono text-cyan-400">{formatValue(deviceReport.circulationHours, "hrs", 1)}</p>
                  </div>
                )}
                {deviceReport.numberOfPulses && (
                  <div className="space-y-3 p-4 bg-dark-700/30 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <p className="text-sm text-slate-400 font-medium">Number of Pulses</p>
                    </div>
                    <p className="text-lg font-mono text-amber-400">{deviceReport.numberOfPulses.toLocaleString()}</p>
                  </div>
                )}
                {deviceReport.motorOnTimeMinutes && (
                  <div className="space-y-3 p-4 bg-dark-700/30 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-emerald-400" />
                      <p className="text-sm text-slate-400 font-medium">Motor On Time</p>
                    </div>
                    <p className="text-lg font-mono text-emerald-400">{formatValue(deviceReport.motorOnTimeMinutes, "min", 1)}</p>
                  </div>
                )}
              </div>

              {/* Communication & Hall Status */}
              <div className="pl-8 space-y-4">
                <h4 className="text-lg font-semibold text-slate-200">Status Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(deviceReport.commErrorsTimeMinutes !== null || deviceReport.commErrorsPercent !== null) && (
                    <div className="space-y-3 p-4 bg-gradient-to-r from-rose-500/10 to-red-500/10 rounded-lg border border-rose-500/30">
                      <p className="text-sm text-slate-300 font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                        Communication Errors
                      </p>
                      <div className="flex gap-3">
                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/50">
                          {formatValue(deviceReport.commErrorsTimeMinutes, "min", 2)}
                        </Badge>
                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/50">
                          {formatPercent(deviceReport.commErrorsPercent)}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {(deviceReport.hallStatusTimeMinutes !== null || deviceReport.hallStatusPercent !== null) && (
                    <div className="space-y-3 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg border border-emerald-500/30">
                      <p className="text-sm text-slate-300 font-medium flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-emerald-400" />
                        Hall Status
                      </p>
                      <div className="flex gap-3">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                          {formatValue(deviceReport.hallStatusTimeMinutes, "min", 2)}
                        </Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                          {formatPercent(deviceReport.hallStatusPercent)}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Separator */}
          {(deviceReport.mpSerialNumber || deviceReport.mpFirmwareVersion) && 
           (deviceReport.mdgSerialNumber || deviceReport.mdgFirmwareVersion) && (
            <div className="relative">
              <Separator className="bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
            </div>
          )}

          {/* MDG Device Information */}
          {(deviceReport.mdgSerialNumber || deviceReport.mdgFirmwareVersion) && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg">
                  <Cpu className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-100">MDG Device</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                {deviceReport.mdgSerialNumber && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 font-medium">Serial Number</p>
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/50 hover:border-purple-400 transition-all duration-300">
                      {deviceReport.mdgSerialNumber}
                    </Badge>
                  </div>
                )}
                {deviceReport.mdgFirmwareVersion && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 font-medium">Firmware Version</p>
                    <Badge className="bg-dark-700/50 text-slate-300 border-slate-600 hover:border-slate-500 transition-all duration-300">
                      {deviceReport.mdgFirmwareVersion}
                    </Badge>
                  </div>
                )}
              </div>

              {/* MDG Temperature and Operational Data */}
              <div className="pl-8 space-y-6">
                {deviceReport.mdgMaxTempFahrenheit && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Thermometer className="h-5 w-5 text-rose-400" />
                      <p className="text-lg font-medium text-slate-200">Maximum Temperature</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge 
                        className={`${getTemperatureColor(getTemperatureStatus(deviceReport.mdgMaxTempFahrenheit))} transition-all duration-300`}
                      >
                        {formatValue(deviceReport.mdgMaxTempFahrenheit, "°F", 1)}
                      </Badge>
                      <Badge className="bg-dark-700/50 text-slate-300 border-slate-600">
                        {formatValue(deviceReport.mdgMaxTempCelsius, "°C", 1)}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {deviceReport.mdgEdtTotalHours && (
                    <div className="space-y-3 p-4 bg-dark-700/30 rounded-lg border border-cyan-500/20">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <p className="text-sm text-slate-400 font-medium">EDT Total Hours</p>
                      </div>
                      <p className="text-lg font-mono text-cyan-400">{formatValue(deviceReport.mdgEdtTotalHours, "hrs", 1)}</p>
                    </div>
                  )}
                  {deviceReport.mdgExtremeShockIndex && (
                    <div className="space-y-3 p-4 bg-dark-700/30 rounded-lg border border-orange-500/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        <p className="text-sm text-slate-400 font-medium">Extreme Shock Index</p>
                      </div>
                      <Badge 
                        className={deviceReport.mdgExtremeShockIndex > 10 ? 
                          "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border-red-500/50" : 
                          "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/50"
                        }
                      >
                        {formatValue(deviceReport.mdgExtremeShockIndex, "", 1)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}