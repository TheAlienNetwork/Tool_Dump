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

    console.log(`Starting advanced AI analysis on ${data.length} sensor records...`);

    // Advanced AI Health Analysis
    // 1. Temperature extremes and trends
    const tempData = data.filter(d => d.tempMP !== null).map(d => ({ value: d.tempMP!, rtd: d.rtd }));
    if (tempData.length > 0) {
      const tempMax = tempData.reduce((max, d) => Math.max(max, d.value), -Infinity);
      const tempMin = tempData.reduce((min, d) => Math.min(min, d.value), Infinity);
      
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
      const vMin = voltageData.reduce((min, d) => Math.min(min, d.value), Infinity);
      const vMax = voltageData.reduce((max, d) => Math.max(max, d.value), -Infinity);
      
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

    // 8. Advanced AI: System voltage instability detection
    const voltageFields = ['v3_3VA_DI', 'v5VD', 'v3_3VD', 'v1_9VD', 'v1_5VD', 'v1_8VA', 'v3_3VA'];
    voltageFields.forEach(field => {
      const voltageData = data.filter(d => d[field as keyof SensorData] !== null)
        .map(d => ({ value: d[field as keyof SensorData] as number, rtd: d.rtd }));
      
      if (voltageData.length > 10) {
        const mean = voltageData.reduce((sum, d) => sum + d.value, 0) / voltageData.length;
        const variance = voltageData.reduce((sum, d) => sum + Math.pow(d.value - mean, 2), 0) / voltageData.length;
        const stdDev = Math.sqrt(variance);
        
        // AI: Detect high voltage instability (CV > 10%)
        const coefficientOfVariation = (stdDev / mean) * 100;
        if (coefficientOfVariation > 10) {
          const unstablePoints = voltageData.filter(d => Math.abs(d.value - mean) > 2 * stdDev);
          if (unstablePoints.length > 0) {
            issues.push({
              issue: `${field} voltage instability detected (CV: ${coefficientOfVariation.toFixed(1)}%)`,
              explanation: "Power supply fluctuations or electrical faults detected using statistical analysis.",
              severity: coefficientOfVariation > 20 ? 'critical' : 'warning',
              count: unstablePoints.length,
              firstTime: unstablePoints[0].rtd,
              lastTime: unstablePoints[unstablePoints.length - 1].rtd,
              times: unstablePoints.map(d => d.rtd)
            });
          }
        }
      }
    });

    // 9. Advanced AI: Vibration pattern analysis
    const vibrationData = data.filter(d => 
      d.maxX !== null && d.maxY !== null && d.maxZ !== null
    ).map(d => ({
      x: d.maxX!,
      y: d.maxY!,
      z: d.maxZ!,
      magnitude: Math.sqrt(d.maxX! * d.maxX! + d.maxY! * d.maxY! + d.maxZ! * d.maxZ!),
      rtd: d.rtd
    }));

    if (vibrationData.length > 10) {
      const magnitudes = vibrationData.map(d => d.magnitude);
      const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
      const highVibrationEvents = vibrationData.filter(d => d.magnitude > avgMagnitude * 1.5);
      
      if (highVibrationEvents.length > magnitudes.length * 0.05) { // More than 5% of readings
        issues.push({
          issue: `Excessive vibration detected: ${highVibrationEvents.length} high-magnitude events`,
          explanation: "AI pattern analysis indicates mechanical wear or imbalance.",
          severity: 'warning',
          count: highVibrationEvents.length,
          firstTime: highVibrationEvents[0].rtd,
          lastTime: highVibrationEvents[highVibrationEvents.length - 1].rtd,
          times: highVibrationEvents.map(d => d.rtd)
        });
      }
    }

    // 10. Advanced AI: Motor performance degradation prediction
    const motorData = data.filter(d => 
      d.motorAvg !== null && d.actuationTime !== null && d.motorAvg > 0
    ).map(d => ({ current: d.motorAvg!, time: d.actuationTime!, rtd: d.rtd }));

    if (motorData.length > 50) {
      // Calculate efficiency trends
      const efficiencyData = motorData.map(d => ({
        efficiency: 1 / (d.current * d.time), // Inverse efficiency metric
        rtd: d.rtd
      }));

      // Look for degradation trend (first 25% vs last 25%)
      const firstQuarter = efficiencyData.slice(0, Math.floor(efficiencyData.length * 0.25));
      const lastQuarter = efficiencyData.slice(-Math.floor(efficiencyData.length * 0.25));
      
      const avgFirstEff = firstQuarter.reduce((sum, d) => sum + d.efficiency, 0) / firstQuarter.length;
      const avgLastEff = lastQuarter.reduce((sum, d) => sum + d.efficiency, 0) / lastQuarter.length;
      const degradation = ((avgFirstEff - avgLastEff) / avgFirstEff) * 100;

      if (degradation > 15) {
        issues.push({
          issue: `Motor performance degradation: ${degradation.toFixed(1)}% efficiency loss`,
          explanation: "AI trend analysis predicts accelerated wear. Consider maintenance scheduling.",
          severity: degradation > 25 ? 'critical' : 'warning',
          count: 1,
          firstTime: lastQuarter[0].rtd,
          lastTime: lastQuarter[lastQuarter.length - 1].rtd,
          times: [lastQuarter[0].rtd]
        });
      }
    }

    // 11. Advanced AI: Anomaly detection using statistical methods
    const tempMPData = data.filter(d => d.tempMP !== null).map(d => d.tempMP!);
    if (tempMPData.length > 100) {
      // Use Interquartile Range (IQR) method for outlier detection
      const sortedTemps = [...tempMPData].sort((a, b) => a - b);
      const q1 = sortedTemps[Math.floor(sortedTemps.length * 0.25)];
      const q3 = sortedTemps[Math.floor(sortedTemps.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const anomalies = data.filter(d => 
        d.tempMP !== null && (d.tempMP! < lowerBound || d.tempMP! > upperBound)
      );

      if (anomalies.length > 0) {
        issues.push({
          issue: `${anomalies.length} temperature anomalies detected by AI`,
          explanation: "Statistical outlier detection found unusual temperature patterns.",
          severity: 'info',
          count: anomalies.length,
          firstTime: anomalies[0].rtd,
          lastTime: anomalies[anomalies.length - 1].rtd,
          times: anomalies.map(d => d.rtd)
        });
      }
    }

    console.log(`Advanced AI analysis complete. Found ${issues.length} issues across ${data.length} records.`);

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
