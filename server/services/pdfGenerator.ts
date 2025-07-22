
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
  deviceReport?: {
    mpSerialNumber?: string;
    mpFirmwareVersion?: string;
    mpMaxTempFahrenheit?: number;
    mpMaxTempCelsius?: number;
    circulationHours?: number;
    numberOfPulses?: number;
    motorOnTimeMinutes?: number;
    commErrorsTimeMinutes?: number;
    commErrorsPercent?: number;
    hallStatusTimeMinutes?: number;
    hallStatusPercent?: number;
    mdgSerialNumber?: string;
    mdgFirmwareVersion?: string;
    mdgMaxTempFahrenheit?: number;
    mdgMaxTempCelsius?: number;
    mdgEdtTotalHours?: number;
    mdgExtremeShockIndex?: number;
  };
}

export class PDFGenerator {
  static async generateReport(reportData: ReportData): Promise<Buffer> {
    const report = this.generateFormattedReport(reportData);
    return Buffer.from(report, 'utf-8');
  }

  private static generateFormattedReport(data: ReportData): string {
    const lines: string[] = [];
    
    // Header
    lines.push('═'.repeat(80));
    lines.push('                    NEURAL DRILL BINARY DUMP REPORT');
    lines.push('                         Advanced Analytics Report');
    lines.push('═'.repeat(80));
    lines.push('');
    
    // Executive Summary
    lines.push('📋 EXECUTIVE SUMMARY');
    lines.push('─'.repeat(50));
    lines.push(`📄 File Name: ${data.filename}`);
    lines.push(`📅 Generated: ${data.processedAt.toLocaleString()}`);
    lines.push(`🔍 Overall Status: ${data.overallStatus.toUpperCase()}`);
    lines.push(`⚠️  Critical Issues: ${data.criticalIssues}`);
    lines.push(`⚡ Warnings: ${data.warnings}`);
    lines.push(`📊 Total Data Points: ${data.sensorData.length}`);
    lines.push('');
    
    // Device Information
    if (data.deviceReport) {
      lines.push('🔧 DEVICE INFORMATION');
      lines.push('─'.repeat(50));
      
      // MP Device
      if (data.deviceReport.mpSerialNumber || data.deviceReport.mpFirmwareVersion) {
        lines.push('');
        lines.push('💻 MP Device:');
        if (data.deviceReport.mpSerialNumber) {
          lines.push(`   • Serial Number: ${data.deviceReport.mpSerialNumber}`);
        }
        if (data.deviceReport.mpFirmwareVersion) {
          lines.push(`   • Firmware Version: ${data.deviceReport.mpFirmwareVersion}`);
        }
        if (data.deviceReport.mpMaxTempFahrenheit) {
          lines.push(`   • Maximum Temperature: ${data.deviceReport.mpMaxTempFahrenheit.toFixed(1)}°F (${data.deviceReport.mpMaxTempCelsius?.toFixed(1)}°C)`);
        }
        if (data.deviceReport.circulationHours) {
          lines.push(`   • Circulation Hours: ${data.deviceReport.circulationHours.toFixed(1)} hrs`);
        }
        if (data.deviceReport.numberOfPulses) {
          lines.push(`   • Number of Pulses: ${data.deviceReport.numberOfPulses.toLocaleString()}`);
        }
        if (data.deviceReport.motorOnTimeMinutes) {
          lines.push(`   • Motor On Time: ${data.deviceReport.motorOnTimeMinutes.toFixed(1)} min`);
        }
      }
      
      // MDG Device
      if (data.deviceReport.mdgSerialNumber || data.deviceReport.mdgFirmwareVersion) {
        lines.push('');
        lines.push('🎛️  MDG Device:');
        if (data.deviceReport.mdgSerialNumber) {
          lines.push(`   • Serial Number: ${data.deviceReport.mdgSerialNumber}`);
        }
        if (data.deviceReport.mdgFirmwareVersion) {
          lines.push(`   • Firmware Version: ${data.deviceReport.mdgFirmwareVersion}`);
        }
        if (data.deviceReport.mdgMaxTempFahrenheit) {
          lines.push(`   • Maximum Temperature: ${data.deviceReport.mdgMaxTempFahrenheit.toFixed(1)}°F (${data.deviceReport.mdgMaxTempCelsius?.toFixed(1)}°C)`);
        }
        if (data.deviceReport.mdgEdtTotalHours) {
          lines.push(`   • EDT Total Hours: ${data.deviceReport.mdgEdtTotalHours.toFixed(1)} hrs`);
        }
        if (data.deviceReport.mdgExtremeShockIndex) {
          lines.push(`   • Extreme Shock Index: ${data.deviceReport.mdgExtremeShockIndex.toFixed(1)}`);
        }
      }
      lines.push('');
    }
    
    // Issues Analysis
    if (data.issues.length > 0) {
      lines.push('🚨 DETECTED ISSUES & ANALYSIS');
      lines.push('─'.repeat(50));
      
      data.issues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'critical' ? '🔴' : 
                            issue.severity === 'warning' ? '🟡' : '🔵';
        
        lines.push('');
        lines.push(`${severityIcon} Issue #${index + 1}: ${issue.issue}`);
        lines.push(`   Severity: ${issue.severity.toUpperCase()}`);
        lines.push(`   Occurrences: ${issue.count}`);
        lines.push(`   Analysis: ${issue.explanation}`);
        
        if (issue.firstTime && issue.lastTime) {
          lines.push(`   First Detected: ${issue.firstTime.toLocaleString()}`);
          lines.push(`   Last Detected: ${issue.lastTime.toLocaleString()}`);
        }
        lines.push('   ' + '─'.repeat(40));
      });
    } else {
      lines.push('✅ SYSTEM STATUS: OPTIMAL');
      lines.push('─'.repeat(50));
      lines.push('No critical issues or warnings detected in this memory dump.');
      lines.push('All parameters are within normal operating ranges.');
      lines.push('');
    }
    
    // Data Analytics Summary
    if (data.sensorData.length > 0) {
      lines.push('');
      lines.push('📊 SENSOR DATA ANALYTICS');
      lines.push('─'.repeat(50));
      
      const tempData = data.sensorData.filter(d => d.tempMP !== null).map(d => d.tempMP!);
      const voltageData = data.sensorData.filter(d => d.batteryVoltMP !== null).map(d => d.batteryVoltMP!);
      const shockData = data.sensorData.filter(d => d.shockZ !== null).map(d => d.shockZ!);
      const motorData = data.sensorData.filter(d => d.motorAvg !== null).map(d => d.motorAvg!);
      const gammaData = data.sensorData.filter(d => d.gamma !== null).map(d => d.gamma!);
      
      if (tempData.length > 0) {
        const avgTemp = tempData.reduce((a, b) => a + b) / tempData.length;
        const maxTemp = Math.max(...tempData);
        const minTemp = Math.min(...tempData);
        lines.push('');
        lines.push('🌡️  Temperature Analysis:');
        lines.push(`   • Range: ${minTemp.toFixed(1)}°F - ${maxTemp.toFixed(1)}°F`);
        lines.push(`   • Average: ${avgTemp.toFixed(1)}°F`);
        lines.push(`   • Status: ${maxTemp > 130 ? '🔴 CRITICAL' : maxTemp > 100 ? '🟡 WARNING' : '✅ NORMAL'}`);
      }
      
      if (voltageData.length > 0) {
        const avgVoltage = voltageData.reduce((a, b) => a + b) / voltageData.length;
        const maxVoltage = Math.max(...voltageData);
        const minVoltage = Math.min(...voltageData);
        lines.push('');
        lines.push('🔋 Battery Voltage Analysis:');
        lines.push(`   • Range: ${minVoltage.toFixed(2)}V - ${maxVoltage.toFixed(2)}V`);
        lines.push(`   • Average: ${avgVoltage.toFixed(2)}V`);
        lines.push(`   • Status: ${minVoltage < 11.5 ? '🔴 LOW' : maxVoltage > 15.5 ? '🟡 HIGH' : '✅ NORMAL'}`);
      }
      
      if (shockData.length > 0) {
        const avgShock = shockData.reduce((a, b) => a + b) / shockData.length;
        const maxShock = Math.max(...shockData);
        lines.push('');
        lines.push('💥 Shock Level Analysis:');
        lines.push(`   • Maximum: ${maxShock.toFixed(1)}g`);
        lines.push(`   • Average: ${avgShock.toFixed(1)}g`);
        lines.push(`   • Status: ${maxShock > 6.0 ? '🔴 EXCEEDED THRESHOLD' : '✅ WITHIN LIMITS'}`);
      }
      
      if (motorData.length > 0) {
        const avgMotor = motorData.reduce((a, b) => a + b) / motorData.length;
        const maxMotor = Math.max(...motorData);
        lines.push('');
        lines.push('⚙️  Motor Current Analysis:');
        lines.push(`   • Maximum: ${maxMotor.toFixed(2)}A`);
        lines.push(`   • Average: ${avgMotor.toFixed(2)}A`);
        lines.push(`   • Status: ${maxMotor > 2.0 ? '🔴 OVERCURRENT' : '✅ NORMAL'}`);
      }
      
      if (gammaData.length > 0) {
        const avgGamma = gammaData.reduce((a, b) => a + b) / gammaData.length;
        const maxGamma = Math.max(...gammaData);
        const minGamma = Math.min(...gammaData);
        lines.push('');
        lines.push('☢️  Gamma Radiation Analysis:');
        lines.push(`   • Range: ${minGamma.toFixed(1)} - ${maxGamma.toFixed(1)} counts`);
        lines.push(`   • Average: ${avgGamma.toFixed(1)} counts`);
        lines.push(`   • Status: ${minGamma < 15 || maxGamma > 45 ? '🟡 OUT OF RANGE' : '✅ NORMAL'}`);
      }
    }
    
    // Recommendations
    lines.push('');
    lines.push('💡 RECOMMENDATIONS');
    lines.push('─'.repeat(50));
    
    if (data.criticalIssues > 0) {
      lines.push('🔴 IMMEDIATE ACTION REQUIRED:');
      lines.push('   • Review all critical issues listed above');
      lines.push('   • Consider halting operations until issues are resolved');
      lines.push('   • Contact technical support for assistance');
    } else if (data.warnings > 0) {
      lines.push('🟡 PREVENTIVE MAINTENANCE RECOMMENDED:');
      lines.push('   • Monitor warning conditions closely');
      lines.push('   • Schedule maintenance at next opportunity');
      lines.push('   • Review operational parameters');
    } else {
      lines.push('✅ SYSTEM OPERATING OPTIMALLY:');
      lines.push('   • Continue normal operations');
      lines.push('   • Maintain regular monitoring schedule');
      lines.push('   • Archive this report for historical analysis');
    }
    
    // Footer
    lines.push('');
    lines.push('═'.repeat(80));
    lines.push(`Report generated by Neural Drill Analytics System v2.0`);
    lines.push(`© ${new Date().getFullYear()} Advanced Drilling Analytics Platform`);
    lines.push('═'.repeat(80));
    
    return lines.join('\n');
  }

  static getReportMimeType(): string {
    return 'application/pdf';
  }

  static getReportExtension(): string {
    return 'pdf';
  }
}
