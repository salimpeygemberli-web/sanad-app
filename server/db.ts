import { eq, and, desc, gte, lte, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  patients, 
  medications, 
  medicationSchedules,
  caregivers,
  adherenceLogs,
  callLogs,
  notificationPreferences,
  type Patient,
  type Medication,
  type MedicationSchedule,
  type Caregiver,
  type AdherenceLog,
  type CallLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phoneNumber"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Patient queries
export async function getPatientByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(patients).where(eq(patients.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPatientById(patientId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPatient(data: { userId: number; dateOfBirth?: Date; medicalConditions?: string; emergencyContact?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(patients).values(data);
  return result;
}

// Medication queries
export async function getMedicationsByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(medications).where(eq(medications.patientId, patientId));
}

export async function getMedicationById(medicationId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(medications).where(eq(medications.id, medicationId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMedication(data: {
  patientId: number;
  name: string;
  dosage: string;
  unit?: string;
  description?: string;
  imageUrl?: string;
  prescribedBy?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(medications).values(data);
  return result;
}

// Medication Schedule queries
export async function getSchedulesByMedicationId(medicationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(medicationSchedules).where(eq(medicationSchedules.medicationId, medicationId));
}

export async function createMedicationSchedule(data: {
  medicationId: number;
  timeOfDay: string;
  dayOfWeek?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(medicationSchedules).values(data);
  return result;
}

// Caregiver queries
export async function getCaregiversByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(caregivers)
    .where(and(eq(caregivers.patientId, patientId), eq(caregivers.isActive, true)))
    .orderBy(caregivers.priority);
}

export async function createCaregiver(data: {
  userId: number;
  patientId: number;
  relationship?: string;
  priority: number;
  phoneNumber: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(caregivers).values(data);
  return result;
}

// Adherence Log queries
export async function createAdherenceLog(data: {
  medicationScheduleId: number;
  patientId: number;
  scheduledTime: Date;
  status?: 'taken' | 'not_taken' | 'late' | 'pending';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(adherenceLogs).values({
    medicationScheduleId: data.medicationScheduleId,
    patientId: data.patientId,
    scheduledTime: data.scheduledTime,
    status: (data.status || 'pending') as 'taken' | 'not_taken' | 'late' | 'pending',
  });
  return result;
}

export async function updateAdherenceLog(logId: number, data: {
  confirmedTime?: Date;
  status?: 'taken' | 'not_taken' | 'late' | 'pending';
  confirmedBy?: 'patient' | 'caregiver' | 'admin' | 'system';
  confirmedByUserId?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(adherenceLogs)
    .set(data)
    .where(eq(adherenceLogs.id, logId));
  return result;
}

export async function getAdherenceLogsByPatientId(patientId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await db.select().from(adherenceLogs)
    .where(and(
      eq(adherenceLogs.patientId, patientId),
      gte(adherenceLogs.scheduledTime, startDate)
    ))
    .orderBy(desc(adherenceLogs.scheduledTime));
}

// Call Log queries
export async function createCallLog(data: {
  adherenceLogId: number;
  recipientType: 'patient' | 'caregiver';
  recipientId: number;
  recipientPhoneNumber: string;
  callStatus: 'initiated' | 'ringing' | 'answered' | 'no_answer' | 'failed' | 'completed';
  callAttemptNumber?: number;
  nextRetryTime?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(callLogs).values(data);
  return result;
}

export async function updateCallLog(callLogId: number, data: {
  callStatus?: 'initiated' | 'ringing' | 'answered' | 'no_answer' | 'failed' | 'completed';
  callStartTime?: Date;
  callEndTime?: Date;
  durationSeconds?: number;
  dtmfResponse?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(callLogs)
    .set(data)
    .where(eq(callLogs.id, callLogId));
  return result;
}

export async function getCallLogsByAdherenceLogId(adherenceLogId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(callLogs)
    .where(eq(callLogs.adherenceLogId, adherenceLogId))
    .orderBy(desc(callLogs.createdAt));
}

// Notification Preferences queries
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateNotificationPreferences(userId: number, data: {
  pushNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getNotificationPreferences(userId);
  
  if (existing) {
    return await db.update(notificationPreferences)
      .set(data)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    return await db.insert(notificationPreferences).values({
      userId,
      ...data,
    });
  }
}
