import { memoryDumps, sensorData, analysisResults, type MemoryDump, type InsertMemoryDump, type SensorData, type InsertSensorData, type AnalysisResults, type InsertAnalysisResults } from "@shared/schema";

export interface IStorage {
  // Memory Dumps
  createMemoryDump(dump: InsertMemoryDump): Promise<MemoryDump>;
  getMemoryDump(id: number): Promise<MemoryDump | undefined>;
  updateMemoryDumpStatus(id: number, status: string, errorMessage?: string): Promise<void>;
  getMemoryDumps(): Promise<MemoryDump[]>;
  
  // Sensor Data
  createSensorData(data: InsertSensorData[]): Promise<void>;
  getSensorDataByDumpId(dumpId: number): Promise<SensorData[]>;
  
  // Analysis Results
  createAnalysisResults(results: InsertAnalysisResults): Promise<AnalysisResults>;
  getAnalysisResultsByDumpId(dumpId: number): Promise<AnalysisResults | undefined>;
}

export class MemStorage implements IStorage {
  private memoryDumps: Map<number, MemoryDump>;
  private sensorData: Map<number, SensorData[]>;
  private analysisResults: Map<number, AnalysisResults>;
  private currentId: number;

  constructor() {
    this.memoryDumps = new Map();
    this.sensorData = new Map();
    this.analysisResults = new Map();
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

  async createSensorData(data: InsertSensorData[]): Promise<void> {
    data.forEach(entry => {
      const dumpId = entry.dumpId;
      if (!this.sensorData.has(dumpId)) {
        this.sensorData.set(dumpId, []);
      }
      const sensorEntry: SensorData = {
        ...entry,
        id: this.currentId++,
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
      generatedAt: new Date(),
    };
    this.analysisResults.set(insertResults.dumpId, results);
    return results;
  }

  async getAnalysisResultsByDumpId(dumpId: number): Promise<AnalysisResults | undefined> {
    return this.analysisResults.get(dumpId);
  }
}

export const storage = new MemStorage();
