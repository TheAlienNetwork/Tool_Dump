import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryDumpDetails } from "@/lib/types";
import { Activity, Thermometer, Zap, AlertTriangle, Battery, Gauge, RotateCw, RotateCcw, Cpu, Compass, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface DataVisualizationProps {
  memoryDump: {
    id: number;
    status: string;
  } | null;
}

export default function DataVisualization({ memoryDump }: DataVisualizationProps) {
  const { data: dumpDetails, isLoading, error } = useQuery<MemoryDumpDetails>({
    queryKey: ['/api/memory-dumps', memoryDump?.id],
    enabled: memoryDump?.status === 'completed',
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always fetch fresh data for new dumps
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes only
  });

  // Move all hooks to the top - this must be called on every render
  const chartData = useMemo(() => {
    if (!dumpDetails?.sensorData || dumpDetails.sensorData.length === 0) {
      return [];
    }

    const sensorData = dumpDetails.sensorData;
    console.log(`Processing ${sensorData.length} sensor records for visualization`);

    // Optimize sampling for large datasets
    const maxPoints = 1000;
    const step = Math.max(1, Math.floor(sensorData.length / maxPoints));

    return sensorData
      .filter((_, index) => index % step === 0)
      .map(item => ({
        time: new Date(item.rtd).toLocaleTimeString(),

        // Acceleration data (MDG)
        accelAX: item.accelAX,
        accelAY: item.accelAY,
        accelAZ: item.accelAZ,

        // Shock data (MDG)
        shockX: item.shockX,
        shockY: item.shockY,
        shockZ: item.shockZ,

        // Shock counters (MDG)
        shockCountAxial50: item.shockCountAxial50,
        shockCountAxial100: item.shockCountAxial100,
        shockCountLat50: item.shockCountLat50,
        shockCountLat100: item.shockCountLat100,

        // RPM data (MDG)
        rotRpmMax: item.rotRpmMax,
        rotRpmAvg: item.rotRpmAvg,
        rotRpmMin: item.rotRpmMin,

        // Power rails (MDG)
        vBatt: item.vBatt,
        v5VD: item.v5VD,
        v3_3VD: item.v3_3VD,
        v3_3VA: item.v3_3VA,
        v1_8VA: item.v1_8VA,
        v1_9VD: item.v1_9VD,
        v1_5VD: item.v1_5VD,
        v3_3VA_DI: item.v3_3VA_DI,

        // Current monitoring (MDG)
        iBatt: item.iBatt,
        i5VD: item.i5VD,
        i3_3VD: item.i3_3VD,

        // Environmental (MDG)
        gamma: item.gamma,

        // Stability (MDG)
        accelStabX: item.accelStabX,
        accelStabY: item.accelStabY,
        accelStabZ: item.accelStabZ,
        accelStabZH: item.accelStabZH,

        // Survey data (MDG)
        surveyTGF: item.surveyTGF,
        surveyTMF: item.surveyTMF,
        surveyDipA: item.surveyDipA,
        surveyINC: item.surveyINC,
        surveyCINC: item.surveyCINC,
        surveyAZM: item.surveyAZM,
        surveyCAZM: item.surveyCAZM,

        // Battery data (MP)
        batteryVoltMP: item.batteryVoltMP,
        batteryCurrMP: item.batteryCurrMP,

        // Temperature (MP)
        tempMP: item.tempMP,

        // Motor performance (MP)
        motorMin: item.motorMin,
        motorAvg: item.motorAvg,
        motorMax: item.motorMax,
        motorHall: item.motorHall,

        // Actuation (MP)
        actuationTime: item.actuationTime,

        // Vibration data (MP)
        maxX: item.maxX,
        maxY: item.maxY,
        maxZ: item.maxZ,
        threshold: item.threshold,
        flowStatus: item.flowStatus,
      }));
  }, [dumpDetails?.sensorData]);

  // Now handle the conditional rendering after all hooks are defined
  if (!memoryDump) {
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Data Visualization
              </CardTitle>
              <p className="text-slate-400 text-sm">Real-time sensor data charts and analytics</p>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Select a completed memory dump to view visualizations</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (memoryDump.status === 'processing') {
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Data Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-lg">Processing binary data for visualization...</p>
                <p className="text-slate-500 text-sm mt-2">Large files may take several minutes to complete</p>
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
                Data Visualization
              </CardTitle>
              <p className="text-slate-400 text-sm">Generating interactive charts and analytics...</p>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Loading comprehensive visualization data...</p>
                <p className="text-slate-500 text-sm mt-2">Optimized for fast rendering (5000 data points max)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (error) {
    console.error("Visualization error:", error);
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Data Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Error loading visualization data</p>
                <p className="text-slate-500 text-sm mt-2">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!dumpDetails?.sensorData || dumpDetails.sensorData.length === 0) {
    return (
      <section>
        <div className="gradient-border">
          <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Data Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No visualization data available</p>
                <p className="text-slate-500 text-sm mt-2">No sensor data found for this dump</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const sensorData = dumpDetails.sensorData;

  // Filter data by type and enhance flow status for visualization
  const mpData = chartData.filter(d => d.tempMP !== null).map(d => ({
    ...d,
    flowStatus: d.flowStatus === 'On' ? 1 : 0, // Convert to numeric for bar chart
    flowStatusLabel: d.flowStatus // Keep original for tooltip
  }));
  const mdgData = chartData.filter(d => d.accelAX !== null);

  // Calculate pump stats
  const pumpOnTime = mpData.reduce((acc, d) => acc + (d.flowStatus === 1 ? 1 : 0), 0);
  const totalRecords = mpData.length;
  const pumpOnPercent = totalRecords > 0 ? (pumpOnTime / totalRecords) * 100 : 0;

  // Temperature histogram data
  const tempHistogramData = mpData.reduce((acc: any[], d) => {
    if (d.tempMP !== null && d.tempMP !== undefined) {
      const tempRange = Math.floor(d.tempMP / 10) * 10;
      const existing = acc.find(item => item.range === tempRange);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ range: tempRange, count: 1, label: `${tempRange}-${tempRange + 10}°F` });
      }
    }
    return acc;
  }, []).sort((a, b) => a.range - b.range);

  return (
    <section>
      <div className="gradient-border">
        <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Comprehensive Sensor Data Analysis
            </CardTitle>
            <p className="text-slate-400 text-sm">Detailed analysis of {sensorData.length.toLocaleString()} sensor records</p>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* MP Charts */}
            {mpData.length > 0 && (
              <>
                {/* 1. Temperature (MP) and Reset */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-5 h-5 text-red-400" />
                      <h3 className="text-lg font-semibold text-slate-200">Temperature (MP) and Reset</h3>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} label={{ value: 'Reset Count', angle: 90, position: 'insideRight' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="tempMP" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} name="Temperature (°F)" />
                        <Bar yAxisId="right" dataKey="resetMP" fill="#10B981" name="Reset Count" opacity={0.7} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Battery (MP) Current and Voltage */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Battery className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Battery (MP) Current and Voltage</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} label={{ value: 'Current (A)', angle: 90, position: 'insideRight' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="batteryVoltMP" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} name="Battery Voltage (V)" />
                        <Line yAxisId="right" type="monotone" dataKey="batteryCurrMP" stroke="#F59E0B" strokeWidth={2} name="Battery Current (A)" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Vibration Analysis - Max X,Y,Z and Threshold */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Vibration Analysis - Max X,Y,Z and Threshold</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Acceleration (g)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value: any, name: string) => [
                            `${typeof value === 'number' ? value.toFixed(3) : value} g`, 
                            name
                          ]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="maxX" stroke="#3B82F6" strokeWidth={2} name="Max X (g)" dot={false} />
                        <Line type="monotone" dataKey="maxY" stroke="#10B981" strokeWidth={2} name="Max Y (g)" dot={false} />
                        <Line type="monotone" dataKey="maxZ" stroke="#F59E0B" strokeWidth={2} name="Max Z (g)" dot={false} />
                        <Line type="monotone" dataKey="threshold" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="5 5" name="Threshold" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Vibration Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">Peak Max X</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {(() => {
                          const validX = mpData.filter(d => 
                            d.maxX !== null && 
                            d.maxX !== undefined && 
                            !isNaN(d.maxX) && 
                            isFinite(d.maxX) && 
                            Math.abs(d.maxX) < 50 // Reasonable vibration range
                          );
                          if (validX.length === 0) return "N/A";
                          const maxX = Math.max(...validX.map(d => Math.abs(d.maxX!)));
                          return `${maxX.toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-blue-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">Peak Max Y</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(() => {
                          const validY = mpData.filter(d => 
                            d.maxY !== null && 
                            d.maxY !== undefined && 
                            !isNaN(d.maxY) && 
                            isFinite(d.maxY) && 
                            Math.abs(d.maxY) < 50
                          );
                          if (validY.length === 0) return "N/A";
                          const maxY = Math.max(...validY.map(d => Math.abs(d.maxY!)));
                          return `${maxY.toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/20">
                      <div className="text-amber-400 text-xs uppercase font-medium mb-2">Peak Max Z</div>
                      <div className="text-2xl font-bold text-amber-400">
                        {(() => {
                          const validZ = mpData.filter(d => 
                            d.maxZ !== null && 
                            d.maxZ !== undefined && 
                            !isNaN(d.maxZ) && 
                            isFinite(d.maxZ) && 
                            Math.abs(d.maxZ) < 50
                          );
                          if (validZ.length === 0) return "N/A";
                          const maxZ = Math.max(...validZ.map(d => Math.abs(d.maxZ!)));
                          return `${maxZ.toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-amber-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">Above Threshold</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(() => {
                          const thresholdEvents = mpData.filter(d => {
                            const validX = d.maxX !== null && d.maxX !== undefined && !isNaN(d.maxX) && isFinite(d.maxX) && Math.abs(d.maxX) > 1.5;
                            const validY = d.maxY !== null && d.maxY !== undefined && !isNaN(d.maxY) && isFinite(d.maxY) && Math.abs(d.maxY) > 1.5;
                            const validZ = d.maxZ !== null && d.maxZ !== undefined && !isNaN(d.maxZ) && isFinite(d.maxZ) && Math.abs(d.maxZ) > 1.5;
                            return validX || validY || validZ;
                          });
                          return thresholdEvents.length.toLocaleString();
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">events</div>
                    </div>
                  </div>
                </div>

                {/* 4. Flow Status Analysis with Advanced Metrics */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-slate-200">Flow Status Analysis</h3>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                        <span className="text-emerald-400 text-sm font-medium">
                          Active: {pumpOnPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-slate-600/20 px-3 py-1 rounded-full border border-slate-500/30">
                        <span className="text-slate-400 text-sm font-medium">
                          Inactive: {(100 - pumpOnPercent).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} label={{ value: 'Flow Status', angle: -90, position: 'insideLeft' }} domain={[0, 1.2]} tickFormatter={(value) => value === 1 ? 'ON' : value === 0 ? 'OFF' : ''} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} label={{ value: 'Duration (s)', angle: 90, position: 'insideRight' }} domain={[0, 'dataMax']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value: any, name: string) => {
                            if (name === 'Flow Status') {
                              return [value === 1 ? 'ON' : 'OFF', 'Flow Status'];
                            }
                            if (name === 'Actuation Time (s)' && typeof value === 'number') {
                              return [`${value.toFixed(2)}s`, name];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Area 
                          yAxisId="left" 
                          type="stepAfter" 
                          dataKey="flowStatus" 
                          stroke="#10B981" 
                          fill="#10B981" 
                          fillOpacity={0.4} 
                          strokeWidth={3} 
                          name="Flow Status" 
                        />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="actuationTime" 
                          stroke="#F59E0B" 
                          strokeWidth={2} 
                          name="Actuation Time (s)" 
                          dot={false} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Flow Status Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg p-4 border border-emerald-500/20">
                      <div className="text-emerald-400 text-xs uppercase font-medium mb-2">Total On Time</div>
                      <div className="text-2xl font-bold text-emerald-400">{pumpOnTime.toLocaleString()}</div>
                      <div className="text-emerald-300 text-sm">records</div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-lg p-4 border border-slate-500/20">
                      <div className="text-slate-400 text-xs uppercase font-medium mb-2">Total Off Time</div>
                      <div className="text-2xl font-bold text-slate-400">{(totalRecords - pumpOnTime).toLocaleString()}</div>
                      <div className="text-slate-300 text-sm">records</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">Duty Cycle</div>
                      <div className="text-2xl font-bold text-blue-400">{pumpOnPercent.toFixed(1)}%</div>
                      <div className="text-blue-300 text-sm">efficiency</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">Total Records</div>
                      <div className="text-2xl font-bold text-purple-400">{totalRecords.toLocaleString()}</div>
                      <div className="text-purple-300 text-sm">data points</div>
                    </div>
                  </div>
                </div>

                {/* 5. Motor Current (MP) Min, Avg, Max, Hall */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Gauge className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Motor Current (MP) Min, Avg, Max, Hall</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="motorMax" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={1} name="Motor Max (A)" />
                        <Area type="monotone" dataKey="motorAvg" stroke="#10B981" fill="#10B981" fillOpacity={0.3} strokeWidth={3} name="Motor Avg (A)" />
                        <Area type="monotone" dataKey="motorMin" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={1} name="Motor Min (A)" />
                        <Line type="monotone" dataKey="motorHall" stroke="#8B5CF6" strokeWidth={2} name="Motor Hall" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Motor Current Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg p-4 border border-red-500/20">
                      <div className="text-red-400 text-xs uppercase font-medium mb-2">Peak Max Current</div>
                      <div className="text-2xl font-bold text-red-400">
                        {(() => {
                          const validMax = mpData.filter(d => 
                            d.motorMax !== null && 
                            d.motorMax !== undefined && 
                            !isNaN(d.motorMax) && 
                            isFinite(d.motorMax) &&
                            Math.abs(d.motorMax) < 1000 // Filter out extreme values
                          );
                          if (validMax.length === 0) return "N/A";
                          const maxCurrent = Math.max(...validMax.map(d => Math.abs(d.motorMax!)));
                          return maxCurrent < 0.001 ? `${(maxCurrent * 1000).toFixed(1)}mA` : `${maxCurrent.toFixed(3)}A`;
                        })()}
                      </div>
                      <div className="text-red-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">Avg Current</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(() => {
                          const validAvg = mpData.filter(d => 
                            d.motorAvg !== null && 
                            d.motorAvg !== undefined && 
                            !isNaN(d.motorAvg) && 
                            isFinite(d.motorAvg) &&
                            Math.abs(d.motorAvg) < 1000 // Filter out extreme values
                          );
                          if (validAvg.length === 0) return "N/A";
                          const avgCurrent = validAvg.reduce((sum, d) => sum + Math.abs(d.motorAvg!), 0) / validAvg.length;
                          return avgCurrent < 0.001 ? `${(avgCurrent * 1000).toFixed(1)}mA` : `${avgCurrent.toFixed(3)}A`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">average</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">Min Current</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {(() => {
                          const validMin = mpData.filter(d => 
                            d.motorMin !== null && 
                            d.motorMin !== undefined && 
                            !isNaN(d.motorMin) && 
                            isFinite(d.motorMin) &&
                            Math.abs(d.motorMin) < 1000 // Filter out extreme values
                          );
                          if (validMin.length === 0) return "N/A";
                          const minCurrent = Math.min(...validMin.map(d => Math.abs(d.motorMin!)));
                          return minCurrent < 0.001 ? `${(minCurrent * 1000).toFixed(1)}mA` : `${minCurrent.toFixed(3)}A`;
                        })()}
                      </div>
                      <div className="text-blue-300 text-sm">minimum</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">Hall Signal</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(() => {
                          const validHall = mpData.filter(d => d.motorHall !== null && d.motorHall !== undefined && !isNaN(d.motorHall) && isFinite(d.motorHall));
                          if (validHall.length === 0) return "N/A";
                          return `${validHall.length.toLocaleString()}`;
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">samples</div>
                    </div>
                  </div>
                </div>

                {/* 6. Actuation Time vs Average Motor Current (MP) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Actuation Time vs Average Motor Current (MP)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} label={{ value: 'Time (s)', angle: 90, position: 'insideRight' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="motorAvg" stroke="#10B981" strokeWidth={2} name="Avg Motor Current (A)" dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="actuationTime" stroke="#F59E0B" strokeWidth={2} name="Actuation Time (s)" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Actuation Time Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg p-4 border border-yellow-500/20">
                      <div className="text-yellow-400 text-xs uppercase font-medium mb-2">Peak Actuation Time</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {(() => {
                          const validActuation = mpData.filter(d => 
                            d.actuationTime !== null && 
                            d.actuationTime !== undefined && 
                            !isNaN(d.actuationTime) && 
                            isFinite(d.actuationTime) &&
                            Math.abs(d.actuationTime) < 3600 // Filter out extreme values (more than 1 hour)
                          );
                          if (validActuation.length === 0) return "N/A";
                          const maxTime = Math.max(...validActuation.map(d => Math.abs(d.actuationTime!)));
                          return maxTime < 0.01 ? `${(maxTime * 1000).toFixed(1)}ms` : `${maxTime.toFixed(2)}s`;
                        })()}
                      </div>
                      <div className="text-yellow-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
                      <div className="text-orange-400 text-xs uppercase font-medium mb-2">Avg Actuation Time</div>
                      <div className="text-2xl font-bold text-orange-400">
                        {(() => {
                          const validActuation = mpData.filter(d => 
                            d.actuationTime !== null && 
                            d.actuationTime !== undefined && 
                            !isNaN(d.actuationTime) && 
                            isFinite(d.actuationTime) &&
                            Math.abs(d.actuationTime) < 3600 // Filter out extreme values
                          );
                          if (validActuation.length === 0) return "N/A";
                          const avgTime = validActuation.reduce((sum, d) => sum + Math.abs(d.actuationTime!), 0) / validActuation.length;
                          return avgTime < 0.01 ? `${(avgTime * 1000).toFixed(1)}ms` : `${avgTime.toFixed(2)}s`;
                        })()}
                      </div>
                      <div className="text-orange-300 text-sm">average</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">Current Efficiency</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(() => {
                          const validData = mpData.filter(d => 
                            d.motorAvg !== null && d.motorAvg !== undefined && !isNaN(d.motorAvg) && isFinite(d.motorAvg) && Math.abs(d.motorAvg) < 1000 &&
                            d.actuationTime !== null && d.actuationTime !== undefined && !isNaN(d.actuationTime) && isFinite(d.actuationTime) && Math.abs(d.actuationTime) < 3600
                          );
                          if (validData.length === 0) return "N/A";
                          const efficiency = validData.reduce((sum, d) => sum + (Math.abs(d.actuationTime!) / Math.max(Math.abs(d.motorAvg!), 0.001)), 0) / validData.length;
                          return efficiency > 10000 ? `${(efficiency / 1000).toFixed(1)}K` : `${efficiency.toFixed(1)}`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">ratio</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">Valid Samples</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {(() => {
                          const validActuation = mpData.filter(d => d.actuationTime !== null && d.actuationTime !== undefined && !isNaN(d.actuationTime) && isFinite(d.actuationTime));
                          return validActuation.length.toLocaleString();
                        })()}
                      </div>
                      <div className="text-blue-300 text-sm">data points</div>
                    </div>
                  </div>
                </div>
                {/* 7. System Voltages Analysis (MP) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-slate-200">System Voltages Analysis (MP)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="vBatt" stroke="#EF4444" strokeWidth={2} name="Battery Voltage" dot={false} />
                        <Line type="monotone" dataKey="v5VD" stroke="#10B981" strokeWidth={2} name="5V Digital" dot={false} />
                        <Line type="monotone" dataKey="v3_3VD" stroke="#3B82F6" strokeWidth={2} name="3.3V Digital" dot={false} />
                        <Line type="monotone" dataKey="v1_8VA" stroke="#8B5CF6" strokeWidth={2} name="1.8V Analog" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Voltage Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg p-4 border border-red-500/20">
                      <div className="text-red-400 text-xs uppercase font-medium mb-2">Battery Status</div>
                      <div className="text-2xl font-bold text-red-400">
                        {(() => {
                          const validBatt = mpData.filter(d => 
                            d.vBatt !== null && 
                            d.vBatt !== undefined && 
                            !isNaN(d.vBatt) && 
                            isFinite(d.vBatt) &&
                            d.vBatt > 0 && d.vBatt < 50
                          );
                          if (validBatt.length === 0) return "N/A";
                          const avgVBatt = validBatt.reduce((sum, d) => sum + d.vBatt!, 0) / validBatt.length;
                          return `${avgVBatt.toFixed(2)}V`;
                        })()}
                      </div>
                      <div className="text-red-300 text-sm">average</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">5V Digital</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(() => {
                          const valid5V = mpData.filter(d => 
                            d.v5VD !== null && 
                            d.v5VD !== undefined && 
                            !isNaN(d.v5VD) && 
                            isFinite(d.v5VD) &&
                            d.v5VD > 0 && d.v5VD < 10
                          );
                          if (valid5V.length === 0) return "N/A";
                          const avg5V = valid5V.reduce((sum, d) => sum + d.v5VD!, 0) / valid5V.length;
                          return `${avg5V.toFixed(2)}V`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">average</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">3.3V Digital</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {(() => {
                          const valid33V = mpData.filter(d => 
                            d.v3_3VD !== null && 
                            d.v3_3VD !== undefined && 
                            !isNaN(d.v3_3VD) && 
                            isFinite(d.v3_3VD) &&
                            d.v3_3VD > 0 && d.v3_3VD < 10
                          );
                          if (valid33V.length === 0) return "N/A";
                          const avg33V = valid33V.reduce((sum, d) => sum + d.v3_3VD!, 0) / valid33V.length;
                          return `${avg33V.toFixed(2)}V`;
                        })()}
                      </div>
                      <div className="text-blue-300 text-sm">average</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">Power Stability</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(() => {
                          const stableReadings = mpData.filter(d => 
                            d.vBatt !== null && d.vBatt !== undefined && !isNaN(d.vBatt) && isFinite(d.vBatt) && d.vBatt > 10 &&
                            d.v5VD !== null && d.v5VD !== undefined && !isNaN(d.v5VD) && isFinite(d.v5VD) && d.v5VD > 4.5 &&
                            d.v3_3VD !== null && d.v3_3VD !== undefined && !isNaN(d.v3_3VD) && isFinite(d.v3_3VD) && d.v3_3VD > 3.0
                          );
                          const stability = stableReadings.length / Math.max(mpData.length, 1) * 100;
                          return `${stability.toFixed(1)}%`;
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">stable</div>
                    </div>
                  </div>
                </div>

                {/* 8. Rotation Speed Analysis (MP) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <RotateCcw className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Rotation Speed Analysis (MP)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'RPM', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="rotRpmMax" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={1} name="Max RPM" />
                        <Area type="monotone" dataKey="rotRpmAvg" stroke="#10B981" fill="#10B981" fillOpacity={0.3} strokeWidth={3} name="Avg RPM" />
                        <Area type="monotone" dataKey="rotRpmMin" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={1} name="Min RPM" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* RPM Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-lg p-4 border border-red-500/20">
                      <div className="text-red-400 text-xs uppercase font-medium mb-2">Peak RPM</div>
                      <div className="text-2xl font-bold text-red-400">
                        {(() => {
                          const validRpm = mpData.filter(d => 
                            d.rotRpmMax !== null && 
                            d.rotRpmMax !== undefined && 
                            !isNaN(d.rotRpmMax) && 
                            isFinite(d.rotRpmMax) &&
                            d.rotRpmMax > 0 && d.rotRpmMax < 10000
                          );
                          if (validRpm.length === 0) return "N/A";
                          const maxRpm = Math.max(...validRpm.map(d => d.rotRpmMax!));
                          return `${maxRpm.toFixed(0)}`;
                        })()}
                      </div>
                      <div className="text-red-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">Avg RPM</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(() => {
                          const validRpm = mpData.filter(d => 
                            d.rotRpmAvg !== null && 
                            d.rotRpmAvg !== undefined && 
                            !isNaN(d.rotRpmAvg) && 
                            isFinite(d.rotRpmAvg) &&
                            d.rotRpmAvg > 0 && d.rotRpmAvg < 10000
                          );
                          if (validRpm.length === 0) return "N/A";
                          const avgRpm = validRpm.reduce((sum, d) => sum + d.rotRpmAvg!, 0) / validRpm.length;
                          return `${avgRpm.toFixed(0)}`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">average</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">RPM Variation</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {(() => {
                          const validRpm = mpData.filter(d => 
                            d.rotRpmMax !== null && d.rotRpmMax !== undefined && !isNaN(d.rotRpmMax) && isFinite(d.rotRpmMax) && d.rotRpmMax > 0 &&
                            d.rotRpmMin !== null && d.rotRpmMin !== undefined && !isNaN(d.rotRpmMin) && isFinite(d.rotRpmMin) && d.rotRpmMin >= 0 &&
                            d.rotRpmMax < 10000 && d.rotRpmMin < 10000
                          );
                          if (validRpm.length === 0) return "N/A";
                          const avgVariation = validRpm.reduce((sum, d) => sum + (d.rotRpmMax! - d.rotRpmMin!), 0) / validRpm.length;
                          return `${avgVariation.toFixed(0)}`;
                        })()}
                      </div>
                      <div className="text-blue-300 text-sm">spread</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">Active Rotation</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(() => {
                          const activeRotation = mpData.filter(d => 
                            d.rotRpmAvg !== null && d.rotRpmAvg !== undefined && !isNaN(d.rotRpmAvg) && isFinite(d.rotRpmAvg) && d.rotRpmAvg > 10
                          );
                          const percentage = activeRotation.length / Math.max(mpData.length, 1) * 100;
                          return `${percentage.toFixed(1)}%`;
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">time active</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* MDG Charts */}
            {mdgData.length > 0 && (
              <>
                {/* 9. Acceleration Temperature (MDG) AX, AY, AZ, RTD, Reset */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Acceleration Temperature (MDG) AX, AY, AZ, RTD, Reset</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} label={{ value: 'Acceleration (g)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} label={{ value: 'Reset Count', angle: 90, position: 'insideRight' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="accelAX" stroke="#3B82F6" strokeWidth={2} name="Accel AX (g)" dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="accelAY" stroke="#10B981" strokeWidth={2} name="Accel AY (g)" dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="accelAZ" stroke="#F59E0B" strokeWidth={2} name="Accel AZ (g)" dot={false} />
                        <Bar yAxisId="right" dataKey="resetMP" fill="#EF4444" name="Reset Count" opacity={0.7} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* MDG Acceleration Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">Peak AX Accel</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {(() => {
                          const validAX = mdgData.filter(d => d.accelAX !== null && d.accelAX !== undefined && !isNaN(d.accelAX) && isFinite(d.accelAX));
                          if (validAX.length === 0) return "N/A";
                          return `${Math.max(...validAX.map(d => Math.abs(d.accelAX!))).toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-blue-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">Peak AY Accel</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(() => {
                          const validAY = mdgData.filter(d => d.accelAY !== null && d.accelAY !== undefined && !isNaN(d.accelAY) && isFinite(d.accelAY));
                          if (validAY.length === 0) return "N/A";
                          return `${Math.max(...validAY.map(d => Math.abs(d.accelAY!))).toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/20">
                      <div className="text-amber-400 text-xs uppercase font-medium mb-2">Peak AZ Accel</div>
                      <div className="text-2xl font-bold text-amber-400">
                        {(() => {
                          const validAZ = mdgData.filter(d => d.accelAZ !== null && d.accelAZ !== undefined && !isNaN(d.accelAZ) && isFinite(d.accelAZ));
                          if (validAZ.length === 0) return "N/A";
                          return `${Math.max(...validAZ.map(d => Math.abs(d.accelAZ!))).toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-amber-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-lg p-4 border border-red-500/20">
                      <div className="text-red-400 text-xs uppercase font-medium mb-2">Total Resets</div>
                      <div className="text-2xl font-bold text-red-400">
                        {(() => {
                          const validResets = mdgData.filter(d => d.tempMP !== null && d.tempMP !== undefined && !isNaN(d.tempMP) && isFinite(d.tempMP));
                          if (validResets.length === 0) return "N/A";
                          return validResets.length.toLocaleString();
                        })()}
                      </div>
                      <div className="text-red-300 text-sm">events</div>
                    </div>
                  </div>
                </div>

                {/* 8. Shock Peak Z (g) (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Shock Peak Z (g) (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Shock Z (g)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="shockZ" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Shock Z (g)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Shock Z Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-lg p-4 border border-red-500/20">
                      <div className="text-red-400 text-xs uppercase font-medium mb-2">Peak Shock Z</div>
                      <div className="text-2xl font-bold text-red-400">
                        {(() => {
                          const validShockZ = mdgData.filter(d => d.shockZ !== null && d.shockZ !== undefined && !isNaN(d.shockZ) && isFinite(d.shockZ));
                          if (validShockZ.length === 0) return "N/A";
                          return `${Math.max(...validShockZ.map(d => Math.abs(d.shockZ!))).toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-red-300 text-sm">maximum</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg p-4 border border-orange-500/20">
                      <div className="text-orange-400 text-xs uppercase font-medium mb-2">Avg Shock Z</div>
                      <div className="text-2xl font-bold text-orange-400">
                        {(() => {
                          const validShockZ = mdgData.filter(d => d.shockZ !== null && d.shockZ !== undefined && !isNaN(d.shockZ) && isFinite(d.shockZ));
                          if (validShockZ.length === 0) return "N/A";
                          const avgShockZ = validShockZ.reduce((sum, d) => sum + Math.abs(d.shockZ!), 0) / validShockZ.length;
                          return `${avgShockZ.toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-orange-300 text-sm">average</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
                      <div className="text-yellow-400 text-xs uppercase font-medium mb-2">High Impact Events</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {(() => {
                          const highShocks = mdgData.filter(d => d.shockZ !== null && d.shockZ !== undefined && !isNaN(d.shockZ) && isFinite(d.shockZ) && Math.abs(d.shockZ) > 10);
                          return highShocks.length.toLocaleString();
                        })()}
                      </div>
                      <div className="text-yellow-300 text-sm">events &gt; 10g</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">Data Points</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(() => {
                          const validShockZ = mdgData.filter(d => d.shockZ !== null && d.shockZ !== undefined && !isNaN(d.shockZ) && isFinite(d.shockZ));
                          return validShockZ.length.toLocaleString();
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">samples</div>
                    </div>
                  </div>
                </div>

                {/* 9. Shock Peak X,Y (g) (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Shock Peak X,Y (g) (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Shock (g)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="shockX" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Shock X (g)" />
                        <Area type="monotone" dataKey="shockY" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Shock Y (g)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Lateral Shock Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">Peak Shock X</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {(() => {
                          const validShockX = mdgData.filter(d => d.shockX !== null && d.shockX !== undefined && !isNaN(d.shockX) && isFinite(d.shockX));
                          if (validShockX.length === 0) return "N/A";
                          return `${Math.max(...validShockX.map(d => Math.abs(d.shockX!))).toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-blue-300 text-sm">lateral max</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">Peak Shock Y</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(() => {
                          const validShockY = mdgData.filter(d => d.shockY !== null && d.shockY !== undefined && !isNaN(d.shockY) && isFinite(d.shockY));
                          if (validShockY.length === 0) return "N/A";
                          return `${Math.max(...validShockY.map(d => Math.abs(d.shockY!))).toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">lateral max</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg p-4 border border-orange-500/20">
                      <div className="text-orange-400 text-xs uppercase font-medium mb-2">Combined Peak</div>
                      <div className="text-2xl font-bold text-orange-400">
                        {(() => {
                          const validBoth = mdgData.filter(d => 
                            d.shockX !== null && d.shockX !== undefined && !isNaN(d.shockX) && isFinite(d.shockX) &&
                            d.shockY !== null && d.shockY !== undefined && !isNaN(d.shockY) && isFinite(d.shockY)
                          );
                          if (validBoth.length === 0) return "N/A";
                          const maxCombined = Math.max(...validBoth.map(d => Math.sqrt(d.shockX! * d.shockX! + d.shockY! * d.shockY!)));
                          return `${maxCombined.toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-orange-300 text-sm">resultant</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">High Lateral Events</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(() => {
                          const highLateral = mdgData.filter(d => 
                            (d.shockX !== null && d.shockX !== undefined && !isNaN(d.shockX) && isFinite(d.shockX) && Math.abs(d.shockX) > 5) ||
                            (d.shockY !== null && d.shockY !== undefined && !isNaN(d.shockY) && isFinite(d.shockY) && Math.abs(d.shockY) > 5)
                          );
                          return highLateral.length.toLocaleString();
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">events &gt; 5g</div>
                    </div>
                  </div>
                </div>

                {/* 9. Axial Shock Count (cps) (MDG) 50g and 100g */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Axial Shock Count (cps) (MDG) 50g and 100g</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Count (cps)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="shockCountAxial50" fill="#F59E0B" name="Axial 50g Count" />
                        <Bar dataKey="shockCountAxial100" fill="#EF4444" name="Axial 100g Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Axial Shock Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-lg p-4 border border-amber-500/20">
                      <div className="text-amber-400 text-xs uppercase font-medium mb-2">Total 50g Axial Shocks</div>
                      <div className="text-2xl font-bold text-amber-400">
                        {(() => {
                          const valid50g = mdgData.filter(d => d.shockCountAxial50 !== null && d.shockCountAxial50 !== undefined && !isNaN(d.shockCountAxial50) && isFinite(d.shockCountAxial50));
                          if (valid50g.length === 0) return "N/A";
                          return valid50g.reduce((sum, d) => sum + (d.shockCountAxial50 || 0), 0).toLocaleString();
                        })()}
                      </div>
                      <div className="text-amber-300 text-sm">total events</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-lg p-4 border border-red-500/20">
                      <div className="text-red-400 text-xs uppercase font-medium mb-2">Total 100g Axial Shocks</div>
                      <div className="text-2xl font-bold text-red-400">
                        {(() => {
                          const valid100g = mdgData.filter(d => d.shockCountAxial100 !== null && d.shockCountAxial100 !== undefined && !isNaN(d.shockCountAxial100) && isFinite(d.shockCountAxial100));
                          if (valid100g.length === 0) return "N/A";
                          return valid100g.reduce((sum, d) => sum + (d.shockCountAxial100 || 0), 0).toLocaleString();
                        })()}
                      </div>
                      <div className="text-red-300 text-sm">severe events</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg p-4 border border-orange-500/20">
                      <div className="text-orange-400 text-xs uppercase font-medium mb-2">50g Event Rate</div>
                      <div className="text-2xl font-bold text-orange-400">
                        {(() => {
                          const valid50g = mdgData.filter(d => d.shockCountAxial50 !== null && d.shockCountAxial50 !== undefined && !isNaN(d.shockCountAxial50) && isFinite(d.shockCountAxial50));
                          if (valid50g.length === 0) return "N/A";
                          const totalShocks = valid50g.reduce((sum, d) => sum + (d.shockCountAxial50 || 0), 0);
                          const timeSpanHours = (valid50g.length * 2) / 3600; // 2 seconds per sample
                          return `${(totalShocks / Math.max(timeSpanHours, 0.001)).toFixed(1)}/hr`;
                        })()}
                      </div>
                      <div className="text-orange-300 text-sm">frequency</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">100g Event Rate</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(() => {
                          const valid100g = mdgData.filter(d => d.shockCountAxial100 !== null && d.shockCountAxial100 !== undefined && !isNaN(d.shockCountAxial100) && isFinite(d.shockCountAxial100));
                          if (valid100g.length === 0) return "N/A";
                          const totalShocks = valid100g.reduce((sum, d) => sum + (d.shockCountAxial100 || 0), 0);
                          const timeSpanHours = (valid100g.length * 2) / 3600; // 2 seconds per sample
                          return `${(totalShocks / Math.max(timeSpanHours, 0.001)).toFixed(1)}/hr`;
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">critical rate</div>
                    </div>
                  </div>
                </div>

                {/* 10. Lateral Shock Count (cps) (MDG) 50g and 100g */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Lateral Shock Count (cps) (MDG) 50g and 100g</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Count (cps)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="shockCountLat50" fill="#8B5CF6" name="Lateral 50g Count" />
                        <Bar dataKey="shockCountLat100" fill="#EC4899" name="Lateral 100g Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 11. Rotation RPM (MDG) Max, Avg, Min */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <RotateCw className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Rotation RPM (MDG) Max, Avg, Min</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'RPM', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="rotRpmMax" stroke="#EF4444" strokeWidth={2} name="RPM Max" dot={false} />
                        <Line type="monotone" dataKey="rotRpmAvg" stroke="#10B981" strokeWidth={2} name="RPM Avg" dot={false} />
                        <Line type="monotone" dataKey="rotRpmMin" stroke="#3B82F6" strokeWidth={2} name="RPM Min" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 12. System Voltage (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Cpu className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-slate-200">System Voltage (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="v3_3VA_DI" stroke="#EF4444" strokeWidth={1} name="3.3VA_DI" dot={false} />
                        <Line type="monotone" dataKey="v5VD" stroke="#10B981" strokeWidth={1} name="5VD" dot={false} />
                        <Line type="monotone" dataKey="v3_3VD" stroke="#3B82F6" strokeWidth={1} name="3.3VD" dot={false} />
                        <Line type="monotone" dataKey="v1_9VD" stroke="#F59E0B" strokeWidth={1} name="1.9VD" dot={false} />
                        <Line type="monotone" dataKey="v1_5VD" stroke="#8B5CF6" strokeWidth={1} name="1.5VD" dot={false} />
                        <Line type="monotone" dataKey="v1_8VA" stroke="#EC4899" strokeWidth={1} name="1.8VA" dot={false} />
                        <Line type="monotone" dataKey="v3_3VA" stroke="#06B6D4" strokeWidth={1} name="3.3VA" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 13. Battery Voltage (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Battery className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Battery Voltage (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="vBatt" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Battery Voltage (V)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 14. System Current (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-200">System Current (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="i5VD" stroke="#EF4444" strokeWidth={2} name="I5VD (A)" dot={false} />
                        <Line type="monotone" dataKey="i3_3VD" stroke="#10B981" strokeWidth={2} name="I3.3VD (A)" dot={false} />
                        <Line type="monotone" dataKey="iBatt" stroke="#F59E0B" strokeWidth={2} name="IBatt (A)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 15. Gamma (cps) (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Gamma (cps) (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Gamma (cps)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="gamma" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Gamma (cps)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 16. Acceleration Long Term Stability (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Acceleration Long Term Stability (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Stability', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="accelStabX" stroke="#3B82F6" strokeWidth={2} name="Accel Stab X" dot={false} />
                        <Line type="monotone" dataKey="accelStabY" stroke="#10B981" strokeWidth={2} name="Accel Stab Y" dot={false} />
                        <Line type="monotone" dataKey="accelStabZ" stroke="#F59E0B" strokeWidth={2} name="Accel Stab Z" dot={false} />
                        <Line type="monotone" dataKey="accelStabZH" stroke="#8B5CF6" strokeWidth={2} name="Accel Stab ZH" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 17. Survey TGF (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Compass className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Survey TGF (g) (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'TGF (g)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="surveyTGF" stroke="#06B6D4" strokeWidth={2} name="Survey TGF (g)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 18. Survey TMF (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Gauge className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Survey TMF (Gauss) (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'TMF (Gauss)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="surveyTMF" stroke="#8B5CF6" strokeWidth={2} name="Survey TMF (Gauss)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 19. Survey DipA (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <RotateCw className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Survey DipA (Deg) (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'DipA (Deg)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="surveyDipA" stroke="#F59E0B" strokeWidth={2} name="Survey DipA (Deg)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 20. Survey vs CINC CAZM (MDG) */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Survey vs CINC CAZM (MDG)</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Degrees', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="surveyINC" stroke="#10B981" strokeWidth={2} name="Survey INC" dot={false} />
                        <Line type="monotone" dataKey="surveyCINC" stroke="#3B82F6" strokeWidth={2} name="Survey CINC" dot={false} />
                        <Line type="monotone" dataKey="surveyAZM" stroke="#F59E0B" strokeWidth={2} name="Survey AZM" dot={false} />
                        <Line type="monotone" dataKey="surveyCAZM" stroke="#8B5CF6" strokeWidth={2} name="Survey CAZM" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Survey Data Analysis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/20">
                      <div className="text-cyan-400 text-xs uppercase font-medium mb-2">True Grav Field</div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {(() => {
                          const validTGF = mdgData.filter(d => d.surveyTGF !== null && d.surveyTGF !== undefined && !isNaN(d.surveyTGF) && isFinite(d.surveyTGF));
                          if (validTGF.length === 0) return "N/A";
                          const avgTGF = validTGF.reduce((sum, d) => sum + d.surveyTGF!, 0) / validTGF.length;
                          return avgTGF.toFixed(3);
                        })()}
                      </div>
                      <div className="text-cyan-300 text-sm">avg TGF</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20">
                      <div className="text-indigo-400 text-xs uppercase font-medium mb-2">True Mag Field</div>
                      <div className="text-2xl font-bold text-indigo-400">
                        {(() => {
                          const validTMF = mdgData.filter(d => d.surveyTMF !== null && d.surveyTMF !== undefined && !isNaN(d.surveyTMF) && isFinite(d.surveyTMF));
                          if (validTMF.length === 0) return "N/A";
                          const avgTMF = validTMF.reduce((sum, d) => sum + d.surveyTMF!, 0) / validTMF.length;
                          return avgTMF.toFixed(3);
                        })()}
                      </div>
                      <div className="text-indigo-300 text-sm">avg TMF</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">Dip Angle</div>
                      <div className="text-2xl font-bold text-green-400">
                        {(() => {
                          const validDip = mdgData.filter(d => d.surveyDipA !== null && d.surveyDipA !== undefined && !isNaN(d.surveyDipA) && isFinite(d.surveyDipA));
                          if (validDip.length === 0) return "N/A";
                          const avgDip = validDip.reduce((sum, d) => sum + d.surveyDipA!, 0) / validDip.length;
                          return `${avgDip.toFixed(1)}°`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">avg dip</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
                      <div className="text-orange-400 text-xs uppercase font-medium mb-2">Inclination</div>
                      <div className="text-2xl font-bold text-orange-400">
                        {(() => {
                          const validINC = mdgData.filter(d => d.surveyINC !== null && d.surveyINC !== undefined && !isNaN(d.surveyINC) && isFinite(d.surveyINC));
                          if (validINC.length === 0) return "N/A";
                          const avgINC = validINC.reduce((sum, d) => sum + d.surveyINC!, 0) / validINC.length;
                          return `${avgINC.toFixed(1)}°`;
                        })()}
                      </div>
                      <div className="text-orange-300 text-sm">avg inclination</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Pump Statistics Table */}
            {mpData.length > 0 && (
              <div className="glass-morphism rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Gauge className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-slate-200">Pump Operating Statistics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-400">{totalRecords.toLocaleString()}</div>
                    <div className="text-slate-400 text-sm">Total Records</div>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400">{pumpOnTime.toLocaleString()}</div>
                    <div className="text-slate-400 text-sm">Pump On Records</div>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-400">{pumpOnPercent.toFixed(1)}%</div>
                    <div className="text-slate-400 text-sm">Pump On Time</div>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-400">{(100 - pumpOnPercent).toFixed(1)}%</div>
                    <div className="text-slate-400 text-sm">Pump Off Time</div>
                  </div>
                </div>
              </div>
            )}

            {/* Temperature Histogram */}
            {tempHistogramData.length > 0 && (
              <div className="glass-morphism rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-slate-200">Temperature Distribution Histogram</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tempHistogramData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelFormatter={(value) => `Temperature Range: ${value}`}
                        formatter={(value: any) => [`${value} records`, 'Count']}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#EF4444" name="Record Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Comprehensive Data Summary for All Plots */}
            <div className="space-y-8">
              {/* Overall Summary */}
              <div className="glass-morphism rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span>Overall Data Summary</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="text-blue-400 text-xs uppercase font-medium mb-2">Total Records</div>
                    <div className="text-2xl font-bold text-blue-400">{sensorData.length.toLocaleString()}</div>
                    <div className="text-blue-300 text-sm">data points</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg p-4 border border-red-500/20">
                    <div className="text-red-400 text-xs uppercase font-medium mb-2">MP Records</div>
                    <div className="text-2xl font-bold text-red-400">{mpData.length.toLocaleString()}</div>
                    <div className="text-red-300 text-sm">motor pump data</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                    <div className="text-green-400 text-xs uppercase font-medium mb-2">MDG Records</div>
                    <div className="text-2xl font-bold text-green-400">{mdgData.length.toLocaleString()}</div>
                    <div className="text-green-300 text-sm">sensor data</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/20 rounded-lg p-4 border border-purple-500/20">
                    <div className="text-purple-400 text-xs uppercase font-medium mb-2">Data Coverage</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {((mpData.length + mdgData.length) / sensorData.length * 100).toFixed(1)}%
                    </div>
                    <div className="text-purple-300 text-sm">processed</div>
                  </div>
                </div>
              </div>

              {/* MP Data Summary */}
              {mpData.length > 0 && (
                <div className="glass-morphism rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-red-400" />
                    <span>Motor Pump (MP) Data Summary</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Flow Status Stats (existing) */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg p-4 border border-emerald-500/20">
                      <div className="text-emerald-400 text-xs uppercase font-medium mb-2">Total On Time</div>
                      <div className="text-2xl font-bold text-emerald-400">{pumpOnTime.toLocaleString()}</div>
                      <div className="text-emerald-300 text-sm">records</div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-lg p-4 border border-slate-500/20">
                      <div className="text-slate-400 text-xs uppercase font-medium mb-2">Total Off Time</div>
                      <div className="text-2xl font-bold text-slate-400">{(totalRecords - pumpOnTime).toLocaleString()}</div>
                      <div className="text-slate-300 text-sm">records</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">Duty Cycle</div>
                      <div className="text-2xl font-bold text-blue-400">{pumpOnPercent.toFixed(1)}%</div>
                      <div className="text-blue-300 text-sm">efficiency</div>
                    </div>

                    {/* Temperature Stats */}
                    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg p-4 border border-red-500/20 overflow-hidden">
                      <div className="text-red-400 text-xs uppercase font-medium mb-2">Max Temperature</div>
                      <div className="text-2xl font-bold text-red-400 truncate">
                        {(() => {
                          const validTemps = mpData.filter(d => 
                            d.tempMP !== null && 
                            d.tempMP !== undefined && 
                            !isNaN(d.tempMP) && 
                            isFinite(d.tempMP) && 
                            d.tempMP > 32 && // Above freezing 
                            d.tempMP < 300 // Below 300°F (reasonable max for industrial equipment)
                          );
                          if (validTemps.length === 0) return "N/A";
                          const maxTemp = Math.max(...validTemps.map(d => d.tempMP!));
                          return `${maxTemp.toFixed(1)}°F`;
                        })()}
                      </div>
                      <div className="text-red-300 text-sm">peak temp</div>
                    </div>

                    {/* Battery Stats */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg p-4 border border-yellow-500/20 overflow-hidden">
                      <div className="text-yellow-400 text-xs uppercase font-medium mb-2">Avg Battery V</div>
                      <div className="text-2xl font-bold text-yellow-400 truncate">
                        {(() => {
                          const validVolts = mpData.filter(d => 
                            d.batteryVoltMP !== null && 
                            d.batteryVoltMP !== undefined && 
                            !isNaN(d.batteryVoltMP) && 
                            isFinite(d.batteryVoltMP) && 
                            d.batteryVoltMP > 8 && // Reasonable minimum battery voltage
                            d.batteryVoltMP < 18 // Reasonable maximum battery voltage
                          );
                          if (validVolts.length === 0) return "N/A";
                          const avgVolt = validVolts.reduce((sum, d) => sum + d.batteryVoltMP!, 0) / validVolts.length;
                          return `${avgVolt.toFixed(1)}V`;
                        })()}
                      </div>
                      <div className="text-yellow-300 text-sm">average</div>
                    </div>
                  </div>

                  {/* Second row for MP stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {/* Motor Current Stats */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20 overflow-hidden">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">Peak Motor Current</div>
                      <div className="text-2xl font-bold text-purple-400 truncate">
                        {(() => {
                          const validCurrent = mpData.filter(d => 
                            d.motorMax !== null && 
                            d.motorMax !== undefined && 
                            !isNaN(d.motorMax) && 
                            isFinite(d.motorMax) && 
                            d.motorMax >= 0 && 
                            d.motorMax < 20 // More realistic current range for motor pump
                          );
                          if (validCurrent.length === 0) return "N/A";
                          const maxCurrent = Math.max(...validCurrent.map(d => d.motorMax!));
                          return `${maxCurrent.toFixed(1)}A`;
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">maximum</div>
                    </div>

                    {/* Vibration Stats */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-lg p-4 border border-cyan-500/20 overflow-hidden">
                      <div className="text-cyan-400 text-xs uppercase font-medium mb-2">Max Vibration</div>
                      <div className="text-2xl font-bold text-cyan-400 truncate">
                        {(() => {
                          const validVibes = mpData.filter(d => 
                            d.maxZ !== null && 
                            d.maxZ !== undefined && 
                            !isNaN(d.maxZ) && 
                            isFinite(d.maxZ) && 
                            Math.abs(d.maxZ) < 50 // More realistic vibration range
                          );
                          if (validVibes.length === 0) return "N/A";
                          const maxVibe = Math.max(...validVibes.map(d => Math.abs(d.maxZ!)));
                          return `${maxVibe.toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-cyan-300 text-sm">Z-axis peak</div>
                    </div>

                    {/* Actuation Time Stats */}
                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20 overflow-hidden">
                      <div className="text-orange-400 text-xs uppercase font-medium mb-2">Avg Actuation</div>
                      <div className="text-2xl font-bold text-orange-400 truncate">
                        {(() => {
                          const validActuation = mpData.filter(d => 
                            d.actuationTime !== null && 
                            d.actuationTime !== undefined && 
                            !isNaN(d.actuationTime) && 
                            isFinite(d.actuationTime) && 
                            d.actuationTime >= 0 && 
                            d.actuationTime < 600 // More realistic time range (0-10 minutes)
                          );
                          if (validActuation.length === 0) return "N/A";
                          const avgActuation = validActuation.reduce((sum, d) => sum + d.actuationTime!, 0) / validActuation.length;
                          return `${avgActuation.toFixed(1)}s`;
                        })()}
                      </div>
                      <div className="text-orange-300 text-sm">average time</div>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-lg p-4 border border-pink-500/20">
                      <div className="text-pink-400 text-xs uppercase font-medium mb-2">Total MP Records</div>
                      <div className="text-2xl font-bold text-pink-400">{mpData.length.toLocaleString()}</div>
                      <div className="text-pink-300 text-sm">data points</div>
                    </div>
                  </div>
                </div>
              )}

              {/* MDG Data Summary */}
              {mdgData.length > 0 && (
                <div className="glass-morphism rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center space-x-2">
                    <Compass className="w-5 h-5 text-green-400" />
                    <span>Memory Data Gauge (MDG) Summary</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Acceleration Stats */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg p-4 border border-blue-500/20 overflow-hidden">
                      <div className="text-blue-400 text-xs uppercase font-medium mb-2">Max Acceleration</div>
                      <div className="text-2xl font-bold text-blue-400 truncate">
                        {(() => {
                          const validAccel = mdgData.filter(d => 
                            d.accelAZ !== null && 
                            d.accelAZ !== undefined && 
                            !isNaN(d.accelAZ) && 
                            isFinite(d.accelAZ) && 
                            Math.abs(d.accelAZ) < 1000 // Reasonable acceleration range
                          );
                          if (validAccel.length === 0) return "N/A";
                          const maxAccel = Math.max(...validAccel.map(d => Math.abs(d.accelAZ!)));
                          return `${maxAccel.toFixed(2)}g`;
                        })()}
                      </div>
                      <div className="text-blue-300 text-sm">peak AZ</div>
                    </div>

                    {/* Shock Events */}
                    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg p-4 border border-red-500/20">
                      <div className="text-red-400 text-xs uppercase font-medium mb-2">High Shock Events</div>
                      <div className="text-2xl font-bold text-red-400">
                        {mdgData.filter(d => d.shockZ && Math.abs(d.shockZ) > 6).length}
                      </div>
                      <div className="text-red-300 text-sm">&gt;6g events</div>
                    </div>

                    {/* RPM Stats */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-lg p-4 border border-cyan-500/20 overflow-hidden">
                      <div className="text-cyan-400 text-xs uppercase font-medium mb-2">Max RPM</div>
                      <div className="text-2xl font-bold text-cyan-400 truncate">
                        {(() => {
                          const validRPM = mdgData.filter(d => 
                            d.rotRpmMax !== null && 
                            d.rotRpmMax !== undefined && 
                            !isNaN(d.rotRpmMax) && 
                            isFinite(d.rotRpmMax) && 
                            d.rotRpmMax >= 0 && 
                            d.rotRpmMax < 100000 // Reasonable RPM range
                          );
                          if (validRPM.length === 0) return "N/A";
                          const maxRPM = Math.max(...validRPM.map(d => d.rotRpmMax!));
                          return maxRPM.toLocaleString();
                        })()}
                      </div>
                      <div className="text-cyan-300 text-sm">peak rotation</div>
                    </div>

                    {/* Battery Voltage */}
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20 overflow-hidden">
                      <div className="text-green-400 text-xs uppercase font-medium mb-2">Avg Battery V</div>
                      <div className="text-2xl font-bold text-green-400 truncate">
                        {(() => {
                          const validBatt = mdgData.filter(d => 
                            d.vBatt !== null && 
                            d.vBatt !== undefined && 
                            !isNaN(d.vBatt) && 
                            isFinite(d.vBatt) && 
                            d.vBatt > 0 && 
                            d.vBatt < 50 // Reasonable battery voltage range
                          );
                          if (validBatt.length === 0) return "N/A";
                          const avgBatt = validBatt.reduce((sum, d) => sum + d.vBatt!, 0) / validBatt.length;
                          return `${avgBatt.toFixed(1)}V`;
                        })()}
                      </div>
                      <div className="text-green-300 text-sm">average</div>
                    </div>

                    {/* Gamma Radiation */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg p-4 border border-yellow-500/20 overflow-hidden">
                      <div className="text-yellow-400 text-xs uppercase font-medium mb-2">Peak Gamma</div>
                      <div className="text-2xl font-bold text-yellow-400 truncate">
                        {(() => {
                          const validGamma = mdgData.filter(d => 
                            d.gamma !== null && 
                            d.gamma !== undefined && 
                            !isNaN(d.gamma) && 
                            isFinite(d.gamma) && 
                            d.gamma >= 0 && 
                            d.gamma < 10000 // Reasonable gamma range
                          );
                          if (validGamma.length === 0) return "N/A";
                          const maxGamma = Math.max(...validGamma.map(d => d.gamma!));
                          return `${maxGamma.toFixed(1)}`;
                        })()}
                      </div>
                      <div className="text-yellow-300 text-sm">cps max</div>
                    </div>
                  </div>

                  {/* Second row for MDG stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {/* Survey Stats */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-purple-400 text-xs uppercase font-medium mb-2">Max Inclination</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(() => {
                          const validInc = mdgData.filter(d => d.surveyINC !== null && d.surveyINC !== undefined && !isNaN(d.surveyINC));
                          if (validInc.length === 0) return "N/A";
                          const maxInc = Math.max(...validInc.map(d => Math.abs(d.surveyINC!)));
                          return `${maxInc.toFixed(1)}°`;
                        })()}
                      </div>
                      <div className="text-purple-300 text-sm">maximum</div>
                    </div>

                    {/* Power Consumption */}
                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20">
                      <div className="text-orange-400 text-xs uppercase font-medium mb-2">Peak Current</div>
                      <div className="text-2xl font-bold text-orange-400">
                        {(() => {
                          const validCurrent = mdgData.filter(d => d.iBatt !== null && d.iBatt !== undefined && !isNaN(d.iBatt));
                          if (validCurrent.length === 0) return "N/A";
                          const maxCurrent = Math.max(...validCurrent.map(d => Math.abs(d.iBatt!)));
                          return `${maxCurrent.toFixed(2)}A`;
                        })()}
                      </div>
                      <div className="text-orange-300 text-sm">battery draw</div>
                    </div>

                    {/* Shock Count Total */}
                    <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-lg p-4 border border-rose-500/20">
                      <div className="text-rose-400 text-xs uppercase font-medium mb-2">Total Shock Count</div>
                      <div className="text-2xl font-bold text-rose-400">
                        {(() => {
                          const totalShocks = mdgData.reduce((sum, d) => {
                            const axial50 = d.shockCountAxial50 || 0;
                            const axial100 = d.shockCountAxial100 || 0;
                            const lat50 = d.shockCountLat50 || 0;
                            const lat100 = d.shockCountLat100 || 0;
                            return sum + axial50 + axial100 + lat50 + lat100;
                          }, 0);
                          return totalShocks.toLocaleString();
                        })()}
                      </div>
                      <div className="text-rose-300 text-sm">all events</div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg p-4 border border-emerald-500/20">
                      <div className="text-emerald-400 text-xs uppercase font-medium mb-2">Total MDG Records</div>
                      <div className="text-2xl font-bold text-emerald-400">{mdgData.length.toLocaleString()}</div>
                      <div className="text-emerald-300 text-sm">data points</div>
                    </div>
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