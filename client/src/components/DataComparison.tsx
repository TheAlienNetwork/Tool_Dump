
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from "recharts";
import { MemoryDump } from "@/lib/types";
import { GitCompare, TrendingUp, TrendingDown, AlertTriangle, Activity } from "lucide-react";

interface DataComparisonProps {
  memoryDumps: MemoryDump[];
  selectedDump: MemoryDump | null;
}

export default function DataComparison({ memoryDumps, selectedDump }: DataComparisonProps) {
  const [comparisonDump, setComparisonDump] = useState<string>("");
  const [metric, setMetric] = useState<string>("tempMP");

  const availableDumps = memoryDumps.filter(dump => 
    dump.status === 'completed' && dump.id !== selectedDump?.id
  );

  const { data: primaryData } = useQuery({
    queryKey: ['/api/memory-dumps', selectedDump?.id],
    enabled: !!selectedDump?.id && selectedDump?.status === 'completed',
  });

  const { data: comparisonData } = useQuery({
    queryKey: ['/api/memory-dumps', comparisonDump],
    enabled: !!comparisonDump,
  });

  const comparisonChartData = useMemo(() => {
    if (!primaryData?.sensorData || !comparisonData?.sensorData) return [];

    const primary = primaryData.sensorData.slice(0, 500); // Sample for performance
    const comparison = comparisonData.sensorData.slice(0, 500);

    return primary.map((record, index) => ({
      index: index + 1,
      time: new Date(record.rtd).toLocaleTimeString(),
      primary: record[metric as keyof typeof record] as number,
      comparison: comparison[index]?.[metric as keyof typeof comparison[index]] as number || null,
      primaryFile: selectedDump?.filename,
      comparisonFile: comparisonData.memoryDump?.filename
    }));
  }, [primaryData, comparisonData, metric, selectedDump]);

  const statistics = useMemo(() => {
    if (!primaryData?.sensorData || !comparisonData?.sensorData) return null;

    const primaryValues = primaryData.sensorData
      .map(r => r[metric as keyof typeof r] as number)
      .filter(v => v !== null && !isNaN(v));
    
    const comparisonValues = comparisonData.sensorData
      .map(r => r[metric as keyof typeof r] as number)
      .filter(v => v !== null && !isNaN(v));

    if (primaryValues.length === 0 || comparisonValues.length === 0) return null;

    const primaryAvg = primaryValues.reduce((sum, val) => sum + val, 0) / primaryValues.length;
    const comparisonAvg = comparisonValues.reduce((sum, val) => sum + val, 0) / comparisonValues.length;
    const difference = primaryAvg - comparisonAvg;
    const percentChange = (difference / comparisonAvg) * 100;

    return {
      primaryAvg,
      comparisonAvg,
      difference,
      percentChange,
      primaryMax: Math.max(...primaryValues),
      comparisonMax: Math.max(...comparisonValues),
      primaryMin: Math.min(...primaryValues),
      comparisonMin: Math.min(...comparisonValues)
    };
  }, [primaryData, comparisonData, metric]);

  const getMetricUnit = (metric: string) => {
    switch (metric) {
      case 'tempMP': return '°F';
      case 'batteryVoltMP': return 'V';
      case 'batteryCurrMP': case 'motorAvg': return 'A';
      case 'gamma': return 'cps';
      case 'maxZ': case 'accelAX': case 'accelAY': case 'accelAZ': return 'g';
      case 'rotRpmAvg': return 'RPM';
      default: return '';
    }
  };

  const formatValue = (value: number, metric: string) => {
    if (value === null || isNaN(value)) return 'N/A';
    const unit = getMetricUnit(metric);
    return `${value.toFixed(2)} ${unit}`;
  };

  if (!selectedDump || availableDumps.length === 0) {
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Advanced Data Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <GitCompare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">
                  {!selectedDump ? "Select a memory dump to begin comparison" : "Upload multiple dumps to enable comparison"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="gradient-border">
        <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Advanced Data Comparison Analytics
            </CardTitle>
            <p className="text-slate-400 text-sm">Compare sensor data across different memory dumps</p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Comparison Controls */}
            <div className="glass-morphism rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Primary File</label>
                  <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/50">
                    <div className="text-blue-400 font-medium">{selectedDump.filename}</div>
                    <div className="text-blue-300 text-sm">{selectedDump.fileType} • {new Date(selectedDump.uploadedAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Compare With</label>
                  <Select value={comparisonDump} onValueChange={setComparisonDump}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-300">
                      <SelectValue placeholder="Select comparison file..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {availableDumps.map(dump => (
                        <SelectItem key={dump.id} value={dump.id.toString()}>
                          {dump.filename} ({dump.fileType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Metric to Compare</label>
                  <Select value={metric} onValueChange={setMetric}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="tempMP">Temperature (°F)</SelectItem>
                      <SelectItem value="batteryVoltMP">Battery Voltage (V)</SelectItem>
                      <SelectItem value="batteryCurrMP">Battery Current (A)</SelectItem>
                      <SelectItem value="motorAvg">Motor Current (A)</SelectItem>
                      <SelectItem value="gamma">Gamma Radiation (cps)</SelectItem>
                      <SelectItem value="maxZ">Vibration Z (g)</SelectItem>
                      <SelectItem value="rotRpmAvg">RPM Average</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Statistics Comparison */}
            {statistics && comparisonDump && (
              <div className="glass-morphism rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                  <Activity className="w-5 h-5 text-green-400 mr-2" />
                  Statistical Comparison - {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="text-blue-400 text-xs uppercase font-medium mb-2">Average Difference</div>
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl font-bold text-blue-400">
                        {formatValue(Math.abs(statistics.difference), metric)}
                      </div>
                      {statistics.percentChange > 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : statistics.percentChange < 0 ? (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      ) : null}
                    </div>
                    <div className={`text-sm ${statistics.percentChange > 0 ? 'text-green-300' : statistics.percentChange < 0 ? 'text-red-300' : 'text-slate-300'}`}>
                      {statistics.percentChange > 0 ? '+' : ''}{statistics.percentChange.toFixed(1)}% change
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                    <div className="text-green-400 text-xs uppercase font-medium mb-2">Primary Max</div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatValue(statistics.primaryMax, metric)}
                    </div>
                    <div className="text-green-300 text-sm">Peak value</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg p-4 border border-orange-500/20">
                    <div className="text-orange-400 text-xs uppercase font-medium mb-2">Comparison Max</div>
                    <div className="text-2xl font-bold text-orange-400">
                      {formatValue(statistics.comparisonMax, metric)}
                    </div>
                    <div className="text-orange-300 text-sm">Peak value</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                    <div className="text-purple-400 text-xs uppercase font-medium mb-2">Variance Analysis</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {Math.abs(statistics.percentChange) > 10 ? (
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 text-red-400 mr-1" />
                          HIGH
                        </div>
                      ) : Math.abs(statistics.percentChange) > 5 ? (
                        "MEDIUM"
                      ) : (
                        "LOW"
                      )}
                    </div>
                    <div className="text-purple-300 text-sm">
                      {Math.abs(statistics.percentChange).toFixed(1)}% variance
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Chart */}
            {comparisonChartData.length > 0 && (
              <div className="glass-morphism rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">
                  Overlay Comparison Chart - {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="index" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: getMetricUnit(metric), angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(value: any, name: string) => [
                          formatValue(value, metric), 
                          name === 'primary' ? comparisonChartData[0]?.primaryFile : comparisonChartData[0]?.comparisonFile
                        ]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="primary" 
                        stroke="#3B82F6" 
                        strokeWidth={2} 
                        name="Primary File"
                        dot={false}
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="comparison" 
                        stroke="#EF4444" 
                        strokeWidth={2} 
                        name="Comparison File"
                        dot={false}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {!comparisonDump && (
              <div className="glass-morphism rounded-xl p-8 text-center">
                <GitCompare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Select a file to compare with for detailed analysis</p>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </section>
  );
}
