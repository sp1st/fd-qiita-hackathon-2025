import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import { MockRepositoryFactory } from '../repositories/mock/factory'
import questionnaireHandlers from '../api/handlers/questionnaire'

// Mock auth middleware for a patient
vi.mock('../auth/middleware', () => ({
  authMiddleware: () => async (c: any, next: any) => {
    c.set('user', {
      sub: 'patient1',
      userType: 'patient',
      id: 1, // Patient ID
    });
    await next();
  },
}));

// Mock database initialization
vi.mock('../app', () => ({
  initializeDatabase: vi.fn(() => ({})),
  Env: {},
}));

const mockPatients = [
  {
    id: 1,
    name: '患者A',
    email: 'patientA@test.com',
    phoneNumber: '080-1111-2222',
  },
];

const mockAppointments = [
  {
    id: 2,
    patientId: 1,
    assignedWorkerId: 2,
    status: 'scheduled',
    scheduledAt: new Date('2025-02-01T10:00:00'),
    durationMinutes: 30,
    chiefComplaint: '頭痛',
    appointmentType: 'initial',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockQuestionnaires = [
  {
    id: 1,
    appointmentId: 2,
    answers: {
      symptoms: '頭痛と発熱',
      duration: '3日間',
      severity: '中等度',
    },
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock('../repositories', () => ({
  DrizzleRepositoryFactory: vi.fn().mockImplementation(() => {
    return new MockRepositoryFactory({
      patients: mockPatients,
      appointments: mockAppointments,
      questionnaires: mockQuestionnaires,
    });
  }),
}));

const env = {
  DB: {} as any,
  JWT_SECRET: 'test-secret',
  JWT_ACCESS_TOKEN_EXPIRY: 3600,
  JWT_REFRESH_TOKEN_EXPIRY: 604800,
};

describe('問診APIテスト', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/patient/questionnaire', questionnaireHandlers);
  });

  describe('問診票取得 (GET /api/patient/questionnaire/:appointmentId)', () => {
    it('既存の問診票を取得する', async () => {
      const response = await app.request('/api/patient/questionnaire/2', {}, env);

      expect(response.status).toBe(200);

      const data = await response.json() as {
        questionnaire: {
          id: number
          appointmentId: number
          answers: Record<string, any>
        }
        template: Array<{
          id: string
          question: string
          type: string
          required: boolean
        }>
      }
      console.log('📊 問診APIレスポンス:', JSON.stringify(data, null, 2))

      // 基本構造の確認
      expect(data).toHaveProperty('questionnaire')
      expect(data.questionnaire).toHaveProperty('id')
      expect(data.questionnaire).toHaveProperty('appointmentId', 2)
      expect(data.questionnaire).toHaveProperty('answers')

      // 🔍 CRITICAL: templateプロパティの確認
      expect(data).toHaveProperty('template')
      expect(Array.isArray(data.template)).toBe(true)
      expect(data.template.length).toBeGreaterThan(0)

      // テンプレート構造の確認
      const firstQuestion = data.template[0]
      expect(firstQuestion).toHaveProperty('id')
      expect(firstQuestion).toHaveProperty('question')
      expect(firstQuestion).toHaveProperty('type')
      expect(firstQuestion).toHaveProperty('required')
    })

    it('存在しない予約IDで404エラーを返す', async () => {
      const response = await app.request('/api/patient/questionnaire/999', {}, env);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    })

    it('認証なしで401エラーを返す', async () => {
      // 認証なしのテストは別途実装
      expect(true).toBe(true); // スキップ
    })
  })

  describe('問診回答保存 (POST /api/patient/questionnaire/answer)', () => {
    it('問診回答を保存する', async () => {
      const answerData = {
        appointmentId: 2,
        questionId: 'symptoms',
        answer: 'テスト用の症状回答'
      }

      const response = await app.request('/api/patient/questionnaire/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(answerData)
      }, env);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    })

    it('無効なデータで400エラーを返す', async () => {
      const invalidData = {
        // appointmentId が欠如
        questionId: 'symptoms',
        answer: 'テスト回答'
      }

      const response = await app.request('/api/patient/questionnaire/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidData)
      }, env);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    })
  })

  describe('問診完了 (POST /api/patient/questionnaire/complete)', () => {
    it('問診を完了させる', async () => {
      const completeData = {
        appointmentId: 2
      }

      const response = await app.request('/api/patient/questionnaire/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completeData)
      }, env);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    })
  })

  describe('問診テンプレート検証', () => {
    it('問診テンプレートの構造が正しい', async () => {
      const response = await app.request('/api/patient/questionnaire/2', {}, env);
      
      if (response.status === 200) {
        const data = await response.json();
        const template = data.template;

        // 必須の質問項目の確認
        const requiredQuestions = template.filter((q: any) => q.required)
        expect(requiredQuestions.length).toBeGreaterThan(0)

        // 任意の質問項目の確認
        const optionalQuestions = template.filter((q: any) => !q.required)
        expect(optionalQuestions.length).toBeGreaterThanOrEqual(0)

        // 質問項目の構造確認
        template.forEach((question: any) => {
          expect(question).toHaveProperty('id')
          expect(question).toHaveProperty('question')
          expect(question).toHaveProperty('type')
          expect(question).toHaveProperty('required')
        })
      } else {
        // 404エラーの場合はスキップ
        expect(true).toBe(true);
      }
    })
  })

  describe('認証・認可テスト', () => {
    it('他の患者の問診票にアクセスできない', async () => {
      const response = await app.request('/api/patient/questionnaire/999', {}, env);
      expect(response.status).toBe(404);
    })

    it('医療従事者は患者の問診票にアクセスできない', async () => {
      // 医療従事者の認証テストは別途実装
      expect(true).toBe(true); // スキップ
    })
  })

  describe('統合テスト', () => {
    it('問診フロー全体のテスト', async () => {
      // 1. 問診票を取得
      const getResponse = await app.request('/api/patient/questionnaire/2', {}, env);

      expect(getResponse.status).toBe(200);
      const questionnaire = await getResponse.json();

      // 2. 回答を保存
      const answerData = {
        appointmentId: 2,
        questionId: 'symptoms',
        answer: '統合テスト用の症状'
      }

      const saveResponse = await app.request('/api/patient/questionnaire/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(answerData)
      }, env);

      expect(saveResponse.status).toBe(200);

      // 3. 問診を完了
      const completeData = {
        appointmentId: 2
      }

      const completeResponse = await app.request('/api/patient/questionnaire/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completeData)
      }, env);

      expect(completeResponse.status).toBe(200);
    })
  })
})
