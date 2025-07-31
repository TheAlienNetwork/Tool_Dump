import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemoryDump, AnalysisResults } from "@/lib/types";
import { Download, Wrench, AlertTriangle, AlertCircle, Info, Shield, Clock, Zap, TrendingUp, Activity, TrendingDown } from "lucide-react";
import { useMemo } from "react";

interface HealthSummaryProps {
  memoryDump: MemoryDump;
}

export default function HealthSummary({ memoryDump }: HealthSummaryProps) {
  const { data: analysisResults, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/memory-dumps', memoryDump?.id, 'analysis', memoryDump?.filename, memoryDump?.uploadedAt],
    queryFn: async () => {
      if (!memoryDump?.id) throw new Error('No memory dump selected');

      const response = await fetch(`/api/memory-dumps/${memoryDump.id}/analysis/${encodeURIComponent(memoryDump.filename)}/${encodeURIComponent(memoryDump.uploadedAt)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!memoryDump?.id && memoryDump?.status === 'completed',
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always fetch fresh data for new dumps
    gcTime: 0, // Don't cache analysis results - always fresh
  });

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/memory-dumps/${memoryDump.id}/report`);
      if (!response.ok) throw new Error('Failed to download PDF report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TheToolDump_Report_${memoryDump.filename.replace('.bin', '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF report:', error);
    }
  };

  // Enhanced AI Insights
  const aiInsights = useMemo(() => {
    if (!analysisResults?.issues) return null;

    const criticalIssues = analysisResults.issues.filter(issue => issue.severity === 'critical');
    const warningIssues = analysisResults.issues.filter(issue => issue.severity === 'warning');

    // Generate maintenance recommendations
    const recommendations = [];

    if (criticalIssues.some(issue => issue.issue.toLowerCase().includes('temperature'))) {
      recommendations.push({
        priority: 'critical',
        action: 'Immediate Temperature Inspection',
        description: 'Check cooling systems, ventilation, and thermal sensors for malfunction.',
        timeline: 'Within 24 hours'
      });
    }

    if (criticalIssues.some(issue => issue.issue.toLowerCase().includes('shock'))) {
      recommendations.push({
        priority: 'critical',
        action: 'Mechanical Integrity Check',
        description: 'Inspect mounting systems, dampeners, and structural supports.',
        timeline: 'Within 48 hours'
      });
    }

    if (warningIssues.some(issue => issue.issue.toLowerCase().includes('motor'))) {
      recommendations.push({
        priority: 'warning',
        action: 'Motor Maintenance',
        description: 'Schedule motor current analysis and bearing inspection.',
        timeline: 'Within 2 weeks'
      });
    }

    if (warningIssues.some(issue => issue.issue.toLowerCase().includes('voltage'))) {
      recommendations.push({
        priority: 'warning',
        action: 'Electrical System Review',
        description: 'Check power supply stability and electrical connections.',
        timeline: 'Within 1 week'
      });
    }

    // Calculate system health score
    const totalIssues = analysisResults.issues.length;
    const criticalWeight = criticalIssues.length * 3;
    const warningWeight = warningIssues.length * 1;
    const healthScore = Math.max(0, 100 - (criticalWeight + warningWeight) * 5);

    return {
      recommendations,
      healthScore,
      riskLevel: healthScore > 80 ? 'low' : healthScore > 60 ? 'medium' : 'high',
      predictiveInsights: {
        nextMaintenanceWindow: healthScore > 80 ? '3-6 months' : healthScore > 60 ? '1-3 months' : 'Immediate',
        reliabilityTrend: criticalIssues.length > 0 ? 'decreasing' : warningIssues.length > 2 ? 'stable' : 'increasing'
      }
    };
  }, [analysisResults]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-50" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-30" />;
      default:
        return <Info className="w-4 h-4 text-ibm-blue" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-50 bg-red-50/10';
      case 'warning':
        return 'border-yellow-30 bg-yellow-30/10';
      default:
        return 'border-ibm-blue bg-ibm-blue/10';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-lg shadow-red-500/30 text-xs font-bold px-3 py-1">CRITICAL</Badge>;
      case 'warning':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/30 text-xs font-bold px-3 py-1">WARNING</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg shadow-blue-500/30 text-xs font-bold px-3 py-1">INFO</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-50';
      case 'warning':
        return 'text-yellow-30';
      case 'critical':
        return 'text-red-50';
      default:
        return 'text-gray-40';
    }
  };

  if (analysisLoading) {
    return (
      <Card className="bg-gray-90 border-gray-80">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-80 rounded w-1/4"></div>
            <div className="h-8 bg-gray-80 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-80 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisResults) {
    return (
      <Card className="bg-gray-90 border-gray-80">
        <CardContent className="p-6">
          <p className="text-gray-40">Analysis results not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-8">
      <div className="gradient-border">
        <Card className="bg-dark-800/50 backdrop-blur-xl border-0 overflow-hidden">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm border border-blue-500/30">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                    Advanced AI Health Analysis
                  </CardTitle>
                  <p className="text-slate-400 text-sm mt-1">AI-Powered Binary Memory Dump Analysis with Predictive Insights</p>
                </div>
              </div>
              <Button 
                onClick={handleDownloadReport}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Modern Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Overall Status */}
              <div className="glass-morphism rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-400/20 rounded-lg">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    analysisResults.overallStatus === 'operational' ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' :
                    analysisResults.overallStatus === 'warning' ? 'bg-amber-400 shadow-lg shadow-amber-500/50' : 'bg-rose-400 shadow-lg shadow-rose-500/50'
                  }`}></div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">System Status</p>
                  <p className={`text-xl font-bold capitalize mt-1 ${
                    analysisResults.overallStatus === 'operational' ? 'text-emerald-400' :
                    analysisResults.overallStatus === 'warning' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {analysisResults.overallStatus}
                  </p>
                </div>
              </div>

              {/* Critical Issues */}
              <div className="glass-morphism rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gradient-to-br from-rose-500/20 to-red-400/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="w-3 h-3 bg-rose-400 rounded-full shadow-lg shadow-rose-500/50"></div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Critical Issues</p>
                  <p className="text-xl font-bold text-rose-400 mt-1">{analysisResults.criticalIssues}</p>
                </div>
              </div>

              {/* Warnings */}
              <div className="glass-morphism rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gradient-to-br from-amber-500/20 to-yellow-400/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-500/50"></div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Warnings</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">{analysisResults.warnings}</p>
                </div>
              </div>

              {/* Analysis Time */}
              <div className="glass-morphism rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50"></div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Analysis Time</p>
                  <p className="text-sm font-semibold text-slate-300 mt-1">
                    {new Date(analysisResults.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Issues List */}
            {analysisResults.issues.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Detected Issues
                </h3>

                {analysisResults.issues.map((issue, index) => {
                  // Enhanced temperature formatting to handle extreme values
                  const formatTemperature = (tempStr: string) => {
                    const tempMatch = tempStr.match(/([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)°F/);
                    if (tempMatch) {
                      const temp = parseFloat(tempMatch[1]);
                      if (Math.abs(temp) > 1e10) {
                        return tempStr.replace(tempMatch[0], "Invalid sensor reading");
                      }
                      return tempStr.replace(tempMatch[0], `${temp.toFixed(1)}°F`);
                    }
                    return tempStr;
                  };

                  const formattedIssue = formatTemperature(issue.issue);

                  return (
                    <div key={index} className="glass-morphism rounded-xl p-6 hover:bg-white/10 transition-all duration-300 border border-slate-700/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-700/30 to-slate-800/30">
                              {getSeverityIcon(issue.severity)}
                            </div>
                            <div className="flex-1">
                              <span className="text-lg font-semibold text-slate-100 block mb-2">{formattedIssue}</span>
                              {getSeverityBadge(issue.severity)}
                            </div>
                          </div>
                          <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
                            <p className="text-slate-300 leading-relaxed">{issue.explanation}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="bg-gradient-to-r from-slate-700/20 to-slate-800/20 px-4 py-2 rounded-lg border border-slate-600/20">
                              <div className="text-slate-400 text-xs uppercase font-medium">Occurrences</div>
                              <div className="text-slate-200 font-bold text-lg">{issue.count.toLocaleString()}</div>
                            </div>
                            {issue.firstTime && (
                              <div className="bg-gradient-to-r from-blue-700/20 to-blue-800/20 px-4 py-2 rounded-lg border border-blue-600/20">
                                <div className="text-blue-400 text-xs uppercase font-medium">First Occurrence</div>
                                <div className="text-slate-200 font-medium">{new Date(issue.firstTime).toLocaleTimeString()}</div>
                              </div>
                            )}
                            {issue.lastTime && (
                              <div className="bg-gradient-to-r from-purple-700/20 to-purple-800/20 px-4 py-2 rounded-lg border border-purple-600/20">
                                <div className="text-purple-400 text-xs uppercase font-medium">Last Occurrence</div>
                                <div className="text-slate-200 font-medium">{new Date(issue.lastTime).toLocaleTimeString()}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-morphism rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500/20 to-green-400/20 rounded-2xl flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">All Systems Operational</h3>
                <p className="text-slate-400">No issues detected in this memory dump analysis.</p>
              </div>
            )}

            {/* AI Analysis Results */}
            {analysisResults && (
              <div className="space-y-6">
                {/* Overall Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      analysisResults.overallStatus === 'operational' ? 'bg-green-500/20' :
                      analysisResults.overallStatus === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}>
                      {analysisResults.overallStatus === 'operational' ? (
                        <Shield className="w-6 h-6 text-green-400" />
                      ) : analysisResults.overallStatus === 'warning' ? (
                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-200">
                        System Status: <span className={`${
                          analysisResults.overallStatus === 'operational' ? 'text-green-400' :
                          analysisResults.overallStatus === 'warning' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {analysisResults.overallStatus.charAt(0).toUpperCase() + analysisResults.overallStatus.slice(1)}
                        </span>
                      </h3>
                      <p className="text-slate-400 text-sm">AI analysis completed at {new Date(analysisResults.generatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <Button onClick={handleDownloadReport} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                </div>

                {/* Enhanced AI Insights Dashboard */}
                {aiInsights && (
                  <div className="glass-morphism rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center">
                      <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                      AI-Powered Predictive Insights
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* System Health Score */}
                      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                        <div className="text-blue-400 text-xs uppercase font-medium mb-2">System Health Score</div>
                        <div className="text-3xl font-bold text-blue-400 mb-2">{aiInsights.healthScore}/100</div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${
                              aiInsights.healthScore > 80 ? 'bg-green-500' :
                              aiInsights.healthScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${aiInsights.healthScore}%` }}
                          ></div>
                        </div>
                        <div className={`text-sm ${
                          aiInsights.riskLevel === 'low' ? 'text-green-300' :
                          aiInsights.riskLevel === 'medium' ? 'text-yellow-300' : 'text-red-300'
                        }`}>
                          {aiInsights.riskLevel.toUpperCase()} Risk Level
                        </div>
                      </div>

                      {/* Maintenance Prediction */}
                      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
                        <div className="text-purple-400 text-xs uppercase font-medium mb-2">Next Maintenance</div>
                        <div className="text-2xl font-bold text-purple-400 mb-2">
                          {aiInsights.predictiveInsights.nextMaintenanceWindow}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-purple-300" />
                          <div className="text-purple-300 text-sm">Predicted window</div>
                        </div>
                      </div>

                      {/* Reliability Trend */}
                      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                        <div className="text-green-400 text-xs uppercase font-medium mb-2">Reliability Trend</div>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="text-2xl font-bold text-green-400">
                            {aiInsights.predictiveInsights.reliabilityTrend.charAt(0).toUpperCase() + 
                             aiInsights.predictiveInsights.reliabilityTrend.slice(1)}
                          </div>
                          {aiInsights.predictiveInsights.reliabilityTrend === 'increasing' ? (
                            <TrendingUp className="w-6 h-6 text-green-400" />
                          ) : aiInsights.predictiveInsights.reliabilityTrend === 'stable' ? (
                            <Activity className="w-6 h-6 text-yellow-400" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-400" />
                          )}
                        </div>
                        <div className="text-green-300 text-sm">AI trend analysis</div>
                      </div>
                    </div>

                    {/* Maintenance Recommendations */}
                    {aiInsights.recommendations.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-slate-200 mb-4">
                          AI-Generated Maintenance Recommendations
                        </h4>
                        <div className="space-y-3">
                          {aiInsights.recommendations.map((rec, index) => (
                            <div key={index} className={`p-4 rounded-lg border ${
                              rec.priority === 'critical' 
                                ? 'bg-red-500/10 border-red-500/30' 
                                : 'bg-yellow-500/10 border-yellow-500/30'
                            }`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Wrench className={`w-4 h-4 ${
                                      rec.priority === 'critical' ? 'text-red-400' : 'text-yellow-400'
                                    }`} />
                                    <h5 className={`font-medium ${
                                      rec.priority === 'critical' ? 'text-red-400' : 'text-yellow-400'
                                    }`}>
                                      {rec.action}
                                    </h5>
                                  </div>
                                  <p className="text-slate-300 text-sm mb-2">{rec.description}</p>
                                  <div className="text-xs text-slate-400">Timeline: {rec.timeline}</div>
                                </div>
                                <Badge className={`${
                                  rec.priority === 'critical' 
                                    ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                }`}>
                                  {rec.priority.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}