import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { BinaryParser } from "./services/binaryParser";
import { AnalysisEngine } from "./services/analysisEngine";
import { PDFGenerator } from "./services/pdfGenerator";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
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
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch memory dumps", error: error.message });
    }
  });

  // Upload binary files
  app.post("/api/memory-dumps/upload", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
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

        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          results.push({
            filename: file.originalname,
            status: 'error',
            error: error.message
          });
        }
      }

      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: "Upload failed", error: error.message });
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

      res.json({
        memoryDump,
        sensorData,
        analysisResults
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch memory dump", error: error.message });
    }
  });

  // Get analysis results for a memory dump
  app.get("/api/memory-dumps/:id/analysis", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysisResults = await storage.getAnalysisResultsByDumpId(id);
      
      if (!analysisResults) {
        return res.status(404).json({ message: "Analysis results not found" });
      }

      res.json(analysisResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis results", error: error.message });
    }
  });

  // Generate PDF report
  app.get("/api/memory-dumps/:id/report", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const memoryDump = await storage.getMemoryDump(id);
      const sensorData = await storage.getSensorDataByDumpId(id);
      const analysisResults = await storage.getAnalysisResultsByDumpId(id);
      
      if (!memoryDump || !analysisResults) {
        return res.status(404).json({ message: "Memory dump or analysis not found" });
      }

      const reportData = {
        filename: memoryDump.filename,
        processedAt: analysisResults.generatedAt,
        overallStatus: analysisResults.overallStatus,
        criticalIssues: analysisResults.criticalIssues,
        warnings: analysisResults.warnings,
        issues: analysisResults.issues as any[],
        sensorData
      };

      const reportBuffer = await PDFGenerator.generateReport(reportData);
      const filename = `NeuralDrill_Report_${memoryDump.filename.replace('.bin', '')}.${PDFGenerator.getReportExtension()}`;

      res.set({
        'Content-Type': PDFGenerator.getReportMimeType(),
        'Content-Disposition': `attachment; filename="${filename}"`
      });

      res.send(reportBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report", error: error.message });
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
    
    // Convert to sensor data format
    const sensorDataArray = BinaryParser.convertToSensorDataArray(parsedData, dumpId);
    
    // Store sensor data
    await storage.createSensorData(sensorDataArray);
    
    // Analyze the data
    const analysisResult = AnalysisEngine.analyzeData(sensorDataArray);
    
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

  } catch (error) {
    console.error(`Error processing memory dump ${dumpId}:`, error);
    await storage.updateMemoryDumpStatus(dumpId, 'error', error.message);
    
    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete uploaded file:', err);
    });
  }
}
