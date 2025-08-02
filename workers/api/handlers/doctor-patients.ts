import { Hono, type Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { DrizzleRepositoryFactory } from '../../repositories';
import { authMiddleware } from '../../auth/middleware';
import { initializeDatabase } from '../../app';

const doctorPatientHandlers = new Hono();

// GET /api/worker/doctor/patients - 医師の患者一覧取得
doctorPatientHandlers.get('/', async (c: any) => {
  try {
    console.log('=== DEBUG: Starting doctor patients handler ===');
    console.log('Authorization header:', c.req.header('Authorization'));
    console.log('Content-Type header:', c.req.header('Content-Type'));
    
    // 認証ミドルウェアを手動で実行
    const authHeader = c.req.header('Authorization');
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header');
      return c.json({ error: 'Authorization header with Bearer token is required' }, 401);
    }
    
    const token = authHeader.substring(7);
    console.log('Token extracted:', token.substring(0, 20) + '...');
    
    // 認証ミドルウェアを手動で実行
    const { verifyAccessToken, JWT_CONFIG } = await import('../../auth/jwt');
    const payload = await verifyAccessToken(token, JWT_CONFIG.secret);
    
    console.log('JWT payload:', payload);
    
    if (!payload) {
      console.log('Invalid or expired token');
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    
    // ユーザー情報をコンテキストに設定
    c.set('user', payload);
    
    const user = c.get('user');
    console.log('User from context:', user);
    
    if (!user) {
      console.log('No user found in context');
      return c.json({ error: 'No user found' }, 401);
    }

    // 医師のみアクセス可能
    if (user.userType !== 'worker' || user.role !== 'doctor') {
      console.log('Permission denied for user:', user);
      return c.json({ error: 'Doctors only' }, 403);
    }

    console.log('Permission check passed, fetching patients for doctor ID:', user.id);

    // データベースを正しく初期化
    const db = initializeDatabase(c.env);
    if (!db) {
      console.error('Database initialization failed');
      return c.json({ error: 'Database not available' }, 500);
    }
    const repoFactory = new DrizzleRepositoryFactory(db);
    const patientRepo = repoFactory.createPatientRepository();

    const patients = await patientRepo.getPatientsByDoctorId(user.id);
    console.log('Patients found:', patients.length);

    return c.json({ patients });
  } catch (error) {
    console.error('Error in doctor patients handler:', error);
    return c.json({ error: 'Failed to fetch patients' }, 500);
  }
});

// GET /api/worker/doctor/patients/:id - 特定の患者情報取得
doctorPatientHandlers.get('/:id', authMiddleware(), async (c: any) => {
  try {
    const user = c.get('user');
    
    // ユーザーが存在し、IDが存在することを確認
    if (!user || !user.id) {
        return c.json({ error: 'User not authenticated or user ID missing' }, 401);
    }
    
    const patientId = parseInt(c.req.param('id'), 10);

    if (!user) {
      return c.json({ error: 'No user found' }, 401);
    }

    // 医師のみアクセス可能
    if (user.userType !== 'worker' || user.role !== 'doctor') {
      return c.json({ error: 'Doctors only' }, 403);
    }

    // データベースを正しく初期化
    const db = initializeDatabase(c.env);
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }
    const repoFactory = new DrizzleRepositoryFactory(db);
    const patientRepo = repoFactory.createPatientRepository();

    const patient = await patientRepo.getPatientByIdAndDoctorId(patientId, user.id);

    if (!patient) {
      return c.json({ error: 'Patient not found or not assigned to this doctor' }, 404);
    }

    return c.json({ patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    return c.json({ error: 'Failed to fetch patient' }, 500);
  }
});

export default doctorPatientHandlers;