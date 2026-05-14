import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with role-based access control for admin, patient, and caregiver roles.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "patient", "caregiver"]).default("patient").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Patients table - stores patient information
 * Each patient can have multiple medications and caregivers
 */
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  medicalConditions: text("medicalConditions"),
  emergencyContact: varchar("emergencyContact", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

/**
 * Medications table - stores medication information for each patient
 */
export const medications = mysqlTable("medications", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  description: text("description"),
  imageUrl: text("imageUrl"),
  prescribedBy: varchar("prescribedBy", { length: 255 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

/**
 * Medication Schedule table - stores daily schedule times for each medication
 */
export const medicationSchedules = mysqlTable("medicationSchedules", {
  id: int("id").autoincrement().primaryKey(),
  medicationId: int("medicationId").notNull(),
  timeOfDay: varchar("timeOfDay", { length: 5 }).notNull(), // HH:MM format
  dayOfWeek: varchar("dayOfWeek", { length: 20 }), // null = every day, or specific days
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MedicationSchedule = typeof medicationSchedules.$inferSelect;
export type InsertMedicationSchedule = typeof medicationSchedules.$inferInsert;

/**
 * Caregivers table - stores caregiver information and their relationships to patients
 */
export const caregivers = mysqlTable("caregivers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  patientId: int("patientId").notNull(),
  relationship: varchar("relationship", { length: 100 }), // Son, Daughter, Nurse, etc.
  priority: int("priority").default(1).notNull(), // 1 = first contact, 2 = second contact, etc.
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Caregiver = typeof caregivers.$inferSelect;
export type InsertCaregiver = typeof caregivers.$inferInsert;

/**
 * Adherence Log table - records every medication dose with its status and confirmation details
 */
export const adherenceLogs = mysqlTable("adherenceLogs", {
  id: int("id").autoincrement().primaryKey(),
  medicationScheduleId: int("medicationScheduleId").notNull(),
  patientId: int("patientId").notNull(),
  scheduledTime: timestamp("scheduledTime").notNull(),
  confirmedTime: timestamp("confirmedTime"),
  status: mysqlEnum("status", ["taken", "not_taken", "late", "pending"]).default("pending").notNull(),
  confirmedBy: mysqlEnum("confirmedBy", ["patient", "caregiver", "admin", "system"]),
  confirmedByUserId: int("confirmedByUserId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdherenceLog = typeof adherenceLogs.$inferSelect;
export type InsertAdherenceLog = typeof adherenceLogs.$inferInsert;

/**
 * Call Logs table - records all automated phone calls and their outcomes
 */
export const callLogs = mysqlTable("callLogs", {
  id: int("id").autoincrement().primaryKey(),
  adherenceLogId: int("adherenceLogId").notNull(),
  recipientType: mysqlEnum("recipientType", ["patient", "caregiver"]).notNull(),
  recipientId: int("recipientId").notNull(),
  recipientPhoneNumber: varchar("recipientPhoneNumber", { length: 20 }).notNull(),
  callStatus: mysqlEnum("callStatus", ["initiated", "ringing", "answered", "no_answer", "failed", "completed"]).notNull(),
  callStartTime: timestamp("callStartTime"),
  callEndTime: timestamp("callEndTime"),
  durationSeconds: int("durationSeconds"),
  dtmfResponse: varchar("dtmfResponse", { length: 10 }),
  callAttemptNumber: int("callAttemptNumber").default(1).notNull(),
  nextRetryTime: timestamp("nextRetryTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = typeof callLogs.$inferInsert;

/**
 * Notification Preferences table - stores user notification settings
 */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pushNotificationsEnabled: boolean("pushNotificationsEnabled").default(true).notNull(),
  emailNotificationsEnabled: boolean("emailNotificationsEnabled").default(true).notNull(),
  smsNotificationsEnabled: boolean("smsNotificationsEnabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Relations for type safety and query convenience
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  patient: one(patients, {
    fields: [users.id],
    references: [patients.userId],
  }),
  caregiverProfiles: many(caregivers),
  notificationPreferences: one(notificationPreferences, {
    fields: [users.id],
    references: [notificationPreferences.userId],
  }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  medications: many(medications),
  caregivers: many(caregivers),
  adherenceLogs: many(adherenceLogs),
}));

export const medicationsRelations = relations(medications, ({ one, many }) => ({
  patient: one(patients, {
    fields: [medications.patientId],
    references: [patients.id],
  }),
  schedules: many(medicationSchedules),
}));

export const medicationSchedulesRelations = relations(medicationSchedules, ({ one, many }) => ({
  medication: one(medications, {
    fields: [medicationSchedules.medicationId],
    references: [medications.id],
  }),
  adherenceLogs: many(adherenceLogs),
  callLogs: many(callLogs),
}));

export const caregiversRelations = relations(caregivers, ({ one }) => ({
  user: one(users, {
    fields: [caregivers.userId],
    references: [users.id],
  }),
  patient: one(patients, {
    fields: [caregivers.patientId],
    references: [patients.id],
  }),
}));

export const adherenceLogsRelations = relations(adherenceLogs, ({ one, many }) => ({
  medicationSchedule: one(medicationSchedules, {
    fields: [adherenceLogs.medicationScheduleId],
    references: [medicationSchedules.id],
  }),
  patient: one(patients, {
    fields: [adherenceLogs.patientId],
    references: [patients.id],
  }),
  callLogs: many(callLogs),
}));

export const callLogsRelations = relations(callLogs, ({ one }) => ({
  adherenceLog: one(adherenceLogs, {
    fields: [callLogs.adherenceLogId],
    references: [adherenceLogs.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));