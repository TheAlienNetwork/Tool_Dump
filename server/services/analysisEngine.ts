import { SensorData } from '@shared/schema';

export interface Issue {
  issue: string;
  explanation: string;
  severity: 'critical' | 'warning' | 'info';
  count: number;
  firstTime?: Date;
  lastTime?: Date;
  times: Date[];
}

export interface AnalysisResult {
  overallStatus: 'operational' | 'warning' | 'critical';
  criticalIssues: number;
  warnings: number;
  issues: Issue[];
}

export class AnalysisEngine {
  static analyzeData(data: SensorData[]): AnalysisResult {
    const issues: Issue[] = [];

    // 1. Temperature extremes
    const tempData = data.filter(d => d.tempMP !== null).map(d => ({ value: d.tempMP!, rtd: d.rtd }));
    if (tempData.length > 0) {
      const tempMax = Math.max(...tempData.map(d => d.value));
      const tempMin = Math.min(...tempData.map(d => d.value));
      
      const highTempData = tempData.filter(d => d.value > 130);
      if (highTempData.length > 0) {
        issues.push({
          issue: `High temperature spike: ${tempMax.toFixed(1)}°F`,
          explanation: "Overheating risk or sensor fault detected.",
          severity: 'critical',
          count: highTempData.length,
          firstTime: highTempData[0].rtd,
          lastTime: highTempData[highTempData.length - 1].rtd,
          times: highTempData.map(d => d.rtd)
        });
      }
      
      const lowTempData = tempData.filter(d => d.value < 100);
      if (lowTempData.length > 0) {
        issues.push({
          issue: `Low temperature dip: ${tempMin.toFixed(1)}°F`,
          explanation: "Unusual cooling or sensor error detected.",
          severity: 'warning',
          count: lowTempData.length,
          firstTime: lowTempData[0].rtd,
          lastTime: lowTempData[lowTempData.length - 1].rtd,
          times: lowTempData.map(d => d.rtd)
        });
      }
    }

    // 2. Battery voltage
    const voltageData = data.filter(d => d.batteryVoltMP !== null).map(d => ({ value: d.batteryVoltMP!, rtd: d.rtd }));
    if (voltageData.length > 0) {
      const vMin = Math.min(...voltageData.map(d => d.value));
      const vMax = Math.max(...voltageData.map(d => d.value));
      
      const lowVoltData = voltageData.filter(d => d.value < 11.5);
      if (lowVoltData.length > 0) {
        issues.push({
          issue: `Low battery voltage: ${vMin.toFixed(2)}V`,
          explanation: "Risk of shutdown or system instability.",
          severity: 'critical',
          count: lowVoltData.length,
          firstTime: lowVoltData[0].rtd,
          lastTime: lowVoltData[lowVoltData.length - 1].rtd,
          times: lowVoltData.map(d => d.rtd)
        });
      }
      
      const highVoltData = voltageData.filter(d => d.value > 15.5);
      if (highVoltData.length > 0) {
        issues.push({
          issue: `High battery voltage: ${vMax.toFixed(2)}V`,
          explanation: "Possible charging fault or damage risk.",
          severity: 'warning',
          count: highVoltData.length,
          firstTime: highVoltData[0].rtd,
          lastTime: highVoltData[highVoltData.length - 1].rtd,
          times: highVoltData.map(d => d.rtd)
        });
      }
    }

    // 3. Reset events
    const resetData = data.filter(d => d.resetMP === 1);
    if (resetData.length > 0 && resetData.length / data.length > 0.1) {
      issues.push({
        issue: `High reset frequency: ${resetData.length} resets`,
        explanation: "Firmware instability detected.",
        severity: 'critical',
        count: resetData.length,
        firstTime: resetData[0].rtd,
        lastTime: resetData[resetData.length - 1].rtd,
        times: resetData.map(d => d.rtd)
      });
    }

    // 4. Shock events
    const threshold = 6.0;
    const shockData = data.filter(d => 
      (d.shockZ !== null && d.shockZ > threshold) ||
      (d.shockX !== null && d.shockX > threshold) ||
      (d.shockY !== null && d.shockY > threshold)
    );
    if (shockData.length > 0) {
      issues.push({
        issue: `${shockData.length} high shock events (> ${threshold}g)`,
        explanation: "Mechanical impact risk detected.",
        severity: 'warning',
        count: shockData.length,
        firstTime: shockData[0].rtd,
        lastTime: shockData[shockData.length - 1].rtd,
        times: shockData.map(d => d.rtd)
      });
    }

    // 5. Motor current spikes
    const motorSpikeData = data.filter(d => d.motorMax !== null && d.motorMax > 2.0);
    if (motorSpikeData.length > 0) {
      issues.push({
        issue: `${motorSpikeData.length} motor current spikes`,
        explanation: "Overcurrent risk detected.",
        severity: 'warning',
        count: motorSpikeData.length,
        firstTime: motorSpikeData[0].rtd,
        lastTime: motorSpikeData[motorSpikeData.length - 1].rtd,
        times: motorSpikeData.map(d => d.rtd)
      });
    }

    // 6. Gamma anomalies
    const gammaLowData = data.filter(d => d.gamma !== null && d.gamma < 15);
    const gammaHighData = data.filter(d => d.gamma !== null && d.gamma > 45);
    
    if (gammaLowData.length > 0) {
      issues.push({
        issue: `${gammaLowData.length} low gamma count readings`,
        explanation: "Possible calibration or shielding issue.",
        severity: 'info',
        count: gammaLowData.length,
        firstTime: gammaLowData[0].rtd,
        lastTime: gammaLowData[gammaLowData.length - 1].rtd,
        times: gammaLowData.map(d => d.rtd)
      });
    }
    
    if (gammaHighData.length > 0) {
      issues.push({
        issue: `${gammaHighData.length} high gamma count readings`,
        explanation: "Contamination or unexpected formation detected.",
        severity: 'warning',
        count: gammaHighData.length,
        firstTime: gammaHighData[0].rtd,
        lastTime: gammaHighData[gammaHighData.length - 1].rtd,
        times: gammaHighData.map(d => d.rtd)
      });
    }

    // 7. Flow status vs motor inconsistency
    const inconsistentData = data.filter(d => 
      d.flowStatus === 'Off' && d.motorAvg !== null && d.motorAvg > 1.2
    );
    if (inconsistentData.length > 0) {
      issues.push({
        issue: `${inconsistentData.length} pump-off high motor events`,
        explanation: "Electrical or sensor fault detected.",
        severity: 'warning',
        count: inconsistentData.length,
        firstTime: inconsistentData[0].rtd,
        lastTime: inconsistentData[inconsistentData.length - 1].rtd,
        times: inconsistentData.map(d => d.rtd)
      });
    }

    // Calculate overall status
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    
    let overallStatus: 'operational' | 'warning' | 'critical' = 'operational';
    if (criticalIssues > 0) {
      overallStatus = 'critical';
    } else if (warnings > 0) {
      overallStatus = 'warning';
    }

    return {
      overallStatus,
      criticalIssues,
      warnings,
      issues
    };
  }
}
