import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemoryDump, AnalysisResults } from "@/lib/types";
import { Download, Wrench, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface HealthSummaryProps {
  memoryDump: MemoryDump;
}

export default function HealthSummary({ memoryDump }: HealthSummaryProps) {
  const { data: analysisResults, isLoading } = useQuery<AnalysisResults>({
    queryKey: ['/api/memory-dumps', memoryDump.id, 'analysis'],
    enabled: memoryDump.status === 'completed',
  });

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/memory-dumps/${memoryDump.id}/report`);
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NeuralDrill_Report_${memoryDump.filename.replace('.bin', '')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

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
        return <Badge className="bg-red-50 text-white text-xs">CRITICAL</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-30 text-gray-100 text-xs">WARNING</Badge>;
      default:
        return <Badge className="bg-ibm-blue text-white text-xs">INFO</Badge>;
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

  if (isLoading) {
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
    <section>
      <Card className="bg-gray-90 border-gray-80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-10 flex items-center">
              <Wrench className="w-6 h-6 mr-2 text-green-50" />
              Tool Health Check Summary
            </CardTitle>
            <Button 
              onClick={handleDownloadReport}
              className="bg-ibm-blue hover:bg-blue-600 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate PDF Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Health Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Status */}
            <div className="bg-gray-80 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-40 uppercase tracking-wide">Overall Status</p>
                  <p className={`text-lg font-semibold capitalize ${getStatusColor(analysisResults.overallStatus)}`}>
                    {analysisResults.overallStatus}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  analysisResults.overallStatus === 'operational' ? 'bg-green-50' :
                  analysisResults.overallStatus === 'warning' ? 'bg-yellow-30' : 'bg-red-50'
                }`}></div>
              </div>
            </div>

            {/* Critical Issues */}
            <div className="bg-gray-80 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-40 uppercase tracking-wide">Critical Issues</p>
                  <p className="text-lg font-semibold text-red-50">{analysisResults.criticalIssues}</p>
                </div>
                <div className="w-3 h-3 bg-red-50 rounded-full"></div>
              </div>
            </div>

            {/* Warnings */}
            <div className="bg-gray-80 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-40 uppercase tracking-wide">Warnings</p>
                  <p className="text-lg font-semibold text-yellow-30">{analysisResults.warnings}</p>
                </div>
                <div className="w-3 h-3 bg-yellow-30 rounded-full"></div>
              </div>
            </div>

            {/* Last Update */}
            <div className="bg-gray-80 rounded-lg p-4">
              <div>
                <p className="text-xs text-gray-40 uppercase tracking-wide">Last Update</p>
                <p className="text-sm font-medium text-gray-10">
                  {new Date(analysisResults.generatedAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-50">{memoryDump.fileType} Dump Processed</p>
              </div>
            </div>
          </div>

          {/* Issues List */}
          {analysisResults.issues.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-10 uppercase tracking-wide">
                Detected Issues
              </h3>
              
              {analysisResults.issues.map((issue, index) => (
                <div key={index} className={`bg-gray-80 rounded-lg p-4 border-l-4 ${getSeverityColor(issue.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getSeverityBadge(issue.severity)}
                        <span className="text-sm font-medium text-gray-10">{issue.issue}</span>
                      </div>
                      <p className="text-sm text-gray-30 mb-2">{issue.explanation}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-40">
                        <span>Occurrences: {issue.count}</span>
                        {issue.firstTime && <span>First: {new Date(issue.firstTime).toLocaleTimeString()}</span>}
                        {issue.lastTime && <span>Last: {new Date(issue.lastTime).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                    {getSeverityIcon(issue.severity)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-80 rounded-lg p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-green-50/20 rounded-full flex items-center justify-center mb-3">
                <Wrench className="w-6 h-6 text-green-50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-10 mb-2">All Systems Operational</h3>
              <p className="text-gray-40">No issues detected in this memory dump analysis.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
