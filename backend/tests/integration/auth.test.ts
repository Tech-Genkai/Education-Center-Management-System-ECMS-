import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/server';
import { User } from '../../src/models/User';

let findOneSpy: jest.SpiedFunction<any>;

beforeEach(() => {
  findOneSpy = jest.spyOn(User as any, 'findOne');
});

afterEach(() => {
  findOneSpy?.mockRestore();
});

describe('POST /api/auth/login', () => {
  it('logs in student with valid credentials', async () => {
    findOneSpy.mockResolvedValue({
      _id: '123student',
      role: 'student',
      email: 'student@example.com',
      password: 'hashedpassword',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'student@example.com',
      password: 'password123'
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('student');
  });

  it('rejects invalid credentials', async () => {
    // Case 1: User not found
    findOneSpy.mockResolvedValue(null);
    let res = await request(app).post('/api/auth/login').send({
      email: 'student@example.com',
      password: 'wrongpass'
    });
    expect(res.status).toBe(401);

    // Case 2: Wrong password
    findOneSpy.mockResolvedValue({
      comparePassword: jest.fn().mockResolvedValue(false)
    });
    res = await request(app).post('/api/auth/login').send({
      email: 'student@example.com',
      password: 'wrongpass'
    });
    expect(res.status).toBe(401);
  });
});
