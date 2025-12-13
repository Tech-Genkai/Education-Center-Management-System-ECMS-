import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { app } from '../../src/server';
import { UserProfile } from '../../src/models/UserProfile';
import { getImageLimitsForRole } from '../../src/routes/profile';

let findOneSpy: jest.SpiedFunction<any>;
let findOneAndUpdateSpy: jest.SpiedFunction<any>;

const uploadsDir = path.resolve(__dirname, '../../public/images/profile/uploads');
const sampleImagePath = path.resolve(__dirname, '../../public/images/profile/default/default-profile.png');
const testJwtSecret = process.env.JWT_SECRET || 'dev-secret';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAF+XIWcAAAAASUVORK5CYII=',
  'base64'
);

const signToken = (payload: object) => jwt.sign(payload, testJwtSecret);

beforeEach(() => {
  findOneSpy = jest.spyOn(UserProfile as any, 'findOne');
  findOneAndUpdateSpy = jest.spyOn(UserProfile as any, 'findOneAndUpdate');
  findOneSpy.mockResolvedValue(null);
  findOneAndUpdateSpy.mockResolvedValue(null);
  fs.mkdirSync(uploadsDir, { recursive: true });
});

afterEach(() => {
  findOneSpy?.mockRestore();
  findOneAndUpdateSpy?.mockRestore();
  // Clean uploaded files between tests
  if (fs.existsSync(uploadsDir)) {
    fs.rmSync(uploadsDir, { recursive: true, force: true });
  }
});

describe('GET /api/profile', () => {
  const userId = '507f1f77bcf86cd799439011';

  it('returns 400 for invalid userId', async () => {
    const token = signToken({ sub: userId, role: 'user' });
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .query({ userId: 'bad-id' });

    expect(res.status).toBe(400);
  });

  it('forbids when requester is not owner or admin', async () => {
    const token = signToken({ sub: 'another-user', role: 'user' });
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .query({ userId });

    expect(res.status).toBe(403);
  });

  it('returns 404 when profile not found', async () => {
    findOneSpy.mockResolvedValue(null);
    const token = signToken({ sub: userId, role: 'user' });

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .query({ userId });

    expect(res.status).toBe(404);
  });

  it('returns profile when found and authorized', async () => {
    const profile = { userId, avatarUrl: '/static/images/profile/default/default-profile.png' };
    findOneSpy.mockResolvedValue(profile);
    const token = signToken({ sub: userId, role: 'user' });

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .query({ userId });

    expect(res.status).toBe(200);
    expect(res.body.profile).toEqual(profile);
  });
});

describe('POST /api/profile/avatar', () => {
  const userId = '507f1f77bcf86cd799439011';

  it('rejects when unauthorized', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .field('userId', userId);

    expect(res.status).toBe(401);
  });

  it('rejects when image dimensions are too small', async () => {
    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Authorization', `Bearer ${signToken({ sub: userId, role: 'user' })}`)
      .field('userId', userId)
      .attach('image', tinyPng, { filename: 'tiny.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Image dimensions');
  });

  it('uploads image and updates profile', async () => {
    findOneSpy.mockResolvedValue({
      userId,
      profilePicture: { isDefault: true }
    });

    const updatedProfile = {
      userId,
      profilePicture: {
        url: '/static/images/profile/uploads/test.png',
        storagePath: 'images/profile/uploads/test.png',
        isDefault: false,
        uploadedAt: new Date()
      }
    };
    findOneAndUpdateSpy.mockResolvedValue(updatedProfile);

    const res = await request(app)
      .post('/api/profile/avatar')
      .set('Authorization', `Bearer ${signToken({ sub: userId, role: 'user' })}`)
      .field('userId', userId)
      .attach('image', sampleImagePath);

    expect(res.status).toBe(200);
    expect(res.body.url).toContain('/static/images/profile/uploads/');
    expect(res.body.profile).toBeDefined();
    expect(findOneSpy).toHaveBeenCalled();
    expect(findOneAndUpdateSpy).toHaveBeenCalled();
  });
});

describe('DELETE /api/profile/avatar', () => {
  const userId = '507f1f77bcf86cd799439012';

  it('reverts to default and removes custom file', async () => {
    const oldFile = path.join(uploadsDir, 'old.png');
    await fs.promises.writeFile(oldFile, 'data');

    findOneSpy.mockResolvedValue({
      userId,
      profilePicture: {
        storagePath: 'images/profile/uploads/old.png',
        isDefault: false
      }
    });

    const updatedProfile = {
      userId,
      profilePicture: {
        url: '/static/images/profile/default/default-profile.png',
        storagePath: 'images/profile/default/default-profile.png',
        isDefault: true
      }
    } as any;
    findOneAndUpdateSpy.mockResolvedValue(updatedProfile);

    const res = await request(app)
      .delete('/api/profile/avatar')
      .set('Authorization', `Bearer ${signToken({ sub: userId, role: 'user' })}`)
      .send({ userId });

    expect(res.status).toBe(200);
    expect(fs.existsSync(oldFile)).toBe(false);
    expect(findOneAndUpdateSpy).toHaveBeenCalled();
  });

  it('returns 404 when profile missing', async () => {
    findOneSpy.mockResolvedValue(null);
    const res = await request(app)
      .delete('/api/profile/avatar')
      .set('Authorization', `Bearer ${signToken({ sub: userId, role: 'user' })}`)
      .send({ userId });

    expect(res.status).toBe(404);
  });
});

describe('getImageLimitsForRole', () => {
  it('returns privileged limits for admin/teacher', () => {
    expect(getImageLimitsForRole('admin').maxWidth).toBeGreaterThan(1200);
    expect(getImageLimitsForRole('teacher').maxBytes).toBeGreaterThan(getImageLimitsForRole('user').maxBytes);
  });
});
