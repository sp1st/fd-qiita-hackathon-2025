import { Hono, type Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { DrizzleRepositoryFactory } from '../../repositories';
import { authMiddleware } from '../../auth/middleware';

const doctorPatientHandlers = new Hono();

doctorPatientHandlers.get('/', authMiddleware(), async (c: Context) => {
    const user = c.get('user');
    
    // ユーザーが存在し、IDが存在することを確認
    if (!user || !user.id) {
        return c.json({ error: 'User not authenticated or user ID missing' }, 401);
    }
    
    const db = drizzle(c.env.DB);
    const repoFactory = new DrizzleRepositoryFactory(db);
    const patientRepo = repoFactory.createPatientRepository();

    const patients = await patientRepo.getPatientsByDoctorId(user.id);

    return c.json({ patients });
});

doctorPatientHandlers.get('/:id', authMiddleware(), async (c: Context) => {
    const user = c.get('user');
    
    // ユーザーが存在し、IDが存在することを確認
    if (!user || !user.id) {
        return c.json({ error: 'User not authenticated or user ID missing' }, 401);
    }
    
    const patientId = parseInt(c.req.param('id'), 10);
    const db = drizzle(c.env.DB);
    const repoFactory = new DrizzleRepositoryFactory(db);
    const patientRepo = repoFactory.createPatientRepository();

    const patient = await patientRepo.getPatientByIdAndDoctorId(patientId, user.id);

    if (!patient) {
        return c.json({ error: 'Patient not found or not assigned to this doctor' }, 404);
    }

    return c.json({ patient });
});

export default doctorPatientHandlers;