import { eq } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { questionnaires } from '../../db/schema'
import type { QuestionnaireRepository, FindOptions } from '../interfaces'

type Database = DrizzleD1Database | LibSQLDatabase

export class DrizzleQuestionnaireRepository implements QuestionnaireRepository {
  constructor(private db: Database) {}

  async findById(id: number) {
    const result = await this.db
      .select()
      .from(questionnaires)
      .where(eq(questionnaires.id, id))
      .limit(1)
      .all()
    
    return result[0] || null
  }

  async findAll(options?: FindOptions) {
    let query = this.db.select().from(questionnaires) as any
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.offset(options.offset)
    }
    
    return await query.all()
  }

  async create(data: Partial<typeof questionnaires.$inferInsert>) {
    const result = await this.db
      .insert(questionnaires)
      .values({
        appointmentId: data.appointmentId!,
        questionsAnswers: data.questionsAnswers || '{}',
        aiSummary: data.aiSummary || null,
        urgencyLevel: data.urgencyLevel || null,
        completedAt: data.completedAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .all()
    
    return result[0]!
  }

  async update(id: number, data: Partial<typeof questionnaires.$inferInsert>) {
    const result = await this.db
      .update(questionnaires)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(questionnaires.id, id))
      .returning()
      .all()
    
    return result[0] || null
  }

  async delete(id: number) {
    const result = await this.db
      .delete(questionnaires)
      .where(eq(questionnaires.id, id))
      .run()
    
    return 'meta' in result ? result.meta.changes > 0 : false
  }

  async findByAppointmentId(appointmentId: number) {
    const result = await this.db
      .select()
      .from(questionnaires)
      .where(eq(questionnaires.appointmentId, appointmentId))
      .limit(1)
      .all()
    
    return result[0] || null
  }

  async updateAnswers(id: number, answers: Record<string, any>) {
    // 既存の回答を取得
    const existing = await this.findById(id)
    if (!existing) {
      return null
    }

    const currentAnswers = existing.questionsAnswers ? JSON.parse(existing.questionsAnswers as string) : {}
    const updatedAnswers = { ...currentAnswers, ...answers }

    const result = await this.db
      .update(questionnaires)
      .set({
        questionsAnswers: JSON.stringify(updatedAnswers),
        updatedAt: new Date(),
      })
      .where(eq(questionnaires.id, id))
      .returning()
      .all()
    
    return result[0] || null
  }

  async markAsCompleted(id: number) {
    const result = await this.db
      .update(questionnaires)
      .set({
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(questionnaires.id, id))
      .returning()
      .all()
    
    return result[0] || null
  }
}