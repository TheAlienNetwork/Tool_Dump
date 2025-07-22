import { memoryDumps, sensorData, analysisResults, deviceReports, type MemoryDump, type InsertMemoryDump, type SensorData, type InsertSensorData, type AnalysisResults, type InsertAnalysisResults, type DeviceReport, type InsertDeviceReport } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Memory Dumps
  createMemoryDump(dump: InsertMemoryDump): Promise<MemoryDump>;
  getMemoryDump(id: number): Promise<MemoryDump | undefined>;
  updateMemoryDumpStatus(id: number, status: string, errorMessage?: string): Promise<void>;
  getMemoryDumps(): Promise<MemoryDump[]>;
  clearAllMemoryDumps(): Promise<void>;

  // Sensor Data
  createSensorData(data: InsertSensorData[]): Promise<void>;
  getSensorDataByDumpId(dumpId: number): Promise<SensorData[]>;

  // Analysis Results
  createAnalysisResults(results: InsertAnalysisResults): Promise<AnalysisResults>;
  getAnalysisResultsByDumpId(dumpId: number): Promise<AnalysisResults | undefined>;

  // Device Reports
  createDeviceReport(report: InsertDeviceReport): Promise<DeviceReport>;
  getDeviceReportByDumpId(dumpId: number): Promise<DeviceReport | undefined>;
}

export class MemStorage implements IStorage {
  private memoryDumps: Map<number, MemoryDump>;
  private sensorData: Map<number, SensorData[]>;
  private analysisResults: Map<number, AnalysisResults>;
  private deviceReports: Map<number, DeviceReport>;
  private currentId: number;

  constructor() {
    this.memoryDumps = new Map();
    this.sensorData = new Map();
    this.analysisResults = new Map();
    this.deviceReports = new Map();
    this.currentId = 1;
  }

  async createMemoryDump(insertDump: InsertMemoryDump): Promise<MemoryDump> {
    const id = this.currentId++;
    const dump: MemoryDump = {
      ...insertDump,
      id,
      uploadedAt: new Date(),
      processedAt: null,
      status: "pending",
      errorMessage: null,
    };
    this.memoryDumps.set(id, dump);
    return dump;
  }

  async getMemoryDump(id: number): Promise<MemoryDump | undefined> {
    return this.memoryDumps.get(id);
  }

  async updateMemoryDumpStatus(id: number, status: string, errorMessage?: string): Promise<void> {
    const dump = this.memoryDumps.get(id);
    if (dump) {
      dump.status = status;
      dump.errorMessage = errorMessage || null;
      if (status === "completed") {
        dump.processedAt = new Date();
      }
      this.memoryDumps.set(id, dump);
    }
  }

