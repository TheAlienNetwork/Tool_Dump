import { useQuery } from "@tanstack/react-query";
import type { DeviceReport as DeviceReportType, MemoryDump } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cpu, HardDrive, Thermometer, Clock, Zap, Wrench, AlertTriangle } from "lucide-react";

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
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-primary">Device Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading device report...</p>
        </CardContent>
      </Card>
    );
  }

  const deviceReport = memoryDumpDetails?.deviceReport;

  if (!deviceReport) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-primary">Device Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No device report data available.</p>
        </CardContent>
      </Card>
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
      case "critical": return "bg-destructive/20 text-destructive border-destructive/50";
      case "warning": return "bg-yellow-500/20 text-yellow-600 border-yellow-500/50";
      case "normal": return "bg-green-500/20 text-green-600 border-green-500/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Device Report Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MP Device Information */}
        {(deviceReport.mpSerialNumber || deviceReport.mpFirmwareVersion) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              <h3 className="text-lg font-semibold text-foreground">MP Device</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              {deviceReport.mpSerialNumber && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                    {deviceReport.mpSerialNumber}
                  </Badge>
                </div>
              )}
              {deviceReport.mpFirmwareVersion && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Firmware Version</p>
                  <Badge variant="secondary">{deviceReport.mpFirmwareVersion}</Badge>
                </div>
              )}
            </div>
            
            {/* MP Temperature */}
            {deviceReport.mpMaxTempFahrenheit && (
              <div className="pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="h-4 w-4 text-orange-400" />
                  <p className="text-sm font-medium">Maximum Temperature</p>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    className={getTemperatureColor(getTemperatureStatus(deviceReport.mpMaxTempFahrenheit))}
                  >
                    {formatValue(deviceReport.mpMaxTempFahrenheit, "°F", 1)}
                  </Badge>
                  <Badge variant="outline">
                    {formatValue(deviceReport.mpMaxTempCelsius, "°C", 1)}
                  </Badge>
                </div>
              </div>
            )}

            {/* MP Operational Data */}
            <div className="pl-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deviceReport.circulationHours && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    <p className="text-xs text-muted-foreground">Circulation Hours</p>
                  </div>
                  <p className="text-sm font-mono">{formatValue(deviceReport.circulationHours, "hrs", 1)}</p>
                </div>
              )}
              {deviceReport.numberOfPulses && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-400" />
                    <p className="text-xs text-muted-foreground">Number of Pulses</p>
                  </div>
                  <p className="text-sm font-mono">{deviceReport.numberOfPulses.toLocaleString()}</p>
                </div>
              )}
              {deviceReport.motorOnTimeMinutes && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-green-400" />
                    <p className="text-xs text-muted-foreground">Motor On Time</p>
                  </div>
                  <p className="text-sm font-mono">{formatValue(deviceReport.motorOnTimeMinutes, "min", 1)}</p>
                </div>
              )}
            </div>

            {/* Communication & Hall Status */}
            <div className="pl-6 space-y-3">
              <h4 className="text-sm font-medium text-foreground">Status Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(deviceReport.commErrorsTimeMinutes !== null || deviceReport.commErrorsPercent !== null) && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                      Communication Errors
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-red-400 border-red-400/50">
                        {formatValue(deviceReport.commErrorsTimeMinutes, "min", 2)}
                      </Badge>
                      <Badge variant="outline" className="text-red-400 border-red-400/50">
                        {formatPercent(deviceReport.commErrorsPercent)}
                      </Badge>
                    </div>
                  </div>
                )}
                {(deviceReport.hallStatusTimeMinutes !== null || deviceReport.hallStatusPercent !== null) && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-green-400" />
                      Hall Status
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-green-400 border-green-400/50">
                        {formatValue(deviceReport.hallStatusTimeMinutes, "min", 2)}
                      </Badge>
                      <Badge variant="outline" className="text-green-400 border-green-400/50">
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
          <Separator />
        )}

        {/* MDG Device Information */}
        {(deviceReport.mdgSerialNumber || deviceReport.mdgFirmwareVersion) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" />
              <h3 className="text-lg font-semibold text-foreground">MDG Device</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              {deviceReport.mdgSerialNumber && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <Badge variant="outline" className="text-purple-400 border-purple-400/50">
                    {deviceReport.mdgSerialNumber}
                  </Badge>
                </div>
              )}
              {deviceReport.mdgFirmwareVersion && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Firmware Version</p>
                  <Badge variant="secondary">{deviceReport.mdgFirmwareVersion}</Badge>
                </div>
              )}
            </div>

            {/* MDG Temperature */}
            {deviceReport.mdgMaxTempFahrenheit && (
              <div className="pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="h-4 w-4 text-orange-400" />
                  <p className="text-sm font-medium">Maximum Temperature</p>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    className={getTemperatureColor(getTemperatureStatus(deviceReport.mdgMaxTempFahrenheit))}
                  >
                    {formatValue(deviceReport.mdgMaxTempFahrenheit, "°F", 1)}
                  </Badge>
                  <Badge variant="outline">
                    {formatValue(deviceReport.mdgMaxTempCelsius, "°C", 1)}
                  </Badge>
                </div>
              </div>
            )}

            {/* MDG Operational Data */}
            <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {deviceReport.mdgEdtTotalHours && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    <p className="text-xs text-muted-foreground">EDT Total Hours</p>
                  </div>
                  <p className="text-sm font-mono">{formatValue(deviceReport.mdgEdtTotalHours, "hrs", 1)}</p>
                </div>
              )}
              {deviceReport.mdgExtremeShockIndex && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-400" />
                    <p className="text-xs text-muted-foreground">Extreme Shock Index</p>
                  </div>
                  <Badge 
                    className={deviceReport.mdgExtremeShockIndex > 10 ? 
                      "bg-red-500/20 text-red-400 border-red-500/50" : 
                      "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                    }
                  >
                    {formatValue(deviceReport.mdgExtremeShockIndex, "", 1)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}