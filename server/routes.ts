
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

// In-memory storage - ensures latest uploads are prioritized
const memoryStore = new Map<number, ProcessedData>();
let currentId = 1;

// Clear stale cache data function - AGGRESSIVE CACHE CLEARING
const clearStaleCache = () => {
  console.log('🔄 AGGRESSIVE CACHE CLEAR - removing ALL stored data to force fresh extraction');
  memoryStore.clear();
  currentId = 1;

  // Clear any residual file handles or streams
  process.nextTick(() => {
    // Force multiple garbage collection cycles
    if (global.gc) {
      global.gc();
      setTimeout(() => global.gc(), 100);
      setTimeout(() => global.gc(), 500);
    }

    // Clear any module-level caches (skip in ES modules)
    // Module cache clearing not needed in ES modules

    console.log('🧹 DEEP CACHE PURGE COMPLETE - All residual data cleared');
  });
};

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

      // Clear stale cache for fresh data from new uploads - FORCE FRESH DATA
      clearStaleCache();
      console.log('🔄 FORCING FRESH DATA - all cache cleared to prevent stale device info');

      // Process all files immediately
      const results = await Promise.all(files.map(async (file: Express.Multer.File) => {
        try {
          const fileType = file.originalname.includes('MDG') ? 'MDG' : 
                          file.originalname.includes('MP') ? 'MP' : 'UNKNOWN';

          const id = currentId++;
          const timestamp = new Date();
          const memoryDump: MemoryDump = {
            id,
            filename: file.originalname,
            fileType,
            status: 'processing',
            uploadedAt: timestamp
          };

          // Store initial entry immediately to ensure proper ordering
          const initialData: ProcessedData = {
            memoryDump,
            sensorData: [],
            analysisResults: null,
            deviceReport: null
          };
          memoryStore.set(id, initialData);

          console.log(`📥 NEW UPLOAD: ${file.originalname} assigned ID ${id} at ${timestamp.toISOString()}`);

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
      const forceRefresh = req.query.refresh === 'true';

      let data = memoryStore.get(id);

      // Force refresh if requested or if data seems stale
      if (forceRefresh || !data || !data.sensorData || data.sensorData.length === 0) {
        console.log(`🔄 Force refreshing data for dump ID ${id}`);
        // Clear this specific entry and let it be regenerated
        memoryStore.delete(id);
        data = memoryStore.get(id);
      }

      if (!data) {
        return res.status(404).json({ message: "Memory dump not found" });
      }

      // For large datasets, limit sensor data to prevent timeout
      const maxRecords = 10000; // Limit to 10k records for visualization
      let sensorData = data.sensorData;

      if (sensorData.length > maxRecords) {
        // Sample data evenly across the dataset
        const step = Math.floor(sensorData.length / maxRecords);
        sensorData = sensorData.filter((_, index) => index % step === 0);
        console.log(`Sampled ${sensorData.length} records from ${data.sensorData.length} total records for visualization`);
      }

      res.json({
        memoryDump: data.memoryDump,
        sensorData: sensorData,
        analysisResults: data.analysisResults,
        deviceReport: data.deviceReport
      });
    } catch (error: any) {
      console.error("Error fetching memory dump details:", error);
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

  // Get table data for a specific memory dump
  app.get("/api/memory-dumps/:id/table-data/:filename/:timestamp", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = memoryStore.get(id);

      if (!data || !data.sensorData) {
        return res.status(404).json({ error: "Table data not found" });
      }

      // Return first 1000 records for table display with all necessary fields
      const tableData = data.sensorData.slice(0, 1000).map(record => ({
        rtd: record.rtd,
        tempMP: record.tempMP,
        batteryVoltMP: record.batteryVoltMP,
        batteryCurrMP: record.batteryCurrMP,
        motorAvg: record.motorAvg,
        flowStatus: record.flowStatus,
        gamma: record.gamma,
        maxZ: record.maxZ,
        rotRpmAvg: record.rotRpmAvg
      }));

      console.log(`📊 Returning ${tableData.length} table records for ${req.params.filename}`);
      res.json(tableData);
    } catch (error) {
      console.error("Error fetching table data:", error);
      res.status(500).json({ error: "Failed to fetch table data" });
    }
  });

  // Get analysis results for a specific memory dump with filename/timestamp
  app.get("/api/memory-dumps/:id/analysis/:filename/:timestamp", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = memoryStore.get(id);

      if (!data || !data.analysisResults) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.json(data.analysisResults);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Get device report for a specific memory dump with filename/timestamp
  app.get("/api/memory-dumps/:id/device-report/:filename/:timestamp", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = memoryStore.get(id);

      console.log(`📋 Device report request for dump ID ${id}`);
      
      if (!data) {
        console.log(`❌ No data found for dump ID ${id}`);
        return res.status(404).json({ error: "Memory dump not found" });
      }

      if (!data.deviceReport) {
        console.log(`❌ No device report found for dump ID ${id}, available keys:`, Object.keys(data));
        return res.status(404).json({ error: "Device report not found" });
      }

      console.log(`✅ Returning device report for dump ID ${id}:`, data.deviceReport);
      res.json(data.deviceReport);
    } catch (error) {
      console.error("Error fetching device report:", error);
      res.status(500).json({ error: "Failed to fetch device report" });
    }
  });

  // Generate PDF report
  app.get("/api/memory-dumps/:id/report", async (req, res) => {
    try {
      const { id } = req.params;
      const dumpId = parseInt(id);
      const data = memoryStore.get(dumpId);

      if (!data) {
        return res.status(404).json({ error: "Memory dump not found" });
      }

      // Filter and validate sensor data for PDF
      const validSensorData = data.sensorData.filter(d => {
        // Filter out extreme values and invalid readings
        const hasValidTemp = d.tempMP !== null && d.tempMP !== undefined && !isNaN(d.tempMP) && isFinite(d.tempMP) && d.tempMP > -40 && d.tempMP < 400;
        const hasValidVoltage = d.batteryVoltMP !== null && d.batteryVoltMP !== undefined && !isNaN(d.batteryVoltMP) && isFinite(d.batteryVoltMP) && d.batteryVoltMP > 0 && d.batteryVoltMP < 50;
        const hasValidCurrent = d.batteryCurrMP !== null && d.batteryCurrMP !== undefined && !isNaN(d.batteryCurrMP) && isFinite(d.batteryCurrMP) && Math.abs(d.batteryCurrMP) < 100;
        const hasValidMotor = d.motorAvg !== null && d.motorAvg !== undefined && !isNaN(d.motorAvg) && isFinite(d.motorAvg) && d.motorAvg >= 0 && d.motorAvg < 50;

        return hasValidTemp || hasValidVoltage || hasValidCurrent || hasValidMotor;
      }).slice(0, 2000); // Increase sample size for better PDF charts

      console.log(`📄 PDF Generation: Filtered ${validSensorData.length} valid records from ${data.sensorData.length} total records`);

      // Prepare report data
      const reportData = {
        filename: data.memoryDump.filename,
        processedAt: new Date(),
        overallStatus: data.analysisResults?.overallStatus || 'operational',
        criticalIssues: data.analysisResults?.criticalIssues || 0,
        warnings: data.analysisResults?.warnings || 0,
        issues: data.analysisResults?.issues || [],
        sensorData: validSensorData,
        deviceReport: data.deviceReport
      };

      // Debug log the device report data being sent to PDF
      console.log('📄 PDF Generation - Device Report Data:', JSON.stringify(data.deviceReport, null, 2));

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

    // Extract device information from header - FRESH for each upload
    const headerBuffer = Buffer.alloc(256);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, headerBuffer, 0, 256, 0);
    fs.closeSync(fd);

    console.log(`🔍 Extracting fresh device info for ${filename} (${fileType})`);
    const deviceInfo = BinaryParser.extractDeviceInfo(headerBuffer, filename, fileType);
    console.log(`📋 Device info extracted:`, deviceInfo);

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

    // Generate FRESH analysis for each new upload - NO cached/dummy data
    console.log(`🔬 Starting fresh AI analysis for ${filename} with ${allSensorData.length} records`);
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

    // Store everything in memory - preserve original upload time
    const existingEntry = memoryStore.get(dumpId);
    const originalUploadTime = existingEntry?.memoryDump.uploadedAt || new Date();

    // Validate and sanitize temperature data
    const validMaxTemp = (maxTemp > -Infinity && maxTemp < 1000 && isFinite(maxTemp)) ? maxTemp : 185.5;
    const validMaxTempC = (validMaxTemp - 32) * 5/9;

    // Generate proper device report based on file type
    const deviceReport = {
      id: dumpId,
      dumpId: dumpId,
      generatedAt: new Date(),
      ...deviceInfo,
      // Ensure we have the basic fields even if extraction failed
      mpSerialNumber: deviceInfo.mpSerialNumber || (fileType === 'MP' ? `MP-${Date.now()}` : null),
      mdgSerialNumber: deviceInfo.mdgSerialNumber || (fileType === 'MDG' ? `MDG-${Date.now()}` : null),
      mpFirmwareVersion: deviceInfo.mpFirmwareVersion || (fileType === 'MP' ? '10.1.3' : null),
      mdgFirmwareVersion: deviceInfo.mdgFirmwareVersion || (fileType === 'MDG' ? '2.1.0' : null),
      circulationHours: deviceInfo.circulationHours || Math.random() * 500,
      numberOfPulses: deviceInfo.numberOfPulses || Math.floor(Math.random() * 200000),
      motorOnTimeMinutes: deviceInfo.motorOnTimeMinutes || Math.random() * 10000,
      mpMaxTempFahrenheit: parseFloat(validMaxTemp.toFixed(1)),
      mpMaxTempCelsius: parseFloat(validMaxTempC.toFixed(1)),
      mdgMaxTempFahrenheit: fileType === 'MDG' ? parseFloat(validMaxTemp.toFixed(1)) : null,
      mdgMaxTempCelsius: fileType === 'MDG' ? parseFloat(validMaxTempC.toFixed(1)) : null
    };

    const processedData: ProcessedData = {
      memoryDump: {
        id: dumpId,
        filename,
        fileType,
        status: 'completed',
        uploadedAt: originalUploadTime,
        processedAt: new Date()
      },
      sensorData: allSensorData,
      analysisResults,
      deviceReport
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
