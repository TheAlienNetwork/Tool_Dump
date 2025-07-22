import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { BinaryParser } from "./services/binaryParser";
import { AnalysisEngine } from "./services/analysisEngine";
import { PDFGenerator } from "./services/pdfGenerator";

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
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

      const results = [];

      for (const file of files) {
        try {
          // Determine file type from filename
          const fileType = file.originalname.includes('MDG') ? 'MDG' : 
                          file.originalname.includes('MP') ? 'MP' : 'UNKNOWN';

          // Create memory dump record
          const memoryDump = await storage.createMemoryDump({
            filename: file.originalname,
            fileType: fileType
          });

          // Start processing in background
          processMemoryDumpAsync(memoryDump.id, file.path, file.originalname, fileType).catch(error => {
            console.error(`Background processing failed for dump ${memoryDump.id}:`, error);
          });

          results.push({
            id: memoryDump.id,
            filename: file.originalname,
            status: 'processing',
            fileType
          });

        } catch (error: any) {
          console.error(`Error processing file ${file.originalname}:`, error);
          results.push({
            filename: file.originalname,
            status: 'error',
            error: error?.message
          });
        }
      }

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

      // Get sensor data
      const sensorData = await storage.getSensorData(dumpId);

      // Get device report
      const deviceReport = await storage.getDeviceReport(dumpId);

      // Prepare report data with proper type conversions
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

      // Set response headers
      res.setHeader('Content-Type', PDFGenerator.getReportMimeType());
      res.setHeader('Content-Disposition', `attachment; filename="memory-dump-report-${dumpId}.${PDFGenerator.getReportExtension()}"`);
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

// Background processing function with enhanced memory management
async function processMemoryDumpAsync(dumpId: number, filePath: string, filename: string, fileType: string) {
  let buffer: Buffer | null = null;
  let parsedData: any = null;
  
  try {
    await storage.updateMemoryDumpStatus(dumpId, 'processing');

    // Check available memory before processing
    const initialMemory = process.memoryUsage();
    console.log(`Starting processing for dump ${dumpId}. Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);

    // Parse the binary file with memory optimization
    parsedData = await BinaryParser.parseMemoryDump(filePath, filename, fileType);

    // Extract device information and store it
    buffer = fs.readFileSync(filePath);
    const deviceInfo = BinaryParser.extractDeviceInfo(buffer, filename, fileType);
    deviceInfo.dumpId = dumpId;
    await storage.createDeviceReport(deviceInfo);
    
    // Clear buffer from memory immediately
    buffer = null;

    // Convert to sensor data format with smaller batch processing
    const sensorDataArray = BinaryParser.convertToSensorDataArray(parsedData, dumpId);
    
    // Clear parsed data from memory
    parsedData = null;

    // Store sensor data in smaller batches to prevent memory issues
    const batchSize = 250; // Further reduced batch size
    console.log(`Processing ${sensorDataArray.length} records in batches of ${batchSize}`);
    
    for (let i = 0; i < sensorDataArray.length; i += batchSize) {
      try {
        const batch = sensorDataArray.slice(i, i + batchSize);
        await storage.createSensorData(batch);
        
        // More aggressive garbage collection
        if (i % (batchSize * 2) === 0) {
          if (global.gc) {
            global.gc();
          }
          // Longer delay to reduce memory pressure
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Check memory usage
          const currentMemory = process.memoryUsage();
          console.log(`Processed ${i + batch.length} records. Memory: ${Math.round(currentMemory.heapUsed / 1024 / 1024)}MB`);
          
          // If memory usage is too high, force a longer pause
          if (currentMemory.heapUsed > 800 * 1024 * 1024) { // 800MB threshold
            console.log('High memory usage detected, pausing...');
            await new Promise(resolve => setTimeout(resolve, 200));
            if (global.gc) {
              global.gc();
            }
          }
        }
      } catch (batchError) {
        console.error(`Error processing batch starting at ${i}:`, batchError);
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    // Final memory cleanup
    if (global.gc) {
      global.gc();
    }

    // Get stored sensor data for analysis (limit to prevent memory issues)
    const storedSensorData = await storage.getSensorDataByDumpId(dumpId, 10000); // Limit to 10k records for analysis
    
    // Simple analysis without recursion - count issues from real data
    const issues = [];
    const tempData = storedSensorData.filter(d => d.tempMP !== null);
    
    if (tempData.length > 0) {
      const highTemps = tempData.filter(d => d.tempMP! > 130);
      const lowTemps = tempData.filter(d => d.tempMP! < 100);
      
      if (highTemps.length > 0) {
        const maxTemp = highTemps.reduce((max, d) => Math.max(max, d.tempMP!), -Infinity);
        issues.push({
          issue: `High temperature detected: ${maxTemp.toFixed(1)}°F`,
          explanation: "Temperature exceeded safe operating limits",
          severity: 'critical',
          count: highTemps.length
        });
      }
      
      if (lowTemps.length > 0) {
        const minTemp = lowTemps.reduce((min, d) => Math.min(min, d.tempMP!), Infinity);
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

    // Final cleanup
    const finalMemory = process.memoryUsage();
    console.log(`Completed processing for dump ${dumpId}. Final memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);

    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete uploaded file:', err);
    });

  } catch (error: any) {
    console.error(`Error processing memory dump ${dumpId}:`, error);
    await storage.updateMemoryDumpStatus(dumpId, 'error', error?.message);

    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete uploaded file:', err);
    });
  } finally {
    // Ensure cleanup even if there's an error
    buffer = null;
    parsedData = null;
    if (global.gc) {
      global.gc();
    }
  }
}