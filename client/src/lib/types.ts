export interface MemoryDump {
  id: number;
  filename: string;
  fileType: string;
  uploadedAt: string;
  processedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface SensorData {
  id: number;
  dumpId: number;
  rtd: string;
  tempMP?: number;
  resetMP?: number;
  batteryCurrMP?: number;
  batteryVoltMP?: number;
  flowStatus?: string;
  maxX?: number;
  maxY?: number;
  maxZ?: number;
  threshold?: number;
  motorMin?: number;
  motorAvg?: number;
  motorMax?: number;
  motorHall?: number;
  actuationTime?: number;
  accelAX?: number;
  accelAY?: number;
  accelAZ?: number;
  shockZ?: number;
  shockX?: number;
  shockY?: number;
  shockCountAxial50?: number;
  shockCountAxial100?: number;
  shockCountLat50?: number;
  shockCountLat100?: number;
  rotRpmMax?: number;
  rotRpmAvg?: number;
  rotRpmMin?: number;
  v3_3VA_DI?: number;
  v5VD?: number;
  v3_3VD?: number;
  v1_9VD?: number;
  v1_5VD?: number;
  v1_8VA?: number;
  v3_3VA?: number;
  vBatt?: number;
  i5VD?: number;
  i3_3VD?: number;
  iBatt?: number;
  gamma?: number;
  accelStabX?: number;
  accelStabY?: number;
  accelStabZ?: number;
  accelStabZH?: number;
  surveyTGF?: number;
  surveyTMF?: number;
  surveyDipA?: number;
  surveyINC?: number;
  surveyCINC?: number;
  surveyAZM?: number;
  surveyCAZM?: number;
}

export interface Issue {
  issue: string;
  explanation: string;
  severity: 'critical' | 'warning' | 'info';
  count: number;
  firstTime?: string;
  lastTime?: string;
  times: string[];
}

export interface AnalysisResults {
  id: number;
  dumpId: number;
  overallStatus: 'operational' | 'warning' | 'critical';
  criticalIssues: number;
  warnings: number;
  issues: Issue[];
  generatedAt: string;
}

export interface MemoryDumpDetails {
  memoryDump: MemoryDump;
  sensorData: SensorData[];
  analysisResults?: AnalysisResults;
}
