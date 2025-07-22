
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { BinaryParser } from "./services/binaryParser";
import { PDFGenerator } from "./services/pdfGenerator";

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.originalname.toLowerCase().endsWith('.bin')) {
      cb(null, true);
    } else {
      cb(new Error('Only .bin files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all memory dumps
  app.get("/api/memory-dumps", async (req, res) => {
    try {
      const dumps = await storage.getMemoryDumps();
      res.json(dumps);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch memory dumps", error: error?.message });
    }
  });

  // Upload binary files
  app.post("/api/memory-dumps/upload", upload.array('files'), async (req: any, res) => {
    try {
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Process all files in parallel for maximum speed
      const filePromises = files.map(async (file: Express.Multer.File) => {
        try {
          // Determine file type from filename
          const fileType = file.originalname.includes('MDG') ? 'MDG' : 
                          file.originalname.includes('MP') ? 'MP' : 'UNKNOWN';

          // Create memory dump record
          const memoryDump = await storage.createMemoryDump({
            filename: file.originalname,
            fileType: fileType
          });

          // Start processing in background with immediate response
          setImmediate(() => {
            processMemoryDumpStreaming(memoryDump.id, file.path, file.originalname, fileType);
          });

          return {
            id: memoryDump.id,
            filename: file.originalname,
            status: 'processing',
            fileType
          };

        } catch (error: any) {
          console.error(`Error processing file ${file.originalname}:`, error);
          return {
            filename: file.originalname,
            status: 'error',
            error: error?.message
          };
        }
      });

      // Wait for all files to be registered and started processing
      const results = await Promise.all(filePromises);

      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ message: "Upload failed", error: error?.message });
    }
  });

  // Get memory dump details with sensor data
  app.get("/api/memory-dumps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const memoryDump = await storage.getMemoryDump(id);

      if (!memoryDump) {
        return res.status(404).json({ message: "Memory dump not found" });
      }

      const sensorData = await storage.getSensorDataByDumpId(id);
      const analysisResults = await storage.getAnalysisResultsByDumpId(id);
      const deviceReport = await storage.getDeviceReportByDumpId(id);

      res.json({
        memoryDump,
        sensorData,
        analysisResults,
        deviceReport
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch memory dump", error: error?.message });
    }
  });

  // Get analysis results for a memory dump
  app.get("/api/memory-dumps/:id/analysis", async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getAnalysisResult(parseInt(id));

      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Generate and download PDF report
  app.get("/api/memory-dumps/:id/report", async (req, res) => {
    try {
      const { id } = req.params;
      const dumpId = parseInt(id);

      // Get memory dump details
      const memoryDump = await storage.getMemoryDump(dumpId);
      if (!memoryDump) {
        return res.status(404).json({ error: "Memory dump not found" });
      }

      // Get analysis results
      const analysis = await storage.getAnalysisResult(dumpId);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      // Get sensor data (limited)
      const sensorData = await storage.getSensorData(dumpId, 1000);

      // Get device report
      const deviceReport = await storage.getDeviceReport(dumpId);

      // Prepare report data
      const reportData = {
        filename: memoryDump.filename,
        processedAt: new Date(),
        overallStatus: analysis.overallStatus,
        criticalIssues: analysis.criticalIssues,
        warnings: analysis.warnings,
        issues: analysis.issues as any,
        sensorData: sensorData || [],
        deviceReport: deviceReport ? {
          mpSerialNumber: deviceReport.mpSerialNumber || undefined,
          mpFirmwareVersion: deviceReport.mpFirmwareVersion || undefined,
          mpMaxTempFahrenheit: deviceReport.mpMaxTempFahrenheit || undefined,
          mpMaxTempCelsius: deviceReport.mpMaxTempCelsius || undefined,
          circulationHours: deviceReport.circulationHours || undefined,
          numberOfPulses: deviceReport.numberOfPulses || undefined,
          motorOnTimeMinutes: deviceReport.motorOnTimeMinutes || undefined,
          commErrorsTimeMinutes: deviceReport.commErrorsTimeMinutes || undefined,
          commErrorsPercent: deviceReport.commErrorsPercent || undefined,
          hallStatusTimeMinutes: deviceReport.hallStatusTimeMinutes || undefined,
          hallStatusPercent: deviceReport.hallStatusPercent || undefined,
          mdgSerialNumber: deviceReport.mdgSerialNumber || undefined,
          mdgFirmwareVersion: deviceReport.mdgFirmwareVersion || undefined,
          mdgMaxTempFahrenheit: deviceReport.mdgMaxTempFahrenheit || undefined,
          mdgMaxTempCelsius: deviceReport.mdgMaxTempCelsius || undefined,
          mdgEdtTotalHours: deviceReport.mdgEdtTotalHours || undefined,
          mdgExtremeShockIndex: deviceReport.mdgExtremeShockIndex || undefined,
        } : undefined
      };

      // Generate PDF
      const pdfBuffer = await PDFGenerator.generateReport(reportData);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${memoryDump.filename}_report.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  });

  // Clear all memory dumps and related data
  app.delete("/api/memory-dumps/clear-all", async (req, res) => {
    try {
      await storage.clearAllMemoryDumps();
      
      // Also clean up uploaded files
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          const filePath = path.join(uploadsDir, file);
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.warn(`Could not delete file ${filePath}:`, err);
          }
        }
      }

      res.json({ message: "All memory dumps and related data cleared successfully" });
    } catch (error: any) {
      console.error("Error clearing all dumps:", error);
      res.status(500).json({ message: "Failed to clear all dumps", error: error?.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Ultra-fast streaming processing with memory control
async function processMemoryDumpStreaming(dumpId: number, filePath: string, filename: string, fileType: string) {
  let processed = 0;
  
  try {
    console.log(`Starting ultra-fast processing for dump ${dumpId}: ${filename}`);
    await storage.updateMemoryDumpStatus(dumpId, 'processing');

    // Check file size
    const stats = fs.statSync(filePath);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Extract device information from header
    const headerBuffer = Buffer.alloc(256);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, headerBuffer, 0, 256, 0);
    fs.closeSync(fd);
    
    const deviceInfo = BinaryParser.extractDeviceInfo(headerBuffer, filename, fileType);
    deviceInfo.dumpId = dumpId;
    await storage.createDeviceReport(deviceInfo);

    // Ultra-fast processing with raw SQL bulk inserts
    const CHUNK_SIZE = 5000; // Large chunks for maximum raw SQL performance
    await BinaryParser.parseMemoryDumpStream(filePath, filename, fileType, CHUNK_SIZE, async (batch, batchIndex) => {
      try {
        // Direct conversion to database format - no intermediate objects
        const sensorDataBatch = BinaryParser.convertToSensorDataArray({
          RTD: batch.RTD,
          TempMP: batch.TempMP,
          ResetMP: batch.ResetMP,
          BatteryCurrMP: batch.BatteryCurrMP,
          BatteryVoltMP: batch.BatteryVoltMP,
          FlowStatus: batch.FlowStatus,
          MaxX: batch.MaxX,
          MaxY: batch.MaxY,
          MaxZ: batch.MaxZ,
          Threshold: batch.Threshold,
          MotorMin: batch.MotorMin,
          MotorAvg: batch.MotorAvg,
          MotorMax: batch.MotorMax,
          MotorHall: batch.MotorHall,
          ActuationTime: batch.ActuationTime,
          AccelAX: batch.AccelAX,
          AccelAY: batch.AccelAY,
          AccelAZ: batch.AccelAZ,
          ShockZ: batch.ShockZ,
          ShockX: batch.ShockX,
          ShockY: batch.ShockY,
          ShockCountAxial50: batch.ShockCountAxial50,
          ShockCountAxial100: batch.ShockCountAxial100,
          ShockCountLat50: batch.ShockCountLat50,
          ShockCountLat100: batch.ShockCountLat100,
          RotRpmMax: batch.RotRpmMax,
          RotRpmAvg: batch.RotRpmAvg,
          RotRpmMin: batch.RotRpmMin,
          V3_3VA_DI: batch.V3_3VA_DI,
          V5VD: batch.V5VD,
          V3_3VD: batch.V3_3VD,
          V1_9VD: batch.V1_9VD,
          V1_5VD: batch.V1_5VD,
          V1_8VA: batch.V1_8VA,
          V3_3VA: batch.V3_3VA,
          VBatt: batch.VBatt,
          I5VD: batch.I5VD,
          I3_3VD: batch.I3_3VD,
          IBatt: batch.IBatt,
          Gamma: batch.Gamma,
          AccelStabX: batch.AccelStabX,
          AccelStabY: batch.AccelStabY,
          AccelStabZ: batch.AccelStabZ,
          AccelStabZH: batch.AccelStabZH,
          SurveyTGF: batch.SurveyTGF,
          SurveyTMF: batch.SurveyTMF,
          SurveyDipA: batch.SurveyDipA,
          SurveyINC: batch.SurveyINC,
          SurveyCINC: batch.SurveyCINC,
          SurveyAZM: batch.SurveyAZM,
          SurveyCAZM: batch.SurveyCAZM,
        }, dumpId);

        // Store immediately with bulk database insert for maximum speed
        await storage.createSensorData(sensorDataBatch);
        processed += sensorDataBatch.length;

        // Aggressive cleanup for speed
        if (global.gc && batchIndex % 2 === 0) {
          global.gc();
        }
        
        // Minimal logging for maximum speed
        if (batchIndex % 5 === 0) {
          const currentMemory = process.memoryUsage();
          console.log(`Processed ${processed} records in ${batchIndex + 1} batches. Memory: ${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`);
        }
        
        return true;
      } catch (error) {
        console.error(`Error processing batch ${batchIndex}:`, error);
        return false;
      }
    });

    console.log(`Completed ultra-fast processing for dump ${dumpId}. Total records: ${processed}`);

    // Simple analysis on a sample of the data to avoid memory issues
    const sampleData = await storage.getSensorDataByDumpId(dumpId, 1000);
    const issues = [];
    
    // Analyze temperature data
    const tempData = sampleData.filter(d => d.tempMP !== null);
    if (tempData.length > 0) {
      const highTemps = tempData.filter(d => d.tempMP! > 150);
      const lowTemps = tempData.filter(d => d.tempMP! < 50);
      
      if (highTemps.length > 0) {
        const maxTemp = Math.max(...highTemps.map(d => d.tempMP!));
        issues.push({
          issue: `High temperature detected: ${maxTemp.toFixed(1)}°F`,
          explanation: "Temperature exceeded safe operating limits",
          severity: 'critical',
          count: highTemps.length
        });
      }
      
      if (lowTemps.length > 0) {
        const minTemp = Math.min(...lowTemps.map(d => d.tempMP!));
        issues.push({
          issue: `Low temperature detected: ${minTemp.toFixed(1)}°F`,
          explanation: "Temperature below normal operating range",
          severity: 'warning',
          count: lowTemps.length
        });
      }
    }

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    const analysisResult = {
      overallStatus: criticalCount > 0 ? 'critical' as const : warningCount > 0 ? 'warning' as const : 'operational' as const,
      criticalIssues: criticalCount,
      warnings: warningCount,
      issues
    };

    // Store analysis results
    await storage.createAnalysisResults({
      dumpId,
      overallStatus: analysisResult.overallStatus,
      criticalIssues: analysisResult.criticalIssues,
      warnings: analysisResult.warnings,
      issues: analysisResult.issues as any
    });

    await storage.updateMemoryDumpStatus(dumpId, 'completed');
    console.log(`Successfully processed dump ${dumpId} with ${processed} records`);
    console.log(`Dump ${dumpId} status updated to: completed`);

  } catch (error: any) {
    console.error(`Error in streaming processing for dump ${dumpId}:`, error);
    await storage.updateMemoryDumpStatus(dumpId, 'error', error?.message);
    console.log(`Dump ${dumpId} status updated to: error`);
  } finally {
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Failed to delete uploaded file:', err);
    }
    
    // Final garbage collection
    if (global.gc) {
      global.gc();
    }
  }
}
