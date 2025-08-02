import { eq, and, gte, lt, lte, desc, asc, sql } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { appointments, workers } from '../../db/schema'
import { createJstDate, utcToJstDateString } from '../../utils/timezone'
import type { Appointment, NewAppointment } from '../../db/types'
import type { AppointmentRepository, AvailableSlot, FindOptions } from '../interfaces'

type Database = DrizzleD1Database | LibSQLDatabase

export class DrizzleAppointmentRepository implements AppointmentRepository {
  constructor(private db: Database) {}

  async findById(id: number): Promise<Appointment | null> {
    const result = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1)
      .all()

    return result[0] ?? null
  }

  async findAll(options?: FindOptions): Promise<Appointment[]> {
    let query = this.db.select().from(appointments)

    if (options?.orderBy) {
      const column = appointments[options.orderBy as keyof typeof appointments] as any
      if (column) {
        query = options.orderDirection === 'desc'
          ? (query as any).orderBy(desc(column))
          : (query as any).orderBy(asc(column))
      }
    }

    if (options?.limit) {
      query = (query as any).limit(options.limit)
    }

    if (options?.offset) {
      query = (query as any).offset(options.offset)
    }

    return await (query as any).all()
  }

  async create(data: Partial<NewAppointment>): Promise<Appointment> {
    const result = await this.db
      .insert(appointments)
      .values({
        patientId: data.patientId!,
        scheduledAt: data.scheduledAt!,
        status: data.status || 'scheduled',
        chiefComplaint: data.chiefComplaint || '',
        appointmentType: data.appointmentType || 'initial',
        assignedWorkerId: data.assignedWorkerId,
        durationMinutes: data.durationMinutes || 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .all()

    return result[0]!
  }

  async update(id: number, data: Partial<typeof appointments.$inferInsert>) {
    const result = await this.db
      .update(appointments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning()
      .all()

    return result[0] ?? null
  }

  async delete(id: number) {
    const result = await this.db
      .delete(appointments)
      .where(eq(appointments.id, id))
      .run()

    return (result as any).meta?.changes > 0
  }

  async findByPatientId(patientId: number, options?: FindOptions) {
    let query = this.db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))

    if (options?.orderBy) {
      const column = appointments[options.orderBy as keyof typeof appointments] as any
      if (column) {
        query = options.orderDirection === 'desc'
          ? (query as any).orderBy(desc(column))
          : (query as any).orderBy(asc(column))
      }
    } else {
      query = (query as any).orderBy(desc(appointments.scheduledAt))
    }

    if (options?.limit) {
      query = (query as any).limit(options.limit)
    }

    if (options?.offset) {
      query = (query as any).offset(options.offset)
    }

    return await (query as any).all()
  }

  async findByWorkerId(workerId: number, options?: FindOptions) {
    let query = this.db
      .select()
      .from(appointments)
      .where(eq(appointments.assignedWorkerId, workerId))

    if (options?.orderBy) {
      const column = appointments[options.orderBy as keyof typeof appointments] as any
      if (column) {
        query = options.orderDirection === 'desc'
          ? (query as any).orderBy(desc(column))
          : (query as any).orderBy(asc(column))
      }
    } else {
      query = (query as any).orderBy(desc(appointments.scheduledAt))
    }

    if (options?.limit) {
      query = (query as any).limit(options.limit)
    }

    if (options?.offset) {
      query = (query as any).offset(options.offset)
    }

    return await (query as any).all()
  }

  async findByDateRange(startDate: Date, endDate: Date) {
    return await this.db
      .select()
      .from(appointments)
      .where(
        and(
          gte(appointments.scheduledAt, startDate),
          lt(appointments.scheduledAt, endDate)
        )
      )
      .orderBy(asc(appointments.scheduledAt))
      .all()
  }

  async findAvailableSlots(date: Date, doctorId?: number): Promise<AvailableSlot[]> {
    // 医師リストを取得
    let doctorsQuery = this.db
      .select()
      .from(workers)
      .where(eq(workers.role, 'doctor'))

    if (doctorId) {
      doctorsQuery = (doctorsQuery as any).where(eq(workers.id, doctorId))
    }

    const doctors = await (doctorsQuery as any).all()

    // 各医師のスロットを生成
    const slots: AvailableSlot[] = []
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    for (const doctor of doctors) {
      // その日の予約を取得
      const existingAppointments = await this.db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.assignedWorkerId, doctor.id),
            gte(appointments.scheduledAt, startOfDay),
            lte(appointments.scheduledAt, endOfDay)
          )
        )
        .all()

      // 9:00-17:00の30分刻みでスロットを生成
      const dateStr = utcToJstDateString(date)
      
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          // JST時刻でスロットを作成し、UTCに変換
          const slotStart = createJstDate(dateStr, hour, minute)
          const slotEnd = createJstDate(dateStr, hour, minute + 30)

          // 既存予約との重複チェック
          const isBooked = existingAppointments.some(apt => {
            const aptStart = new Date(apt.scheduledAt)
            const aptEnd = new Date(aptStart)
            aptEnd.setMinutes(aptEnd.getMinutes() + (apt.durationMinutes || 30))

            return (slotStart >= aptStart && slotStart < aptEnd) ||
                   (slotEnd > aptStart && slotEnd <= aptEnd)
          })

          slots.push({
            doctorId: doctor.id,
            doctorName: doctor.name,
            specialty: doctor.role, // 専門科は現在roleで管理（将来的にspecialtiesテーブルを使用予定）
            startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            endTime: `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`,
            available: !isBooked,
          })
        }
      }
    }

    return slots
  }

  async findConflicting(doctorId: number, startTime: Date, endTime: Date) {
    return await this.db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.assignedWorkerId, doctorId),
          // 時間が重複する条件
          lt(appointments.scheduledAt, endTime),
          sql`datetime(${appointments.scheduledAt}, '+' || ${appointments.durationMinutes} || ' minutes') > ${startTime}`
        )
      )
      .all()
  }

  async updateStatus(id: number, status: string) {
    const result = await this.db
      .update(appointments)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning()
      .all()

    return result[0] ?? null
  }
}
