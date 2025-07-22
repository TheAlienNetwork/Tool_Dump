
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
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    
    // Set up fonts and colors
    pdf.setFont('helvetica');
    
    // Header with logo space
    pdf.setFontSize(24);
    pdf.setTextColor(41, 128, 185); // Blue color
    pdf.text('The Tool Dump', 105, 30, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Advanced Binary Dump Analysis Report', 105, 40, { align: 'center' });
    
    // Line separator
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(41, 128, 185);
    pdf.line(20, 45, 190, 45);
    
    let yPos = 60;
    
    // Executive Summary
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Executive Summary', 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.text(`File Name: ${reportData.filename}`, 20, yPos);
    yPos += 7;
    pdf.text(`Generated: ${reportData.processedAt.toLocaleString()}`, 20, yPos);
    yPos += 7;
    pdf.text(`Overall Status: ${reportData.overallStatus.toUpperCase()}`, 20, yPos);
    yPos += 7;
    pdf.text(`Critical Issues: ${reportData.criticalIssues}`, 20, yPos);
    yPos += 7;
    pdf.text(`Warnings: ${reportData.warnings}`, 20, yPos);
    yPos += 7;
    pdf.text(`Total Data Points: ${reportData.sensorData.length}`, 20, yPos);
    yPos += 15;
    
    // Device Information
    if (reportData.deviceReport) {
      pdf.setFontSize(16);
      pdf.text('Device Information', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      
      // MP Device (Enhanced User-Friendly Format)
      if (reportData.deviceReport.mpSerialNumber || reportData.deviceReport.mpFirmwareVersion) {
        pdf.setFontSize(13);
        pdf.setTextColor(34, 139, 34); // Green for MP
        pdf.text('Memory Pump (MP) Device:', 20, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        if (reportData.deviceReport.mpSerialNumber) {
          pdf.text(`• Serial Number: MP S/N ${reportData.deviceReport.mpSerialNumber}`, 25, yPos);
          yPos += 6;
        }
        if (reportData.deviceReport.mpFirmwareVersion) {
          pdf.text(`• Firmware Version: ${reportData.deviceReport.mpFirmwareVersion}`, 25, yPos);
          yPos += 6;
        }
        if (reportData.deviceReport.mpMaxTempFahrenheit) {
          const tempStatus = (reportData.deviceReport.mpMaxTempFahrenheit > 130) ? ' (⚠ High Temp)' : ' (✓ Normal)';
          pdf.text(`• Peak Operating Temperature: ${reportData.deviceReport.mpMaxTempCelsius?.toFixed(1)}°C (${reportData.deviceReport.mpMaxTempFahrenheit?.toFixed(1)}°F)${tempStatus}`, 25, yPos);
          yPos += 6;
        }
        
        // Additional MP metrics
        if (reportData.deviceReport.motorOnTimeMinutes !== undefined) {
          const hours = Math.floor(reportData.deviceReport.motorOnTimeMinutes / 60);
          const mins = Math.round(reportData.deviceReport.motorOnTimeMinutes % 60);
          pdf.text(`• Motor Operation: ${hours}h ${mins}m total runtime`, 25, yPos);
          yPos += 6;
        }
        
        if (reportData.deviceReport.commErrorsPercent !== undefined) {
          const healthPercent = (100 - reportData.deviceReport.commErrorsPercent).toFixed(1);
          const status = (reportData.deviceReport.commErrorsPercent < 5) ? ' (✓ Excellent)' : ' (⚠ Check Connection)';
          pdf.text(`• Communication Health: ${healthPercent}%${status}`, 25, yPos);
          yPos += 6;
        }
        
        yPos += 8;
      }
      
      // MDG Device (Enhanced User-Friendly Format)
      if (reportData.deviceReport.mdgSerialNumber || reportData.deviceReport.mdgFirmwareVersion) {
        pdf.setFontSize(13);
        pdf.setTextColor(255, 140, 0); // Orange for MDG
        pdf.text('Measurement During Drilling (MDG) Device:', 20, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        if (reportData.deviceReport.mdgSerialNumber) {
          pdf.text(`• Serial Number: MDG S/N ${reportData.deviceReport.mdgSerialNumber}`, 25, yPos);
          yPos += 6;
        }
        if (reportData.deviceReport.mdgFirmwareVersion) {
          pdf.text(`• Firmware Version: ${reportData.deviceReport.mdgFirmwareVersion}`, 25, yPos);
          yPos += 6;
        }
        if (reportData.deviceReport.mdgMaxTempFahrenheit) {
          const tempStatus = (reportData.deviceReport.mdgMaxTempFahrenheit > 130) ? ' (⚠ High Temp)' : ' (✓ Normal)';
          pdf.text(`• Peak Operating Temperature: ${reportData.deviceReport.mdgMaxTempCelsius?.toFixed(1)}°C (${reportData.deviceReport.mdgMaxTempFahrenheit?.toFixed(1)}°F)${tempStatus}`, 25, yPos);
          yPos += 6;
        }
        
        // Additional MDG metrics
        if (reportData.deviceReport.mdgEdtTotalHours !== undefined) {
          const days = Math.floor(reportData.deviceReport.mdgEdtTotalHours / 24);
          const hours = Math.round(reportData.deviceReport.mdgEdtTotalHours % 24);
          pdf.text(`• Total Operational Time: ${days} days, ${hours} hours`, 25, yPos);
          yPos += 6;
        }
        
        if (reportData.deviceReport.mdgExtremeShockIndex !== undefined) {
          let shockLevel = 'Normal Operation';
          let status = ' (✓ Good)';
          if (reportData.deviceReport.mdgExtremeShockIndex > 100) {
            shockLevel = 'High Vibration Environment';
            status = ' (⚠ Monitor)';
          }
          if (reportData.deviceReport.mdgExtremeShockIndex > 500) {
            shockLevel = 'Extreme Shock Environment';
            status = ' (⚠ Critical)';
          }
          pdf.text(`• Shock Environment: ${shockLevel}${status}`, 25, yPos);
          yPos += 6;
        }
        
        yPos += 8;
      }
      
      // Operation Summary (Enhanced)
      if (reportData.deviceReport.circulationHours !== undefined || reportData.deviceReport.numberOfPulses !== undefined) {
        pdf.setFontSize(13);
        pdf.setTextColor(70, 130, 180); // Steel blue for summary
        pdf.text('Operation Summary:', 20, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        if (reportData.deviceReport.circulationHours !== undefined) {
          const days = Math.floor(reportData.deviceReport.circulationHours / 24);
          const hours = Math.round(reportData.deviceReport.circulationHours % 24);
          pdf.text(`• Total Circulation Time: ${days} days, ${hours} hours (${reportData.deviceReport.circulationHours.toFixed(2)}h)`, 25, yPos);
          yPos += 6;
        }
        
        if (reportData.deviceReport.numberOfPulses !== undefined) {
          pdf.text(`• Operational Cycles: ${reportData.deviceReport.numberOfPulses.toLocaleString()} pulses recorded`, 25, yPos);
          yPos += 6;
        }
        
        yPos += 8;
      }
    }
    
    // Issues Analysis
    if (reportData.issues && reportData.issues.length > 0) {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(16);
      pdf.text('Issues Analysis', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      for (const issue of reportData.issues.slice(0, 10)) { // Limit to first 10 issues
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setTextColor(issue.severity === 'critical' ? 220 : 255, issue.severity === 'critical' ? 53 : 193, issue.severity === 'critical' ? 69 : 7);
        pdf.text(`${issue.severity.toUpperCase()}: ${issue.issue}`, 20, yPos);
        yPos += 7;
        
        if (issue.explanation) {
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Explanation: ${issue.explanation}`, 25, yPos);
          yPos += 7;
        }
        yPos += 3;
      }
    }
    
    // Comprehensive Sensor Data Analysis
    if (reportData.sensorData && reportData.sensorData.length > 0) {
      if (yPos > 200) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Comprehensive Sensor Analysis', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      
      // Temperature analysis
      const temps = reportData.sensorData
        .map(d => d.tempMP)
        .filter(t => t !== null && t !== undefined) as number[];
      
      if (temps.length > 0) {
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        
        pdf.text(`Temperature Analysis (${temps.length} readings):`, 20, yPos);
        yPos += 7;
        pdf.text(`  Average: ${avgTemp.toFixed(1)}°F`, 25, yPos);
        yPos += 6;
        pdf.text(`  Maximum: ${maxTemp.toFixed(1)}°F`, 25, yPos);
        yPos += 6;
        pdf.text(`  Minimum: ${minTemp.toFixed(1)}°F`, 25, yPos);
        yPos += 10;
      }

      // Battery voltage analysis
      const voltages = reportData.sensorData
        .map(d => d.batteryVoltMP)
        .filter(v => v !== null && v !== undefined) as number[];
      
      if (voltages.length > 0) {
        const avgVoltage = voltages.reduce((a, b) => a + b, 0) / voltages.length;
        const minVoltage = Math.min(...voltages);
        
        pdf.text(`Battery Analysis (${voltages.length} readings):`, 20, yPos);
        yPos += 7;
        pdf.text(`  Average Voltage: ${avgVoltage.toFixed(2)}V`, 25, yPos);
        yPos += 6;
        pdf.text(`  Minimum Voltage: ${minVoltage.toFixed(2)}V`, 25, yPos);
        yPos += 10;
      }

      // Shock analysis for MDG data
      const shocks = reportData.sensorData
        .map(d => d.shockZ)
        .filter(s => s !== null && s !== undefined) as number[];
      
      if (shocks.length > 0) {
        const avgShock = shocks.reduce((a, b) => a + b, 0) / shocks.length;
        const maxShock = Math.max(...shocks);
        
        pdf.text(`Shock Analysis (${shocks.length} readings):`, 20, yPos);
        yPos += 7;
        pdf.text(`  Average Shock: ${avgShock.toFixed(2)}g`, 25, yPos);
        yPos += 6;
        pdf.text(`  Maximum Shock: ${maxShock.toFixed(2)}g`, 25, yPos);
        yPos += 10;
      }

      // Data visualization note
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFontSize(12);
      pdf.setTextColor(41, 128, 185);
      pdf.text('📊 Data Visualizations', 20, yPos);
      yPos += 8;
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Interactive charts and detailed visualizations are available in the web application.', 20, yPos);
      yPos += 6;
      pdf.text('This report provides summary statistics. For comprehensive analysis,', 20, yPos);
      yPos += 6;
      pdf.text('access the full visualization dashboard with time-series plots,', 20, yPos);
      yPos += 6;
      pdf.text('histograms, and real-time data exploration tools.', 20, yPos);
      yPos += 15;
    }
    
    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Report generated by The Tool Dump - ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
    
    return Buffer.from(pdf.output('arraybuffer'));
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
        const maxTemp = tempData.reduce((max, temp) => Math.max(max, temp), -Infinity);
        const minTemp = tempData.reduce((min, temp) => Math.min(min, temp), Infinity);
        lines.push('');
        lines.push('🌡️  Temperature Analysis:');
        lines.push(`   • Range: ${minTemp.toFixed(1)}°F - ${maxTemp.toFixed(1)}°F`);
        lines.push(`   • Average: ${avgTemp.toFixed(1)}°F`);
        lines.push(`   • Status: ${maxTemp > 130 ? '🔴 CRITICAL' : maxTemp > 100 ? '🟡 WARNING' : '✅ NORMAL'}`);
      }
      
      if (voltageData.length > 0) {
        const avgVoltage = voltageData.reduce((a, b) => a + b) / voltageData.length;
        const maxVoltage = voltageData.reduce((max, volt) => Math.max(max, volt), -Infinity);
        const minVoltage = voltageData.reduce((min, volt) => Math.min(min, volt), Infinity);
        lines.push('');
        lines.push('🔋 Battery Voltage Analysis:');
        lines.push(`   • Range: ${minVoltage.toFixed(2)}V - ${maxVoltage.toFixed(2)}V`);
        lines.push(`   • Average: ${avgVoltage.toFixed(2)}V`);
        lines.push(`   • Status: ${minVoltage < 11.5 ? '🔴 LOW' : maxVoltage > 15.5 ? '🟡 HIGH' : '✅ NORMAL'}`);
      }
      
      if (shockData.length > 0) {
        const avgShock = shockData.reduce((a, b) => a + b) / shockData.length;
        const maxShock = shockData.reduce((max, shock) => Math.max(max, shock), -Infinity);
        lines.push('');
        lines.push('💥 Shock Level Analysis:');
        lines.push(`   • Maximum: ${maxShock.toFixed(1)}g`);
        lines.push(`   • Average: ${avgShock.toFixed(1)}g`);
        lines.push(`   • Status: ${maxShock > 6.0 ? '🔴 EXCEEDED THRESHOLD' : '✅ WITHIN LIMITS'}`);
      }
      
      if (motorData.length > 0) {
        const avgMotor = motorData.reduce((a, b) => a + b) / motorData.length;
        const maxMotor = motorData.reduce((max, motor) => Math.max(max, motor), -Infinity);
        lines.push('');
        lines.push('⚙️  Motor Current Analysis:');
        lines.push(`   • Maximum: ${maxMotor.toFixed(2)}A`);
        lines.push(`   • Average: ${avgMotor.toFixed(2)}A`);
        lines.push(`   • Status: ${maxMotor > 2.0 ? '🔴 OVERCURRENT' : '✅ NORMAL'}`);
      }
      
      if (gammaData.length > 0) {
        const avgGamma = gammaData.reduce((a, b) => a + b) / gammaData.length;
        const maxGamma = gammaData.reduce((max, gamma) => Math.max(max, gamma), -Infinity);
        const minGamma = gammaData.reduce((min, gamma) => Math.min(min, gamma), Infinity);
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
