
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { BinaryParser } from "./services/binaryParser";
import { PDFGenerator } from "./services/pdfGenerator";

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}

interface MemoryDump {
  id: number;
  filename: string;
  fileType: string;
  status: 'processing' | 'completed' | 'error';
  uploadedAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}

interface ProcessedData {
  memoryDump: MemoryDump;
  sensorData: any[];
  analysisResults: any;
  deviceReport: any;
}

// In-memory storage
const memoryStore = new Map<number, ProcessedData>();
let currentId = 1;

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
      const dumps = Array.from(memoryStore.values())
        .map(data => data.memoryDump)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      res.json(dumps);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch memory dumps", error: error?.message });
    }
  });

  // Upload and process binary files immediately
  app.post("/api/memory-dumps/upload", upload.array('files'), async (req: any, res) => {
    try {
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Process all files immediately
      const results = await Promise.all(files.map(async (file: Express.Multer.File) => {
        try {
          const fileType = file.originalname.includes('MDG') ? 'MDG' : 
                          file.originalname.includes('MP') ? 'MP' : 'UNKNOWN';

          const id = currentId++;
          const memoryDump: MemoryDump = {
            id,
            filename: file.originalname,
            fileType,
            status: 'processing',
            uploadedAt: new Date()
          };

          // Start processing immediately
          processFileInMemory(id, file.path, file.originalname, fileType);

          return {
            id,
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
      }));

      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ message: "Upload failed", error: error?.message });
    }
  });

  // Get memory dump details with sensor data
  app.get("/api/memory-dumps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = memoryStore.get(id);

      if (!data) {
        return res.status(404).json({ message: "Memory dump not found" });
      }

      res.json({
        memoryDump: data.memoryDump,
        sensorData: data.sensorData,
        analysisResults: data.analysisResults,
        deviceReport: data.deviceReport
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch memory dump", error: error?.message });
    }
  });

  // Get analysis results for a memory dump
  app.get("/api/memory-dumps/:id/analysis", async (req, res) => {
    try {
      const { id } = req.params;
      const data = memoryStore.get(parseInt(id));

      if (!data || !data.analysisResults) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.json(data.analysisResults);
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
      const data = memoryStore.get(dumpId);

      if (!data) {
        return res.status(404).json({ error: "Memory dump not found" });
      }

      // Prepare report data
      const reportData = {
        filename: data.memoryDump.filename,
        processedAt: new Date(),
        overallStatus: data.analysisResults?.overallStatus || 'operational',
        criticalIssues: data.analysisResults?.criticalIssues || 0,
        warnings: data.analysisResults?.warnings || 0,
        issues: data.analysisResults?.issues || [],
        sensorData: data.sensorData.slice(0, 1000), // Limit for PDF
        deviceReport: data.deviceReport
      };

      // Generate PDF
      const pdfBuffer = await PDFGenerator.generateReport(reportData);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${data.memoryDump.filename}_report.pdf"`);
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
      memoryStore.clear();
      currentId = 1;

      // Clean up uploaded files
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

// Fast in-memory processing
async function processFileInMemory(dumpId: number, filePath: string, filename: string, fileType: string) {
  try {
    console.log(`🚀 Starting in-memory processing for ${filename}`);
    
    // Update status to processing
    const existingData = memoryStore.get(dumpId);
    if (existingData) {
      existingData.memoryDump.status = 'processing';
      memoryStore.set(dumpId, existingData);
    }

    // Extract device information from header
    const headerBuffer = Buffer.alloc(256);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, headerBuffer, 0, 256, 0);
    fs.closeSync(fd);

    const deviceInfo = BinaryParser.extractDeviceInfo(headerBuffer, filename, fileType);

    // Process file in smaller chunks to prevent memory issues
    const allSensorData: any[] = [];
    const CHUNK_SIZE = 5000; // Smaller chunks to prevent stack overflow
    let totalProcessed = 0;

    await BinaryParser.parseMemoryDumpStream(filePath, filename, fileType, CHUNK_SIZE, async (batch, batchIndex) => {
      try {
        console.log(`📊 Processing batch ${batchIndex + 1} with ${batch.RTD.length} records...`);
        
        // Convert to sensor data format and store in memory with better memory management
        const sensorDataBatch = BinaryParser.convertToSensorDataArray(batch, dumpId);
        
        // Use spread operator in smaller chunks to prevent stack overflow
        if (sensorDataBatch.length > 1000) {
          // Process in sub-chunks to avoid stack overflow
          for (let i = 0; i < sensorDataBatch.length; i += 1000) {
            const subChunk = sensorDataBatch.slice(i, i + 1000);
            allSensorData.push(...subChunk);
          }
        } else {
          allSensorData.push(...sensorDataBatch);
        }
        
        totalProcessed += batch.RTD.length;
        
        // Force garbage collection every few batches
        if (batchIndex % 5 === 0 && global.gc) {
          global.gc();
        }

        return true;
      } catch (error) {
        console.error(`❌ Error processing batch ${batchIndex}:`, error);
        return true; // Continue processing
      }
    });

    console.log(`✅ Processed ${allSensorData.length} total records for ${filename}`);
    
    // Force garbage collection after processing
    if (global.gc) {
      console.log(`🧹 Running garbage collection after processing ${allSensorData.length} records`);
      global.gc();
    }

    // Streaming analysis to avoid stack overflow with large datasets
    const issues = [];
    let maxTemp = -Infinity;
    let minTemp = Infinity;
    let highTempCount = 0;
    let lowTempCount = 0;
    let tempRecordCount = 0;

    // Process data in chunks to avoid memory issues
    const ANALYSIS_CHUNK_SIZE = 10000;
    for (let i = 0; i < allSensorData.length; i += ANALYSIS_CHUNK_SIZE) {
      const chunk = allSensorData.slice(i, i + ANALYSIS_CHUNK_SIZE);
      
      // Analyze temperature data in this chunk
      for (const record of chunk) {
        if (record.tempMP !== null) {
          tempRecordCount++;
          const temp = record.tempMP;
          
          if (temp > maxTemp) maxTemp = temp;
          if (temp < minTemp) minTemp = temp;
          
          if (temp > 150) highTempCount++;
          if (temp < 50) lowTempCount++;
        }
      }
    }

    // Generate issues based on streaming analysis
    if (tempRecordCount > 0) {
      if (highTempCount > 0) {
        issues.push({
          issue: `High temperature detected: ${maxTemp.toFixed(1)}°F`,
          explanation: "Temperature exceeded safe operating limits",
          severity: 'critical',
          count: highTempCount
        });
      }

      if (lowTempCount > 0) {
        issues.push({
          issue: `Low temperature detected: ${minTemp.toFixed(1)}°F`,
          explanation: "Temperature below normal operating range",
          severity: 'warning',
          count: lowTempCount
        });
      }
    }

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    const analysisResults = {
      id: dumpId,
      dumpId,
      overallStatus: criticalCount > 0 ? 'critical' as const : warningCount > 0 ? 'warning' as const : 'operational' as const,
      criticalIssues: criticalCount,
      warnings: warningCount,
      issues,
      generatedAt: new Date()
    };

    // Store everything in memory
    const processedData: ProcessedData = {
      memoryDump: {
        id: dumpId,
        filename,
        fileType,
        status: 'completed',
        uploadedAt: new Date(),
        processedAt: new Date()
      },
      sensorData: allSensorData,
      analysisResults,
      deviceReport: {
        id: dumpId,
        dumpId,
        generatedAt: new Date(),
        ...deviceInfo
      }
    };

    memoryStore.set(dumpId, processedData);

    console.log(`🎉 Successfully completed processing ${filename} with ${allSensorData.length} records`);
    console.log(`📊 Analysis: ${analysisResults.overallStatus} status with ${analysisResults.criticalIssues} critical issues`);

  } catch (error: any) {
    console.error(`💥 Error processing ${filename}:`, error);
    
    const errorData: ProcessedData = {
      memoryDump: {
        id: dumpId,
        filename,
        fileType,
        status: 'error',
        uploadedAt: new Date(),
        errorMessage: error?.message
      },
      sensorData: [],
      analysisResults: null,
      deviceReport: null
    };

    memoryStore.set(dumpId, errorData);
  } finally {
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('Failed to delete uploaded file:', err);
    }

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  }
}
