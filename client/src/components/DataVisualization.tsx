
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryDumpDetails, SensorData } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, BarChart, Bar } from "recharts";
import { Download, TrendingUp, Zap, Thermometer, Battery, Activity, Gauge, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataVisualizationProps {
  memoryDump: {
    id: number;
    status: string;
  } | null;
}

export default function DataVisualization({ memoryDump }: DataVisualizationProps) {
  const { data: dumpDetails, isLoading } = useQuery<MemoryDumpDetails>({
    queryKey: ['/api/memory-dumps', memoryDump?.id],
    enabled: memoryDump?.status === 'completed',
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity, // Never consider data stale
    gcTime: Infinity, // Keep data in cache forever
  });

  // Process data for charts - using actual sensor data
  const chartData = useMemo(() => {
    const sensorData = dumpDetails?.sensorData;
    if (!sensorData) return [];
    return sensorData.map((data, index) => ({
      index,
      rtd: data.rtd,
      timestamp: new Date(data.rtd).toLocaleTimeString(),
      // MP Data
      tempMP: data.tempMP,
      resetMP: data.resetMP,
      batteryCurrMP: data.batteryCurrMP,
      batteryVoltMP: data.batteryVoltMP,
      flowStatus: data.flowStatus,
      maxX: data.maxX,
      maxY: data.maxY,
      maxZ: data.maxZ,
      threshold: data.threshold,
      motorMin: data.motorMin,
      motorAvg: data.motorAvg,
      motorMax: data.motorMax,
      motorHall: data.motorHall,
      actuationTime: data.actuationTime,
      // MDG Data
      accelAX: data.accelAX,
      accelAY: data.accelAY,
      accelAZ: data.accelAZ,
      shockZ: data.shockZ,
      shockX: data.shockX,
      shockY: data.shockY,
      shockCountAxial50: data.shockCountAxial50,
      shockCountAxial100: data.shockCountAxial100,
      shockCountLat50: data.shockCountLat50,
      shockCountLat100: data.shockCountLat100,
      rotRpmMin: data.rotRpmMin,
      rotRpmAvg: data.rotRpmAvg,
      rotRpmMax: data.rotRpmMax,
      v3_3VA_DI: data.v3_3VA_DI,
      v5VD: data.v5VD,
      v3_3VD: data.v3_3VD,
      v1_9VD: data.v1_9VD,
      v1_5VD: data.v1_5VD,
      v1_8VA: data.v1_8VA,
      v3_3VA: data.v3_3VA,
      vBatt: data.vBatt,
      i5VD: data.i5VD,
      i3_3VD: data.i3_3VD,
      iBatt: data.iBatt,
      gamma: data.gamma,
      accelStabX: data.accelStabX,
      accelStabY: data.accelStabY,
      accelStabZ: data.accelStabZ,
      accelStabZH: data.accelStabZH,
      surveyTGF: data.surveyTGF,
      surveyTMF: data.surveyTMF,
      surveyDipA: data.surveyDipA,
      surveyINC: data.surveyINC,
      surveyCINC: data.surveyCINC,
      surveyAZM: data.surveyAZM,
      surveyCAZM: data.surveyCAZM,
    }));
  }, [dumpDetails?.sensorData]);

  // Temperature histogram data
  const tempHistogramData = useMemo(() => {
    if (!chartData.length) return [];
    const tempBins: { [key: string]: number } = {};
    chartData.forEach(d => {
      if (d.tempMP !== null && d.tempMP !== undefined) {
        const bin = Math.floor(d.tempMP / 5) * 5; // 5°F bins
        tempBins[bin] = (tempBins[bin] || 0) + 1;
      }
    });
    return Object.entries(tempBins).map(([temp, count]) => ({
      temperature: `${temp}-${parseInt(temp) + 5}°F`,
      count
    }));
  }, [chartData]);

  // Pump on stats
  const pumpStats = useMemo(() => {
    if (!chartData.length) return null;
    const pumpOnData = chartData.filter(d => d.flowStatus === 'On');
    const totalRuntime = pumpOnData.length;
    const avgMotorCurrent = pumpOnData.reduce((sum, d) => sum + (d.motorAvg || 0), 0) / pumpOnData.length;
    const maxTemp = Math.max(...pumpOnData.map(d => d.tempMP || 0));
    const avgActuationTime = pumpOnData.reduce((sum, d) => sum + (d.actuationTime || 0), 0) / pumpOnData.length;
    
    return {
      totalRuntime,
      avgMotorCurrent: avgMotorCurrent.toFixed(2),
      maxTemp: maxTemp.toFixed(1),
      avgActuationTime: avgActuationTime.toFixed(2),
      efficiency: ((totalRuntime / chartData.length) * 100).toFixed(1)
    };
  }, [chartData]);

  const ModernTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-morphism rounded-lg p-4 border border-blue-500/30">
          <p className="text-slate-300 text-sm mb-2">{`Time: ${label}`}</p>
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

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/memory-dumps/${memoryDump?.id}/report`, {
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
      a.download = `memory-dump-report-${memoryDump?.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (!memoryDump) {
    return (
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            Data Visualization & Analysis
          </h2>
        </div>
        <div className="glass-morphism rounded-xl p-8 text-center">
          <p className="text-slate-400 text-lg">Select a memory dump to view visualizations</p>
        </div>
      </section>
    );
  }

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

      {/* Pump Stats Table */}
      {pumpStats && (
        <div className="glass-morphism rounded-xl p-6">
          <h3 className="text-xl font-semibold text-slate-100 mb-4">Pump Operation Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{pumpStats.totalRuntime}</div>
              <div className="text-sm text-slate-400">Runtime (samples)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{pumpStats.avgMotorCurrent}A</div>
              <div className="text-sm text-slate-400">Avg Motor Current</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{pumpStats.maxTemp}°F</div>
              <div className="text-sm text-slate-400">Max Temperature</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{pumpStats.avgActuationTime}s</div>
              <div className="text-sm text-slate-400">Avg Actuation Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{pumpStats.efficiency}%</div>
              <div className="text-sm text-slate-400">Efficiency</div>
            </div>
          </div>
        </div>
      )}
      
      {/* MP Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Temperature (MP) & Reset */}
        <ChartCard 
          title="Temperature (MP) & Reset Events" 
          icon={Thermometer}
          gradient="from-rose-500 to-orange-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="tempMP" stroke="hsl(346, 77%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resetMP" stroke="hsl(43, 96%, 56%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Battery (MP) Current & Voltage */}
        <ChartCard 
          title="Battery (MP) Current & Voltage" 
          icon={Battery}
          gradient="from-emerald-500 to-teal-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="batteryCurrMP" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="batteryVoltMP" stroke="hsl(187, 85%, 53%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Vibration Flow Status & Max X,Y,Z */}
        <ChartCard 
          title="Vibration Flow Status & Max X,Y,Z & Threshold" 
          icon={Activity}
          gradient="from-purple-500 to-indigo-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="maxX" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="maxY" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="maxZ" stroke="hsl(43, 96%, 56%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="threshold" stroke="hsl(346, 77%, 60%)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Motor Current (MP) Min, Avg, Max, Hall */}
        <ChartCard 
          title="Motor Current (MP) Min, Avg, Max, Hall" 
          icon={Zap}
          gradient="from-amber-500 to-orange-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="motorMin" stroke="hsl(215, 20%, 65%)" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="motorAvg" stroke="hsl(43, 96%, 56%)" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="motorMax" stroke="hsl(346, 77%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="motorHall" stroke="hsl(271, 81%, 56%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Actuation Time vs Average Motor Current */}
        <ChartCard 
          title="Actuation Time vs Average Motor Current (MP)" 
          icon={Clock}
          gradient="from-cyan-500 to-blue-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="motorAvg" stroke="hsl(187, 85%, 53%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actuationTime" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Accel Temp (MDG) AX, AY, AZ */}
        <ChartCard 
          title="Accel Temp (MDG) AX, AY, AZ" 
          icon={TrendingUp}
          gradient="from-violet-500 to-purple-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="accelAX" stroke="hsl(187, 85%, 53%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="accelAY" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="accelAZ" stroke="hsl(271, 81%, 56%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* MDG Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Shock Peak Z (g) (MDG) */}
        <ChartCard 
          title="Shock Peak Z (g) (MDG)" 
          icon={Activity}
          gradient="from-red-500 to-pink-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="shockZ" stroke="hsl(346, 77%, 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Shock Peak X,Y (g) (MDG) */}
        <ChartCard 
          title="Shock Peak X,Y (g) (MDG)" 
          icon={Activity}
          gradient="from-orange-500 to-red-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="shockX" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="shockY" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Axial Shock Count (cps)(MDG) */}
        <ChartCard 
          title="Axial Shock Count (cps)(MDG) 50g & 100g" 
          icon={Gauge}
          gradient="from-indigo-500 to-purple-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="shockCountAxial50" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="shockCountAxial100" stroke="hsl(346, 77%, 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Lateral Shock Count (cps)(MDG) */}
        <ChartCard 
          title="Lateral Shock Count (cps)(MDG) 50g & 100g" 
          icon={Gauge}
          gradient="from-teal-500 to-cyan-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="shockCountLat50" stroke="hsl(187, 85%, 53%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="shockCountLat100" stroke="hsl(271, 81%, 56%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Rotation Rpm (MDG) */}
        <ChartCard 
          title="Rotation Rpm (MDG) Max, Avg, Min" 
          icon={Activity}
          gradient="from-green-500 to-emerald-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="rotRpmMax" stroke="hsl(346, 77%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rotRpmAvg" stroke="hsl(43, 96%, 56%)" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="rotRpmMin" stroke="hsl(215, 20%, 65%)" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* System Voltage (MDG) */}
        <ChartCard 
          title="System Voltage (MDG)" 
          icon={Zap}
          gradient="from-yellow-500 to-orange-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="v3_3VA_DI" stroke="hsl(217, 91%, 60%)" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="v5VD" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="v3_3VD" stroke="hsl(43, 96%, 56%)" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="v1_9VD" stroke="hsl(346, 77%, 60%)" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="v1_5VD" stroke="hsl(271, 81%, 56%)" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="v1_8VA" stroke="hsl(187, 85%, 53%)" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="v3_3VA" stroke="hsl(0, 0%, 60%)" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Battery Voltage (MDG) */}
        <ChartCard 
          title="Battery Voltage (MDG)" 
          icon={Battery}
          gradient="from-lime-500 to-green-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="vBatt" stroke="hsl(142, 71%, 45%)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* System Current (MDG) */}
        <ChartCard 
          title="System Current (MDG)" 
          icon={Zap}
          gradient="from-pink-500 to-rose-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="i5VD" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="i3_3VD" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="iBatt" stroke="hsl(346, 77%, 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gamma (cps) (MDG) */}
        <ChartCard 
          title="Gamma (cps) (MDG)" 
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
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Area type="monotone" dataKey="gamma" stroke="hsl(271, 81%, 56%)" strokeWidth={3} fill="url(#gammaGradient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Accel Long Term Stability (MDG) */}
        <ChartCard 
          title="Accel Long Term Stability (MDG)" 
          icon={TrendingUp}
          gradient="from-slate-500 to-gray-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="accelStabX" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="accelStabY" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="accelStabZ" stroke="hsl(43, 96%, 56%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="accelStabZH" stroke="hsl(271, 81%, 56%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Survey TGF (MDG) */}
        <ChartCard 
          title="Survey TGF (MDG) Survey TGF (g)" 
          icon={Gauge}
          gradient="from-blue-500 to-indigo-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="surveyTGF" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Survey TMF (MDG) */}
        <ChartCard 
          title="Survey TMF (MDG) Survey TMF (Gauss)" 
          icon={Gauge}
          gradient="from-emerald-500 to-green-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="surveyTMF" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Survey DipA (MDG) */}
        <ChartCard 
          title="Survey DipA (MDG) Survey DipA (Deg)" 
          icon={Activity}
          gradient="from-amber-500 to-yellow-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="surveyDipA" stroke="hsl(43, 96%, 56%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Survey vs CINC CAZM (MDG) */}
        <ChartCard 
          title="Survey vs CINC CAZM (MDG)" 
          icon={Activity}
          gradient="from-purple-500 to-pink-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="timestamp" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Line type="monotone" dataKey="surveyINC" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="surveyCINC" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="surveyAZM" stroke="hsl(43, 96%, 56%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="surveyCAZM" stroke="hsl(271, 81%, 56%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Temperature Histogram */}
        <ChartCard 
          title="Temperature Histogram (MDG)" 
          icon={Thermometer}
          gradient="from-red-500 to-orange-500"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tempHistogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" strokeOpacity={0.3} />
              <XAxis dataKey="temperature" stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ModernTooltip />} />
              <Bar dataKey="count" fill="hsl(346, 77%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}
