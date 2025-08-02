import { eq, and, desc, gte, lte } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import {
  smartwatchData,
  patientPersonalities,
  aiFeedbacks,
  patientHealthGoals,
  // patients,
} from '../db/schema';
import type {
  SmartwatchData,
  PatientPersonality,
  AIFeedback,
} from '../db/schema';

type Database = LibSQLDatabase | DrizzleD1Database<any>;

export class SmartwatchService {
  // スマートウォッチデータの保存
  static async saveSmartwatchData(
    db: Database,
    patientId: number,
    deviceType: string,
    deviceId: string,
    dataType: string,
    data: SmartwatchData,
    recordedAt: Date
  ) {
    const result = await db
      .insert(smartwatchData)
      .values({
        patientId,
        deviceType,
        deviceId,
        dataType,
        data: JSON.stringify(data),
        recordedAt,
        syncedAt: new Date(),
        createdAt: new Date(),
      })
      .returning()
      .all();

    return result[0];
  }

  // 患者のスマートウォッチデータ取得
  static async getPatientSmartwatchData(
    db: Database,
    patientId: number,
    startDate?: Date,
    endDate?: Date,
    dataType?: string
  ) {
    let query = db
      .select()
      .from(smartwatchData)
      .where(eq(smartwatchData.patientId, patientId)) as any;

    if (startDate) {
      query = query.where(gte(smartwatchData.recordedAt, startDate));
    }

    if (endDate) {
      query = query.where(lte(smartwatchData.recordedAt, endDate));
    }

    if (dataType) {
      query = query.where(eq(smartwatchData.dataType, dataType));
    }

    return await query.orderBy(desc(smartwatchData.recordedAt)).all();
  }

  // 患者パーソナリティの保存
  static async savePatientPersonality(
    db: Database,
    patientId: number,
    personalityData: PatientPersonality,
    confidenceScore?: number
  ) {
    const result = await db
      .insert(patientPersonalities)
      .values({
        patientId,
        personalityData: JSON.stringify(personalityData),
        confidenceScore,
        lastUpdated: new Date(),
        createdAt: new Date(),
      })
      .returning()
      .all();

    return result[0];
  }

  // 患者パーソナリティの取得
  static async getPatientPersonality(db: Database, patientId: number) {
    const result = await db
      .select()
      .from(patientPersonalities)
      .where(eq(patientPersonalities.patientId, patientId))
      .limit(1)
      .all();

    if (result[0]) {
      return {
        ...result[0],
        personalityData: JSON.parse(result[0].personalityData as string),
      };
    }

    return null;
  }

  // AIフィードバックの生成と保存
  static async generateAndSaveFeedback(
    db: Database,
    patientId: number,
    triggerType: string,
    triggerData?: any,
    scheduledFor?: Date
  ) {
    // 患者のパーソナリティを取得
    const personality = await this.getPatientPersonality(db, patientId);
    
    // 最近のスマートウォッチデータを取得
    const recentData = await this.getPatientSmartwatchData(
      db,
      patientId,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 過去7日間
    );

    // AIフィードバックを生成
    const feedback = await this.generateFeedback(
      patientId,
      personality,
      recentData,
      triggerType,
      triggerData
    );

    // フィードバックを保存
    const result = await db
      .insert(aiFeedbacks)
      .values({
        patientId,
        feedbackData: JSON.stringify(feedback),
        triggerType,
        triggerData: triggerData ? JSON.stringify(triggerData) : null,
        isRead: false,
        isActioned: false,
        scheduledFor,
        createdAt: new Date(),
      })
      .returning()
      .all();

    return result[0];
  }

