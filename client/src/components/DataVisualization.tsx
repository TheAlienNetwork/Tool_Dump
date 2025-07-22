
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryDumpDetails } from "@/lib/types";
import { Activity, Thermometer, Zap, AlertTriangle, Battery, Gauge, RotateCw, Cpu, Compass } from "lucide-react";

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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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

  if (error || !dumpDetails?.sensorData || dumpDetails.sensorData.length === 0) {
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
                <p className="text-slate-500 text-sm mt-2">
                  {error ? 'Error loading data' : 'No sensor data found for this dump'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const sensorData = dumpDetails.sensorData;

  // Sample data for charts (take every 20th record to reduce chart load but maintain detail)
  const chartData = sensorData
    .filter((_, index) => index % 20 === 0)
    .slice(0, 1000) // Limit to 1000 points for performance
    .map((record, index) => ({
      index,
      time: new Date(record.rtd).toLocaleTimeString(),
      rtd: record.rtd,
      // MP Data
      tempMP: record.tempMP,
      resetMP: record.resetMP,
      batteryVoltMP: record.batteryVoltMP,
      batteryCurrMP: record.batteryCurrMP,
      flowStatus: record.flowStatus === 'On' ? 1 : 0,
      maxX: record.maxX,
      maxY: record.maxY,
      maxZ: record.maxZ,
      threshold: record.threshold,
      motorMin: record.motorMin,
      motorAvg: record.motorAvg,
      motorMax: record.motorMax,
      motorHall: record.motorHall,
      actuationTime: record.actuationTime,
      // MDG Data
      accelAX: record.accelAX,
      accelAY: record.accelAY,
      accelAZ: record.accelAZ,
      shockZ: record.shockZ,
      shockX: record.shockX,
      shockY: record.shockY,
      shockCountAxial50: record.shockCountAxial50,
      shockCountAxial100: record.shockCountAxial100,
      shockCountLat50: record.shockCountLat50,
      shockCountLat100: record.shockCountLat100,
      rotRpmMax: record.rotRpmMax,
      rotRpmAvg: record.rotRpmAvg,
      rotRpmMin: record.rotRpmMin,
      v3_3VA_DI: record.v3_3VA_DI,
      v5VD: record.v5VD,
      v3_3VD: record.v3_3VD,
      v1_9VD: record.v1_9VD,
      v1_5VD: record.v1_5VD,
      v1_8VA: record.v1_8VA,
      v3_3VA: record.v3_3VA,
      vBatt: record.vBatt,
      i5VD: record.i5VD,
      i3_3VD: record.i3_3VD,
      iBatt: record.iBatt,
      gamma: record.gamma,
      accelStabX: record.accelStabX,
      accelStabY: record.accelStabY,
      accelStabZ: record.accelStabZ,
      accelStabZH: record.accelStabZH,
      surveyTGF: record.surveyTGF,
      surveyTMF: record.surveyTMF,
      surveyDipA: record.surveyDipA,
      surveyINC: record.surveyINC,
      surveyCINC: record.surveyCINC,
      surveyAZM: record.surveyAZM,
      surveyCAZM: record.surveyCAZM,
    }));

  // Filter data by type
  const mpData = chartData.filter(d => d.tempMP !== null);
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
                {/* Enhanced Temperature Plot */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-5 h-5 text-red-400" />
                      <h3 className="text-lg font-semibold text-slate-200">MP Temperature Analysis</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>Avg: {mpData.length > 0 ? (mpData.reduce((acc, d) => acc + (d.tempMP || 0), 0) / mpData.filter(d => d.tempMP !== null).length).toFixed(1) : 'N/A'}°F</span>
                      <span>Max: {mpData.length > 0 ? Math.max(...mpData.filter(d => d.tempMP !== null).map(d => d.tempMP || 0)).toFixed(1) : 'N/A'}°F</span>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} label={{ value: 'Reset Count', angle: 90, position: 'insideRight' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value, name) => [
                            typeof value === 'number' ? value.toFixed(2) : value,
                            name
                          ]}
                        />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="tempMP" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} name="Temperature (°F)" />
                        <Bar yAxisId="right" dataKey="resetMP" fill="#10B981" name="Reset Count" opacity={0.7} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="text-red-400 font-medium">Critical Zone</div>
                      <div className="text-slate-400">&gt; 130°F</div>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="text-amber-400 font-medium">Warning Zone</div>
                      <div className="text-slate-400">100-130°F</div>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="text-emerald-400 font-medium">Normal Zone</div>
                      <div className="text-slate-400">&lt; 100°F</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Battery Analysis */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Battery className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-slate-200">MP Battery System Analysis</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>Avg V: {mpData.length > 0 ? (mpData.reduce((acc, d) => acc + (d.batteryVoltMP || 0), 0) / mpData.filter(d => d.batteryVoltMP !== null).length).toFixed(2) : 'N/A'}V</span>
                      <span>Avg A: {mpData.length > 0 ? (mpData.reduce((acc, d) => acc + (d.batteryCurrMP || 0), 0) / mpData.filter(d => d.batteryCurrMP !== null).length).toFixed(2) : 'N/A'}A</span>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} label={{ value: 'Current (A)', angle: 90, position: 'insideRight' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value, name) => [
                            typeof value === 'number' ? value.toFixed(3) : value,
                            name
                          ]}
                        />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="batteryVoltMP" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} name="Battery Voltage (V)" />
                        <Line yAxisId="right" type="monotone" dataKey="batteryCurrMP" stroke="#F59E0B" strokeWidth={2} name="Battery Current (A)" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="text-red-400 font-medium">Low Voltage</div>
                      <div className="text-slate-400">&lt; 11.5V</div>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="text-emerald-400 font-medium">Normal</div>
                      <div className="text-slate-400">11.5-15.5V</div>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="text-amber-400 font-medium">High Voltage</div>
                      <div className="text-slate-400">&gt; 15.5V</div>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="text-blue-400 font-medium">Power Status</div>
                      <div className="text-slate-400">{mpData.filter(d => (d.batteryCurrMP || 0) > 0).length > 0 ? 'Active' : 'Idle'}</div>
                    </div>
                  </div>
                </div>

                {/* Vibration & Flow Status */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Vibration, Flow Status & Max X,Y,Z, Threshold</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="maxX" stroke="#3B82F6" strokeWidth={2} name="Max X (g)" dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="maxY" stroke="#10B981" strokeWidth={2} name="Max Y (g)" dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="maxZ" stroke="#F59E0B" strokeWidth={2} name="Max Z (g)" dot={false} />
                        <Line yAxisId="left" type="monotone" dataKey="threshold" stroke="#8B5CF6" strokeWidth={1} name="Threshold" dot={false} />
                        <Bar yAxisId="right" dataKey="flowStatus" fill="#EF4444" name="Flow Status (On=1, Off=0)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Enhanced Motor Average Analysis */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-slate-200">MP Motor Performance Analysis</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>Avg Current: {mpData.length > 0 ? (mpData.reduce((acc, d) => acc + (d.motorAvg || 0), 0) / mpData.filter(d => d.motorAvg !== null).length).toFixed(3) : 'N/A'}A</span>
                      <span>Peak: {mpData.length > 0 ? Math.max(...mpData.filter(d => d.motorMax !== null).map(d => d.motorMax || 0)).toFixed(3) : 'N/A'}A</span>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value, name) => [
                            typeof value === 'number' ? value.toFixed(4) : value,
                            name
                          ]}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="motorMax" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={1} name="Motor Max (A)" />
                        <Area type="monotone" dataKey="motorAvg" stroke="#10B981" fill="#10B981" fillOpacity={0.3} strokeWidth={3} name="Motor Avg (A)" />
                        <Area type="monotone" dataKey="motorMin" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={1} name="Motor Min (A)" />
                        <Line type="monotone" dataKey="motorHall" stroke="#8B5CF6" strokeWidth={2} name="Motor Hall" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="text-emerald-400 font-medium">Normal Load</div>
                      <div className="text-slate-400">&lt; 1.0A</div>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="text-amber-400 font-medium">High Load</div>
                      <div className="text-slate-400">1.0-2.0A</div>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="text-red-400 font-medium">Overcurrent</div>
                      <div className="text-slate-400">&gt; 2.0A</div>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="text-purple-400 font-medium">Motor Status</div>
                      <div className="text-slate-400">{mpData.filter(d => (d.motorAvg || 0) > 0.1).length > 0 ? 'Active' : 'Idle'}</div>
                    </div>
                  </div>
                </div>

                {/* Actuation Time vs Average Motor Current */}
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
                        <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="motorAvg" stroke="#10B981" strokeWidth={2} name="Avg Motor Current (A)" dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="actuationTime" stroke="#F59E0B" strokeWidth={2} name="Actuation Time (s)" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* MDG Charts */}
            {mdgData.length > 0 && (
              <>
                {/* Acceleration Data */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Acceleration (MDG) AX, AY, AZ, RTD</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="accelAX" stroke="#3B82F6" strokeWidth={2} name="Accel AX (g)" dot={false} />
                        <Line type="monotone" dataKey="accelAY" stroke="#10B981" strokeWidth={2} name="Accel AY (g)" dot={false} />
                        <Line type="monotone" dataKey="accelAZ" stroke="#F59E0B" strokeWidth={2} name="Accel AZ (g)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Shock Peak Z */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="shockZ" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Shock Z (g)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Shock Peak X,Y */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="shockX" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Shock X (g)" />
                        <Area type="monotone" dataKey="shockY" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Shock Y (g)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Axial Shock Count */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Axial Shock Count (cps) (MDG) 50g & 100g</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="shockCountAxial50" fill="#F59E0B" name="Axial 50g Count" />
                        <Bar dataKey="shockCountAxial100" fill="#EF4444" name="Axial 100g Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Lateral Shock Count */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Lateral Shock Count (cps) (MDG) 50g & 100g</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="shockCountLat50" fill="#8B5CF6" name="Lateral 50g Count" />
                        <Bar dataKey="shockCountLat100" fill="#EC4899" name="Lateral 100g Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Rotation RPM */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="rotRpmMax" stroke="#EF4444" strokeWidth={2} name="RPM Max" dot={false} />
                        <Line type="monotone" dataKey="rotRpmAvg" stroke="#10B981" strokeWidth={2} name="RPM Avg" dot={false} />
                        <Line type="monotone" dataKey="rotRpmMin" stroke="#3B82F6" strokeWidth={2} name="RPM Min" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* System Voltage */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
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

                {/* Battery Voltage MDG */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="vBatt" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Battery Voltage (V)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* System Current */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="i5VD" stroke="#EF4444" strokeWidth={2} name="I5VD (A)" dot={false} />
                        <Line type="monotone" dataKey="i3_3VD" stroke="#10B981" strokeWidth={2} name="I3.3VD (A)" dot={false} />
                        <Line type="monotone" dataKey="iBatt" stroke="#F59E0B" strokeWidth={2} name="IBatt (A)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gamma Radiation */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="gamma" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Gamma (cps)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Accel Long Term Stability */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
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

                {/* Survey TGF */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="surveyTGF" stroke="#06B6D4" strokeWidth={2} name="Survey TGF (g)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Survey TMF */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="surveyTMF" stroke="#8B5CF6" strokeWidth={2} name="Survey TMF (Gauss)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Survey DipA */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="surveyDipA" stroke="#F59E0B" strokeWidth={2} name="Survey DipA (Deg)" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Survey vs CINC CAZM */}
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
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                        <Legend />
                        <Line type="monotone" dataKey="surveyINC" stroke="#10B981" strokeWidth={2} name="Survey INC" dot={false} />
                        <Line type="monotone" dataKey="surveyCINC" stroke="#3B82F6" strokeWidth={2} name="Survey CINC" dot={false} />
                        <Line type="monotone" dataKey="surveyAZM" stroke="#F59E0B" strokeWidth={2} name="Survey AZM" dot={false} />
                        <Line type="monotone" dataKey="surveyCAZM" stroke="#8B5CF6" strokeWidth={2} name="Survey CAZM" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
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
                  <h3 className="text-lg font-semibold text-slate-200">Temperature Distribution Histogram (MP)</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tempHistogramData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
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

            {/* Data Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-morphism rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-400">{sensorData.length.toLocaleString()}</div>
                <div className="text-slate-400 text-sm">Total Records</div>
              </div>
              {mpData.length > 0 && (
                <div className="glass-morphism rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-red-400">
                    {Math.max(...mpData.filter(d => d.tempMP !== null).map(d => d.tempMP!)).toFixed(1)}°F
                  </div>
                  <div className="text-slate-400 text-sm">Max Temperature</div>
                </div>
              )}
              {mdgData.length > 0 && (
                <div className="glass-morphism rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {mdgData.filter(d => d.shockZ && d.shockZ > 6).length}
                  </div>
                  <div className="text-slate-400 text-sm">High Shock Events</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
