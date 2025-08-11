const request = require('supertest');
const app = require('./src/server');

describe('SkillSwap Backend API', () => {
  test('Health check endpoint', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  test('Auth register endpoint exists', async () => {
    const response = await request(app).post('/api/auth/register');
    expect(response.status).not.toBe(404);
  });

  test('Auth login endpoint exists', async () => {
    const response = await request(app).post('/api/auth/login');
    expect(response.status).not.toBe(404);
  });

  test('Users endpoint exists', async () => {
    const response = await request(app).get('/api/users');
    expect(response.status).not.toBe(404);
  });

  test('Skills endpoint exists', async () => {
    const response = await request(app).get('/api/skills');
    expect(response.status).not.toBe(404);
  });
}); 