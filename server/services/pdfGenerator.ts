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
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Modern color palette
    const colors = {
      primary: [41, 128, 185],     // Professional blue
      secondary: [52, 73, 94],     // Dark gray
      accent: [46, 204, 113],      // Green
      warning: [241, 196, 15],     // Yellow
      danger: [231, 76, 60],       // Red
      light: [236, 240, 241],      // Light gray
      white: [255, 255, 255],
      text: [44, 62, 80]           // Dark text
    };

    let currentPage = 1;
    let yPos = 20;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > 270) {
        pdf.addPage();
        currentPage++;
        yPos = 20;
        return true;
      }
      return false;
    };

    // Helper function to add gradient background
    const addGradientBackground = () => {
      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.rect(0, 0, 210, 297, 'F');
    };

    // Helper function to add header with logo space
    const addHeader = (title: string, subtitle?: string) => {
      // Header background
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(0, 0, 210, 35, 'F');

      // Main title
      pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.text(title, 105, 20, { align: 'center' });

      if (subtitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(subtitle, 105, 28, { align: 'center' });
      }

      yPos = 45;
    };

    // Helper function to add section header
    const addSectionHeader = (title: string, icon?: string) => {
      checkNewPage(15);

      // Section background
      pdf.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      pdf.rect(15, yPos - 2, 180, 12, 'F');

      pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text((icon ? icon + ' ' : '') + title, 20, yPos + 6);

      yPos += 18;
    };

    // Helper function to add data card
    const addDataCard = (title: string, value: string, unit: string, color: number[], x: number, width: number = 40) => {
      // Card background
      pdf.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      pdf.rect(x, yPos, width, 20, 'F');

      // Card border
      pdf.setDrawColor(color[0], color[1], color[2]);
      pdf.setLineWidth(0.5);
      pdf.rect(x, yPos, width, 20);

      // Color accent
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(x, yPos, width, 3, 'F');

      // Title
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(title, x + 2, yPos + 8);

      // Value
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(value, x + 2, yPos + 14);

      // Unit
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(unit, x + 2, yPos + 18);
    };

    // Helper function to create chart visualization
    const addChart = (title: string, data: any[], chartType: 'line' | 'bar' | 'area' = 'line', width: number = 160, height: number = 60) => {
      checkNewPage(height + 20);

      // Chart title
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(title, 25, yPos);
      yPos += 8;

      if (data.length === 0) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('No data available', 25, yPos + 20);
        yPos += 40;
        return;
      }

      const chartX = 25;
      const chartY = yPos;

      // Chart background
      pdf.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      pdf.rect(chartX, chartY, width, height, 'F');

      // Chart border
      pdf.setDrawColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.setLineWidth(0.5);
      pdf.rect(chartX, chartY, width, height);

      // Grid lines
      pdf.setDrawColor(240, 240, 240);
      pdf.setLineWidth(0.2);
      for (let i = 1; i < 5; i++) {
        const gridY = chartY + (height / 5) * i;
        pdf.line(chartX, gridY, chartX + width, gridY);
      }
      for (let i = 1; i < 8; i++) {
        const gridX = chartX + (width / 8) * i;
        pdf.line(gridX, chartY, gridX, chartY + height);
      }

      // Data processing
      const values = data.filter(d => d !== null && d !== undefined && !isNaN(d) && isFinite(d));
      if (values.length === 0) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('No valid data points', chartX + 10, chartY + height/2);
        yPos += height + 10;
        return;
      }

      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);
      const range = maxVal - minVal || 1;

      // Sample data for visualization (limit to ~50 points)
      const sampleStep = Math.max(1, Math.floor(values.length / 50));
      const sampledData = values.filter((_, index) => index % sampleStep === 0);

      // Draw chart based on type
      if (chartType === 'line' || chartType === 'area') {
        const points: [number, number][] = sampledData.map((value, index) => {
          const x = chartX + (index / (sampledData.length - 1 || 1)) * width;
          const y = chartY + height - ((value - minVal) / range) * height;
          return [x, y];
        });

        if (chartType === 'area') {
          // Fill area
          pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
          pdf.setGState(new pdf.GState({opacity: 0.3}));

          if (points.length > 0) {
            pdf.lines(
              [
                ...points.map(([x, y]) => [x - points[0][0], y - points[0][1]]),
                [points[points.length - 1][0] - points[0][0], chartY + height - points[0][1]],
                [0, chartY + height - points[0][1]]
              ],
              points[0][0], points[0][1], [1, 1], 'F'
            );
          }
          pdf.setGState(new pdf.GState({opacity: 1}));
        }

        // Draw line
        pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.setLineWidth(1.5);

        for (let i = 0; i < points.length - 1; i++) {
          pdf.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
        }

      } else if (chartType === 'bar') {
        const barWidth = width / sampledData.length * 0.8;
        const barSpacing = width / sampledData.length * 0.2;

        pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);

        sampledData.forEach((value, index) => {
          const barHeight = ((value - minVal) / range) * height;
          const x = chartX + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = chartY + height - barHeight;

          pdf.rect(x, y, barWidth - 2, barHeight, 'F');
        });
      }

      // Chart labels
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      // Y-axis labels
      for (let i = 0; i <= 4; i++) {
        const value = minVal + (range / 4) * i;
        const y = chartY + height - (height / 4) * i;
        const label = value >= 1000 ? (value/1000).toFixed(1) + 'K' : value.toFixed(1);
        pdf.text(label, chartX - 15, y + 1);
      }

      yPos += height + 15;
    };

    // Page 1: Cover Page
    addGradientBackground();
    addHeader('Advanced Binary Dump Analysis Report', 'AI-Powered Sensor Data Intelligence Platform');

    // Executive summary cards
    yPos += 10;
    addDataCard('Overall Status', reportData.overallStatus.toUpperCase(), 'system health', 
      reportData.overallStatus === 'critical' ? colors.danger : 
      reportData.overallStatus === 'warning' ? colors.warning : colors.accent, 25);

    addDataCard('Critical Issues', reportData.criticalIssues.toString(), 'alerts', colors.danger, 75);
    addDataCard('Warnings', reportData.warnings.toString(), 'notices', colors.warning, 125);
    addDataCard('Data Points', reportData.sensorData.length.toLocaleString(), 'records', colors.primary, 175, 30);

    yPos += 30;

    // File information
    addSectionHeader('📄 File Information');

    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const fileInfo = [
      ['File Name:', reportData.filename],
      ['Processing Date:', reportData.processedAt.toLocaleString()],
      ['Total Records:', reportData.sensorData.length.toLocaleString()],
      ['Analysis Engine:', 'Advanced AI Pattern Recognition v2.0'],
      ['Report Type:', 'Comprehensive Health Analysis']
    ];

    fileInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 25, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 80, yPos);
      yPos += 6;
    });

    yPos += 10;

    // Device Information Section
    if (reportData.deviceReport) {
      addSectionHeader('🔧 Device Information & Performance Metrics');

      // MP Device Info
      if (reportData.deviceReport.mpSerialNumber || reportData.deviceReport.mpFirmwareVersion) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        pdf.text('Memory Pump (MP) Device', 25, yPos);
        yPos += 8;

        // MP Data cards
        const mpCards = [];
        if (reportData.deviceReport.mpSerialNumber) {
          mpCards.push(['S/N', reportData.deviceReport.mpSerialNumber, 'serial']);
        }
        if (reportData.deviceReport.mpFirmwareVersion) {
          mpCards.push(['Firmware', reportData.deviceReport.mpFirmwareVersion, 'version']);
        }
        if (reportData.deviceReport.mpMaxTempFahrenheit) {
          const tempColor = reportData.deviceReport.mpMaxTempFahrenheit > 130 ? colors.danger : colors.accent;
          mpCards.push([
            'Peak Temp', 
            `${reportData.deviceReport.mpMaxTempFahrenheit.toFixed(1)}°F`, 
            `${reportData.deviceReport.mpMaxTempCelsius?.toFixed(1)}°C`
          ]);
        }

        mpCards.forEach((card, index) => {
          const x = 25 + (index * 55);
          if (x + 50 <= 190) {
            addDataCard(card[0], card[1], card[2], colors.accent, x, 50);
          }
        });

        if (mpCards.length > 0) yPos += 25;

        // Additional MP metrics
        const mpMetrics = [];
        if (reportData.deviceReport.circulationHours !== undefined) {
          const days = Math.floor(reportData.deviceReport.circulationHours / 24);
          const hours = Math.round(reportData.deviceReport.circulationHours % 24);
          mpMetrics.push(['Circulation Time', `${days}d ${hours}h`, 'runtime']);
        }
        if (reportData.deviceReport.numberOfPulses) {
          mpMetrics.push(['Pulses', reportData.deviceReport.numberOfPulses.toLocaleString(), 'cycles']);
        }
        if (reportData.deviceReport.motorOnTimeMinutes !== undefined) {
          const hours = Math.floor(reportData.deviceReport.motorOnTimeMinutes / 60);
          const mins = Math.round(reportData.deviceReport.motorOnTimeMinutes % 60);
          mpMetrics.push(['Motor Time', `${hours}h ${mins}m`, 'operation']);
        }

        mpMetrics.forEach((metric, index) => {
          const x = 25 + (index * 55);
          if (x + 50 <= 190) {
            addDataCard(metric[0], metric[1], metric[2], colors.primary, x, 50);
          }
        });

        if (mpMetrics.length > 0) yPos += 25;
      }

      // MDG Device Info
      if (reportData.deviceReport.mdgSerialNumber || reportData.deviceReport.mdgFirmwareVersion) {
        checkNewPage(40);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
        pdf.text('Measurement During Drilling (MDG) Device', 25, yPos);
        yPos += 8;

        const mdgCards = [];
        if (reportData.deviceReport.mdgSerialNumber) {
          mdgCards.push(['S/N', reportData.deviceReport.mdgSerialNumber, 'serial']);
        }
        if (reportData.deviceReport.mdgFirmwareVersion) {
          mdgCards.push(['Firmware', reportData.deviceReport.mdgFirmwareVersion, 'version']);
        }
        if (reportData.deviceReport.mdgMaxTempFahrenheit) {
          mdgCards.push([
            'Peak Temp', 
            `${reportData.deviceReport.mdgMaxTempFahrenheit.toFixed(1)}°F`, 
            `${reportData.deviceReport.mdgMaxTempCelsius?.toFixed(1)}°C`
          ]);
        }

        mdgCards.forEach((card, index) => {
          const x = 25 + (index * 55);
          if (x + 50 <= 190) {
            addDataCard(card[0], card[1], card[2], colors.warning, x, 50);
          }
        });

        if (mdgCards.length > 0) yPos += 25;
      }
    }

    // Page 2: AI Analysis Results
    pdf.addPage();
    currentPage++;
    yPos = 20;
    addHeader('🤖 AI Analysis Results', 'Advanced Pattern Recognition & Anomaly Detection');

    if (reportData.issues && reportData.issues.length > 0) {
      addSectionHeader('⚠️ Critical Findings & Recommendations');

      // Issue summary cards
      const criticalCount = reportData.issues.filter(i => i.severity === 'critical').length;
      const warningCount = reportData.issues.filter(i => i.severity === 'warning').length;
      const infoCount = reportData.issues.filter(i => i.severity === 'info').length;

      addDataCard('Critical', criticalCount.toString(), 'issues', colors.danger, 25);
      addDataCard('Warnings', warningCount.toString(), 'issues', colors.warning, 75);
      addDataCard('Info', infoCount.toString(), 'notices', colors.primary, 125);
      addDataCard('Total', reportData.issues.length.toString(), 'findings', colors.secondary, 175, 30);

      yPos += 30;

      // Detailed issues
      reportData.issues.slice(0, 8).forEach((issue, index) => {
        checkNewPage(25);

        const issueColor = issue.severity === 'critical' ? colors.danger : 
                          issue.severity === 'warning' ? colors.warning : colors.primary;

        // Issue header
        pdf.setFillColor(issueColor[0], issueColor[1], issueColor[2]);
        pdf.setGState(new pdf.GState({opacity: 0.1}));
        pdf.rect(20, yPos - 2, 170, 20, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));

        // Severity badge
        pdf.setFillColor(issueColor[0], issueColor[1], issueColor[2]);
        pdf.rect(22, yPos, 20, 6, 'F');
        pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text(issue.severity.toUpperCase(), 32, yPos + 4, { align: 'center' });

        // Issue title
        pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(issue.issue, 45, yPos + 4);

        // Issue details
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);

        const explanation = issue.explanation.length > 140 ? 
          issue.explanation.substring(0, 137) + '...' : issue.explanation;

        const explanationLines = pdf.splitTextToSize(explanation, 165);
        explanationLines.slice(0, 2).forEach((line: string, lineIndex: number) => {
          pdf.text(line, 22, yPos + 10 + (lineIndex * 4));
        });

        // Occurrence info
        if (issue.count > 1) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text(`Occurrences: ${issue.count}`, 22, yPos + 18);
        }

        if (issue.firstTime) {
          pdf.text(`First: ${new Date(issue.firstTime).toLocaleTimeString()}`, 80, yPos + 18);
        }

        yPos += 25;
      });

      if (reportData.issues.length > 8) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`... and ${reportData.issues.length - 8} more issues. See full analysis for complete details.`, 25, yPos);
        yPos += 10;
      }
    } else {
      addSectionHeader('✅ System Status: Optimal');

      pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      pdf.setGState(new pdf.GState({opacity: 0.1}));
      pdf.rect(20, yPos, 170, 30, 'F');
      pdf.setGState(new pdf.GState({opacity: 1}));

      pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('No Critical Issues Detected', 105, yPos + 12, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('All parameters are within normal operating ranges.', 105, yPos + 20, { align: 'center' });

      yPos += 40;
    }

    // Page 3: Comprehensive Data Visualizations
    pdf.addPage();
    currentPage++;
    yPos = 20;
    addHeader('📊 Comprehensive Data Visualizations', 'Interactive Chart Analysis & Trends');

    // Prepare data for visualizations
    const validSensorData = reportData.sensorData.filter(d => d && typeof d === 'object');

    if (validSensorData.length > 0) {
      // Temperature Analysis
      const tempData = validSensorData
        .map(d => d.tempMP)
        .filter(t => t !== null && t !== undefined && !isNaN(t as number) && isFinite(t as number) && (t as number) > -40 && (t as number) < 400) as number[];

      if (tempData.length > 0) {
        addChart('Temperature Analysis (°F)', tempData, 'area');

        // Temperature statistics
        const avgTemp = tempData.reduce((a, b) => a + b, 0) / tempData.length;
        const maxTemp = Math.max(...tempData);
        const minTemp = Math.min(...tempData);

        addDataCard('Avg Temp', avgTemp.toFixed(1), '°F', colors.primary, 25);
        addDataCard('Max Temp', maxTemp.toFixed(1), '°F', colors.danger, 75);
        addDataCard('Min Temp', minTemp.toFixed(1), '°F', colors.accent, 125);
        addDataCard('Readings', tempData.length.toLocaleString(), 'points', colors.secondary, 175, 30);

        yPos += 25;
      }

      // Shock Analysis
      const shockData = validSensorData
        .map(d => d.shockZ !== null && Math.abs(d.shockZ as number) < 100 ? Math.abs(d.shockZ as number) : null)
        .filter(s => s !== null) as number[];

      if (shockData.length > 0) {
        checkNewPage(90);
        addChart('Shock Analysis (g-force)', shockData, 'line');

        const maxShock = Math.max(...shockData);
        const avgShock = shockData.reduce((a, b) => a + b, 0) / shockData.length;
        const highShockEvents = shockData.filter(s => s > 10).length;

        addDataCard('Max Shock', maxShock.toFixed(2), 'g', colors.danger, 25);
        addDataCard('Avg Shock', avgShock.toFixed(2), 'g', colors.warning, 75);
        addDataCard('High Events', highShockEvents.toString(), '>10g', colors.danger, 125);
        addDataCard('Total', shockData.length.toLocaleString(), 'readings', colors.primary, 175, 30);

        yPos += 25;
      }

      // Battery Voltage Analysis
      const batteryData = validSensorData
        .map(d => (d.vBatt !== null && (d.vBatt as number) > 0 && (d.vBatt as number) < 50) ? d.vBatt as number : 
                  (d.batteryVoltMP !== null && (d.batteryVoltMP as number) > 0 && (d.batteryVoltMP as number) < 50) ? d.batteryVoltMP as number : null)
        .filter(v => v !== null) as number[];

      if (batteryData.length > 0) {
        checkNewPage(90);
        addChart('Battery Voltage Analysis (V)', batteryData, 'area');

        const avgVoltage = batteryData.reduce((a, b) => a + b, 0) / batteryData.length;
        const minVoltage = Math.min(...batteryData);
        const maxVoltage = Math.max(...batteryData);
        const healthyReadings = batteryData.filter(v => v > 11.5 && v < 15.5).length;
        const healthPercent = (healthyReadings / batteryData.length) * 100;

        addDataCard('Avg Voltage', avgVoltage.toFixed(2), 'V', colors.accent, 25);
        addDataCard('Min Voltage', minVoltage.toFixed(2), 'V', colors.warning, 75);
        addDataCard('Health', healthPercent.toFixed(1), '%', colors.primary, 125);
        addDataCard('Readings', batteryData.length.toLocaleString(), 'points', colors.secondary, 175, 30);

        yPos += 25;
      }

      // RPM Analysis
      const rpmData = validSensorData
        .map(d => (d.rotRpmAvg !== null && (d.rotRpmAvg as number) > 0 && (d.rotRpmAvg as number) < 50000) ? d.rotRpmAvg as number : 
                  (d.rotRpmMax !== null && (d.rotRpmMax as number) > 0 && (d.rotRpmMax as number) < 50000) ? d.rotRpmMax as number : null)
        .filter(r => r !== null) as number[];

      if (rpmData.length > 0) {
        checkNewPage(90);
        addChart('Rotation Speed Analysis (RPM)', rpmData, 'line');

        const maxRpm = Math.max(...rpmData);
        const avgRpm = rpmData.reduce((a, b) => a + b, 0) / rpmData.length;
        const highRpmEvents = rpmData.filter(r => r > 4000).length;

        addDataCard('Max RPM', maxRpm.toFixed(0), 'rpm', colors.danger, 25);
        addDataCard('Avg RPM', avgRpm.toFixed(0), 'rpm', colors.primary, 75);
        addDataCard('High Speed', highRpmEvents.toString(), '>4000', colors.warning, 125);
        addDataCard('Active', rpmData.length.toLocaleString(), 'readings', colors.accent, 175, 30);

        yPos += 25;
      }

      // Motor Current Analysis
      const motorData = validSensorData
        .map(d => (d.motorAvg !== null && (d.motorAvg as number) >= 0 && (d.motorAvg as number) < 100) ? d.motorAvg as number : null)
        .filter(m => m !== null) as number[];

      if (motorData.length > 0) {
        checkNewPage(90);
        addChart('Motor Current Analysis (A)', motorData, 'area');

        const maxCurrent = Math.max(...motorData);
        const avgCurrent = motorData.reduce((a, b) => a + b, 0) / motorData.length;
        const overCurrentEvents = motorData.filter(m => m > 2.0).length;

        addDataCard('Max Current', maxCurrent.toFixed(3), 'A', colors.danger, 25);
        addDataCard('Avg Current', avgCurrent.toFixed(3), 'A', colors.primary, 75);
        addDataCard('Overcurrent', overCurrentEvents.toString(), '>2A', colors.warning, 125);
        addDataCard('Samples', motorData.length.toLocaleString(), 'readings', colors.accent, 175, 30);

        yPos += 25;
      }

      // Gamma Radiation Analysis
      const gammaData = validSensorData
        .map(d => (d.gamma !== null && (d.gamma as number) >= 0 && (d.gamma as number) < 10000) ? d.gamma as number : null)
        .filter(g => g !== null) as number[];

      if (gammaData.length > 0) {
        checkNewPage(90);
        addChart('Gamma Radiation Analysis (cps)', gammaData, 'bar');

        const maxGamma = Math.max(...gammaData);
        const avgGamma = gammaData.reduce((a, b) => a + b, 0) / gammaData.length;
        const anomalousCounts = gammaData.filter(g => g < 15 || g > 45).length;

        addDataCard('Max Gamma', maxGamma.toFixed(1), 'cps', colors.warning, 25);
        addDataCard('Avg Gamma', avgGamma.toFixed(1), 'cps', colors.primary, 75);
        addDataCard('Anomalies', anomalousCounts.toString(), 'events', colors.danger, 125);
        addDataCard('Total', gammaData.length.toLocaleString(), 'readings', colors.accent, 175, 30);

        yPos += 25;
      }

    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(12);
      pdf.setTextColor(150, 150, 150);
      pdf.text('No visualization data available', 105, yPos + 50, { align: 'center' });
    }

    // Page 4: Technical Summary & Recommendations
    pdf.addPage();
    currentPage++;
    yPos = 20;
    addHeader('📋 Technical Summary & Recommendations', 'Expert Analysis & Action Items');

    // Overall Health Score
    addSectionHeader('🎯 Overall System Health Score');

    const healthScore = reportData.criticalIssues === 0 ? 
      (reportData.warnings === 0 ? 95 : 85 - (reportData.warnings * 5)) : 
      60 - (reportData.criticalIssues * 10);

    const scoreColor = healthScore >= 90 ? colors.accent : 
                      healthScore >= 70 ? colors.warning : colors.danger;

// Health score visualization
    pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.setGState(new pdf.GState({opacity: 0.2}));
    pdf.rect(25, yPos, 160, 25, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));

    pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text(`${Math.max(0, healthScore)}/100`, 105, yPos + 15, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    const healthStatus = healthScore >= 90 ? 'EXCELLENT' : 
                        healthScore >= 70 ? 'GOOD' : 
                        healthScore >= 50 ? 'FAIR' : 'POOR';
    pdf.text(healthStatus, 105, yPos + 22, { align: 'center' });

    yPos += 35;

    // Recommendations
    addSectionHeader('💡 Expert Recommendations');

    const recommendations = [];

    if (reportData.criticalIssues > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Address Critical Issues',
        description: `${reportData.criticalIssues} critical issue(s) require immediate attention to prevent equipment damage or failure.`,
        color: colors.danger
      });
    }

    if (reportData.warnings > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Preventive Maintenance',
        description: `${reportData.warnings} warning(s) detected. Schedule maintenance at next opportunity.`,
        color: colors.warning
      });
    }

    if (validSensorData.length > 50000) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Data Archive',
        description: `Large dataset (${validSensorData.length.toLocaleString()} records) - consider archiving for historical analysis.`,
        color: colors.primary
      });
    }

    recommendations.push({
      priority: 'LOW',
      action: 'Routine Monitoring',
      description: 'Continue regular data collection and analysis to maintain optimal performance.',
      color: colors.accent
    });

    recommendations.forEach((rec, index) => {
      checkNewPage(20);

      // Priority badge
      pdf.setFillColor(rec.color[0], rec.color[1], rec.color[2]);
      pdf.rect(25, yPos, 25, 8, 'F');
      pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(rec.priority, 37.5, yPos + 5, { align: 'center' });

      // Action title
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(rec.action, 55, yPos + 5);

      // Description
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const descLines = pdf.splitTextToSize(rec.description, 130);
      descLines.slice(0, 2).forEach((line: string, lineIndex: number) => {
        pdf.text(line, 25, yPos + 12 + (lineIndex * 5));
      });

      yPos += 20;
    });

    // Footer on last page
    yPos = 280;
    pdf.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    pdf.rect(0, yPos, 210, 17, 'F');

    pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`Advanced AI Report • The Tool Dump Analytics Platform • Generated: ${new Date().toLocaleString()}`, 105, yPos + 8, { align: 'center' });
    pdf.text(`Page ${currentPage} • Confidential Technical Analysis`, 105, yPos + 13, { align: 'center' });

    return Buffer.from(pdf.output('arraybuffer'));
  }

  static getReportMimeType(): string {
    return 'application/pdf';
  }

  static getReportExtension(): string {
    return 'pdf';
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