import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getPatientByUserId,
  getPatientById,
  createPatient,
  getMedicationsByPatientId,
  createMedication,
  getSchedulesByMedicationId,
  createMedicationSchedule,
  getCaregiversByPatientId,
  createCaregiver,
  getAdherenceLogsByPatientId,
  createAdherenceLog,
  updateAdherenceLog,
  getCallLogsByAdherenceLogId,
  createCallLog,
  getNotificationPreferences,
  createOrUpdateNotificationPreferences,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Patient procedures
  patient: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return await getPatientByUserId(ctx.user.id);
    }),

    createProfile: protectedProcedure
      .input(z.object({
        dateOfBirth: z.date().optional(),
        medicalConditions: z.string().optional(),
        emergencyContact: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        return await createPatient({
          userId: ctx.user.id,
          ...input,
        });
      }),

    getMedications: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      const patient = await getPatientByUserId(ctx.user.id);
      if (!patient) return [];
      return await getMedicationsByPatientId(patient.id);
    }),

    addMedication: protectedProcedure
      .input(z.object({
        name: z.string(),
        dosage: z.string(),
        unit: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        prescribedBy: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        schedules: z.array(z.object({
          timeOfDay: z.string(), // HH:MM format
          dayOfWeek: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        const patient = await getPatientByUserId(ctx.user.id);
        if (!patient) throw new Error("Patient profile not found");

        const medication = await createMedication({
          patientId: patient.id,
          name: input.name,
          dosage: input.dosage,
          unit: input.unit,
          description: input.description,
          imageUrl: input.imageUrl,
          prescribedBy: input.prescribedBy,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        // Create schedules for the medication
        // Note: In production, you'd get the actual medication ID from the insert result
        return medication;
      }),

    getAdherenceHistory: protectedProcedure
      .input(z.object({
        days: z.number().default(30),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        const patient = await getPatientByUserId(ctx.user.id);
        if (!patient) return [];
        return await getAdherenceLogsByPatientId(patient.id, input.days);
      }),
  }),

  // Caregiver procedures
  caregiver: router({
    getAssignedPatients: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'caregiver') throw new Error("Not a caregiver");
      // TODO: Implement query to get patients assigned to this caregiver
      return [];
    }),

    getPatientAdherence: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        days: z.number().default(30),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'caregiver') throw new Error("Not a caregiver");
        return await getAdherenceLogsByPatientId(input.patientId, input.days);
      }),

    confirmDose: protectedProcedure
      .input(z.object({
        adherenceLogId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'caregiver') throw new Error("Not a caregiver");
        return await updateAdherenceLog(input.adherenceLogId, {
          confirmedTime: new Date(),
          status: 'taken',
          confirmedBy: 'caregiver',
          confirmedByUserId: ctx.user.id,
        });
      }),
  }),

  // Admin procedures
  admin: router({
    getAllPatients: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new Error("Not an admin");
      // TODO: Implement query to get all patients
      return [];
    }),

    addPatient: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phoneNumber: z.string(),
        dateOfBirth: z.date().optional(),
        medicalConditions: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error("Not an admin");
        // TODO: Implement patient creation with user account
        return {};
      }),

    linkCaregiver: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        caregiverId: z.number(),
        relationship: z.string(),
        priority: z.number(),
        phoneNumber: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error("Not an admin");
        return await createCaregiver({
          userId: input.caregiverId,
          patientId: input.patientId,
          relationship: input.relationship,
          priority: input.priority,
          phoneNumber: input.phoneNumber,
        });
      }),

    getAdherenceReport: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        month: z.number(),
        year: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error("Not an admin");
        // TODO: Implement adherence report generation
        return {
          patientId: input.patientId,
          month: input.month,
          year: input.year,
          adherenceRate: 0,
          totalDoses: 0,
          takenDoses: 0,
          missedDoses: 0,
          lateDoses: 0,
        };
      }),
  }),

  // Notification preferences
  notifications: router({
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return await getNotificationPreferences(ctx.user.id);
    }),

    updatePreferences: protectedProcedure
      .input(z.object({
        pushNotificationsEnabled: z.boolean().optional(),
        emailNotificationsEnabled: z.boolean().optional(),
        smsNotificationsEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        return await createOrUpdateNotificationPreferences(ctx.user.id, input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
