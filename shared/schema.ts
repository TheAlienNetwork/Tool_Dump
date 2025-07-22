import { pgTable, text, serial, integer, boolean, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const memoryDumps = pgTable("memory_dumps", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(), // 'MDG' or 'MP'
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'error'
  errorMessage: text("error_message"),
});

export const sensorData = pgTable("sensor_data", {
  id: serial("id").primaryKey(),
  dumpId: integer("dump_id").references(() => memoryDumps.id).notNull(),
  rtd: timestamp("rtd").notNull(),
  tempMP: real("temp_mp"),
  resetMP: integer("reset_mp"),
  batteryCurrMP: real("battery_curr_mp"),
  batteryVoltMP: real("battery_volt_mp"),
  flowStatus: text("flow_status"),
  maxX: real("max_x"),
  maxY: real("max_y"),
  maxZ: real("max_z"),
  threshold: real("threshold"),
  motorMin: real("motor_min"),
  motorAvg: real("motor_avg"),
  motorMax: real("motor_max"),
  motorHall: real("motor_hall"),
  actuationTime: real("actuation_time"),
  accelAX: real("accel_ax"),
  accelAY: real("accel_ay"),
  accelAZ: real("accel_az"),
  shockZ: real("shock_z"),
  shockX: real("shock_x"),
  shockY: real("shock_y"),
  shockCountAxial50: integer("shock_count_axial_50"),
  shockCountAxial100: integer("shock_count_axial_100"),
  shockCountLat50: integer("shock_count_lat_50"),
  shockCountLat100: integer("shock_count_lat_100"),
  rotRpmMax: real("rot_rpm_max"),
  rotRpmAvg: real("rot_rpm_avg"),
  rotRpmMin: real("rot_rpm_min"),
  v3_3VA_DI: real("v3_3va_di"),
  v5VD: real("v5vd"),
  v3_3VD: real("v3_3vd"),
  v1_9VD: real("v1_9vd"),
  v1_5VD: real("v1_5vd"),
  v1_8VA: real("v1_8va"),
  v3_3VA: real("v3_3va"),
  vBatt: real("v_batt"),
  i5VD: real("i5vd"),
  i3_3VD: real("i3_3vd"),
  iBatt: real("i_batt"),
  gamma: integer("gamma"),
  accelStabX: real("accel_stab_x"),
  accelStabY: real("accel_stab_y"),
  accelStabZ: real("accel_stab_z"),
  accelStabZH: real("accel_stab_zh"),
  surveyTGF: real("survey_tgf"),
  surveyTMF: real("survey_tmf"),
  surveyDipA: real("survey_dip_a"),
  surveyINC: real("survey_inc"),
  surveyCINC: real("survey_cinc"),
  surveyAZM: real("survey_azm"),
  surveyCAZM: real("survey_cazm"),
});

export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  dumpId: integer("dump_id").references(() => memoryDumps.id).notNull(),
  overallStatus: text("overall_status").notNull(),
  criticalIssues: integer("critical_issues").notNull().default(0),
  warnings: integer("warnings").notNull().default(0),
  issues: jsonb("issues").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const deviceReports = pgTable("device_reports", {
  id: serial("id").primaryKey(),
  dumpId: integer("dump_id").references(() => memoryDumps.id).notNull(),
  mpSerialNumber: text("mp_serial_number"),
  mpFirmwareVersion: text("mp_firmware_version"),
  mdgSerialNumber: text("mdg_serial_number"),
  mdgFirmwareVersion: text("mdg_firmware_version"),
  circulationHours: real("circulation_hours"),
  numberOfPulses: integer("number_of_pulses"),
  motorOnTimeMinutes: real("motor_on_time_minutes"),
  commErrorsTimeMinutes: real("comm_errors_time_minutes"),
  commErrorsPercent: real("comm_errors_percent"),
  hallStatusTimeMinutes: real("hall_status_time_minutes"),
  hallStatusPercent: real("hall_status_percent"),
  mpMaxTempCelsius: real("mp_max_temp_celsius"),
  mpMaxTempFahrenheit: real("mp_max_temp_fahrenheit"),
  mdgEdtTotalHours: real("mdg_edt_total_hours"),
  mdgExtremeShockIndex: real("mdg_extreme_shock_index"),
  mdgMaxTempCelsius: real("mdg_max_temp_celsius"),
  mdgMaxTempFahrenheit: real("mdg_max_temp_fahrenheit"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const insertMemoryDumpSchema = createInsertSchema(memoryDumps).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
  status: true,
  errorMessage: true,
});

export const insertSensorDataSchema = createInsertSchema(sensorData).omit({
  id: true,
});

export const insertAnalysisResultsSchema = createInsertSchema(analysisResults).omit({
  id: true,
  generatedAt: true,
});

export const insertDeviceReportSchema = createInsertSchema(deviceReports).omit({
  id: true,
  generatedAt: true,
});

export type InsertMemoryDump = z.infer<typeof insertMemoryDumpSchema>;
export type MemoryDump = typeof memoryDumps.$inferSelect;
export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;
export type SensorData = typeof sensorData.$inferSelect;
export type InsertAnalysisResults = z.infer<typeof insertAnalysisResultsSchema>;
export type AnalysisResults = typeof analysisResults.$inferSelect;
export type InsertDeviceReport = z.infer<typeof insertDeviceReportSchema>;
export type DeviceReport = typeof deviceReports.$inferSelect;
