import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import { medicalRecords } from '../../db/schema'
import type { MedicalRecordRepository } from '../interfaces'
import type { MedicalRecord } from '../../db/types'

type Database = DrizzleD1Database | LibSQLDatabase

export class DrizzleMedicalRecordRepository implements MedicalRecordRepository {
  constructor(private db: Database) {}

  async findById(id: number): Promise<MedicalRecord | null> {
    const result = await this.db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id))
      .limit(1)
      .all()
    
    return result[0] || null
  }

  async findAll(): Promise<MedicalRecord[]> {
    return await this.db
      .select()
      .from(medicalRecords)
      .all()
  }

  async create(data: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const result = await this.db
      .insert(medicalRecords)
      .values({
        appointmentId: data.appointmentId!,
        subjective: data.subjective || null,
        objective: data.objective || null,
        assessment: data.assessment || null,
        plan: data.plan || null,
        vitalSigns: data.vitalSigns || '{}',
        prescriptions: data.prescriptions || '[]',
        aiSummary: data.aiSummary || '{}',
      })
      .returning()
      .all()
    
    return result[0]!
  }

  async update(id: number, data: Partial<MedicalRecord>): Promise<MedicalRecord | null> {
    const result = await this.db
      .update(medicalRecords)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(medicalRecords.id, id))
      .returning()
      .all()
    
    return result[0] || null
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(medicalRecords)
      .where(eq(medicalRecords.id, id))
      .run()
    
    return result.meta.changes > 0
  }

  async findByAppointmentId(appointmentId: number): Promise<MedicalRecord | null> {
    const result = await this.db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.appointmentId, appointmentId))
      .limit(1)
      .all()
    
    return result[0] || null
  }
} 