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
          processMemoryDumpAsync(memoryDump.id, file.path, file.originalname, fileType);

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

      // Prepare report data
      const reportData = {
        filename: memoryDump.filename,
        processedAt: new Date(),
        overallStatus: analysis.overallStatus,
        criticalIssues: analysis.criticalIssues,
        warnings: analysis.warnings,
        issues: analysis.issues as any,
        sensorData: sensorData || [],
        deviceReport: deviceReport || undefined
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

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processMemoryDumpAsync(dumpId: number, filePath: string, filename: string, fileType: string) {
  try {
    await storage.updateMemoryDumpStatus(dumpId, 'processing');

    // Parse the binary file
    const parsedData = await BinaryParser.parseMemoryDump(filePath, filename, fileType);

    // Extract device information and store it
    const deviceInfo = BinaryParser.extractDeviceInfo(
      fs.readFileSync(filePath), 
      filename, 
      fileType
    );
    deviceInfo.dumpId = dumpId;
    await storage.createDeviceReport(deviceInfo);

    // Convert to sensor data format
    const sensorDataArray = BinaryParser.convertToSensorDataArray(parsedData, dumpId);

    // Store sensor data in batches for large datasets (optimization for speed)
    const batchSize = 1000; // Process 1000 records at a time
    for (let i = 0; i < sensorDataArray.length; i += batchSize) {
      const batch = sensorDataArray.slice(i, i + batchSize);
      await storage.createSensorData(batch);
    }

    // Get stored sensor data for analysis
    const storedSensorData = await storage.getSensorDataByDumpId(dumpId);
    const analysisResult = AnalysisEngine.analyzeData(storedSensorData);

    // Store analysis results
    await storage.createAnalysisResults({
      dumpId,
      overallStatus: analysisResult.overallStatus,
      criticalIssues: analysisResult.criticalIssues,
      warnings: analysisResult.warnings,
      issues: analysisResult.issues as any
    });

    await storage.updateMemoryDumpStatus(dumpId, 'completed');

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
  }
}