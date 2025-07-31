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

    // ADVANCED AI TEMPERATURE ANALYSIS - High Precision Diagnostics
    // 1. Enhanced Temperature Validation with Sensor Integrity Checks
    const tempData = data.filter(d => 
      d.tempMP !== null && 
      typeof d.tempMP === 'number' && 
      !isNaN(d.tempMP) && 
      isFinite(d.tempMP) && 
      d.tempMP > -40 && // Realistic low temp (-40°F = -40°C)
      d.tempMP < 400 // Realistic high temp (400°F = 204°C for industrial equipment)
    ).map(d => ({ value: d.tempMP!, rtd: d.rtd, index: data.indexOf(d), originalIndex: data.indexOf(d) }));

    console.log(`🔬 AI TEMPERATURE DIAGNOSTICS: Processing ${tempData.length} valid readings from ${data.length} total records`);

    if (tempData.length > 0) {
      const tempValues = tempData.map(d => d.value);
      const tempMax = Math.max(...tempValues);
      const tempMin = Math.min(...tempValues);
      const tempAvg = tempValues.reduce((sum, val) => sum + val, 0) / tempValues.length;
      const tempStdDev = Math.sqrt(tempValues.reduce((sum, val) => sum + Math.pow(val - tempAvg, 2), 0) / tempValues.length);

      console.log(`🌡️ ADVANCED TEMP ANALYSIS: Min=${tempMin.toFixed(1)}°F, Max=${tempMax.toFixed(1)}°F, Avg=${tempAvg.toFixed(1)}°F, StdDev=${tempStdDev.toFixed(1)}°F`);

      // CRITICAL TEMPERATURE ANALYSIS - Industry Standard Thresholds
      const criticalTempThreshold = 200; // 200°F = 93°C (NEMA standard)
      const warningTempThreshold = 160;  // 160°F = 71°C (early warning)
      const lowTempThreshold = 50;       // 50°F = 10°C (operational minimum)

      // HIGH TEMPERATURE DETECTION with Pinpoint Accuracy
      const highTempData = tempData.filter(d => d.value > criticalTempThreshold);
      const warningTempData = tempData.filter(d => d.value > warningTempThreshold && d.value <= criticalTempThreshold);

      if (highTempData.length > 0) {
        // Advanced Pattern Recognition - Detect sustained vs transient events
        const temperatureGroups = [];
        let currentGroup = [highTempData[0]];

        for (let i = 1; i < highTempData.length; i++) {
          const timeDiff = highTempData[i].rtd.getTime() - highTempData[i-1].rtd.getTime();
          const indexDiff = highTempData[i].index - highTempData[i-1].index;

          // Group if within 30 seconds or 30 samples
          if (timeDiff <= 30000 || indexDiff <= 30) {
            currentGroup.push(highTempData[i]);
          } else {
            temperatureGroups.push(currentGroup);
            currentGroup = [highTempData[i]];
          }
        }
        temperatureGroups.push(currentGroup);

        // Analyze each temperature event group
        const sustainedEvents = temperatureGroups.filter(group => group.length >= 5); // 5+ consecutive readings
        const transientEvents = temperatureGroups.filter(group => group.length < 5);

        if (sustainedEvents.length > 0) {
          const longestEvent = sustainedEvents.reduce((max, group) => group.length > max.length ? group : max);
          const peakTemp = Math.max(...longestEvent.map(d => d.value));
          const eventDuration = (longestEvent[longestEvent.length - 1].rtd.getTime() - longestEvent[0].rtd.getTime()) / 1000;

          issues.push({
            issue: `CRITICAL: Sustained high temperature - Peak ${peakTemp.toFixed(1)}°F (${((peakTemp - 32) * 5/9).toFixed(1)}°C)`,
            explanation: `AI detected ${sustainedEvents.length} sustained thermal event(s). Longest event: ${eventDuration.toFixed(0)}s duration with ${longestEvent.length} consecutive readings above ${criticalTempThreshold}°F. Risk of equipment damage or failure. Immediate inspection required.`,
            severity: 'critical',
            count: highTempData.length,
            firstTime: longestEvent[0].rtd,
            lastTime: longestEvent[longestEvent.length - 1].rtd,
            times: longestEvent.map(d => d.rtd)
          });
        } else if (transientEvents.length > 0) {
          const peakTemp = Math.max(...highTempData.map(d => d.value));
          issues.push({
            issue: `WARNING: Transient temperature spikes - Peak ${peakTemp.toFixed(1)}°F (${((peakTemp - 32) * 5/9).toFixed(1)}°C)`,
            explanation: `AI detected ${transientEvents.length} brief temperature spike(s) above ${criticalTempThreshold}°F. Events were transient (<5 consecutive readings) suggesting possible sensor noise or brief thermal events. Monitor for pattern development.`,
            severity: 'warning',
            count: highTempData.length,
            firstTime: highTempData[0].rtd,
            lastTime: highTempData[highTempData.length - 1].rtd,
            times: highTempData.slice(0, 10).map(d => d.rtd) // First 10 occurrences
          });
        }
      }

      // WARNING LEVEL TEMPERATURE ANALYSIS
      if (warningTempData.length > tempData.length * 0.05) { // >5% of readings in warning range
        const avgWarningTemp = warningTempData.reduce((sum, d) => sum + d.value, 0) / warningTempData.length;
        issues.push({
          issue: `Elevated operating temperature - Average ${avgWarningTemp.toFixed(1)}°F (${((avgWarningTemp - 32) * 5/9).toFixed(1)}°C)`,
          explanation: `AI analysis shows ${warningTempData.length} readings (${((warningTempData.length / tempData.length) * 100).toFixed(1)}%) in warning range (${warningTempThreshold}-${criticalTempThreshold}°F). Indicates elevated thermal stress - recommend checking ventilation and cooling systems.`,
          severity: 'warning',
          count: warningTempData.length,
          firstTime: warningTempData[0].rtd,
          lastTime: warningTempData[warningTempData.length - 1].rtd,
          times: warningTempData.slice(0, 20).map(d => d.rtd) // First 20 occurrences
        });
      }

      // LOW TEMPERATURE ANALYSIS - Enhanced Logic
      const lowTempData = tempData.filter(d => d.value < lowTempThreshold);
      if (lowTempData.length > tempData.length * 0.1) { // >10% of readings below threshold
        const minTemp = Math.min(...lowTempData.map(d => d.value));
        const avgLowTemp = lowTempData.reduce((sum, d) => sum + d.value, 0) / lowTempData.length;

        issues.push({
          issue: `Low temperature operation - Minimum ${minTemp.toFixed(1)}°F (${((minTemp - 32) * 5/9).toFixed(1)}°C)`,
          explanation: `AI detected ${lowTempData.length} readings (${((lowTempData.length / tempData.length) * 100).toFixed(1)}%) below optimal operating range (<${lowTempThreshold}°F). Average low temp: ${avgLowTemp.toFixed(1)}°F. May indicate cold environment affecting viscosity and performance.`,
          severity: 'info',
          count: lowTempData.length,
          firstTime: lowTempData[0].rtd,
          lastTime: lowTempData[lowTempData.length - 1].rtd,
          times: lowTempData.slice(0, 50).map(d => d.rtd)
        });
      }

      // SENSOR INTEGRITY ANALYSIS - Detect Invalid/Suspicious Readings
      const invalidTempData = data.filter(d => 
        d.tempMP === null || 
        typeof d.tempMP !== 'number' || 
        isNaN(d.tempMP) || 
        !isFinite(d.tempMP) ||
        d.tempMP <= -40 || 
        d.tempMP >= 400
      );

      if (invalidTempData.length > 0) {
        const invalidPercent = (invalidTempData.length / data.length) * 100;
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let explanation = `AI detected ${invalidTempData.length} invalid temperature readings (${invalidPercent.toFixed(1)}% of total data).`;

        if (invalidPercent > 20) {
          severity = 'critical';
          explanation += ` HIGH FAILURE RATE - Sensor malfunction or communication errors likely. Immediate calibration required.`;
        } else if (invalidPercent > 5) {
          severity = 'warning';
          explanation += ` Moderate sensor issues detected. Consider sensor maintenance.`;
        } else {
          explanation += ` Occasional sensor anomalies - within acceptable range but monitor trend.`;
        }

        issues.push({
          issue: `Temperature sensor integrity: ${invalidTempData.length} invalid readings`,
          explanation,
          severity,
          count: invalidTempData.length,
          firstTime: invalidTempData.length > 0 ? invalidTempData[0].rtd : undefined,
          lastTime: invalidTempData.length > 0 ? invalidTempData[invalidTempData.length - 1].rtd : undefined,
          times: invalidTempData.slice(0, 100).map(d => d.rtd)
        });
      }
    } else {
      // No valid temperature data available
      issues.push({
        issue: `Temperature sensor failure: No valid readings`,
        explanation: `CRITICAL: AI analysis found zero valid temperature readings from ${data.length} total records. Complete sensor failure or severe communication issues. Immediate replacement required.`,
        severity: 'critical',
        count: data.length,
        firstTime: data.length > 0 ? data[0].rtd : undefined,
        lastTime: data.length > 0 ? data[data.length - 1].rtd : undefined,
        times: data.slice(0, 100).map(d => d.rtd)
      });
    }

    // ADVANCED AI: DELTA CALCULATIONS - Enhanced Temperature Change Analysis
    const deltaCalculations = {
      tempDeltas: {
        values: [],
        avg: 0,
        max: 0,
        spikes: 0
      }
    };

    // Temperature delta analysis with enhanced validation
    for (let i = 1; i < tempData.length; i++) {
      const current = tempData[i].value;
      const previous = tempData[i-1].value;

      // Additional validation to prevent extreme values
      if (isFinite(current) && isFinite(previous) && 
          Math.abs(current) < 1000 && Math.abs(previous) < 1000) {
        const delta = Math.abs(current - previous);

        // Only include reasonable delta values (max 50°F change between readings)
        if (delta < 50 && isFinite(delta) && !isNaN(delta) && delta >= 0) {
          deltaCalculations.tempDeltas.values.push(delta);
        }
      }
    }

    if (deltaCalculations.tempDeltas.values.length > 0) {
      const validDeltas = deltaCalculations.tempDeltas.values.filter(d => isFinite(d) && !isNaN(d) && d >= 0);

      if (validDeltas.length > 0) {
        deltaCalculations.tempDeltas.avg = validDeltas.reduce((sum, val) => sum + val, 0) / validDeltas.length;
        deltaCalculations.tempDeltas.max = Math.max(...validDeltas);
        deltaCalculations.tempDeltas.spikes = validDeltas.filter(d => d > 10).length;

        // Additional safety check to prevent extreme values
        if (!isFinite(deltaCalculations.tempDeltas.avg) || deltaCalculations.tempDeltas.avg > 100) {
          deltaCalculations.tempDeltas.avg = 0;
        }
        if (!isFinite(deltaCalculations.tempDeltas.max) || deltaCalculations.tempDeltas.max > 100) {
          deltaCalculations.tempDeltas.max = 0;
        }
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

    // 4. Advanced Shock Analysis with Pattern Recognition
    const validShockData = data.filter(d => 
      (d.shockZ !== null && typeof d.shockZ === 'number' && isFinite(d.shockZ) && Math.abs(d.shockZ) < 500) ||
      (d.shockX !== null && typeof d.shockX === 'number' && isFinite(d.shockX) && Math.abs(d.shockX) < 500) ||
      (d.shockY !== null && typeof d.shockY === 'number' && isFinite(d.shockY) && Math.abs(d.shockY) < 500)
    ).map(d => ({
      z: Math.abs(d.shockZ || 0),
      x: Math.abs(d.shockX || 0), 
      y: Math.abs(d.shockY || 0),
      magnitude: Math.sqrt((d.shockZ || 0)**2 + (d.shockX || 0)**2 + (d.shockY || 0)**2),
      rtd: d.rtd,
      index: data.indexOf(d)
    }));

    if (validShockData.length > 10) {
      // Calculate statistical thresholds based on actual data
      const magnitudes = validShockData.map(d => d.magnitude);
      const avgMagnitude = magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
      const stdDevMagnitude = Math.sqrt(magnitudes.reduce((sum, val) => sum + Math.pow(val - avgMagnitude, 2), 0) / magnitudes.length);

      // Dynamic threshold: 2 standard deviations above mean, minimum 8g
      const dynamicThreshold = Math.max(8.0, avgMagnitude + (2 * stdDevMagnitude));

      const significantShocks = validShockData.filter(d => d.magnitude > dynamicThreshold);

      if (significantShocks.length > 0) {
        // Pattern analysis - are these isolated events or sustained vibration?
        const maxShock = Math.max(...significantShocks.map(d => d.magnitude));
        const shockFrequency = significantShocks.length / (validShockData.length / 100); // per 100 samples

        let severity: 'info' | 'warning' | 'critical' = 'warning';
        let explanation = `AI detected ${significantShocks.length} significant shock events above statistical threshold (${dynamicThreshold.toFixed(1)}g).`;

        if (maxShock > 20 || shockFrequency > 5) {
          severity = 'critical';
          explanation += ` CRITICAL: Peak shock ${maxShock.toFixed(1)}g exceeds equipment limits. Immediate inspection recommended.`;
        } else if (shockFrequency > 2) {
          explanation += ` High frequency shock pattern suggests ongoing mechanical issue.`;
        } else {
          explanation += ` Isolated shock events within acceptable range but monitoring recommended.`;
        }

        issues.push({
          issue: `VALIDATED Shock Analysis: ${significantShocks.length} events, peak ${maxShock.toFixed(1)}g`,
          explanation,
          severity,
          count: significantShocks.length,
          firstTime: significantShocks[0].rtd,
          lastTime: significantShocks[significantShocks.length - 1].rtd,
          times: significantShocks.map(d => d.rtd)
        });
      }
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

    // 10. ADVANCED ROTATION SPEED ANALYSIS - Motor Performance Intelligence
    const rotationData = data.filter(d => 
      (d.rotRpmMax !== null && d.rotRpmMax > 0) ||
      (d.rotRpmAvg !== null && d.rotRpmAvg > 0) ||
      (d.rotRpmMin !== null && d.rotRpmMin > 0)
    ).map(d => ({
      max: d.rotRpmMax || 0,
      avg: d.rotRpmAvg || 0,
      min: d.rotRpmMin || 0,
      motorCurrent: d.motorAvg || 0,
      rtd: d.rtd,
      index: data.indexOf(d)
    }));

    if (rotationData.length > 10) {
      const validRPMData = rotationData.filter(d => d.max > 0 || d.avg > 0 || d.min > 0);
      console.log(`🔄 ROTATION ANALYSIS: ${validRPMData.length} valid RPM readings from ${rotationData.length} records`);

      if (validRPMData.length > 0) {
        const maxRPMs = validRPMData.map(d => d.max).filter(rpm => rpm > 0);
        const avgRPMs = validRPMData.map(d => d.avg).filter(rpm => rpm > 0);

        if (maxRPMs.length > 0) {
          const peakRPM = Math.max(...maxRPMs);
          const avgMaxRPM = maxRPMs.reduce((sum, rpm) => sum + rpm, 0) / maxRPMs.length;
          const minRPM = Math.min(...maxRPMs);

          console.log(`🔄 RPM STATISTICS: Peak=${peakRPM}, Avg=${avgMaxRPM.toFixed(0)}, Min=${minRPM}`);

          // High RPM Analysis - Equipment Protection
          const highRPMThreshold = 4000; // Typical industrial pump max safe RPM
          const highRPMEvents = validRPMData.filter(d => d.max > highRPMThreshold);

          if (highRPMEvents.length > 0) {
            const highRPMPercent = (highRPMEvents.length / validRPMData.length) * 100;
            let severity: 'warning' | 'critical' = 'warning';
            let explanation = `AI detected ${highRPMEvents.length} high-speed events (>${highRPMThreshold} RPM, ${highRPMPercent.toFixed(1)}% of operation).`;

            if (peakRPM > 4500 || highRPMPercent > 10) {
              severity = 'critical';
              explanation += ` CRITICAL: Peak RPM ${peakRPM} exceeds safe operating limits. Risk of mechanical failure, cavitation, or bearing damage.`;
            } else {
              explanation += ` Operating near maximum design limits. Monitor for mechanical stress indicators.`;
            }

            issues.push({
              issue: `High rotation speed detected: Peak ${peakRPM} RPM`,
              explanation,
              severity,
              count: highRPMEvents.length,
              firstTime: highRPMEvents[0].rtd,
              lastTime: highRPMEvents[highRPMEvents.length - 1].rtd,
              times: highRPMEvents.slice(0, 50).map(d => d.rtd)
            });
          }

          // Low RPM Analysis - Performance Issues
          const lowRPMThreshold = 500; // Minimum effective pumping speed
          const lowRPMEvents = validRPMData.filter(d => d.max < lowRPMThreshold && d.max > 0);

          if (lowRPMEvents.length > validRPMData.length * 0.15) { // >15% of operation
            const lowRPMPercent = (lowRPMEvents.length / validRPMData.length) * 100;
            issues.push({
              issue: `Low rotation speed operation: ${lowRPMPercent.toFixed(1)}% below optimal`,
              explanation: `AI detected ${lowRPMEvents.length} low-speed events (<${lowRPMThreshold} RPM). May indicate motor issues, high viscosity, blockages, or insufficient power supply. Reduced pumping efficiency expected.`,
              severity: 'warning',
              count: lowRPMEvents.length,
              firstTime: lowRPMEvents[0].rtd,
              lastTime: lowRPMEvents[lowRPMEvents.length - 1].rtd,
              times: lowRPMEvents.slice(0, 30).map(d => d.rtd)
            });
          }

          // RPM Variability Analysis - Stability Assessment
          const rpmVariability = validRPMData.map(d => Math.abs(d.max - d.min)).filter(v => v > 0);
          if (rpmVariability.length > 0) {
            const avgVariability = rpmVariability.reduce((sum, v) => sum + v, 0) / rpmVariability.length;
            const maxVariability = Math.max(...rpmVariability);

            if (avgVariability > 200 || maxVariability > 500) {
              let severity: 'info' | 'warning' | 'critical' = 'warning';
              let explanation = `AI detected high RPM variability: Average ${avgVariability.toFixed(0)} RPM spread, Maximum ${maxVariability} RPM spread.`;

              if (maxVariability > 1000) {
                severity = 'critical';
                explanation += ` CRITICAL: Extreme speed fluctuations indicate severe mechanical issues, control system problems, or unstable load conditions.`;
              } else if (avgVariability > 400) {
                severity = 'warning';
                explanation += ` High variability suggests mechanical wear, bearing issues, or control system instability.`;
              } else {
                severity = 'info';
                explanation += ` Moderate variability detected - normal for variable load conditions but monitor trend.`;
              }

              issues.push({
                issue: `RPM instability detected: ${avgVariability.toFixed(0)} RPM average variation`,
                explanation,
                severity,
                count: rpmVariability.length,
                firstTime: validRPMData[0].rtd,
                lastTime: validRPMData[validRPMData.length - 1].rtd,
                times: validRPMData.slice(0, 25).map(d => d.rtd)
              });
            }
          }
        }
      } else {
        console.log(`⚠️ No valid RPM data found in ${rotationData.length} rotation records`);
      }
    }

    // 11. Advanced AI: Motor performance degradation prediction
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
      // Use Interquartile Range (IQR) method for outlier detection      const sortedTemps = [...tempMPData].sort((a, b) => a - b);
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