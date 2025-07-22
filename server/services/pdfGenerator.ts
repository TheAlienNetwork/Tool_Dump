import { SensorData } from '@shared/schema';
import { Issue } from './analysisEngine';

export interface ReportData {
  filename: string;
  processedAt: Date;
  overallStatus: string;
  criticalIssues: number;
  warnings: number;
  issues: Issue[];
  sensorData: SensorData[];
}

export class PDFGenerator {
  static async generateReport(reportData: ReportData): Promise<Buffer> {
    // For this implementation, we'll create a simple text-based report
    // In a production environment, you'd use a proper PDF library like PDFKit or Puppeteer
    
    const report = this.generateTextReport(reportData);
    return Buffer.from(report, 'utf-8');
  }

  private static generateTextReport(data: ReportData): string {
    const lines: string[] = [];
    
    lines.push('NEURAL DRILL BINARY DUMP REPORT');
    lines.push('=' .repeat(50));
    lines.push('');
    lines.push(`File: ${data.filename}`);
    lines.push(`Generated: ${data.processedAt.toISOString()}`);
    lines.push(`Overall Status: ${data.overallStatus.toUpperCase()}`);
    lines.push(`Critical Issues: ${data.criticalIssues}`);
    lines.push(`Warnings: ${data.warnings}`);
    lines.push('');
    
    if (data.issues.length > 0) {
      lines.push('DETECTED ISSUES:');
      lines.push('-'.repeat(30));
      
      data.issues.forEach((issue, index) => {
        lines.push(`${index + 1}. ${issue.issue}`);
        lines.push(`   Severity: ${issue.severity.toUpperCase()}`);
        lines.push(`   Explanation: ${issue.explanation}`);
        lines.push(`   Count: ${issue.count}`);
        if (issue.firstTime && issue.lastTime) {
          lines.push(`   First occurrence: ${issue.firstTime.toISOString()}`);
          lines.push(`   Last occurrence: ${issue.lastTime.toISOString()}`);
        }
        lines.push('');
      });
    } else {
      lines.push('No issues detected in this memory dump.');
      lines.push('');
    }
    
    // Summary statistics
    if (data.sensorData.length > 0) {
      lines.push('DATA SUMMARY:');
      lines.push('-'.repeat(30));
      
      const tempData = data.sensorData.filter(d => d.tempMP !== null).map(d => d.tempMP!);
      const voltageData = data.sensorData.filter(d => d.batteryVoltMP !== null).map(d => d.batteryVoltMP!);
      const shockData = data.sensorData.filter(d => d.shockZ !== null).map(d => d.shockZ!);
      
      if (tempData.length > 0) {
        lines.push(`Temperature: ${Math.min(...tempData).toFixed(1)}°F - ${Math.max(...tempData).toFixed(1)}°F (avg: ${(tempData.reduce((a, b) => a + b) / tempData.length).toFixed(1)}°F)`);
      }
      
      if (voltageData.length > 0) {
        lines.push(`Battery Voltage: ${Math.min(...voltageData).toFixed(2)}V - ${Math.max(...voltageData).toFixed(2)}V (avg: ${(voltageData.reduce((a, b) => a + b) / voltageData.length).toFixed(2)}V)`);
      }
      
      if (shockData.length > 0) {
        lines.push(`Shock Levels: ${Math.min(...shockData).toFixed(1)}g - ${Math.max(...shockData).toFixed(1)}g (avg: ${(shockData.reduce((a, b) => a + b) / shockData.length).toFixed(1)}g)`);
      }
      
      lines.push(`Total data points: ${data.sensorData.length}`);
    }
    
    return lines.join('\n');
  }

  static getReportMimeType(): string {
    return 'text/plain'; // For simplified implementation
  }

  static getReportExtension(): string {
    return 'txt'; // For simplified implementation
  }
}