  // AIフィードバック生成（ダミー実装）
  private static async generateFeedback(
    _patientId: number,
    _personality: any,
    _recentData: any[],
    _triggerType: string,
    _triggerData?: any
  ): Promise<AIFeedback> {
    // ダミーのAIフィードバック生成ロジック
    const feedbackTypes = ['motivation', 'reminder', 'achievement', 'suggestion'];
    const tones = ['encouraging', 'informative', 'gentle', 'direct'];
    const priorities = ['low', 'medium', 'high'];

    const messageType = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    let content = '';
    switch (messageType) {
      case 'motivation':
        content = '今日も健康な生活を続けましょう！小さな一歩が大きな変化につながります。';
        break;
      case 'reminder':
        content = '運動の時間です。軽い散歩から始めてみませんか？';
        break;
      case 'achievement':
        content = '素晴らしい進歩です！目標達成に向けて頑張りましょう。';
        break;
      case 'suggestion':
        content = '睡眠の質を向上させるために、就寝前のルーティンを整えてみてはいかがでしょうか？';
        break;
    }

    return {
      messageType,
      content,
      tone,
      priority,
      targetMetrics: ['steps', 'sleep', 'exercise'],
    };
  }

  // 未読フィードバックの取得
  static async getUnreadFeedbacks(db: Database, patientId: number) {
    const result = await db
      .select()
      .from(aiFeedbacks)
      .where(
        and(
          eq(aiFeedbacks.patientId, patientId),
          eq(aiFeedbacks.isRead, false)
        )
      )
      .orderBy(desc(aiFeedbacks.createdAt))
      .all();

    return result.map(feedback => ({
      ...feedback,
      feedbackData: JSON.parse(feedback.feedbackData as string),
    }));
  }

  // フィードバックを既読にする
  static async markFeedbackAsRead(db: Database, feedbackId: number) {
    const result = await db
      .update(aiFeedbacks)
      .set({ isRead: true })
      .where(eq(aiFeedbacks.id, feedbackId))
      .returning()
      .all();

    return result[0];
  }

  // 健康目標の保存
  static async saveHealthGoal(
    db: Database,
    patientId: number,
    goalType: string,
    targetValue: string,
    unit: string,
    timeframe: string,
    targetDate?: Date
  ) {
    const result = await db
      .insert(patientHealthGoals)
      .values({
        patientId,
        goalType,
        targetValue,
        unit,
        timeframe,
        startDate: new Date(),
        targetDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .all();

    return result[0];
  }

  // 患者の健康目標取得
  static async getPatientHealthGoals(db: Database, patientId: number) {
    return await db
      .select()
      .from(patientHealthGoals)
      .where(eq(patientHealthGoals.patientId, patientId))
      .orderBy(desc(patientHealthGoals.createdAt))
      .all();
  }

  // ダミーのスマートウォッチデータ生成
  static generateDummySmartwatchData(_deviceType: string): SmartwatchData {
    return {
      exercise: {
        type: ['ウォーキング', 'ランニング', '筋トレ', 'ヨガ'][Math.floor(Math.random() * 4)],
        duration: Math.floor(Math.random() * 60) + 10,
        frequency: Math.floor(Math.random() * 7) + 1,
        intensity: ['低', '中', '高'][Math.floor(Math.random() * 3)],
        caloriesBurned: Math.floor(Math.random() * 500) + 50,
      },
      sleep: {
        duration: Math.random() * 3 + 5, // 5-8時間
        quality: (Math.floor(Math.random() * 5) + 1).toString(),
        deepSleep: Math.floor(Math.random() * 120) + 60,
        lightSleep: Math.floor(Math.random() * 240) + 120,
        remSleep: Math.floor(Math.random() * 120) + 60,
      },
      activity: {
        steps: Math.floor(Math.random() * 8000) + 2000,
        distance: Math.random() * 5 + 1,
        activeMinutes: Math.floor(Math.random() * 120) + 30,
        caloriesBurned: Math.floor(Math.random() * 300) + 100,
      },
      vitals: {
        heartRate: Math.floor(Math.random() * 40) + 60,
        bloodPressure: {
          systolic: Math.floor(Math.random() * 40) + 110,
          diastolic: Math.floor(Math.random() * 20) + 70,
        },
        temperature: Math.random() * 2 + 36,
        oxygenSaturation: Math.floor(Math.random() * 10) + 95,
      },
      otherMetrics: {
        stressLevel: Math.floor(Math.random() * 10) + 1,
        caloriesConsumed: Math.floor(Math.random() * 1000) + 1500,
        weight: Math.random() * 10 + 60,
        bodyFatPercentage: Math.random() * 10 + 15,
      },
    };
  }
} 