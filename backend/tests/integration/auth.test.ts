import request from 'supertest';
import { app } from '../../src/server';

describe('POST /api/auth/login', () => {
  it('logs in student with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@example.com',
      password: '81234567'
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('student');
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@example.com',
      password: 'wrongpass'
    });

    expect(res.status).toBe(401);
  });
});