  async getMemoryDumps(): Promise<MemoryDump[]> {
    return Array.from(this.memoryDumps.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async clearAllMemoryDumps(): Promise<void> {
    this.memoryDumps.clear();
    this.sensorData.clear();
    this.analysisResults.clear();
    this.deviceReports.clear();
    this.currentId = 1;
  }

  async createSensorData(data: InsertSensorData[]): Promise<void> {
    data.forEach(entry => {
      const dumpId = entry.dumpId;
      if (!this.sensorData.has(dumpId)) {
        this.sensorData.set(dumpId, []);
      }
      const sensorEntry: SensorData = {
        ...entry,
        id: this.currentId++,
        tempMP: entry.tempMP ?? null,
        resetMP: entry.resetMP ?? null,
        batteryCurrMP: entry.batteryCurrMP ?? null,
        batteryVoltMP: entry.batteryVoltMP ?? null,
        flowStatus: entry.flowStatus ?? null,
        maxX: entry.maxX ?? null,
        maxY: entry.maxY ?? null,
        maxZ: entry.maxZ ?? null,
        threshold: entry.threshold ?? null,
        motorMin: entry.motorMin ?? null,
        motorAvg: entry.motorAvg ?? null,
        motorMax: entry.motorMax ?? null,
        motorHall: entry.motorHall ?? null,
        actuationTime: entry.actuationTime ?? null,
        accelAX: entry.accelAX ?? null,
        accelAY: entry.accelAY ?? null,
        accelAZ: entry.accelAZ ?? null,
        shockZ: entry.shockZ ?? null,
        shockX: entry.shockX ?? null,
        shockY: entry.shockY ?? null,
        shockCountAxial50: entry.shockCountAxial50 ?? null,
        shockCountAxial100: entry.shockCountAxial100 ?? null,
        shockCountLat50: entry.shockCountLat50 ?? null,
        shockCountLat100: entry.shockCountLat100 ?? null,
        rotRpmMax: entry.rotRpmMax ?? null,
        rotRpmAvg: entry.rotRpmAvg ?? null,
        rotRpmMin: entry.rotRpmMin ?? null,
        v3_3VA_DI: entry.v3_3VA_DI ?? null,
        v5VD: entry.v5VD ?? null,
        v3_3VD: entry.v3_3VD ?? null,
        v1_9VD: entry.v1_9VD ?? null,
        v1_5VD: entry.v1_5VD ?? null,
        v1_8VA: entry.v1_8VA ?? null,
        v3_3VA: entry.v3_3VA ?? null,
        vBatt: entry.vBatt ?? null,
        i5VD: entry.i5VD ?? null,
        i3_3VD: entry.i3_3VD ?? null,
        iBatt: entry.iBatt ?? null,
        gamma: entry.gamma ?? null,
        accelStabX: entry.accelStabX ?? null,
        accelStabY: entry.accelStabY ?? null,
        accelStabZ: entry.accelStabZ ?? null,
        accelStabZH: entry.accelStabZH ?? null,
        surveyTGF: entry.surveyTGF ?? null,
        surveyTMF: entry.surveyTMF ?? null,
        surveyDipA: entry.surveyDipA ?? null,
        surveyINC: entry.surveyINC ?? null,
        surveyCINC: entry.surveyCINC ?? null,
        surveyAZM: entry.surveyAZM ?? null,
        surveyCAZM: entry.surveyCAZM ?? null,
      };
      this.sensorData.get(dumpId)!.push(sensorEntry);
    });
  }

  async getSensorDataByDumpId(dumpId: number): Promise<SensorData[]> {
    return this.sensorData.get(dumpId) || [];
  }

  async createAnalysisResults(insertResults: InsertAnalysisResults): Promise<AnalysisResults> {
    const id = this.currentId++;
    const results: AnalysisResults = {
      ...insertResults,
      id,
      criticalIssues: insertResults.criticalIssues ?? 0,
      warnings: insertResults.warnings ?? 0,
      generatedAt: new Date(),
    };
    this.analysisResults.set(insertResults.dumpId, results);
    return results;
  }

  async getAnalysisResultsByDumpId(dumpId: number): Promise<AnalysisResults | undefined> {
    return this.analysisResults.get(dumpId);
  }

  async createDeviceReport(insertReport: InsertDeviceReport): Promise<DeviceReport> {
    const id = this.currentId++;
    const report: DeviceReport = {
      id,
      dumpId: insertReport.dumpId,
      generatedAt: new Date(),
      mpSerialNumber: insertReport.mpSerialNumber ?? null,
      mpFirmwareVersion: insertReport.mpFirmwareVersion ?? null,
      mdgSerialNumber: insertReport.mdgSerialNumber ?? null,
      mdgFirmwareVersion: insertReport.mdgFirmwareVersion ?? null,
      mpMaxTempFahrenheit: insertReport.mpMaxTempFahrenheit ?? null,
      mpMaxTempCelsius: insertReport.mpMaxTempCelsius ?? null,
      circulationHours: insertReport.circulationHours ?? null,
      numberOfPulses: insertReport.numberOfPulses ?? null,
      motorOnTimeMinutes: insertReport.motorOnTimeMinutes ?? null,
      commErrorsTimeMinutes: insertReport.commErrorsTimeMinutes ?? null,
      commErrorsPercent: insertReport.commErrorsPercent ?? null,
      hallStatusTimeMinutes: insertReport.hallStatusTimeMinutes ?? null,
      hallStatusPercent: insertReport.hallStatusPercent ?? null,
      mdgMaxTempFahrenheit: insertReport.mdgMaxTempFahrenheit ?? null,
      mdgMaxTempCelsius: insertReport.mdgMaxTempCelsius ?? null,
      mdgEdtTotalHours: insertReport.mdgEdtTotalHours ?? null,
      mdgExtremeShockIndex: insertReport.mdgExtremeShockIndex ?? null,
    };
    this.deviceReports.set(insertReport.dumpId, report);
    return report;
  }

  async getDeviceReportByDumpId(dumpId: number): Promise<DeviceReport | undefined> {
    return this.deviceReports.get(dumpId);
  }

  // Additional methods needed by routes
  async getSensorData(dumpId: number): Promise<SensorData[]> {
    return this.getSensorDataByDumpId(dumpId);
  }

  async getAnalysisResult(dumpId: number): Promise<AnalysisResults | undefined> {
    return this.getAnalysisResultsByDumpId(dumpId);
  }

  async getDeviceReport(dumpId: number): Promise<DeviceReport | undefined> {
    return this.getDeviceReportByDumpId(dumpId);
  }
}

export class DatabaseStorage implements IStorage {
  async createMemoryDump(insertDump: InsertMemoryDump): Promise<MemoryDump> {
    const [dump] = await db.insert(memoryDumps).values(insertDump).returning();
    return dump;
  }

  async getMemoryDump(id: number): Promise<MemoryDump | undefined> {
    const [dump] = await db.select().from(memoryDumps).where(eq(memoryDumps.id, id));
    return dump;
  }

  async updateMemoryDumpStatus(id: number, status: string, errorMessage?: string): Promise<void> {
    const updateData: any = { status };
    if (errorMessage) updateData.errorMessage = errorMessage;
    if (status === "completed") updateData.processedAt = new Date();

    await db.update(memoryDumps)
      .set(updateData)
      .where(eq(memoryDumps.id, id));
  }

  async getMemoryDumps(): Promise<MemoryDump[]> {
    return await db.select().from(memoryDumps).orderBy(desc(memoryDumps.uploadedAt));
  }

  async clearAllMemoryDumps(): Promise<void> {
    // Delete in reverse order to respect foreign key constraints
    await db.delete(deviceReports);
    await db.delete(analysisResults);
    await db.delete(sensorData);
    await db.delete(memoryDumps);
  }

  async createSensorData(data: InsertSensorData[]): Promise<void> {
    if (data.length > 0) {
      await db.insert(sensorData).values(data);
    }
  }

  async getSensorDataByDumpId(dumpId: number): Promise<SensorData[]> {
    return await db.select().from(sensorData).where(eq(sensorData.dumpId, dumpId));
  }

  async createAnalysisResults(insertResults: InsertAnalysisResults): Promise<AnalysisResults> {
    const [results] = await db.insert(analysisResults).values(insertResults).returning();
    return results;
  }

  async getAnalysisResultsByDumpId(dumpId: number): Promise<AnalysisResults | undefined> {
    const [results] = await db.select().from(analysisResults).where(eq(analysisResults.dumpId, dumpId));
    return results;
  }

  async createDeviceReport(insertReport: InsertDeviceReport): Promise<DeviceReport> {
    const [report] = await db.insert(deviceReports).values(insertReport).returning();
    return report;
  }

  async getDeviceReportByDumpId(dumpId: number): Promise<DeviceReport | undefined> {
    const [report] = await db.select().from(deviceReports).where(eq(deviceReports.dumpId, dumpId));
    return report;
  }

  // Additional methods needed by routes
  async getSensorData(dumpId: number): Promise<SensorData[]> {
    return this.getSensorDataByDumpId(dumpId);
  }

  async getAnalysisResult(dumpId: number): Promise<AnalysisResults | undefined> {
    return this.getAnalysisResultsByDumpId(dumpId);
  }

  async getDeviceReport(dumpId: number): Promise<DeviceReport | undefined> {
    return this.getDeviceReportByDumpId(dumpId);
  }
}

export const storage = new DatabaseStorage();