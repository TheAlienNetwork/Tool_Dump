import { useQuery } from "@tanstack/react-query";
import type { DeviceReport as DeviceReportType, MemoryDump } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown,
  ChevronRight,
  MapPin, 
  Gauge,
  Cpu,
  HardDrive,
  Wrench,
  AlertTriangle
} from "lucide-react";

interface DeviceReportProps {
  memoryDump: MemoryDump;
}

export function DeviceReport({ memoryDump }: DeviceReportProps) {
  const { data: memoryDumpDetails, isLoading } = useQuery({
    queryKey: ['/api/memory-dumps', memoryDump.id],
    enabled: !!memoryDump.id
  });

  if (isLoading) {
    return (
      <div className="glass-morphism rounded-xl p-8 animate-pulse">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-6 h-6 bg-dark-600 rounded"></div>
          <div className="h-6 bg-dark-600 rounded w-48"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-dark-600 rounded w-3/4"></div>
          <div className="h-4 bg-dark-600 rounded w-1/2"></div>
          <div className="h-4 bg-dark-600 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const deviceReport = memoryDumpDetails?.deviceReport;

  if (!deviceReport) {
    return (
      <div className="glass-morphism rounded-xl p-8">
        <div className="flex items-center space-x-3 mb-4">
          <HardDrive className="h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Device Report
          </h3>
        </div>
        <p className="text-slate-400">No device report data available.</p>
      </div>
    );
  }

  const formatValue = (value: number | null, unit?: string, precision = 2) => {
    if (value === null) return "N/A";
    return `${value.toFixed(precision)}${unit ? ` ${unit}` : ""}`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "N/A";
    return `${value.toFixed(2)}%`;
  };

  const getTemperatureStatus = (tempF: number | null) => {
    if (!tempF) return "unknown";
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
        </CardHeader>
        <CardContent className="space-y-8">
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