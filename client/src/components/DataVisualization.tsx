
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryDumpDetails, SensorData } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from "recharts";
import { Download, TrendingUp, Zap, Thermometer, Battery, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/memory-dumps/${memoryDump.id}/report`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `memory-dump-report-${memoryDump.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Data Visualization & Analysis
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-morphism rounded-xl p-8 animate-pulse">
              <div className="h-6 bg-dark-600 rounded-lg w-1/2 mb-6"></div>
              <div className="h-80 bg-dark-600 rounded-lg"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!dumpDetails?.sensorData) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-8 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Data Visualization & Analysis
        </h2>
        <div className="glass-morphism rounded-xl p-8 text-center">
          <p className="text-slate-400 text-lg">No sensor data available for visualization</p>
        </div>
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

  const ModernTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-morphism rounded-lg p-4 border border-blue-500/30">
          <p className="text-slate-300 text-sm mb-2">{`Index: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value?.toFixed(2) || 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartCard = ({ 
    title, 
    children, 
    bounds, 
    icon: Icon,
    gradient = "from-blue-500 to-purple-500"
  }: { 
    title: string; 
    children: React.ReactNode; 
    bounds?: string;
    icon?: any;
    gradient?: string;
  }) => (
    <div className="gradient-border chart-enter">
      <Card className="bg-dark-800/50 backdrop-blur-xl border-0 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="w-5 h-5 text-blue-500" />}
              <CardTitle className={`text-lg font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {title}
              </CardTitle>
            </div>
            {bounds && (
              <div className="px-3 py-1 bg-dark-700/70 rounded-full">
                <span className="text-xs text-slate-400">{bounds}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-80 relative">
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          Data Visualization & Analysis
        </h2>
        <Button 
          onClick={handleDownloadPDF}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF Report
        </Button>
      </div>
      
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Temperature Chart */}
        <ChartCard 
          title="Temperature Monitoring" 
          bounds="UB: 130°F | LB: 100°F"
          icon={Thermometer}
          gradient="from-rose-500 to-orange-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(346, 77%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(346, 77%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis 
                dataKey="index" 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ModernTooltip />} />
              <ReferenceLine y={130} stroke="hsl(346, 77%, 60%)" strokeDasharray="5 5" strokeWidth={2} />
              <ReferenceLine y={100} stroke="hsl(43, 96%, 56%)" strokeDasharray="5 5" strokeWidth={2} />
              <Area 
                type="monotone" 
                dataKey="tempMP" 
                stroke="hsl(346, 77%, 60%)" 
                strokeWidth={3}
                fill="url(#tempGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Battery Voltage Chart */}
        <ChartCard 
          title="Battery Voltage" 
          bounds="UB: 15.5V | LB: 11.5V"
          icon={Battery}
          gradient="from-emerald-500 to-teal-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis 
                dataKey="index" 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ModernTooltip />} />
              <ReferenceLine y={15.5} stroke="hsl(43, 96%, 56%)" strokeDasharray="5 5" strokeWidth={2} />
              <ReferenceLine y={11.5} stroke="hsl(346, 77%, 60%)" strokeDasharray="5 5" strokeWidth={2} />
              <Area 
                type="monotone" 
                dataKey="batteryVoltMP" 
                stroke="hsl(142, 71%, 45%)" 
                strokeWidth={3}
                fill="url(#batteryGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Shock Levels */}
        <ChartCard 
          title="Shock Levels (XYZ)" 
          bounds="Threshold: 6.0g"
          icon={Activity}
          gradient="from-purple-500 to-indigo-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis 
                dataKey="index" 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ModernTooltip />} />
              <ReferenceLine y={6.0} stroke="hsl(346, 77%, 60%)" strokeDasharray="5 5" strokeWidth={2} />
              <Line 
                type="monotone" 
                dataKey="shockX" 
                stroke="hsl(217, 91%, 60%)" 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="shockY" 
                stroke="hsl(142, 71%, 45%)" 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="shockZ" 
                stroke="hsl(43, 96%, 56%)" 
                strokeWidth={2} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Motor Current */}
        <ChartCard 
          title="Motor Current" 
          bounds="Max: 2.0A"
          icon={Zap}
          gradient="from-amber-500 to-orange-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis 
                dataKey="index" 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ModernTooltip />} />
              <ReferenceLine y={2.0} stroke="hsl(346, 77%, 60%)" strokeDasharray="5 5" strokeWidth={2} />
              <Line 
                type="monotone" 
                dataKey="motorMin" 
                stroke="hsl(215, 20%, 65%)" 
                strokeWidth={1} 
                dot={false}
                strokeOpacity={0.7}
              />
              <Line 
                type="monotone" 
                dataKey="motorAvg" 
                stroke="hsl(43, 96%, 56%)" 
                strokeWidth={3} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="motorMax" 
                stroke="hsl(346, 77%, 60%)" 
                strokeWidth={2} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Acceleration Data */}
        <ChartCard 
          title="Acceleration Data" 
          bounds="3σ outlier detection"
          icon={TrendingUp}
          gradient="from-cyan-500 to-blue-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis 
                dataKey="index" 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ModernTooltip />} />
              <Line 
                type="monotone" 
                dataKey="accelAX" 
                stroke="hsl(187, 85%, 53%)" 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="accelAY" 
                stroke="hsl(142, 71%, 45%)" 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="accelAZ" 
                stroke="hsl(271, 81%, 56%)" 
                strokeWidth={2} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gamma Radiation */}
        <ChartCard 
          title="Gamma Radiation" 
          bounds="Range: 15-45 counts"
          icon={Activity}
          gradient="from-violet-500 to-purple-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gammaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(271, 81%, 56%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis 
                dataKey="index" 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 65%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ModernTooltip />} />
              <ReferenceLine y={45} stroke="hsl(43, 96%, 56%)" strokeDasharray="5 5" strokeWidth={2} />
              <ReferenceLine y={15} stroke="hsl(142, 71%, 45%)" strokeDasharray="5 5" strokeWidth={2} />
              <Area 
                type="monotone" 
                dataKey="gamma" 
                stroke="hsl(271, 81%, 56%)" 
                strokeWidth={3}
                fill="url(#gammaGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}
