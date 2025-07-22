import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryDumpDetails, SensorData } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface DataVisualizationProps {
  memoryDump: {
    id: number;
    status: string;
  };
}

export default function DataVisualization({ memoryDump }: DataVisualizationProps) {
  const { data: dumpDetails, isLoading } = useQuery<MemoryDumpDetails>({
    queryKey: ['/api/memory-dumps', memoryDump.id],
    enabled: memoryDump.status === 'completed',
  });

  if (isLoading) {
    return (
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-10">Data Visualization & Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-gray-90 border-gray-80">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-80 rounded w-1/2 mb-4"></div>
                  <div className="h-64 bg-gray-80 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!dumpDetails?.sensorData) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-gray-10 mb-6">Data Visualization & Analysis</h2>
        <Card className="bg-gray-90 border-gray-80">
          <CardContent className="p-6 text-center text-gray-40">
            No sensor data available for visualization
          </CardContent>
        </Card>
      </section>
    );
  }

  const sensorData = dumpDetails.sensorData;

  // Prepare data for charts
  const chartData = sensorData.map((data, index) => ({
    index,
    timestamp: new Date(data.rtd).toLocaleTimeString(),
    tempMP: data.tempMP,
    batteryVoltMP: data.batteryVoltMP,
    shockZ: data.shockZ,
    shockX: data.shockX,
    shockY: data.shockY,
    motorMin: data.motorMin,
    motorAvg: data.motorAvg,
    motorMax: data.motorMax,
    accelAX: data.accelAX,
    accelAY: data.accelAY,
    accelAZ: data.accelAZ,
    rotRpmMin: data.rotRpmMin,
    rotRpmAvg: data.rotRpmAvg,
    rotRpmMax: data.rotRpmMax,
    gamma: data.gamma,
    v3_3VD: data.v3_3VD,
    v5VD: data.v5VD,
    vBatt: data.vBatt,
    surveyINC: data.surveyINC,
    surveyAZM: data.surveyAZM,
  }));

  const ChartCard = ({ title, children, bounds }: { title: string; children: React.ReactNode; bounds?: string }) => (
    <Card className="bg-gray-90 border-gray-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-10">{title}</CardTitle>
          {bounds && (
            <div className="flex items-center space-x-2 text-xs text-gray-40">
              <span>{bounds}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {children}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-10">Data Visualization & Analysis</h2>
      
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <ChartCard title="Temperature Monitoring" bounds="UB: 130°F | LB: 100°F">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <ReferenceLine y={130} stroke="#FA4D56" strokeDasharray="5 5" />
              <ReferenceLine y={100} stroke="#FA4D56" strokeDasharray="5 5" />
              <Line 
                type="monotone" 
                dataKey="tempMP" 
                stroke="#0F62FE" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Battery Voltage Chart */}
        <ChartCard title="Battery Voltage" bounds="UB: 15.5V | LB: 11.5V">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <ReferenceLine y={15.5} stroke="#F1C21B" strokeDasharray="5 5" />
              <ReferenceLine y={11.5} stroke="#F1C21B" strokeDasharray="5 5" />
              <Line 
                type="monotone" 
                dataKey="batteryVoltMP" 
                stroke="#24A148" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shock Levels */}
        <ChartCard title="Shock Levels (XYZ)" bounds="Threshold: 6.0g">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <ReferenceLine y={6.0} stroke="#FA4D56" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="shockX" stroke="#0F62FE" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="shockY" stroke="#24A148" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="shockZ" stroke="#F1C21B" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Motor Current */}
        <ChartCard title="Motor Current" bounds="Max: 2.0A">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <ReferenceLine y={2.0} stroke="#FA4D56" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="motorMin" stroke="#8D8D8D" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="motorAvg" stroke="#0F62FE" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="motorMax" stroke="#FA4D56" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Acceleration and Rotation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acceleration Data */}
        <ChartCard title="Acceleration Data" bounds="3σ outlier detection">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <Line type="monotone" dataKey="accelAX" stroke="#0F62FE" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="accelAY" stroke="#24A148" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="accelAZ" stroke="#F1C21B" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Rotation Speed */}
        <ChartCard title="Rotation Speed" bounds="120-140 RPM range">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <Line type="monotone" dataKey="rotRpmMin" stroke="#8D8D8D" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="rotRpmAvg" stroke="#0F62FE" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rotRpmMax" stroke="#24A148" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Power and Survey Data Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Systems */}
        <ChartCard title="Power System Voltages" bounds="3.3V, 5V, Battery">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <Line type="monotone" dataKey="v3_3VD" stroke="#0F62FE" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="v5VD" stroke="#24A148" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="vBatt" stroke="#F1C21B" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Survey Data */}
        <ChartCard title="Survey Data" bounds="INC, AZM Parameters">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <Line type="monotone" dataKey="surveyINC" stroke="#0F62FE" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="surveyAZM" stroke="#24A148" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Gamma Radiation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Gamma Radiation" bounds="Range: 15-45 counts">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#393939" />
              <XAxis dataKey="index" stroke="#8D8D8D" fontSize={12} />
              <YAxis stroke="#8D8D8D" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#262626', 
                  border: '1px solid #393939', 
                  borderRadius: '6px',
                  color: '#F4F4F4'
                }}
              />
              <ReferenceLine y={45} stroke="#F1C21B" strokeDasharray="5 5" />
              <ReferenceLine y={15} stroke="#F1C21B" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="gamma" stroke="#0F62FE" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}
