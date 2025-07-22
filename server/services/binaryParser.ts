import fs from 'fs';
import { InsertDeviceReport, InsertSensorData } from '@shared/schema';

export interface ParsedData {
  RTD: Date[];
  TempMP: number[];
  ResetMP: number[];
  BatteryCurrMP: number[];
  BatteryVoltMP: number[];
  FlowStatus: string[];
  MaxX: number[];
  MaxY: number[];
  MaxZ: number[];
  Threshold: number[];
  MotorMin: number[];
  MotorAvg: number[];
  MotorMax: number[];
  MotorHall: number[];
  ActuationTime: number[];
  AccelAX: number[];
  AccelAY: number[];
  AccelAZ: number[];
  ShockZ: number[];
  ShockX: number[];
  ShockY: number[];
  ShockCountAxial50: number[];
  ShockCountAxial100: number[];
  ShockCountLat50: number[];
  ShockCountLat100: number[];
  RotRpmMax: number[];
  RotRpmAvg: number[];
  RotRpmMin: number[];
  V3_3VA_DI: number[];
  V5VD: number[];
  V3_3VD: number[];
  V1_9VD: number[];
  V1_5VD: number[];
  V1_8VA: number[];
  V3_3VA: number[];
  VBatt: number[];
  I5VD: number[];
  I3_3VD: number[];
  IBatt: number[];
  Gamma: number[];
  AccelStabX: number[];
  AccelStabY: number[];
  AccelStabZ: number[];
  AccelStabZH: number[];
  SurveyTGF: number[];
  SurveyTMF: number[];
  SurveyDipA: number[];
  SurveyINC: number[];
  SurveyCINC: number[];
  SurveyAZM: number[];
  SurveyCAZM: number[];
}

export class BinaryParser {
  static async parseMemoryDump(filePath: string, filename: string, fileType: string): Promise<ParsedData> {
    try {
      // Check file size before processing
      const stats = fs.statSync(filePath);
      if (stats.size > 50 * 1024 * 1024) { // Reduced to 50MB limit
        throw new Error(`File too large: ${stats.size} bytes. Maximum allowed: 50MB`);
      }

      console.log(`Starting to parse ${fileType} file: ${filename} (${stats.size} bytes)`);
      
      // Initialize data structure with limited initial capacity
      const data: ParsedData = {
        RTD: [], 
        TempMP: [], 
        ResetMP: [], 
        BatteryCurrMP: [], 
        BatteryVoltMP: [], 
        FlowStatus: [],
        MaxX: [], 
        MaxY: [], 
        MaxZ: [], 
        Threshold: [],
        MotorMin: [], 
        MotorAvg: [], 
        MotorMax: [], 
        MotorHall: [], 
        ActuationTime: [],
        AccelAX: [], 
        AccelAY: [], 
        AccelAZ: [],
        ShockZ: [], 
        ShockX: [], 
        ShockY: [],
        ShockCountAxial50: [], 
        ShockCountAxial100: [], 
        ShockCountLat50: [], 
        ShockCountLat100: [],
        RotRpmMax: [], 
        RotRpmAvg: [], 
        RotRpmMin: [],
        V3_3VA_DI: [], 
        V5VD: [], 
        V3_3VD: [], 
        V1_9VD: [], 
        V1_5VD: [], 
        V1_8VA: [], 
        V3_3VA: [], 
        VBatt: [],
        I5VD: [], 
        I3_3VD: [], 
        IBatt: [],
        Gamma: [],
        AccelStabX: [], 
        AccelStabY: [], 
        AccelStabZ: [], 
        AccelStabZH: [],
        SurveyTGF: [], 
        SurveyTMF: [], 
        SurveyDipA: [], 
        SurveyINC: [], 
        SurveyCINC: [], 
        SurveyAZM: [], 
        SurveyCAZM: []
      };

      // Parse based on device type with streaming approach
      if (fileType === 'MDG') {
        await this.parseMDGFileStreaming(filePath, data, filename);
      } else if (fileType === 'MP') {
        await this.parseMPFileStreaming(filePath, data, filename);
      }
      
      // Force garbage collection after parsing
      if (global.gc) {
        global.gc();
      }
      
      console.log(`Completed parsing ${fileType} file: ${data.RTD.length} records`);
      return data;
    } catch (error: any) {
      console.error(`Error parsing binary file ${filename}:`, error);
      throw new Error(`Failed to parse binary file ${filename}: ${error.message}`);
    }
  }

