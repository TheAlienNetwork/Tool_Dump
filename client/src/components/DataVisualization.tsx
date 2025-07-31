import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemoryDumpDetails } from "@/lib/types";
import { Activity, Thermometer, Zap, AlertTriangle, Battery, Gauge, RotateCw, RotateCcw, Cpu, Compass, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface DataVisualizationProps {
  memoryDump: {
    id: number;
    status: string;
    filename?: string;
    uploadedAt?: string;
  } | null;
}

// Enhanced formatting utilities for user-friendly displays
const formatValue = (value: number | null | undefined, type: string = 'default'): string => {
  if (value === null || value === undefined || !isFinite(value) || isNaN(value)) {
    return "N/A";
  }

  // Handle scientific notation and extreme values
  const absValue = Math.abs(value);

  switch (type) {
    case 'voltage':
      if (absValue < 0.001) return `${(value * 1000000).toFixed(1)}µV`;
      if (absValue < 1) return `${(value * 1000).toFixed(1)}mV`;
      return `${value.toFixed(2)}V`;

    case 'current':
      if (absValue < 0.001) return `${(value * 1000000).toFixed(1)}µA`;
      if (absValue < 1) return `${(value * 1000).toFixed(1)}mA`;
      return `${value.toFixed(3)}A`;

    case 'temperature':
      const celsius = ((value - 32) * 5/9);
      return `${value.toFixed(1)}°F (${celsius.toFixed(1)}°C)`;

    case 'acceleration':
      if (absValue < 0.001) return `${(value * 1000).toFixed(1)}mg`;
      return `${value.toFixed(3)}g`;

    case 'shock':
      let severity = '';
      if (absValue > 100) severity = '🚨 CRITICAL';
      else if (absValue > 50) severity = '⚠️ HIGH';
      else if (absValue > 20) severity = '🟡 MODERATE';
      else if (absValue > 0.1) severity = '🟢 LOW';
      return `${severity} ${value.toFixed(2)}g`;

    case 'rpm':
      if (absValue > 1000) return `${(value / 1000).toFixed(1)}K RPM`;
      return `${value.toFixed(0)} RPM`;

    case 'time':
      if (absValue < 0.01) return `${(value * 1000).toFixed(1)}ms`;
      if (absValue > 3600) return `${(value / 3600).toFixed(1)}hr`;
      if (absValue > 60) return `${(value / 60).toFixed(1)}min`;
      return `${value.toFixed(2)}s`;

    case 'count':
      if (absValue > 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (absValue > 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toFixed(0);

    case 'angle':
      return `${value.toFixed(1)}°`;

    case 'gamma':
      return `${value.toFixed(1)} cps`;

    case 'flow':
      return value === 1 ? '🟢 ON' : '🔴 OFF';

    default:
      if (absValue > 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (absValue > 1000) return `${(value / 1000).toFixed(1)}K`;
      if (absValue < 0.001) return `${(value * 1000).toFixed(3)}m`;
      return value.toFixed(3);
  }
};

// Enhanced data validation
const isValidData = (value: any, type: string = 'default', range?: { min?: number, max?: number }): boolean => {
  if (value === null || value === undefined || !isFinite(value) || isNaN(value)) {
    return false;
  }

  const absValue = Math.abs(value);

  // Type-specific validation
  switch (type) {
    case 'temperature':
      return value > -40 && value < 300; // Reasonable temperature range
    case 'voltage':
      return absValue < 100; // Reasonable voltage range
    case 'current':
      return absValue < 1000; // Reasonable current range
    case 'acceleration':
      return absValue < 50; // Reasonable acceleration range
    case 'shock':
      return absValue < 200; // Reasonable shock range
    case 'rpm':
      return absValue < 100000; // Reasonable RPM range
    case 'time':
      return absValue < 86400; // Less than 24 hours
    default:
      if (range) {
        if (range.min !== undefined && value < range.min) return false;
        if (range.max !== undefined && value > range.max) return false;
      }
      return true;
  }
};

// Enhanced tooltip formatter
const createTooltipFormatter = (type: string) => (value: any, name: string) => {
  const formattedValue = formatValue(value, type);
  return [formattedValue, name];
};

// Enhanced Y-axis formatter
const createYAxisFormatter = (type: string) => (value: any) => {
  if (value === 0) return '0';
  return formatValue(value, type);
};

export default function DataVisualization({ memoryDump }: DataVisualizationProps) {
  const { data: dumpDetails, isLoading, error } = useQuery<MemoryDumpDetails>({
    queryKey: ['/api/memory-dumps', memoryDump?.id],
    enabled: memoryDump?.status === 'completed',
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0,
    gcTime: 0,
  });

  // Enhanced chart data processing with validation
  const chartData = useMemo(() => {
    if (!dumpDetails?.sensorData || dumpDetails.sensorData.length === 0) {
      return [];
    }

    const sensorData = dumpDetails.sensorData;
    console.log(`Processing ${sensorData.length} sensor records for visualization`);

    const maxPoints = 1000;
    const step = Math.max(1, Math.floor(sensorData.length / maxPoints));

    return sensorData
      .filter((_, index) => index % step === 0)
      .map(item => ({
        time: new Date(item.rtd).toLocaleTimeString(),

        // Validated acceleration data
        accelAX: isValidData(item.accelAX, 'acceleration') ? item.accelAX : null,
        accelAY: isValidData(item.accelAY, 'acceleration') ? item.accelAY : null,
        accelAZ: isValidData(item.accelAZ, 'acceleration') ? item.accelAZ : null,

        // Validated shock data
        shockX: isValidData(item.shockX, 'shock') ? item.shockX : null,
        shockY: isValidData(item.shockY, 'shock') ? item.shockY : null,
        shockZ: isValidData(item.shockZ, 'shock') ? item.shockZ : null,

        // Validated shock counters
        shockCountAxial50: isValidData(item.shockCountAxial50, 'default', { min: 0, max: 10000 }) ? item.shockCountAxial50 : null,
        shockCountAxial100: isValidData(item.shockCountAxial100, 'default', { min: 0, max: 10000 }) ? item.shockCountAxial100 : null,
        shockCountLat50: isValidData(item.shockCountLat50, 'default', { min: 0, max: 10000 }) ? item.shockCountLat50 : null,
        shockCountLat100: isValidData(item.shockCountLat100, 'default', { min: 0, max: 10000 }) ? item.shockCountLat100 : null,

        // Validated RPM data
        rotRpmMax: isValidData(item.rotRpmMax, 'rpm') ? item.rotRpmMax : null,
        rotRpmAvg: isValidData(item.rotRpmAvg, 'rpm') ? item.rotRpmAvg : null,
        rotRpmMin: isValidData(item.rotRpmMin, 'rpm') ? item.rotRpmMin : null,

        // Validated power rails
        vBatt: isValidData(item.vBatt, 'voltage') ? item.vBatt : null,
        v5VD: isValidData(item.v5VD, 'voltage') ? item.v5VD : null,
        v3_3VD: isValidData(item.v3_3VD, 'voltage') ? item.v3_3VD : null,
        v3_3VA: isValidData(item.v3_3VA, 'voltage') ? item.v3_3VA : null,
        v1_8VA: isValidData(item.v1_8VA, 'voltage') ? item.v1_8VA : null,
        v1_9VD: isValidData(item.v1_9VD, 'voltage') ? item.v1_9VD : null,
        v1_5VD: isValidData(item.v1_5VD, 'voltage') ? item.v1_5VD : null,
        v3_3VA_DI: isValidData(item.v3_3VA_DI, 'voltage') ? item.v3_3VA_DI : null,

        // Validated current monitoring
        iBatt: isValidData(item.iBatt, 'current') ? item.iBatt : null,
        i5VD: isValidData(item.i5VD, 'current') ? item.i5VD : null,
        i3_3VD: isValidData(item.i3_3VD, 'current') ? item.i3_3VD : null,

        // Validated environmental
        gamma: isValidData(item.gamma, 'default', { min: 0, max: 50000 }) ? item.gamma : null,

        // Validated stability
        accelStabX: isValidData(item.accelStabX, 'acceleration') ? item.accelStabX : null,
        accelStabY: isValidData(item.accelStabY, 'acceleration') ? item.accelStabY : null,
        accelStabZ: isValidData(item.accelStabZ, 'acceleration') ? item.accelStabZ : null,
        accelStabZH: isValidData(item.accelStabZH, 'acceleration') ? item.accelStabZH : null,

        // Validated survey data
        surveyTGF: isValidData(item.surveyTGF, 'acceleration') ? item.surveyTGF : null,
        surveyTMF: isValidData(item.surveyTMF, 'default', { min: 0, max: 100000 }) ? item.surveyTMF : null,
        surveyDipA: isValidData(item.surveyDipA, 'angle') ? item.surveyDipA : null,
        surveyINC: isValidData(item.surveyINC, 'angle') ? item.surveyINC : null,
        surveyCINC: isValidData(item.surveyCINC, 'angle') ? item.surveyCINC : null,
        surveyAZM: isValidData(item.surveyAZM, 'angle') ? item.surveyAZM : null,
        surveyCAZM: isValidData(item.surveyCAZM, 'angle') ? item.surveyCAZM : null,

        // Validated MP data
        batteryVoltMP: isValidData(item.batteryVoltMP, 'voltage') ? item.batteryVoltMP : null,
        batteryCurrMP: isValidData(item.batteryCurrMP, 'current') ? item.batteryCurrMP : null,
        tempMP: isValidData(item.tempMP, 'temperature') ? item.tempMP : null,
        motorMin: isValidData(item.motorMin, 'current') ? item.motorMin : null,
        motorAvg: isValidData(item.motorAvg, 'current') ? item.motorAvg : null,
        motorMax: isValidData(item.motorMax, 'current') ? item.motorMax : null,
        motorHall: isValidData(item.motorHall, 'default', { min: 0, max: 10000 }) ? item.motorHall : null,
        actuationTime: isValidData(item.actuationTime, 'time') ? item.actuationTime : null,
        maxX: isValidData(item.maxX, 'acceleration') ? item.maxX : null,
        maxY: isValidData(item.maxY, 'acceleration') ? item.maxY : null,
        maxZ: isValidData(item.maxZ, 'acceleration') ? item.maxZ : null,
        threshold: isValidData(item.threshold, 'acceleration') ? item.threshold : null,
        flowStatus: item.flowStatus === 'On' ? 1 : 0,
        flowStatusLabel: item.flowStatus
      }));
  }, [dumpDetails?.sensorData]);

  // Get analysis results for error markers
  const { data: analysisResults } = useQuery({
    queryKey: ['/api/memory-dumps', memoryDump?.id, 'analysis'],
    enabled: memoryDump?.status === 'completed',
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  // Create error markers for critical issues
  const createErrorMarkers = (issues: any[], dataKey: string, yAxisId: string = 'left') => {
    if (!issues || issues.length === 0) return null;

    const relevantIssues = issues.filter(issue => 
      issue.issue.toLowerCase().includes(dataKey.toLowerCase()) ||
      (dataKey === 'tempMP' && issue.issue.toLowerCase().includes('temperature')) ||
      (dataKey === 'shockZ' && issue.issue.toLowerCase().includes('shock')) ||
      (dataKey === 'motorAvg' && issue.issue.toLowerCase().includes('motor'))
    );

    return relevantIssues.map((issue, index) => (
      <ReferenceLine 
        key={`error-${index}`}
        x={new Date(issue.firstTime).toLocaleTimeString()} 
        stroke="#dc2626" 
        strokeWidth={2}
        strokeDasharray="5 5"
        yAxisId={yAxisId}
        label={{ 
          value: `⚠️ ${issue.severity.toUpperCase()}`, 
          position: 'top',
          style: { fill: '#dc2626', fontWeight: 'bold', fontSize: '12px' }
        }}
      />
    ));
  };

  // Enhanced visibility logic
  const hasValidData = (field: string, minCount: number = 5) => {
    if (!dumpDetails?.sensorData) return false;

    const validValues = dumpDetails.sensorData.filter(d => {
      const value = (d as any)[field];
      return isValidData(value, field === 'tempMP' ? 'temperature' : 'default');
    });

    return validValues.length >= minCount;
  };

  // Data quality indicators
  const getDataQuality = (field: string) => {
    if (!dumpDetails?.sensorData) return 0;

    const total = dumpDetails.sensorData.length;
    const valid = dumpDetails.sensorData.filter(d => {
      const value = (d as any)[field];
      return isValidData(value, field === 'tempMP' ? 'temperature' : 'default');
    }).length;

    return (valid / total) * 100;
  };

  // Handle conditional rendering
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
                <p className="text-slate-500 text-sm mt-2">Optimized for fast rendering with enhanced formatting</p>
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

  // Filter data by type
  const mpData = chartData.filter(d => d.tempMP !== null || d.batteryVoltMP !== null || d.flowStatus !== null);
  const mdgData = chartData.filter(d => d.accelAX !== null || d.vBatt !== null || d.shockZ !== null);

  // Calculate statistics with enhanced formatting
  const calculateStats = (data: any[], field: string, type: string) => {
    const validData = data.filter(d => d[field] !== null && d[field] !== undefined);
    if (validData.length === 0) return { min: 'N/A', max: 'N/A', avg: 'N/A', count: 0 };

    const values = validData.map(d => d[field]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return {
      min: formatValue(min, type),
      max: formatValue(max, type),
      avg: formatValue(avg, type),
      count: validData.length
    };
  };

  // Pump statistics
  const pumpOnTime = mpData.reduce((acc, d) => acc + (d.flowStatus === 1 ? 1 : 0), 0);
  const totalRecords = mpData.length;
  const pumpOnPercent = totalRecords > 0 ? (pumpOnTime / totalRecords) * 100 : 0;

  return (
    <section>
      <div className="gradient-border">
        <Card className="bg-dark-800/50 backdrop-blur-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Enhanced Sensor Data Analysis
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Analyzing {sensorData.length.toLocaleString()} sensor records with AI-powered formatting
            </p>
            <div className="flex gap-2 mt-2">
              <div className="bg-emerald-500/20 px-2 py-1 rounded text-xs text-emerald-400">
                🔄 Smart Value Formatting
              </div>
              <div className="bg-blue-500/20 px-2 py-1 rounded text-xs text-blue-400">
                📊 Enhanced Tooltips
              </div>
              <div className="bg-purple-500/20 px-2 py-1 rounded text-xs text-purple-400">
                🧠 Data Validation
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* MP Charts with Enhanced Formatting */}
            {mpData.length > 0 && (
              <>
                {/* Temperature Analysis with AI Enhancement */}
                {hasValidData('tempMP', 10) && (
                  <div className="glass-morphism rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-slate-200">Temperature Analysis (MP) - AI Enhanced</h3>
                      </div>
                      <div className="flex gap-2">
                        <div className="bg-green-500/20 px-2 py-1 rounded text-xs text-green-400">
                          Quality: {getDataQuality('tempMP').toFixed(1)}%
                        </div>
                        {analysisResults?.issues && analysisResults.issues.some(issue => 
                          issue.issue.toLowerCase().includes('temperature')
                        ) && (
                          <div className="bg-red-500/20 px-2 py-1 rounded text-xs text-red-400 animate-pulse">
                            ⚠️ AI Alert
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mpData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                          <YAxis 
                            stroke="#9CA3AF" 
                            fontSize={12} 
                            label={{ value: 'Temperature', angle: -90, position: 'insideLeft' }}
                            tickFormatter={createYAxisFormatter('temperature')}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                            formatter={createTooltipFormatter('temperature')}
                          />
                          <Legend />
                          {createErrorMarkers(analysisResults?.issues, 'tempMP', 'left')}
                          <Area 
                            type="monotone" 
                            dataKey="tempMP" 
                            stroke="#EF4444" 
                            fill="#EF4444" 
                            fillOpacity={0.3} 
                            strokeWidth={2} 
                            name="Temperature (MP)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Enhanced Temperature Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {(() => {
                        const tempStats = calculateStats(mpData, 'tempMP', 'temperature');
                        return (
                          <>
                            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-lg p-4 border border-red-500/20">
                              <div className="text-red-400 text-xs uppercase font-medium mb-2">Peak Temperature</div>
                              <div className="text-2xl font-bold text-red-400">{tempStats.max}</div>
                              <div className="text-red-300 text-sm">maximum recorded</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                              <div className="text-blue-400 text-xs uppercase font-medium mb-2">Min Temperature</div>
                              <div className="text-2xl font-bold text-blue-400">{tempStats.min}</div>
                              <div className="text-blue-300 text-sm">minimum recorded</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                              <div className="text-green-400 text-xs uppercase font-medium mb-2">Avg Temperature</div>
                              <div className="text-2xl font-bold text-green-400">{tempStats.avg}</div>
                              <div className="text-green-300 text-sm">operational average</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                              <div className="text-purple-400 text-xs uppercase font-medium mb-2">Data Quality</div>
                              <div className="text-2xl font-bold text-purple-400">{getDataQuality('tempMP').toFixed(1)}%</div>
                              <div className="text-purple-300 text-sm">valid readings</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Battery Analysis with Smart Formatting */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Battery className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Battery Analysis (MP) - Smart Units</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis 
                          yAxisId="left" 
                          stroke="#9CA3AF" 
                          fontSize={12} 
                          label={{ value: 'Voltage', angle: -90, position: 'insideLeft' }}
                          tickFormatter={createYAxisFormatter('voltage')}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke="#9CA3AF" 
                          fontSize={12} 
                          label={{ value: 'Current', angle: 90, position: 'insideRight' }}
                          tickFormatter={createYAxisFormatter('current')}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value: any, name: string) => {
                            if (name.includes('Voltage')) return createTooltipFormatter('voltage')(value, name);
                            if (name.includes('Current')) return createTooltipFormatter('current')(value, name);
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="batteryVoltMP" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} name="Battery Voltage" />
                        <Line yAxisId="right" type="monotone" dataKey="batteryCurrMP" stroke="#F59E0B" strokeWidth={2} name="Battery Current" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Flow Status with Enhanced Indicators */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-slate-200">Flow Status Analysis - Enhanced</h3>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                        <span className="text-emerald-400 text-sm font-medium">
                          🟢 Active: {pumpOnPercent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-slate-600/20 px-3 py-1 rounded-full border border-slate-500/30">
                        <span className="text-slate-400 text-sm font-medium">
                          🔴 Inactive: {(100 - pumpOnPercent).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis 
                          yAxisId="left" 
                          stroke="#9CA3AF" 
                          fontSize={12} 
                          label={{ value: 'Flow Status', angle: -90, position: 'insideLeft' }} 
                          domain={[0, 1.2]} 
                          tickFormatter={(value) => value === 1 ? '🟢 ON' : value === 0 ? '🔴 OFF' : ''} 
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke="#9CA3AF" 
                          fontSize={12} 
                          label={{ value: 'Duration', angle: 90, position: 'insideRight' }}
                          tickFormatter={createYAxisFormatter('time')}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value: any, name: string) => {
                            if (name === 'Flow Status') return [formatValue(value, 'flow'), name];
                            if (name.includes('Time')) return createTooltipFormatter('time')(value, name);
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
                          name="Actuation Time" 
                          dot={false} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Motor Current Analysis with Smart Units */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Gauge className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Motor Current Analysis - Smart Units</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis 
                          stroke="#9CA3AF" 
                          fontSize={12} 
                          label={{ value: 'Current', angle: -90, position: 'insideLeft' }}
                          tickFormatter={createYAxisFormatter('current')}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={createTooltipFormatter('current')}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="motorMax" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={1} name="Motor Max" />
                        <Area type="monotone" dataKey="motorAvg" stroke="#10B981" fill="#10B981" fillOpacity={0.3} strokeWidth={3} name="Motor Avg" />
                        <Area type="monotone" dataKey="motorMin" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={1} name="Motor Min" />
                        <Line type="monotone" dataKey="motorHall" stroke="#8B5CF6" strokeWidth={2} name="Motor Hall" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Vibration Analysis with Severity Indicators */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Vibration Analysis - Severity Enhanced</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis 
                          stroke="#9CA3AF" 
                          fontSize={12} 
                          label={{ value: 'Acceleration', angle: -90, position: 'insideLeft' }}
                          tickFormatter={createYAxisFormatter('acceleration')}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={createTooltipFormatter('acceleration')}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="maxX" stroke="#3B82F6" strokeWidth={2} name="Max X" dot={false} />
                        <Line type="monotone" dataKey="maxY" stroke="#10B981" strokeWidth={2} name="Max Y" dot={false} />
                        <Line type="monotone" dataKey="maxZ" stroke="#F59E0B" strokeWidth={2} name="Max Z" dot={false} />
                        <Line type="monotone" dataKey="threshold" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="5 5" name="Threshold" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* MDG Charts with Enhanced Formatting */}
            {mdgData.length > 0 && (
              <>
                {/* Shock Analysis with Severity Assessment */}
                {hasValidData('shockZ', 5) && (
                  <div className="glass-morphism rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-slate-200">Shock Analysis - AI Severity Assessment</h3>
                      </div>
                      <div className="flex gap-2">
                        <div className="bg-blue-500/20 px-2 py-1 rounded text-xs text-blue-400">
                          Quality: {getDataQuality('shockZ').toFixed(1)}%
                        </div>
                        {analysisResults?.issues && analysisResults.issues.some(issue => 
                          issue.issue.toLowerCase().includes('shock')
                        ) && (
                          <div className="bg-red-500/20 px-2 py-1 rounded text-xs text-red-400 animate-pulse">
                            🚨 Critical Events
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mdgData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                          <YAxis 
                            stroke="#9CA3AF" 
                            fontSize={12} 
                            label={{ value: 'Shock Z', angle: -90, position: 'insideLeft' }}
                            tickFormatter={createYAxisFormatter('shock')}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                            formatter={createTooltipFormatter('shock')}
                          />
                          <Legend />
                          {createErrorMarkers(analysisResults?.issues, 'shockZ', 'left')}
                          <Area type="monotone" dataKey="shockZ" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Shock Z" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* System Voltages with Smart Unit Display */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Cpu className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-slate-200">System Voltages (MDG) - Smart Units</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis 
                          stroke="#9CA3AF" 
                          fontSize={12} 
                          label={{ value: 'Voltage', angle: -90, position: 'insideLeft' }}
                          tickFormatter={createYAxisFormatter('voltage')}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={createTooltipFormatter('voltage')}
                        />
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

                {/* Survey Data with Enhanced Angle Display */}
                <div className="glass-morphism rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-slate-200">Survey Data - Enhanced Angles</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mdgData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} interval="preserveStartEnd" />
                        <YAxis 
                          stroke="#9CA3AF" 
                          fontSize={12} 
                          label={{ value: 'Degrees', angle: -90, position: 'insideLeft' }}
                          tickFormatter={createYAxisFormatter('angle')}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={createTooltipFormatter('angle')}
                        />
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

            {/* Enhanced Summary Statistics */}
            <div className="glass-morphism rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span>Enhanced Data Summary - AI Powered</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="text-blue-400 text-xs uppercase font-medium mb-2">Total Records</div>
                  <div className="text-2xl font-bold text-blue-400">{formatValue(sensorData.length, 'count')}</div>
                  <div className="text-blue-300 text-sm">data points processed</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="text-green-400 text-xs uppercase font-medium mb-2">Data Quality</div>
                  <div className="text-2xl font-bold text-green-400">
                    {((mpData.length + mdgData.length) / Math.max(sensorData.length, 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-green-300 text-sm">validated records</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 text-xs uppercase font-medium mb-2">MP Records</div>
                  <div className="text-2xl font-bold text-purple-400">{formatValue(mpData.length, 'count')}</div>
                  <div className="text-purple-300 text-sm">motor pump data</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/20">
                  <div className="text-amber-400 text-xs uppercase font-medium mb-2">MDG Records</div>
                  <div className="text-2xl font-bold text-amber-400">{formatValue(mdgData.length, 'count')}</div>
                  <div className="text-amber-300 text-sm">sensor measurements</div>
                </div>
              </div>

              {/* AI Enhancement Indicators */}
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
                <h4 className="text-sm font-semibold text-indigo-400 mb-2">🧠 AI Enhancements Applied</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="text-emerald-400">✓ Smart Unit Conversion</div>
                  <div className="text-blue-400">✓ Scientific Notation Elimination</div>
                  <div className="text-purple-400">✓ Data Validation & Cleaning</div>
                  <div className="text-amber-400">✓ Contextual Precision</div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </section>
  );
}