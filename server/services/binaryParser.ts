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
  // New streaming parser for large datasets
  static async parseMemoryDumpStream(
    filePath: string, 
    filename: string, 
    fileType: string, 
    batchSize: number,
    batchCallback: (batch: ParsedData, batchIndex: number) => Promise<boolean>
  ): Promise<void> {
    try {
      const stats = fs.statSync(filePath);
      console.log(`Starting streaming parse of ${fileType} file: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      if (fileType === 'MDG') {
        await this.parseMDGFileInBatches(filePath, filename, batchSize, batchCallback);
      } else if (fileType === 'MP') {
        await this.parseMPFileInBatches(filePath, filename, batchSize, batchCallback);
      }

      console.log(`Completed streaming parse of ${fileType} file: ${filename}`);
    } catch (error: any) {
      console.error(`Error in streaming parse of ${filename}:`, error);
      throw error;
    }
  }

  // Stream MDG file in small batches
  static async parseMDGFileInBatches(
    filePath: string, 
    filename: string, 
    batchSize: number,
    batchCallback: (batch: ParsedData, batchIndex: number) => Promise<boolean>
  ): Promise<void> {
    const headerSize = 256;
    const recordSize = 128;
    const stats = fs.statSync(filePath);
    const totalRecords = Math.floor((stats.size - headerSize) / recordSize);

    console.log(`Processing MDG file in batches of ${batchSize}. Total records: ${totalRecords}`);

    const baseTime = this.extractTimestamp(filename);
    const fd = fs.openSync(filePath, 'r');

    try {
      let recordIndex = 0;
      let batchIndex = 0;

      while (recordIndex < totalRecords) {
        const currentBatchSize = Math.min(batchSize, totalRecords - recordIndex);
        const buffer = Buffer.alloc(currentBatchSize * recordSize);

        // Read batch of records
        const offset = headerSize + (recordIndex * recordSize);
        fs.readSync(fd, buffer, 0, buffer.length, offset);

        // Create batch data structure
        const batch: ParsedData = this.createEmptyDataStructure();

        // Process records in this batch
        for (let i = 0; i < currentBatchSize; i++) {
          const bufferOffset = i * recordSize;

          // Time progression (2 second intervals for MDG)
          batch.RTD.push(new Date(baseTime.getTime() + ((recordIndex + i) * 2000)));

          // MP-specific fields (not available in MDG) - set to null
          batch.TempMP.push(null);
          batch.BatteryCurrMP.push(null);
          batch.BatteryVoltMP.push(null);
          batch.FlowStatus.push(null);
          batch.MaxX.push(null);
          batch.MaxY.push(null);
          batch.MaxZ.push(null);
          batch.Threshold.push(null);
          batch.MotorMin.push(null);
          batch.MotorAvg.push(null);
          batch.MotorMax.push(null);
          batch.MotorHall.push(null);
          batch.ActuationTime.push(null);

          // MDG-specific data
          batch.AccelAX.push(this.readFloat32LE(buffer, bufferOffset + 0));
          batch.AccelAY.push(this.readFloat32LE(buffer, bufferOffset + 4));
          batch.AccelAZ.push(this.readFloat32LE(buffer, bufferOffset + 8));
          batch.ResetMP.push(this.readUInt8(buffer, bufferOffset + 12));

          // Shock data
          batch.ShockZ.push(this.readFloat32LE(buffer, bufferOffset + 16));
          batch.ShockX.push(this.readFloat32LE(buffer, bufferOffset + 20));
          batch.ShockY.push(this.readFloat32LE(buffer, bufferOffset + 24));

          // Shock counters
          batch.ShockCountAxial50.push(this.readUInt16LE(buffer, bufferOffset + 28));
          batch.ShockCountAxial100.push(this.readUInt16LE(buffer, bufferOffset + 30));
          batch.ShockCountLat50.push(this.readUInt16LE(buffer, bufferOffset + 32));
          batch.ShockCountLat100.push(this.readUInt16LE(buffer, bufferOffset + 34));

          // Rotation RPM
          batch.RotRpmMax.push(this.readFloat32LE(buffer, bufferOffset + 36));
          batch.RotRpmAvg.push(this.readFloat32LE(buffer, bufferOffset + 40));
          batch.RotRpmMin.push(this.readFloat32LE(buffer, bufferOffset + 44));

          // System voltages
          batch.V3_3VA_DI.push(this.readFloat32LE(buffer, bufferOffset + 48));
          batch.V5VD.push(this.readFloat32LE(buffer, bufferOffset + 52));
          batch.V3_3VD.push(this.readFloat32LE(buffer, bufferOffset + 56));
          batch.V1_9VD.push(this.readFloat32LE(buffer, bufferOffset + 60));
          batch.V1_5VD.push(this.readFloat32LE(buffer, bufferOffset + 64));
          batch.V1_8VA.push(this.readFloat32LE(buffer, bufferOffset + 68));
          batch.V3_3VA.push(this.readFloat32LE(buffer, bufferOffset + 72));
          batch.VBatt.push(this.readFloat32LE(buffer, bufferOffset + 76));

          // System currents
          batch.I5VD.push(this.readFloat32LE(buffer, bufferOffset + 80));
          batch.I3_3VD.push(this.readFloat32LE(buffer, bufferOffset + 84));
          batch.IBatt.push(this.readFloat32LE(buffer, bufferOffset + 88));

          // Gamma radiation
          batch.Gamma.push(this.readUInt16LE(buffer, bufferOffset + 92));

          // Acceleration stability
          batch.AccelStabX.push(this.readFloat32LE(buffer, bufferOffset + 96));
          batch.AccelStabY.push(this.readFloat32LE(buffer, bufferOffset + 100));
          batch.AccelStabZ.push(this.readFloat32LE(buffer, bufferOffset + 104));
          batch.AccelStabZH.push(this.readFloat32LE(buffer, bufferOffset + 108));

          // Survey data
          batch.SurveyTGF.push(this.readFloat32LE(buffer, bufferOffset + 112));
          batch.SurveyTMF.push(this.readFloat32LE(buffer, bufferOffset + 116));
          batch.SurveyDipA.push(this.readFloat32LE(buffer, bufferOffset + 120));
          batch.SurveyINC.push(this.readFloat32LE(buffer, bufferOffset + 124));
          batch.SurveyCINC.push(this.readFloat32LE(buffer, bufferOffset + 128));
          batch.SurveyAZM.push(this.readFloat32LE(buffer, bufferOffset + 132));
          batch.SurveyCAZM.push(this.readFloat32LE(buffer, bufferOffset + 136));
        }

        // Process batch through callback
        const shouldContinue = await batchCallback(batch, batchIndex);
        if (!shouldContinue) {
          console.log(`Stopping processing at batch ${batchIndex} due to callback request`);
          break;
        }

        recordIndex += currentBatchSize;
        batchIndex++;

        // Reduced garbage collection frequency for better performance
        if (batchIndex % 20 === 0 && global.gc) {
          global.gc();
        }
      }
    } finally {
      fs.closeSync(fd);
    }
  }

  // Stream MP file in small batches
  static async parseMPFileInBatches(
    filePath: string, 
    filename: string, 
    batchSize: number,
    batchCallback: (batch: ParsedData, batchIndex: number) => Promise<boolean>
  ): Promise<void> {
    const headerSize = 256;
    const recordSize = 64;
    const stats = fs.statSync(filePath);
    const totalRecords = Math.floor((stats.size - headerSize) / recordSize);

    console.log(`Processing MP file in batches of ${batchSize}. Total records: ${totalRecords}`);

    const baseTime = this.extractTimestamp(filename);
    const fd = fs.openSync(filePath, 'r');

    try {
      let recordIndex = 0;
      let batchIndex = 0;

      while (recordIndex < totalRecords) {
        const currentBatchSize = Math.min(batchSize, totalRecords - recordIndex);
        const buffer = Buffer.alloc(currentBatchSize * recordSize);

        // Read batch of records
        const offset = headerSize + (recordIndex * recordSize);
        fs.readSync(fd, buffer, 0, buffer.length, offset);

        // Create batch data structure
        const batch: ParsedData = this.createEmptyDataStructure();

        // Process records in this batch
        for (let i = 0; i < currentBatchSize; i++) {
          const bufferOffset = i * recordSize;

          // Time progression (1 second intervals for MP)
          batch.RTD.push(new Date(baseTime.getTime() + ((recordIndex + i) * 1000)));

          // MP-specific data
          batch.TempMP.push(this.readFloat32LE(buffer, bufferOffset + 0));
          batch.ResetMP.push(this.readUInt8(buffer, bufferOffset + 4));
          batch.BatteryVoltMP.push(this.readFloat32LE(buffer, bufferOffset + 8));
          batch.BatteryCurrMP.push(this.readFloat32LE(buffer, bufferOffset + 12));

          // Flow status
          const flowVal = this.readUInt8(buffer, bufferOffset + 16);
          batch.FlowStatus.push(flowVal > 0 ? 'On' : 'Off');

          // Vibration data
          batch.MaxX.push(this.readFloat32LE(buffer, bufferOffset + 20));
          batch.MaxY.push(this.readFloat32LE(buffer, bufferOffset + 24));
          batch.MaxZ.push(this.readFloat32LE(buffer, bufferOffset + 28));
          batch.Threshold.push(1.5);

          // Motor current data
          batch.MotorMin.push(this.readFloat32LE(buffer, bufferOffset + 32));
          batch.MotorAvg.push(this.readFloat32LE(buffer, bufferOffset + 36));
          batch.MotorMax.push(this.readFloat32LE(buffer, bufferOffset + 40));
          batch.MotorHall.push(this.readFloat32LE(buffer, bufferOffset + 44));

          // Actuation time
          batch.ActuationTime.push(this.readFloat32LE(buffer, bufferOffset + 48));

          // MDG-specific fields (not available in MP) - set to null
          batch.AccelAX.push(null);
          batch.AccelAY.push(null);
          batch.AccelAZ.push(null);
          batch.ShockZ.push(null);
          batch.ShockX.push(null);
          batch.ShockY.push(null);
          batch.ShockCountAxial50.push(null);
          batch.ShockCountAxial100.push(null);
          batch.ShockCountLat50.push(null);
          batch.ShockCountLat100.push(null);
          batch.RotRpmMax.push(null);
          batch.RotRpmAvg.push(null);
          batch.RotRpmMin.push(null);
          batch.V3_3VA_DI.push(null);
          batch.V5VD.push(null);
          batch.V3_3VD.push(null);
          batch.V1_9VD.push(null);
          batch.V1_5VD.push(null);
          batch.V1_8VA.push(null);
          batch.V3_3VA.push(null);
          batch.VBatt.push(null);
          batch.I5VD.push(null);
          batch.I3_3VD.push(null);
          batch.IBatt.push(null);
          batch.Gamma.push(null);
          batch.AccelStabX.push(null);
          batch.AccelStabY.push(null);
          batch.AccelStabZ.push(null);
          batch.AccelStabZH.push(null);
          batch.SurveyTGF.push(null);
          batch.SurveyTMF.push(null);
          batch.SurveyDipA.push(null);
          batch.SurveyINC.push(null);
          batch.SurveyCINC.push(null);
          batch.SurveyAZM.push(null);
          batch.SurveyCAZM.push(null);
        }

        // Process batch through callback
        const shouldContinue = await batchCallback(batch, batchIndex);
        if (!shouldContinue) {
          console.log(`Stopping processing at batch ${batchIndex} due to callback request`);
          break;
        }

        recordIndex += currentBatchSize;
        batchIndex++;

        // Reduced garbage collection frequency for better performance  
        if (batchIndex % 20 === 0 && global.gc) {
          global.gc();
        }
      }
    } finally {
      fs.closeSync(fd);
    }
  }

  // Helper to create empty data structure
  static createEmptyDataStructure(): ParsedData {
    return {
      RTD: [], TempMP: [], ResetMP: [], BatteryCurrMP: [], BatteryVoltMP: [], FlowStatus: [],
      MaxX: [], MaxY: [], MaxZ: [], Threshold: [], MotorMin: [], MotorAvg: [], MotorMax: [], 
      MotorHall: [], ActuationTime: [], AccelAX: [], AccelAY: [], AccelAZ: [], ShockZ: [], 
      ShockX: [], ShockY: [], ShockCountAxial50: [], ShockCountAxial100: [], ShockCountLat50: [], 
      ShockCountLat100: [], RotRpmMax: [], RotRpmAvg: [], RotRpmMin: [], V3_3VA_DI: [], V5VD: [], 
      V3_3VD: [], V1_9VD: [], V1_5VD: [], V1_8VA: [], V3_3VA: [], VBatt: [], I5VD: [], I3_3VD: [], 
      IBatt: [], Gamma: [], AccelStabX: [], AccelStabY: [], AccelStabZ: [], AccelStabZH: [], 
      SurveyTGF: [], SurveyTMF: [], SurveyDipA: [], SurveyINC: [], SurveyCINC: [], SurveyAZM: [], 
      SurveyCAZM: []
    };
  }

  // Extract timestamp from filename
  static extractTimestamp(filename: string): Date {
    const timestampMatch = filename.match(/(\d{8})_(\d{6})/);
    if (timestampMatch) {
      const dateStr = timestampMatch[1];
      const timeStr = timestampMatch[2];
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

    console.log(`Extracting device info from ${fileType} header (${buffer.length} bytes)...`);

    // Extract device info from binary header - enhanced extraction
    let mpSerialNumber = null;
    let mdgSerialNumber = null;
    let firmwareVersion = null;
    let maxTemp = null;
    let circulationHours = null;
    let numberOfPulses = null;
    let motorOnTimeMinutes = null;
    let commErrorsTimeMinutes = null;
    let commErrorsPercent = null;
    let hallStatusTimeMinutes = null;
    let hallStatusPercent = null;
    let mdgEdtTotalHours = null;
    let mdgExtremeShockIndex = null;

    if (buffer.length >= 256) {
      // Extract serial numbers from header bytes 0-3 (32-bit integer)
      const serialFromHeader = this.readUInt32LE(buffer, 0);
      if (serialFromHeader > 0 && serialFromHeader < 999999) {
        if (isMP) mpSerialNumber = serialFromHeader.toString();
        if (isMDG) mdgSerialNumber = serialFromHeader.toString();
      }
      
      // Try filename fallback for serial number
      const filenameSerial = filename.match(/(\d{4,})/);
      if (filenameSerial && !mpSerialNumber && !mdgSerialNumber) {
        if (isMP) mpSerialNumber = filenameSerial[1];
        if (isMDG) mdgSerialNumber = filenameSerial[1];
      }

      // Extract firmware version from header bytes 16-19
      const fwBytes = buffer.subarray(16, 20);
      firmwareVersion = `${fwBytes[0]}.${fwBytes[1]}.${fwBytes[2]}.${fwBytes[3]}`;

      // Extract max temperature from header bytes 32-35 (float)
      maxTemp = this.readFloat32LE(buffer, 32);
      if (maxTemp < -50 || maxTemp > 300) maxTemp = null; // Sanity check

      // Extract operational statistics
      circulationHours = this.readFloat32LE(buffer, 64);
      numberOfPulses = this.readUInt32LE(buffer, 68);
      motorOnTimeMinutes = this.readFloat32LE(buffer, 72);
      commErrorsTimeMinutes = this.readFloat32LE(buffer, 76);
      commErrorsPercent = this.readFloat32LE(buffer, 80);
      hallStatusTimeMinutes = this.readFloat32LE(buffer, 84);
      hallStatusPercent = this.readFloat32LE(buffer, 88);

      // MDG-specific data
      if (isMDG) {
        mdgEdtTotalHours = this.readFloat32LE(buffer, 92);
        mdgExtremeShockIndex = this.readFloat32LE(buffer, 96);
      }

      // Sanity checks on extracted values
      if (circulationHours < 0 || circulationHours > 100000) circulationHours = null;
      if (numberOfPulses < 0 || numberOfPulses > 10000000) numberOfPulses = null;
      if (motorOnTimeMinutes < 0 || motorOnTimeMinutes > 100000) motorOnTimeMinutes = null;
      if (commErrorsPercent < 0 || commErrorsPercent > 100) commErrorsPercent = null;
      if (hallStatusPercent < 0 || hallStatusPercent > 100) hallStatusPercent = null;
      if (mdgEdtTotalHours && (mdgEdtTotalHours < 0 || mdgEdtTotalHours > 100000)) mdgEdtTotalHours = null;
      if (mdgExtremeShockIndex && (mdgExtremeShockIndex < 0 || mdgExtremeShockIndex > 1000)) mdgExtremeShockIndex = null;

      console.log(`Device info extracted: S/N=${mpSerialNumber || mdgSerialNumber}, FW=${firmwareVersion}, MaxTemp=${maxTemp}°F`);
    }

    return {
      dumpId: 0,
      mpSerialNumber,
      mpFirmwareVersion: isMP ? firmwareVersion : null,
      mpMaxTempFahrenheit: isMP ? maxTemp : null,
      mpMaxTempCelsius: isMP && maxTemp ? (maxTemp - 32) * 5/9 : null,
      mdgSerialNumber,
      mdgFirmwareVersion: isMDG ? firmwareVersion : null,
      mdgMaxTempFahrenheit: isMDG ? maxTemp : null,
      mdgMaxTempCelsius: isMDG && maxTemp ? (maxTemp - 32) * 5/9 : null,
      circulationHours,
      numberOfPulses,
      motorOnTimeMinutes,
      commErrorsTimeMinutes,
      commErrorsPercent,
      hallStatusTimeMinutes,
      hallStatusPercent,
      mdgEdtTotalHours,
      mdgExtremeShockIndex,
    };
  }
}