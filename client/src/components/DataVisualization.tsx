import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryDumpDetails } from "@/lib/types";
import { Activity, Thermometer, Zap, AlertTriangle } from "lucide-react";

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
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="glass-morphism rounded-xl p-8">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-lg">Loading visualization data...</p>
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

  // Sample data for charts (take every 10th record to reduce chart load)
  const chartData = sensorData
    .filter((_, index) => index % 10 === 0)
    .slice(0, 500) // Limit to 500 points for performance
    .map((record, index) => ({
      index,
      time: new Date(record.rtd).toLocaleTimeString(),
      temperature: record.tempMP,
      batteryVolt: record.batteryVoltMP,
      accelX: record.accelAX,
      accelY: record.accelAY,
      accelZ: record.accelAZ,
      shockZ: record.shockZ,
      motorAvg: record.motorAvg,
    }))
    .filter(record => record.temperature !== null || record.accelX !== null);

  // Temperature data for MP files
  const tempData = chartData.filter(d => d.temperature !== null);

  // Acceleration data for MDG files
  const accelData = chartData.filter(d => d.accelX !== null);

  return (
    <section>
      <div className="gradient-border">
        <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Data Visualization
            </CardTitle>
            <p className="text-slate-400 text-sm">Real-time sensor data analysis ({sensorData.length.toLocaleString()} total records)</p>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* Temperature Chart (MP files) */}
            {tempData.length > 0 && (
              <div className="glass-morphism rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-slate-200">Temperature Analysis</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#9CA3AF"
                        fontSize={12}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        name="Temperature (°F)"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="batteryVolt" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Battery Voltage (V)"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Acceleration Chart (MDG files) */}
            {accelData.length > 0 && (
              <div className="glass-morphism rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-slate-200">Acceleration Data</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#9CA3AF"
                        fontSize={12}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="accelX" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Accel X (g)"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accelY" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Accel Y (g)"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accelZ" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        name="Accel Z (g)"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Shock Events Chart */}
            {accelData.some(d => d.shockZ !== null) && (
              <div className="glass-morphism rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-slate-200">Shock Events</h3>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accelData.filter(d => d.shockZ && d.shockZ > 2)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#9CA3AF"
                        fontSize={12}
                      />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="shockZ" 
                        fill="#F59E0B" 
                        name="Shock Z (g)"
                      />
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

              {tempData.length > 0 && (
                <div className="glass-morphism rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-red-400">
                    {Math.max(...tempData.map(d => d.temperature!)).toFixed(1)}°F
                  </div>
                  <div className="text-slate-400 text-sm">Max Temperature</div>
                </div>
              )}

              {accelData.length > 0 && (
                <div className="glass-morphism rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {accelData.filter(d => d.shockZ && d.shockZ > 6).length}
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