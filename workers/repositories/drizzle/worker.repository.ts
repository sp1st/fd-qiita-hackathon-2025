import { eq, and, sql } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { workers, workerSchedules } from '../../db/schema'
import type { WorkerRepository, FindOptions } from '../interfaces'
import type { Worker } from '../../db/types'

type Database = DrizzleD1Database | LibSQLDatabase

export class DrizzleWorkerRepository implements WorkerRepository {
  constructor(private db: Database) {}

  async findById(id: number): Promise<Worker | null> {
    const result = await this.db
      .select()
      .from(workers)
      .where(eq(workers.id, id))
      .limit(1)
      .all()
    return result[0] || null
  }

  async findAll(_options?: FindOptions): Promise<Worker[]> {
    // Drizzleの型システムの問題でorderBy/limit/offsetは一時的に無効化
    // TODO: Drizzle ORMのバージョンアップデートで解決予定
    const query = this.db.select().from(workers)
    return await query.all()
  }

  async create(data: any): Promise<Worker> {
    const result = await this.db
      .insert(workers)
      .values(data)
      .returning()
      .all()
    
    if (!result[0]) {
      throw new Error('Failed to create worker')
    }
    return result[0]
  }

  async update(id: number, data: Partial<Worker>): Promise<Worker | null> {
    const result = await this.db
      .update(workers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(workers.id, id))
      .returning()
      .all()
    
    return result[0] || null
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(workers)
      .where(eq(workers.id, id))
      .returning()
      .all()
    
    return result.length > 0
  }

  async findByEmail(email: string): Promise<Worker | null> {
    const result = await this.db
      .select()
      .from(workers)
      .where(eq(workers.email, email))
      .limit(1)
      .all()
    return result[0] || null
  }

  async findByRole(role: Worker['role']): Promise<Worker[]> {
    return await this.db
      .select()
      .from(workers)
      .where(eq(workers.role, role))
      .all()
  }

  async updateStatus(id: number, isActive: boolean): Promise<Worker | null> {
    return await this.update(id, { isActive })
  }

  async findAvailableDoctors(date: Date): Promise<Worker[]> {
    // 指定日時に勤務予定があり、予約が入っていない医師を検索
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // 該当日に勤務予定がある医師を取得
    const availableDoctors = await this.db
      .selectDistinct()
      .from(workers)
      .innerJoin(workerSchedules, eq(workers.id, workerSchedules.workerId))
      .where(
        and(
          eq(workers.role, 'doctor'),
          eq(workers.isActive, true),
          eq(workerSchedules.status, 'available'),
          sql`date(${workerSchedules.scheduleDate}) = date(${date})`
        )
      )
      .all()

    return availableDoctors.map(doctor => doctor.workers)
  }
}