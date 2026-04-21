import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../src/app';

describe('Auth E2E', () => {
  it('registers a new user successfully', async () => {
    const email = `auth_${Date.now()}@mail.com`;

    const response = await request(app).post('/auth/register').send({
      name: 'Auth Test',
      email,
      password: '123456'
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
  });

  it('logs in with valid credentials', async () => {
    const email = `login_${Date.now()}@mail.com`;
    const password = '123456';

    await request(app).post('/auth/register').send({
      name: 'Login Test',
      email,
      password
    });

    const response = await request(app).post('/auth/login').send({
      email,
      password
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(email);
  });

  it('rejects login with invalid password', async () => {
    const email = `invalid_${Date.now()}@mail.com`;

    await request(app).post('/auth/register').send({
      name: 'Invalid Login',
      email,
      password: '123456'
    });

    const response = await request(app).post('/auth/login').send({
      email,
      password: 'wrong-password'
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});