  // Parse MDG file format with streaming to reduce memory usage
  static async parseMDGFileStreaming(filePath: string, data: ParsedData, filename: string) {
    const headerSize = 256;
    const recordSize = 128; // MDG record size
    const chunkSize = 64 * 1024; // 64KB chunks
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const numRecords = Math.floor((stats.size - headerSize) / recordSize);
    
    console.log(`Parsing MDG file: ${numRecords} records`);
    
    // Extract base timestamp from filename
    const baseTime = this.extractTimestamp(filename);
    
    // Read file in chunks to avoid loading entire file into memory
    const fd = fs.openSync(filePath, 'r');
    let currentOffset = headerSize;
    let recordIndex = 0;
    
    try {
      while (currentOffset < stats.size && recordIndex < numRecords) {
        // Read chunk
        const buffer = Buffer.alloc(Math.min(chunkSize, stats.size - currentOffset));
        const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, currentOffset);
        
        // Process records in this chunk
        let bufferOffset = 0;
        while (bufferOffset + recordSize <= bytesRead && recordIndex < numRecords) {
          // Time progression (2 second intervals for MDG)
          data.RTD.push(new Date(baseTime.getTime() + (recordIndex * 2000)));
          
          // MP-specific fields (not available in MDG) - set to null
          data.TempMP.push(null);
          data.BatteryCurrMP.push(null);
          data.BatteryVoltMP.push(null);
          data.FlowStatus.push(null);
          data.MaxX.push(null);
          data.MaxY.push(null);
          data.MaxZ.push(null);
          data.Threshold.push(null);
          data.MotorMin.push(null);
          data.MotorAvg.push(null);
          data.MotorMax.push(null);
          data.MotorHall.push(null);
          data.ActuationTime.push(null);
          
          // MDG Accel data
          data.AccelAX.push(this.readFloat32LE(buffer, bufferOffset + 0));
          data.AccelAY.push(this.readFloat32LE(buffer, bufferOffset + 4));
          data.AccelAZ.push(this.readFloat32LE(buffer, bufferOffset + 8));
          data.ResetMP.push(this.readUInt8(buffer, bufferOffset + 12));
          
          // Shock data  
          data.ShockZ.push(this.readFloat32LE(buffer, bufferOffset + 16));
          data.ShockX.push(this.readFloat32LE(buffer, bufferOffset + 20));
          data.ShockY.push(this.readFloat32LE(buffer, bufferOffset + 24));
          
          // Shock counters
          data.ShockCountAxial50.push(this.readUInt16LE(buffer, bufferOffset + 28));
          data.ShockCountAxial100.push(this.readUInt16LE(buffer, bufferOffset + 30));
          data.ShockCountLat50.push(this.readUInt16LE(buffer, bufferOffset + 32));
          data.ShockCountLat100.push(this.readUInt16LE(buffer, bufferOffset + 34));
          
          // Rotation RPM
          data.RotRpmMax.push(this.readFloat32LE(buffer, bufferOffset + 36));
          data.RotRpmAvg.push(this.readFloat32LE(buffer, bufferOffset + 40));
          data.RotRpmMin.push(this.readFloat32LE(buffer, bufferOffset + 44));
          
          // System voltages
          data.V3_3VA_DI.push(this.readFloat32LE(buffer, bufferOffset + 48));
          data.V5VD.push(this.readFloat32LE(buffer, bufferOffset + 52));
          data.V3_3VD.push(this.readFloat32LE(buffer, bufferOffset + 56));
          data.V1_9VD.push(this.readFloat32LE(buffer, bufferOffset + 60));
          data.V1_5VD.push(this.readFloat32LE(buffer, bufferOffset + 64));
          data.V1_8VA.push(this.readFloat32LE(buffer, bufferOffset + 68));
          data.V3_3VA.push(this.readFloat32LE(buffer, bufferOffset + 72));
          data.VBatt.push(this.readFloat32LE(buffer, bufferOffset + 76));
          
          // System currents
          data.I5VD.push(this.readFloat32LE(buffer, bufferOffset + 80));
          data.I3_3VD.push(this.readFloat32LE(buffer, bufferOffset + 84));
          data.IBatt.push(this.readFloat32LE(buffer, bufferOffset + 88));
          
          // Gamma radiation
          data.Gamma.push(this.readUInt16LE(buffer, bufferOffset + 92));
          
          // Acceleration stability
          data.AccelStabX.push(this.readFloat32LE(buffer, bufferOffset + 96));
          data.AccelStabY.push(this.readFloat32LE(buffer, bufferOffset + 100));
          data.AccelStabZ.push(this.readFloat32LE(buffer, bufferOffset + 104));
          data.AccelStabZH.push(this.readFloat32LE(buffer, bufferOffset + 108));
          
          // Survey data
          data.SurveyTGF.push(this.readFloat32LE(buffer, bufferOffset + 112));
          data.SurveyTMF.push(this.readFloat32LE(buffer, bufferOffset + 116));
          data.SurveyDipA.push(this.readFloat32LE(buffer, bufferOffset + 120));
          data.SurveyINC.push(this.readFloat32LE(buffer, bufferOffset + 124));
          data.SurveyCINC.push(this.readFloat32LE(buffer, bufferOffset + 128));
          data.SurveyAZM.push(this.readFloat32LE(buffer, bufferOffset + 132));
          data.SurveyCAZM.push(this.readFloat32LE(buffer, bufferOffset + 136));
          
          bufferOffset += recordSize;
          recordIndex++;
          
          // Periodic memory cleanup
          if (recordIndex % 1000 === 0) {
            if (global.gc) global.gc();
            // Small delay to prevent memory buildup
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        currentOffset += bytesRead;
      }
    } finally {
      fs.closeSync(fd);
    }
  }

  // Parse MP file format with streaming to reduce memory usage
  static async parseMPFileStreaming(filePath: string, data: ParsedData, filename: string) {
    const headerSize = 256;
    const recordSize = 64; // MP record size
    const chunkSize = 64 * 1024; // 64KB chunks
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const numRecords = Math.floor((stats.size - headerSize) / recordSize);
    
    console.log(`Parsing MP file: ${numRecords} records`);
    
    // Extract base timestamp from filename
    const baseTime = this.extractTimestamp(filename);
    
    // Read file in chunks to avoid loading entire file into memory
    const fd = fs.openSync(filePath, 'r');
    let currentOffset = headerSize;
    let recordIndex = 0;
    
    try {
      while (currentOffset < stats.size && recordIndex < numRecords) {
        // Read chunk
        const buffer = Buffer.alloc(Math.min(chunkSize, stats.size - currentOffset));
        const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, currentOffset);
        
        // Process records in this chunk
        let bufferOffset = 0;
        while (bufferOffset + recordSize <= bytesRead && recordIndex < numRecords) {
          // Time progression (1 second intervals for MP)
          data.RTD.push(new Date(baseTime.getTime() + (recordIndex * 1000)));
          
          // MP Temperature and basic data
          data.TempMP.push(this.readFloat32LE(buffer, bufferOffset + 0));
          data.ResetMP.push(this.readUInt8(buffer, bufferOffset + 4));
          data.BatteryVoltMP.push(this.readFloat32LE(buffer, bufferOffset + 8));
          data.BatteryCurrMP.push(this.readFloat32LE(buffer, bufferOffset + 12));
          
          // Flow status
          const flowVal = this.readUInt8(buffer, bufferOffset + 16);
          data.FlowStatus.push(flowVal > 0 ? 'On' : 'Off');
          
          // Vibration data (Max X, Y, Z)
          data.MaxX.push(this.readFloat32LE(buffer, bufferOffset + 20));
          data.MaxY.push(this.readFloat32LE(buffer, bufferOffset + 24));
          data.MaxZ.push(this.readFloat32LE(buffer, bufferOffset + 28));
          data.Threshold.push(1.5); // Standard threshold
          
          // Motor current data
          data.MotorMin.push(this.readFloat32LE(buffer, bufferOffset + 32));
          data.MotorAvg.push(this.readFloat32LE(buffer, bufferOffset + 36));
          data.MotorMax.push(this.readFloat32LE(buffer, bufferOffset + 40));
          data.MotorHall.push(this.readFloat32LE(buffer, bufferOffset + 44));
          
          // Actuation time
          data.ActuationTime.push(this.readFloat32LE(buffer, bufferOffset + 48));
          
          // MDG-specific fields (not available in MP) - set to null
          data.AccelAX.push(null);
          data.AccelAY.push(null);
          data.AccelAZ.push(null);
          data.ShockZ.push(null);
          data.ShockX.push(null);
          data.ShockY.push(null);
          data.ShockCountAxial50.push(null);
          data.ShockCountAxial100.push(null);
          data.ShockCountLat50.push(null);
          data.ShockCountLat100.push(null);
          data.RotRpmMax.push(null);
          data.RotRpmAvg.push(null);
          data.RotRpmMin.push(null);
          data.V3_3VA_DI.push(null);
          data.V5VD.push(null);
          data.V3_3VD.push(null);
          data.V1_9VD.push(null);
          data.V1_5VD.push(null);
          data.V1_8VA.push(null);
          data.V3_3VA.push(null);
          data.VBatt.push(null);
          data.I5VD.push(null);
          data.I3_3VD.push(null);
          data.IBatt.push(null);
          data.Gamma.push(null);
          data.AccelStabX.push(null);
          data.AccelStabY.push(null);
          data.AccelStabZ.push(null);
          data.AccelStabZH.push(null);
          data.SurveyTGF.push(null);
          data.SurveyTMF.push(null);
          data.SurveyDipA.push(null);
          data.SurveyINC.push(null);
          data.SurveyCINC.push(null);
          data.SurveyAZM.push(null);
          data.SurveyCAZM.push(null);
          
          bufferOffset += recordSize;
          recordIndex++;
          
          // Periodic memory cleanup
          if (recordIndex % 1000 === 0) {
            if (global.gc) global.gc();
            // Small delay to prevent memory buildup
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        currentOffset += bytesRead;
      }
    } finally {
      fs.closeSync(fd);
    }
  }

  // Extract timestamp from filename
  static extractTimestamp(filename: string): Date {
    const timestampMatch = filename.match(/(\d{8})_(\d{6})/);
    if (timestampMatch) {
      const dateStr = timestampMatch[1]; // YYYYMMDD
      const timeStr = timestampMatch[2]; // HHMMSS
      const year = parseInt(dateStr.substr(0, 4));
      const month = parseInt(dateStr.substr(4, 2)) - 1;
      const day = parseInt(dateStr.substr(6, 2));
      const hour = parseInt(timeStr.substr(0, 2));
      const minute = parseInt(timeStr.substr(2, 2));
      const second = parseInt(timeStr.substr(4, 2));
      return new Date(year, month, day, hour, minute, second);
    }
    return new Date();
  }

  // Binary data reading helpers
  static readFloat32LE(buffer: Buffer, offset: number): number {
    if (offset + 4 > buffer.length) return 0;
    return buffer.readFloatLE(offset);
  }

  static readUInt8(buffer: Buffer, offset: number): number {
    if (offset >= buffer.length) return 0;
    return buffer.readUInt8(offset);
  }

  static readUInt16LE(buffer: Buffer, offset: number): number {
    if (offset + 2 > buffer.length) return 0;
    return buffer.readUInt16LE(offset);
  }

  static readUInt32LE(buffer: Buffer, offset: number): number {
    if (offset + 4 > buffer.length) return 0;
    return buffer.readUInt32LE(offset);
  }

  // Convert parsed data to sensor data array format
  static convertToSensorDataArray(parsedData: ParsedData, dumpId: number): InsertSensorData[] {
    const results: InsertSensorData[] = [];
    const recordCount = parsedData.RTD.length;

    for (let i = 0; i < recordCount; i++) {
      results.push({
        dumpId,
        rtd: parsedData.RTD[i],
        tempMP: parsedData.TempMP[i] || null,
        resetMP: parsedData.ResetMP[i] || null,
        batteryCurrMP: parsedData.BatteryCurrMP[i] || null,
        batteryVoltMP: parsedData.BatteryVoltMP[i] || null,
        flowStatus: parsedData.FlowStatus[i] || null,
        maxX: parsedData.MaxX[i] || null,
        maxY: parsedData.MaxY[i] || null,
        maxZ: parsedData.MaxZ[i] || null,
        threshold: parsedData.Threshold[i] || null,
        motorMin: parsedData.MotorMin[i] || null,
        motorAvg: parsedData.MotorAvg[i] || null,
        motorMax: parsedData.MotorMax[i] || null,
        motorHall: parsedData.MotorHall[i] || null,
        actuationTime: parsedData.ActuationTime[i] || null,
        accelAX: parsedData.AccelAX[i] || null,
        accelAY: parsedData.AccelAY[i] || null,
        accelAZ: parsedData.AccelAZ[i] || null,
        shockZ: parsedData.ShockZ[i] || null,
        shockX: parsedData.ShockX[i] || null,
        shockY: parsedData.ShockY[i] || null,
        shockCountAxial50: parsedData.ShockCountAxial50[i] || null,
        shockCountAxial100: parsedData.ShockCountAxial100[i] || null,
        shockCountLat50: parsedData.ShockCountLat50[i] || null,
        shockCountLat100: parsedData.ShockCountLat100[i] || null,
        rotRpmMax: parsedData.RotRpmMax[i] || null,
        rotRpmAvg: parsedData.RotRpmAvg[i] || null,
        rotRpmMin: parsedData.RotRpmMin[i] || null,
        v3_3VA_DI: parsedData.V3_3VA_DI[i] || null,
        v5VD: parsedData.V5VD[i] || null,
        v3_3VD: parsedData.V3_3VD[i] || null,
        v1_9VD: parsedData.V1_9VD[i] || null,
        v1_5VD: parsedData.V1_5VD[i] || null,
        v1_8VA: parsedData.V1_8VA[i] || null,
        v3_3VA: parsedData.V3_3VA[i] || null,
        vBatt: parsedData.VBatt[i] || null,
        i5VD: parsedData.I5VD[i] || null,
        i3_3VD: parsedData.I3_3VD[i] || null,
        iBatt: parsedData.IBatt[i] || null,
        gamma: parsedData.Gamma[i] || null,
        accelStabX: parsedData.AccelStabX[i] || null,
        accelStabY: parsedData.AccelStabY[i] || null,
        accelStabZ: parsedData.AccelStabZ[i] || null,
        accelStabZH: parsedData.AccelStabZH[i] || null,
        surveyTGF: parsedData.SurveyTGF[i] || null,
        surveyTMF: parsedData.SurveyTMF[i] || null,
        surveyDipA: parsedData.SurveyDipA[i] || null,
        surveyINC: parsedData.SurveyINC[i] || null,
        surveyCINC: parsedData.SurveyCINC[i] || null,
        surveyAZM: parsedData.SurveyAZM[i] || null,
        surveyCAZM: parsedData.SurveyCAZM[i] || null,
      });
    }

    return results;
  }

  // Extract device information from binary header
  static extractDeviceInfo(buffer: Buffer, filename: string, fileType: string): InsertDeviceReport {
    const isMDG = filename.includes('MDG');
    const isMP = filename.includes('MP');
    
    // Extract serial number from filename pattern
    const serialMatch = filename.match(/(\d{10,})/);
    const serialNumber = serialMatch ? serialMatch[1] : null;
    
    // Extract device info from binary header
    let firmwareVersion = null;
    let maxTemp = null;
    
    if (buffer.length >= 256) {
      // Extract firmware version from header bytes 32-35
      const fwBytes = buffer.subarray(32, 36);
      firmwareVersion = `${fwBytes[0]}.${fwBytes[1]}.${fwBytes[2]}.${fwBytes[3]}`;
      
      // Extract max temperature from header bytes 64-67
      if (buffer.length >= 68) {
        maxTemp = this.readFloat32LE(buffer, 64);
      }
    }
    
    return {
      dumpId: 0, // Will be set by caller
      mpSerialNumber: isMP ? serialNumber : null,
      mpFirmwareVersion: isMP ? firmwareVersion : null,
      mpMaxTempFahrenheit: isMP ? maxTemp : null,
      mpMaxTempCelsius: isMP && maxTemp ? (maxTemp - 32) * 5/9 : null,
      mdgSerialNumber: isMDG ? serialNumber : null,
      mdgFirmwareVersion: isMDG ? firmwareVersion : null,
      mdgMaxTempFahrenheit: isMDG ? maxTemp : null,
      mdgMaxTempCelsius: isMDG && maxTemp ? (maxTemp - 32) * 5/9 : null,
      circulationHours: buffer.length > 100 ? this.readFloat32LE(buffer, 96) : null,
      numberOfPulses: buffer.length > 104 ? this.readUInt32LE(buffer, 100) : null,
      motorOnTimeMinutes: buffer.length > 108 ? this.readFloat32LE(buffer, 104) : null,
      commErrorsTimeMinutes: buffer.length > 124 ? this.readFloat32LE(buffer, 120) : null,
      commErrorsPercent: buffer.length > 128 ? this.readFloat32LE(buffer, 124) : null,
      hallStatusTimeMinutes: buffer.length > 132 ? this.readFloat32LE(buffer, 128) : null,
      hallStatusPercent: buffer.length > 136 ? this.readFloat32LE(buffer, 132) : null,
      mdgEdtTotalHours: isMDG && buffer.length > 140 ? this.readFloat32LE(buffer, 136) : null,
      mdgExtremeShockIndex: isMDG && buffer.length > 144 ? this.readFloat32LE(buffer, 140) : null,
    };
  }
}