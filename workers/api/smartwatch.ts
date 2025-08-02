import { Hono } from 'hono';
import { z } from 'zod';
import { SmartwatchService } from '../services/smartwatch.service';
import { authMiddleware, getUser } from '../auth/middleware';
import { SmartwatchDataSchema, PatientPersonalitySchema } from '../db/schema';
import { initializeDatabase } from '../app';
import type { Env } from '../app';

const smartwatchRouter = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
smartwatchRouter.use('*', authMiddleware());

// Validation schemas
const saveSmartwatchDataSchema = z.object({
  deviceType: z.string(),
  deviceId: z.string().optional(),
  dataType: z.string(),
  data: SmartwatchDataSchema,
  recordedAt: z.string().optional(),
});

const savePersonalitySchema = z.object({
  personalityData: PatientPersonalitySchema,
  confidenceScore: z.number().optional(),
});

const saveHealthGoalSchema = z.object({
  goalType: z.string(),
  targetValue: z.string(),
  unit: z.string(),
  timeframe: z.string(),
  targetDate: z.string().optional(),
});

const generateFeedbackSchema = z.object({
  triggerType: z.string(),
  triggerData: z.any().optional(),
  scheduledFor: z.string().optional(),
});

// スマートウォッチデータ保存
smartwatchRouter.post('/data', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const body = await c.req.json();
    const validation = saveSmartwatchDataSchema.safeParse(body);

    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: '無効なデータ形式です', 
        details: validation.error 
      }, 400);
    }

    const db = initializeDatabase(c.env);

    const result = await SmartwatchService.saveSmartwatchData(
      db,
      user.id,
      validation.data.deviceType,
      validation.data.deviceId || '',
      validation.data.dataType,
      validation.data.data,
      validation.data.recordedAt ? new Date(validation.data.recordedAt) : new Date()
    );

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('スマートウォッチデータ保存エラー:', error);
    return c.json({ success: false, error: 'データの保存に失敗しました' }, 500);
  }
});

// スマートウォッチデータ取得
smartwatchRouter.get('/data', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const db = initializeDatabase(c.env);
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const dataType = c.req.query('dataType');

    const data = await SmartwatchService.getPatientSmartwatchData(
      db,
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      dataType
    );

    return c.json({ success: true, data });
  } catch (error) {
    console.error('スマートウォッチデータ取得エラー:', error);
    return c.json({ success: false, error: 'データの取得に失敗しました' }, 500);
  }
});

// 患者パーソナリティ保存
smartwatchRouter.post('/personality', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const body = await c.req.json();
    const validation = savePersonalitySchema.safeParse(body);

    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: '無効なデータ形式です', 
        details: validation.error 
      }, 400);
    }

    const db = initializeDatabase(c.env);

    const result = await SmartwatchService.savePatientPersonality(
      db,
      user.id,
      validation.data.personalityData,
      validation.data.confidenceScore
    );

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('パーソナリティ保存エラー:', error);
    return c.json({ success: false, error: 'パーソナリティの保存に失敗しました' }, 500);
  }
});

// 患者パーソナリティ取得
smartwatchRouter.get('/personality', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const db = initializeDatabase(c.env);
    const personality = await SmartwatchService.getPatientPersonality(db, user.id);

    return c.json({ success: true, data: personality });
  } catch (error) {
    console.error('パーソナリティ取得エラー:', error);
    return c.json({ success: false, error: 'パーソナリティの取得に失敗しました' }, 500);
  }
});

// AIフィードバック生成
smartwatchRouter.post('/feedback/generate', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const body = await c.req.json();
    const validation = generateFeedbackSchema.safeParse(body);

    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: '無効なデータ形式です', 
        details: validation.error 
      }, 400);
    }

    const db = initializeDatabase(c.env);

    const result = await SmartwatchService.generateAndSaveFeedback(
      db,
      user.id,
      validation.data.triggerType,
      validation.data.triggerData,
      validation.data.scheduledFor ? new Date(validation.data.scheduledFor) : undefined
    );

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('AIフィードバック生成エラー:', error);
    return c.json({ success: false, error: 'フィードバックの生成に失敗しました' }, 500);
  }
});

// 未読フィードバック取得
smartwatchRouter.get('/feedback/unread', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const db = initializeDatabase(c.env);
    const feedbacks = await SmartwatchService.getUnreadFeedbacks(db, user.id);

    return c.json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('未読フィードバック取得エラー:', error);
    return c.json({ success: false, error: 'フィードバックの取得に失敗しました' }, 500);
  }
});

// フィードバック既読化
smartwatchRouter.put('/feedback/:id/read', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const feedbackId = parseInt(c.req.param('id'));
    if (isNaN(feedbackId)) {
      return c.json({ success: false, error: '無効なフィードバックIDです' }, 400);
    }

    const db = initializeDatabase(c.env);
    const result = await SmartwatchService.markFeedbackAsRead(db, feedbackId);

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('フィードバック既読化エラー:', error);
    return c.json({ success: false, error: 'フィードバックの既読化に失敗しました' }, 500);
  }
});

// 健康目標保存
smartwatchRouter.post('/goals', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const body = await c.req.json();
    const validation = saveHealthGoalSchema.safeParse(body);

    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: '無効なデータ形式です', 
        details: validation.error 
      }, 400);
    }

    const db = initializeDatabase(c.env);

    const result = await SmartwatchService.saveHealthGoal(
      db,
      user.id,
      validation.data.goalType,
      validation.data.targetValue,
      validation.data.unit,
      validation.data.timeframe,
      validation.data.targetDate ? new Date(validation.data.targetDate) : undefined
    );

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('健康目標保存エラー:', error);
    return c.json({ success: false, error: '健康目標の保存に失敗しました' }, 500);
  }
});

// 健康目標取得
smartwatchRouter.get('/goals', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const db = initializeDatabase(c.env);
    const goals = await SmartwatchService.getPatientHealthGoals(db, user.id);

    return c.json({ success: true, data: goals });
  } catch (error) {
    console.error('健康目標取得エラー:', error);
    return c.json({ success: false, error: '健康目標の取得に失敗しました' }, 500);
  }
});

// ダミーデータ生成
smartwatchRouter.post('/dummy-data', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: '認証が必要です' }, 401);
    }

    const body = await c.req.json();
    const deviceType = body.deviceType || 'fitbit';
    const dataType = body.dataType || 'comprehensive';

    const db = initializeDatabase(c.env);
    const dummyData = SmartwatchService.generateDummySmartwatchData(deviceType);

    const result = await SmartwatchService.saveSmartwatchData(
      db,
      user.id,
      deviceType,
      `dummy-${Date.now()}`,
      dataType,
      dummyData,
      new Date()
    );

    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('ダミーデータ生成エラー:', error);
    return c.json({ success: false, error: 'ダミーデータの生成に失敗しました' }, 500);
  }
});

export default smartwatchRouter; 